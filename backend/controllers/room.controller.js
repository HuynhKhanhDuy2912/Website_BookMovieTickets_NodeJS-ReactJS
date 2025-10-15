const Room = require("../models/Room");

// Lấy tất cả phòng chiếu
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate("cinema", "name address");
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách phòng chiếu", error: err.message });
  }
};

// Lấy phòng chiếu theo ID
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("cinema", "name address");
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin phòng chiếu", error: err.message });
  }
};

// Tạo mới phòng chiếu
exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ message: "Thêm phòng chiếu thành công", room });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi thêm phòng chiếu", error: err.message });
  }
};

// Cập nhật phòng chiếu
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
      "cinema",
      "name address"
    );
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
    res.json({ message: "Cập nhật phòng chiếu thành công", room });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi cập nhật phòng chiếu", error: err.message });
  }
};

// Xóa phòng chiếu
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
    res.json({ message: "Xóa phòng chiếu thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa phòng chiếu", error: err.message });
  }
};
