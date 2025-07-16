const axios = require("axios");
require("dotenv").config();

const BRANDS = ["trimfinity", "urbanyog"];

module.exports = async function fetchShopifyData() {
  const brandResults = [];

  for (const brand of BRANDS) {
    const apiUrl = process.env[`SHOPIFY_API_${brand.toUpperCase()}`];
    const apiKey = process.env[`SHOPIFY_API_KEY_${brand.toUpperCase()}`];

    if (!apiUrl || !apiKey) {
      console.warn(`Missing Shopify config for brand: ${brand}`);
      continue;
    }

    try {
      const { data } = await axios.get(apiUrl, {
        headers: {
          "X-Shopify-Access-Token": apiKey,
          "Content-Type": "application/json",
        },
      });

      const orders = data.orders || [];
      orders.forEach((order) => {
        const discount = order.discount_codes?.[0]?.code || "";

        const processedOrder = {
          ...order,
          phone_number: order.billing_address?.phone || "",
          discount_codes: discount, // ✅ store only the code string
          brand,
        };

        brandResults.push(processedOrder);
      });
    } catch (error) {
      console.error(`Shopify fetch failed for ${brand}:`, error.message);
    }
  }

  return brandResults;
};
