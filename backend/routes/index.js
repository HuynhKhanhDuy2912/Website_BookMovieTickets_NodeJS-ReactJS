// routes/admin.route.js
const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats.controller");

// GET /api/admin/stats?type=year&year=2025
router.get("/stats", statsController.getRevenueStats); 

module.exports = router;