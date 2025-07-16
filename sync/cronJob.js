const cron = require("node-cron");
const { syncData } = require("../controllers/dataController");

// Fake req/res to reuse the controller function
const fakeReq = {};
const fakeRes = {
  status: () => ({ json: () => {} }),
};

cron.schedule("0 */2 * * *", async () => {
  console.log("⏰ Cron running: syncing data...");
  try {
    await syncData(fakeReq, fakeRes);
    console.log(`[${new Date().toISOString()}] ✅ Cron sync completed.`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Cron sync failed:`, err);
  }
});
