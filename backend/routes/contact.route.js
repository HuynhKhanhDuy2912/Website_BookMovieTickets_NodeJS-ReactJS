const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../controllers/contact.controller");
// 👇 1. Import thư viện
const rateLimit = require("express-rate-limit");

// 👇 2. Cấu hình bộ đếm
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3, // Tối đa 3 request mỗi IP
  message: {
    success: false,
    message: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 giờ!"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 👇 3. Chèn vào giữa (Middleware)
router.post("/send", contactLimiter, sendContactEmail);

module.exports = router;