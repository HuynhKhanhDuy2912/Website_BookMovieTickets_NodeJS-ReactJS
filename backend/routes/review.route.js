const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");

// Giả sử bạn có middleware xác thực (nếu chưa có thì bỏ dòng này và bỏ verifyToken ở dưới)
const { verifyToken } = require("../middleware/authMiddleware"); 

// --- PUBLIC ROUTES (Ai cũng xem được) ---
// GET /api/review?movieId=...
router.get("/", reviewController.getAllReviews);
router.post("/", verifyToken, reviewController.createReview);

router.delete("/:id", reviewController.deleteReview);

module.exports = router;