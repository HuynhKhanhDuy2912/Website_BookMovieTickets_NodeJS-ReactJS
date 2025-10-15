const Showtime = require("../models/Showtime");

// Lấy tất cả suất chiếu
exports.getAllShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find()
      .populate("movie", "title duration")
      .populate("cinema", "name city")
      .populate("room", "name seatCount");
    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách suất chiếu", error: err.message });
  }
};

// Lấy suất chiếu theo ID
exports.getShowtimeById = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate("movie", "title duration")
      .populate("cinema", "name city")
      .populate("room", "name seatCount");

    if (!showtime) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    res.json(showtime);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin suất chiếu", error: err.message });
  }
};

// Thêm suất chiếu mới
exports.createShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.create(req.body);
    res.status(201).json({ message: "Thêm suất chiếu thành công", showtime });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi thêm suất chiếu", error: err.message });
  }
};

// Cập nhật suất chiếu
exports.updateShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("movie", "title duration")
      .populate("cinema", "name city")
      .populate("room", "name seatCount");

    if (!showtime) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    res.json({ message: "Cập nhật suất chiếu thành công", showtime });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi cập nhật suất chiếu", error: err.message });
  }
};

// Xóa suất chiếu
exports.deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);
    if (!showtime) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    res.json({ message: "Xóa suất chiếu thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa suất chiếu", error: err.message });
  }
};

// Lấy suất chiếu theo phim
exports.getShowtimesByMovie = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ movie: req.params.movieId })
      .populate("cinema", "name city")
      .populate("room", "name seatCount");

    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy suất chiếu theo phim", error: err.message });
  }
};

// Lấy suất chiếu theo rạp
exports.getShowtimesByCinema = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ cinema: req.params.cinemaId })
      .populate("movie", "title duration")
      .populate("room", "name seatCount");

    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy suất chiếu theo rạp", error: err.message });
  }
};
