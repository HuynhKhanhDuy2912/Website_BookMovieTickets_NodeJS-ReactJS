const Article = require("../models/Article");

// Lấy danh sách tất cả bài viết
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 }); // Mới nhất trước
    res.json(articles);
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách bài viết",
      error: err.message,
    });
  }
};

// Lấy chi tiết 1 bài viết theo ID
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    res.json(article);
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy thông tin bài viết",
      error: err.message,
    });
  }
};

// Tạo mới bài viết
exports.createArticle = async (req, res) => {
  try {
    const { title, content, image, tags } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Tiêu đề và nội dung là bắt buộc" });
    }

    const article = await Article.create({ title, content, image, tags });
    res.status(201).json({
      message: "Thêm bài viết thành công",
      article,
    });
  } catch (err) {
    res.status(400).json({
      message: "Lỗi khi thêm bài viết",
      error: err.message,
    });
  }
};

// Cập nhật bài viết
exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!article)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    res.json({
      message: "Cập nhật bài viết thành công",
      article,
    });
  } catch (err) {
    res.status(400).json({
      message: "Lỗi khi cập nhật bài viết",
      error: err.message,
    });
  }
};

// Xóa bài viết
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    res.json({ message: "Đã xóa bài viết thành công" });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi xóa bài viết",
      error: err.message,
    });
  }
};
