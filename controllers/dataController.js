const db = require("../models");
const fetchShopifyData = require("../services/fetchShopifyData");
const fetchRetellData = require("../services/fetchRetellData");
const dataProcessor = require("../services/dataProcessor");

exports.syncData = async (req, res) => {
  try {
    const shopifyOrders = await fetchShopifyData();
    const retellCalls = await fetchRetellData();

    console.log("Shopify orders fetched:", shopifyOrders.length);
    console.log("Retell calls fetched:", retellCalls.length);

    // ✅ Store all Retell calls (not just matched)
    for (const call of retellCalls) {
      const brand = (() => {
        const title = call.retell_llm_dynamic_variables?.title?.toLowerCase() || "";
        if (title.includes("trimfinity")) return "trimfinity";
        if (title.includes("makemeebold")) return "urbanyog";
        if (title.includes("urbanyog") || title.includes("urban yog")) return "urbanyog";
        return "unknown";
      })();

      const callExists = await db.CallLog.findOne({
        where: { call_id: call.call_id },
      });

      if (!callExists) {
        const callData = {
          call_id: call.call_id,
          start_timestamp: call.start_timestamp,
          end_timestamp: call.end_timestamp,
          combined_cost: call.call_cost?.combined_cost,
          from_number: call.from_number,
          to_number: call.to_number,
          email: call.retell_llm_dynamic_variables?.email,
          name: call.retell_llm_dynamic_variables?.name,
          title: call.retell_llm_dynamic_variables?.title,
          price: call.retell_llm_dynamic_variables?.price,
          brand: brand,
        };
        await db.CallLog.create(callData);
      }

      // ✅ Store phone_number if not already stored
      const phone = call.to_number?.replace(/\D/g, "").slice(-10);
      if (phone) {
        const phoneExists = await db.PhoneNumber.findOne({
          where: { phone_number: phone, brand },
        });

        if (!phoneExists) {
          await db.PhoneNumber.create({
            phone_number: phone,
            agent_id: call.agent_id || null,
            brand: brand,
          });
        }
      }
    }

    // ✅ Match and selectively store Shopify orders
    const matched = dataProcessor.matchByEmailOrPhone(
      shopifyOrders,
      retellCalls
    );

    for (const record of matched) {
      const shopifyData = {
        shopify_order_id: record.shopify.id,
        title: record.shopify.line_items?.[0]?.title || null,
        email: record.shopify.email,
        phone_number: record.shopify.phone_number,
        order_number: record.shopify.order_number,
        created_at: record.shopify.created_at,
        total_price: record.shopify.total_price,
        discount_codes: record.shopify.discount_codes,
        customer_first_name: record.shopify.customer?.first_name || null,
        brand: record.shopify.brand,
      };

      const exists = await db.ShopifyOrder.findOne({
        where: { shopify_order_id: shopifyData.shopify_order_id },
      });

      if (!exists) {
        await db.ShopifyOrder.create(shopifyData);
      }

      // ✅ Always insert order items
      const lineItems = record.shopify.line_items || [];
      for (const item of lineItems) {
        const orderItemData = {
          order_number: record.shopify.order_number,
          title: item.title,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.subtotal_price || item.price,
          created_at: record.shopify.created_at,
          brand: record.shopify.brand,
        };

        const alreadyExists = await db.OrderItem.findOne({
          where: {
            order_number: orderItemData.order_number,
            product_id: orderItemData.product_id,
          },
        });

        if (!alreadyExists) {
          console.log("📦 Inserting Order Item:", orderItemData);
          await db.OrderItem.create(orderItemData);
        }
      }
    }

    res.status(200).json({ message: "Synced", count: matched.length });
  } catch (err) {
    console.error("❌ Sync failed:", err);
    res.status(500).json({ error: "Sync failed" });
  }
};

exports.matchByEmailOrPhone = (shopifyOrders, retellCalls) => {
  const matched = [];

  shopifyOrders.forEach((order) => {
    const email = order.email?.toLowerCase().trim();
    const phone = order.phone_number?.replace(/\D/g, "").slice(-10);

    const match = retellCalls.find(
      (call) =>
        call.brand === order.brand &&
        ((call.email && call.email.toLowerCase().trim() === email) ||
          (call.to_number &&
            call.to_number.replace(/\D/g, "").slice(-10) === phone))
    );

    if (match) {
      console.log("✅ MATCH FOUND:", {
        brand: order.brand,
        shopifyEmail: email,
        shopifyPhone: phone,
        callEmail: match.email,
        callPhone: match.to_number,
      });

      matched.push({ shopify: order, retell: match });
    }
  });

  return matched;
};
