const express = require("express");
const router = express.Router();
const db = require("../models");
const { Op } = require("sequelize");

function normalizePhone(phone) {
  return phone?.replace(/\D/g, "").slice(-10);
}

// Utility to get grouping key
function getGroupKey(date, groupBy) {
  const d = new Date(date);
  if (groupBy === "week") {
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay()); // Sunday
    return startOfWeek.toISOString().split("T")[0];
  } else if (groupBy === "month") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  } else if (groupBy === "quarter") {
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `${d.getFullYear()}-Q${q}`;
  } else {
    return d.toISOString().split("T")[0];
  }
}

router.get("/metrics", async (req, res) => {
  try {
    const brand = req.query.brand;
    const startDate = req.query.start || "2025-04-01";
    const endDateRaw = req.query.end || new Date();
    const endDate = new Date(endDateRaw);
    const groupBy = req.query.groupBy || "day";

    // ✅ Force endDate to be end-of-day
    endDate.setHours(23, 59, 59, 999);

    // Filters
    const callDateFilter = {
      start_timestamp: {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      },
    };
    const orderDateFilter = {
      created_at: {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      },
    };

    const callWhere =
      brand && brand !== "all" ? { brand, ...callDateFilter } : callDateFilter;
    const orderWhere =
      brand && brand !== "all"
        ? { brand, ...orderDateFilter }
        : orderDateFilter;

    // ✅ Load data
    const calls = await db.CallLog.findAll({ where: callWhere });
    const orders = await db.ShopifyOrder.findAll({ where: orderWhere });
    const items = await db.ProductCogs.findAll({
      where: brand && brand !== "all" ? { brand } : {},
    });

    // ✅ Call metrics
    const totalCallCost = calls.reduce((sum, call) => {
      const start = new Date(call.start_timestamp);
      const end = new Date(call.end_timestamp);
      const durationSec = (end - start) / 1000;
      return sum + durationSec * 0.2;
    }, 0);

    const totalDurationMin = calls.reduce((sum, call) => {
      const start = new Date(call.start_timestamp);
      const end = new Date(call.end_timestamp);
      return sum + (end - start) / 1000 / 60;
    }, 0);

    const totalDurationSec = calls.reduce((sum, call) => {
      const start = new Date(call.start_timestamp);
      const end = new Date(call.end_timestamp);
      return sum + (end - start) / 1000;
    }, 0);

    const connectedCalls = calls.filter((call) => {
      const start = new Date(call.start_timestamp);
      const end = new Date(call.end_timestamp);
      const duration = (end - start) / 1000;
      return duration > 1;
    }).length;

    // ✅ Purchase list

    // Step 1: Initial purchase list without profit calculation
    let purchaseList = orders.map((o) => {
      const item = items.find((i) => i.dataValues.product_name === o.title);
      const cogs = parseFloat(item?.dataValues?.COGS || 0);
      const total_price = parseFloat(o.total_price);

      const matchingCall = calls.find((c) => {
        const callPhone = normalizePhone(c.to_number);
        const orderPhone = normalizePhone(o.phone_number);

        const emailMatch =
          c.email && o.email && c.email.toLowerCase() === o.email.toLowerCase();
        const phoneMatch = callPhone && orderPhone && callPhone === orderPhone;

        return emailMatch || phoneMatch;
      });

      if (!matchingCall) {
        // console.log("❌ No matching call found for order:", {
        //   order_email: o.email,
        //   order_phone: o.phone_number,
        //   normalized_order_phone: normalizePhone(o.phone_number),
        // });

        const availablePhones = calls.map((c) => normalizePhone(c.to_number));
        // console.log("📞 All available call phones:", availablePhones);
      }

      return {
        email: o.email,
        phone_number: o.phone_number,
        title: o.title,
        total_price,
        cogs,
        created_at: o.created_at,
        order_number: o.order_number,
        call_time: matchingCall?.start_timestamp || null,
      };
    });

    // // Step 2: Filter by date
    // const filteredPurchaseList = purchaseList.filter((entry) => {
    //   const created = new Date(entry.created_at);
    //   return created >= new Date(startDate) && created <= endDate;
    // });

    // // Step 3: Calculate totals
    // const revenue = filteredPurchaseList.reduce(
    //   (sum, o) => sum + parseFloat(o.total_price),
    //   0
    // );
    // const totalCogs = filteredPurchaseList.reduce(
    //   (sum, o) => sum + parseFloat(o.cogs),
    //   0
    // );
    // const profitAmount =
    //   (revenue / 118) * 100 -
    //   totalCogs -
    //   totalCallCost -
    //   120 * filteredPurchaseList.length;

    // const totalProfit = profitAmount.toFixed(2);

    // // Step 4: Compute per-order profit using proportional share
    // purchaseList = filteredPurchaseList.map((o) => {
    //   const orderShare = o.total_price / revenue;
    //   const revenueAdjusted = (revenue / 118) * 100;
    //   const callCostShare = orderShare * totalCallCost;
    //   const profit =
    //     revenueAdjusted * orderShare - o.cogs - callCostShare - 120;

    //   return {
    //     ...o,
    //     total_price: o.total_price.toFixed(2),
    //     cogs: o.cogs.toFixed(2),
    //     profit: profit.toFixed(2),
    //   };
    // });

    // Step 2: Filter by date for metrics (ungrouped)
    const filteredPurchaseList = purchaseList.filter((entry) => {
      const created = new Date(entry.created_at);
      return created >= new Date(startDate) && created <= endDate;
    });

    // Step 3: Calculate top metrics from filtered list
    const revenue = filteredPurchaseList.reduce(
      (sum, o) => sum + parseFloat(o.total_price),
      0
    );
    const totalCogs = filteredPurchaseList.reduce(
      (sum, o) => sum + parseFloat(o.cogs),
      0
    );
    const profitAmount =
      (revenue / 118) * 100 -
      totalCogs -
      totalCallCost -
      120 * filteredPurchaseList.length;

    const totalProfit = profitAmount.toFixed(2);

    // Step 4: For charts – apply groupBy profit calculation
    const groupedPurchaseList = filteredPurchaseList.map((o) => {
      const orderShare = o.total_price / revenue;
      const revenueAdjusted = (revenue / 118) * 100;
      const callCostShare = orderShare * totalCallCost;
      const profit =
        revenueAdjusted * orderShare - o.cogs - callCostShare - 120;

      return {
        ...o,
        total_price: o.total_price.toFixed(2),
        cogs: o.cogs.toFixed(2),
        profit: profit.toFixed(2),
      };
    });

    const conversionRate = ((orders.length / connectedCalls) * 100).toFixed(2);

    // ✅ Revenue Chart Data
    const revenueMap = {};
    groupedPurchaseList.forEach((entry) => {
      const groupKey = getGroupKey(entry.created_at, groupBy);
      if (!revenueMap[groupKey]) {
        revenueMap[groupKey] = { revenue: 0, profit: 0 };
      }
      revenueMap[groupKey].revenue += parseFloat(entry.total_price);
      revenueMap[groupKey].profit += parseFloat(entry.profit);
    });

    // const revenueData = {
    //   labels: Object.keys(revenueMap),
    //   revenue: Object.values(revenueMap).map((d) => d.revenue),
    //   profit: Object.values(revenueMap).map((d) => d.profit),
    // };
    let sortedKeys = Object.keys(revenueMap);

    if (groupBy === "day" || groupBy === "week") {
      sortedKeys.sort((a, b) => new Date(a) - new Date(b));
    } else if (groupBy === "month") {
      sortedKeys.sort((a, b) => {
        const [yearA, monthA] = a.split("-").map(Number);
        const [yearB, monthB] = b.split("-").map(Number);
        return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1); // ✅ Correct direction
      });
    } else if (groupBy === "quarter") {
      sortedKeys.sort((a, b) => {
        const [yearA, quarterA] = a.split("-Q").map(Number);
        const [yearB, quarterB] = b.split("-Q").map(Number);
        return yearA !== yearB ? yearA - yearB : quarterA - quarterB; // ✅ Correct direction
      });
    }

    const revenueData = {
      labels: sortedKeys,
      revenue: sortedKeys.map((key) => revenueMap[key].revenue),
      profit: sortedKeys.map((key) => revenueMap[key].profit),
    };

    // ✅ Call Duration Buckets
    const callDurationData = {
      labels: ["0-30s", "30-90s", "90s+"],
      duration: [0, 0, 0],
    };

    calls.forEach((call) => {
      const start = new Date(call.start_timestamp);
      const end = new Date(call.end_timestamp);

      // just to debug
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.log("⚠️ Invalid date detected:", {
          start_raw: call.start_timestamp,
          end_raw: call.end_timestamp,
          phone: call.phone_number,
        });
      }

      const duration = (end - start) / 1000;
      if (duration <= 30) callDurationData.duration[0]++;
      else if (duration <= 90) callDurationData.duration[1]++;
      else callDurationData.duration[2]++;
    });

    // ✅ Product Distribution
    const productMap = {};
    purchaseList.forEach((entry) => {
      const title = entry.title?.trim().toLowerCase(); // normalize casing and spaces
      if (!productMap[title]) productMap[title] = 0;
      productMap[title]++;
    });

    // console.log("Pie chart labels:", Object.keys(productMap));

    const productDistribution = {
      labels: Object.keys(productMap),
      values: Object.values(productMap),
    };

    // ✅ Send response
    res.json({
      metrics: {
        total_calls: calls.length,
        connected_calls: connectedCalls,
        total_duration_min: totalDurationMin.toFixed(2),
        total_call_cost: totalCallCost.toFixed(2),
        total_cogs: totalCogs.toFixed(2),
        total_orders: orders.length,
        revenue: revenue.toFixed(2),
        profit: totalProfit,
        conversion_rate: conversionRate + "%",
      },
      revenueData,
      callDurationData,
      productDistribution,
      purchaseList: purchaseList,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard metrics" });
  }
});

module.exports = router;
