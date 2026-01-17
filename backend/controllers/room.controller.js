const Room = require("../models/Room");
const Cinema = require("../models/Cinema");

// --- HÀM SINH GHẾ TỰ ĐỘNG ---
function buildSeats(rows, cols, vipRows = []) {
  const seats = [];

  // Chuyển đổi mảng ["A", "B"] thành index [0, 1]
  const vipIndexes = vipRows.map((r) =>
    typeof r === "string" ? r.toUpperCase().charCodeAt(0) - 65 : r
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Tạo tên ghế: A1, A2...
      const seatNumber = String.fromCharCode(65 + r) + (c + 1);
      
      // Kiểm tra xem hàng này có phải VIP không
      const type = vipIndexes.includes(r) ? "vip" : "standard"; // Lưu ý: type nên viết hoa chữ cái đầu cho đẹp hoặc theo quy ước enum của bạn

      seats.push({ 
          seatNumber, 
          type, 
          status: "active" 
      });
    }
  }

  return seats;
}

// 1. LẤY TẤT CẢ PHÒNG
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate("cinema", "name address");
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách phòng chiếu", error: err.message });
  }
};

// 2. LẤY PHÒNG THEO ID
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("cinema", "name address");
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin phòng chiếu", error: err.message });
  }
};

// 3. TẠO MỚI PHÒNG
// 3. TẠO MỚI PHÒNG (Đã Fix)
exports.createRoom = async (req, res) => {
  try {
    const { cinema, name, rows = 5, cols = 8, vipRows = [] } = req.body;

    const seats = buildSeats(rows, cols, vipRows);

    const roomData = {
      cinema,
      name,
      rows,
      cols,
      vipRows, // 👈 QUAN TRỌNG: Phải thêm dòng này để lưu mảng ["A", "B"] vào DB
      seats,
      seatCount: seats.length,
    };

    const room = await Room.create(roomData);

    await Cinema.findByIdAndUpdate(cinema, { $push: { rooms: room._id } });

    res.status(201).json({ message: "Thêm phòng chiếu thành công", room });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi thêm phòng chiếu", error: err.message });
  }
};

// 4. CẬP NHẬT PHÒNG (Đã Fix)
exports.updateRoom = async (req, res) => {
  try {
    const { cinema, name, rows, cols, vipRows } = req.body;
    
    // Tạo lại ghế mới
    const seats = buildSeats(rows, cols, vipRows || []);

    const updateData = {
        cinema,
        name,
        rows,
        cols,
        vipRows, // 👈 QUAN TRỌNG: Cập nhật cả cái này nữa
        seats, 
        seatCount: seats.length
    };

    const room = await Room.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate("cinema", "name address");

    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
    
    res.json({ message: "Cập nhật phòng chiếu thành công", room });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi cập nhật phòng chiếu", error: err.message });
  }
};

// 5. XÓA PHÒNG
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng chiếu" });

    await Cinema.findByIdAndUpdate(room.cinema, { $pull: { rooms: room._id } });

    res.json({ message: "Xóa phòng chiếu thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa phòng chiếu", error: err.message });
  }
};