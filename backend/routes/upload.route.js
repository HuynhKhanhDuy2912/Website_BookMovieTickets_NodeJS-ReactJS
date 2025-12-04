const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // Import cái middleware bạn đã tạo lúc nãy

// Route này sẽ map với đường dẫn: /api/upload/
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Chưa có file nào được gửi lên!' });
  }

  // Trả về link ảnh từ Cloudinary
  res.json({
    success: true,
    message: 'Upload thành công!',
    imageUrl: req.file.path,
    publicId: req.file.filename // Có thể cần dùng ID này nếu muốn xóa ảnh sau này
  });
});

module.exports = router;