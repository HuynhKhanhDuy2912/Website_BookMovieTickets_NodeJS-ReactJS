const Cinema = require("../models/Cinema");

exports.getAllCinemas = async (req, res) => {
  try {
    const cinemas = await Cinema.find().populate("rooms");
    res.json(cinemas);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách rạp", error: err.message });
  }
};

exports.getCinemaById = async (req, res) => {
  try {
    const cinema = await Cinema.findById(req.params.id).populate("rooms");
    if (!cinema) return res.status(404).json({ message: "Không tìm thấy rạp" });
    res.json(cinema);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin rạp", error: err.message });
  }
};

exports.createCinema = async (req, res) => {
  try {
    const cinema = await Cinema.create(req.body);
    res.status(201).json({ message: "Thêm rạp thành công", cinema });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi thêm rạp", error: err.message });
  }
};

exports.updateCinema = async (req, res) => {
  try {
    const cinema = await Cinema.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cinema) return res.status(404).json({ message: "Không tìm thấy rạp" });
    res.json({ message: "Cập nhật rạp thành công", cinema });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi cập nhật rạp", error: err.message });
  }
};

exports.deleteCinema = async (req, res) => {
  try {
    const cinema = await Cinema.findByIdAndDelete(req.params.id);
    if (!cinema) return res.status(404).json({ message: "Không tìm thấy rạp" });
    res.json({ message: "Đã xóa rạp thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa rạp", error: err.message });
  }
};
