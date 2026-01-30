const Ticket = require("../models/Ticket");
const Showtime = require("../models/Showtime");
const User = require("../models/User");

// 1. TẠO VÉ MỚI (Dùng cho Admin hoặc test lẻ)
// Lưu ý: Nếu hệ thống đặt vé chính nằm ở orderController, bạn nhớ copy logic req.io sang bên đó nữa nhé!
exports.createTicket = async (req, res) => {
  try {
    const { user, showtime, seatNumber, price, status } = req.body;

    // Kiểm tra showtime
    const foundShowtime = await Showtime.findById(showtime);
    if (!foundShowtime) return res.status(404).json({ message: "Showtime not found" });

    // Kiểm tra ghế trùng (Trong DB)
    const existingTicket = await Ticket.findOne({ showtime, seatNumber, status: "booked" });
    if (existingTicket) return res.status(400).json({ message: "Seat already taken" });

    const ticket = new Ticket({
      user,
      showtime,
      seatNumber, 
      price,
      status: status || "booked"
    });

    await ticket.save();

    // 🔥 [SOCKET REAL-TIME]: Báo cho tất cả client trong phòng 'showtime' biết ghế này đã bán
    if (req.io) {
        // Sự kiện 'seat_sold' sẽ làm ghế chuyển sang màu Xám trên Frontend
        req.io.to(showtime).emit("seat_sold", seatNumber);
        console.log(`📡 Socket emitted: seat_sold ${seatNumber} for showtime ${showtime}`);
    }

    res.status(201).json({ message: "Ticket created successfully", ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating ticket", error: error.message });
  }
};

// 2. LẤY VÉ CỦA TÔI (Profile)
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title posterUrl" },
          { path: "cinema", select: "name" },
          { path: "room", select: "name" },
        ],
      })
      .populate("order", "orderCode status totalPrice")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user tickets", error: error.message });
  }
};

// 3. LẤY TẤT CẢ VÉ (Admin)
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("user", "name email") 
      .populate("showtime")           
      .populate({
         path: "showtime",
         populate: { path: "movie", select: "title" } 
      })
      .populate("order", "totalPrice seats status") 
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách vé", error: err.message });
  }
};

// 4. LẤY CHI TIẾT 1 VÉ
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("user", "name email")
      .populate("showtime")
      .populate("order");

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ticket", error: error.message });
  }
};

// 5. CẬP NHẬT VÉ (Admin/Staff)
exports.updateTicket = async (req, res) => {
  try {
    const { seatNumber, price, status } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { seatNumber, price, status },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    res.status(200).json({ message: "Ticket updated successfully", ticket });
  } catch (error) {
    res.status(500).json({ message: "Error updating ticket", error: error.message });
  }
};

// 6. XÓA VÉ (Admin xóa vé -> Ghế phải trống lại)
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // 🔥 [SOCKET REAL-TIME]: Admin xóa vé -> Báo ghế này đã trống (seat_released)
    // Để frontend cập nhật lại màu trắng (hoặc bỏ màu xám)
    if (req.io) {
        // Cần toString() showtime ID để room socket nhận diện đúng
        const showtimeId = ticket.showtime.toString(); 
        req.io.to(showtimeId).emit("seat_released", ticket.seatNumber);
        console.log(`📡 Socket emitted: seat_released ${ticket.seatNumber} (Ticket Deleted)`);
    }

    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ticket", error: error.message });
  }
};

// 7. LẤY DANH SÁCH GHẾ ĐÃ BÁN
exports.getTicketsByShowtime = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    const tickets = await Ticket.find({ 
      showtime: showtimeId,
      status: { $in: ["booked", "sold", "active"] } 
    }).select("seatNumber"); 

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy vé", error: err.message });
  }
};