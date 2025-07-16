// routes/dataRoutes.js ✅ CORRECT

const express = require("express");
const router = express.Router();
const dataController = require("../controllers/dataController");

// Do NOT use () after syncData
router.get("/sync", dataController.syncData);

module.exports = router;
