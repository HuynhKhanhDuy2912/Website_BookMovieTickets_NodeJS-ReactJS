const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats.controller");

// 1. Thống kê Doanh thu (Biểu đồ dòng tiền)
router.get("/stats", statsController.getRevenueStats); 

// 2. Thống kê Phim (Bảng danh sách phim)
router.get("/stats/movies", statsController.getMovieStats);

// 3. Thống kê Combo (Bảng danh sách combo) 👇👇👇 THÊM DÒNG NÀY
router.get("/stats/combos", statsController.getComboStats);

module.exports = router;