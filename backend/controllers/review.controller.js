const Review = require("../models/Review"); // Đảm bảo đường dẫn đúng tới model của bạn

// 1. Lấy danh sách đánh giá (Hỗ trợ lọc theo movieId)
exports.getAllReviews = async (req, res) => {
  try {
    const { movieId } = req.query; // Lấy movieId từ URL (VD: /api/review?movieId=123)
    let filter = {};

    // Nếu có movieId thì chỉ lấy review của phim đó
    if (movieId) {
      filter.movie = movieId;
    }

    // Tìm review, populate để lấy tên và avatar của người viết review
    const reviews = await Review.find(filter)
      .populate("user", "name avatar email") // Lấy các trường cần thiết từ bảng User
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên đầu

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách đánh giá", error: err.message });
  }
};

// 2. Thêm đánh giá mới
exports.createReview = async (req, res) => {
  try {
    // Dữ liệu từ Client gửi lên
    const { movieId, rating, comment } = req.body;
    
    // Lấy ID người dùng từ Token (Middleware verifyToken sẽ gán vào req.user)
    // Nếu bạn chưa có middleware auth thì tạm thời gửi userId từ body (req.body.userId)
    const userId = req.user ? req.user.id : req.body.userId; 

    if (!userId) {
      return res.status(401).json({ message: "Bạn cần đăng nhập để đánh giá" });
    }

    // Kiểm tra xem user này đã đánh giá phim này chưa (Tùy chọn: mỗi người chỉ 1 review)
    const existingReview = await Review.findOne({ user: userId, movie: movieId });
    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá phim này rồi!" });
    }

    const newReview = await Review.create({
      user: userId,
      movie: movieId,
      rating,
      comment
    });

    // Populate ngay lập tức để trả về cho Frontend hiển thị luôn
    const populatedReview = await newReview.populate("user", "name avatar");

    res.status(201).json(populatedReview);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo đánh giá", error: err.message });
  }
};

// 3. Xóa đánh giá (Dành cho Admin hoặc chính chủ)
exports.deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa đánh giá" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa đánh giá", error: err.message });
  }
};