const Movie = require("../models/Movie");

// // Lấy danh sách phim
// exports.getAllMovies = async (req, res) => {
//   try {
//     const movies = await Movie.find().sort({ createdAt: -1 });
//     res.json(movies);
//   } catch (err) {
//     res.status(500).json({ message: "Lỗi khi lấy danh sách phim", error: err.message });
//   }
// };
// Lấy danh sách
exports.getAllMovies = async (req, res) => {
  // populate('cinema') thay vì 'cinema'
  const movies = await Movie.find().populate("cinema", "name city").sort({ createdAt: -1 });
  res.json(movies);
};

// Lấy chi tiết 1 phim theo ID
exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin phim", error: err.message });
  }
};

// // Thêm phim mới
// exports.createMovie = async (req, res) => {
//   try {
//     const movie = await Movie.create(req.body);
//     res.status(201).json({ message: "Thêm phim thành công", movie });
//   } catch (err) {
//     res.status(400).json({ message: "Lỗi khi thêm phim", error: err.message });
//   }
// };
// Tạo mới
exports.createMovie = async (req, res) => {
  // req.body.cinema sẽ là mảng ["id1", "id2"]
  const movie = await Movie.create(req.body);
  await movie.populate("cinema", "name"); 
  res.status(201).json({ message: "Thêm thành công", movie });
};

// // Cập nhật phim
// exports.updateMovie = async (req, res) => {
//   try {
//     const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });
//     res.json({ message: "Cập nhật phim thành công", movie });
//   } catch (err) {
//     res.status(400).json({ message: "Lỗi khi cập nhật phim", error: err.message });
//   }
// };
// Cập nhật
exports.updateMovie = async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate("cinema", "name");
  res.json({ message: "Cập nhật thành công", movie });
};

// Xóa phim
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });
    res.json({ message: "Đã xóa phim thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa phim", error: err.message });
  }
};
