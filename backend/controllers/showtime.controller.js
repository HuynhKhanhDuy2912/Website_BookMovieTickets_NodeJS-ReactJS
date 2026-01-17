const Showtime = require("../models/Showtime");

// 1. LẤY TẤT CẢ SUẤT CHIẾU
exports.getAllShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find()
      .populate("movie", "title duration")
      .populate("cinema", "name city")
      // ✅ Lấy vipRows để hiển thị nhanh danh sách nếu cần
      .populate("room", "name seatCount vipRows"); 
      
    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách suất chiếu", error: err.message });
  }
};

// 2. LẤY SUẤT CHIẾU THEO ID (Chi tiết để đặt vé)
exports.getShowtimeById = async (req, res) => {
  try {
    const { id } = req.params;
    const showtime = await Showtime.findById(id)
      .populate("movie")
      .populate("cinema")
      .populate({
        path: "room",
        // ✅ QUAN TRỌNG: Phải lấy vipRows để Frontend vẽ màu ghế VIP
        select: "name seats rows cols vipRows seatCount" 
      });

    if (!showtime) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });

    res.json(showtime);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// 3. TẠO SUẤT CHIẾU MỚI
exports.createShowtime = async (req, res) => {
  try {
    // (Optional) Bạn có thể thêm logic kiểm tra trùng giờ chiếu tại đây nếu muốn
    const showtime = await Showtime.create(req.body);
    res.status(201).json({ message: "Thêm suất chiếu thành công", showtime });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi thêm suất chiếu", error: err.message });
  }
};

// 4. CẬP NHẬT SUẤT CHIẾU
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

// 5. XÓA SUẤT CHIẾU
exports.deleteShowtime = async (req, res) => {
  try {
    // Lưu ý: Nếu suất chiếu đã có vé đặt, việc xóa này sẽ làm vé bị lỗi tham chiếu.
    // Tốt nhất nên kiểm tra Ticket trước khi xóa (nhưng ở mức cơ bản thì xóa luôn cũng được).
    const showtime = await Showtime.findByIdAndDelete(req.params.id);
    if (!showtime) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    res.json({ message: "Xóa suất chiếu thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa suất chiếu", error: err.message });
  }
};

// 6. LẤY SUẤT CHIẾU THEO PHIM (Dùng cho trang chi tiết phim)
exports.getShowtimesByMovie = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ movie: req.params.movieId })
      .populate("cinema", "name city")
      .populate("room", "name seatCount vipRows"); // Lấy thêm vipRows để hiển thị sơ qua

    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy suất chiếu theo phim", error: err.message });
  }
};

// 7. LẤY SUẤT CHIẾU THEO RẠP (Dùng cho trang chi tiết rạp)
exports.getShowtimesByCinema = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ 
        cinema: req.params.cinemaId,
        startTime: { $gte: new Date() } // Chỉ lấy suất chưa chiếu
    })
    .populate("movie", "title duration posterUrl description") 
    .populate("room", "name seatCount vipRows")
    .sort({ startTime: 1 });

    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách theo rạp", error: err.message });
  }
};