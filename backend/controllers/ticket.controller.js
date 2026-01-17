const Ticket = require("../models/Ticket");
const Showtime = require("../models/Showtime");
const User = require("../models/User");

// 1. TẠO VÉ MỚI (Dùng cho Admin hoặc test lẻ)
// Lưu ý: Hệ thống chính dùng orderController.createOrder, hàm này để backup hoặc admin tạo vé lẻ
exports.createTicket = async (req, res) => {
  try {
    const { user, showtime, seatNumber, price, status } = req.body;

    // Kiểm tra showtime và user
    const foundShowtime = await Showtime.findById(showtime);
    if (!foundShowtime) return res.status(404).json({ message: "Showtime not found" });

    // Kiểm tra ghế trùng
    const existingTicket = await Ticket.findOne({ showtime, seatNumber, status: "booked" });
    if (existingTicket) return res.status(400).json({ message: "Seat already taken" });

    const ticket = new Ticket({
      user,
      showtime,
      seatNumber, // <--- Dùng seatNumber (String) thay vì seats (Array)
      price,
      status: status || "booked"
    });

    await ticket.save();

    res.status(201).json({ message: "Ticket created successfully", ticket });
  } catch (error) {
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
// controllers/ticketController.js

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("user", "name email") // Lấy tên User
      .populate("showtime")           // Lấy thông tin suất chiếu
      .populate({
         path: "showtime",
         populate: { path: "movie", select: "title" } // Lấy tên phim
      })
      // 👇 QUAN TRỌNG: Populate ngược về Order để lấy tổng tiền nếu Ticket không có
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

// 6. XÓA VÉ
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ticket", error: error.message });
  }
};

// 7. LẤY DANH SÁCH GHẾ ĐÃ BÁN (QUAN TRỌNG NHẤT CHO FRONTEND)
exports.getTicketsByShowtime = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    // Lấy tất cả vé đã đặt thành công
    const tickets = await Ticket.find({ 
      showtime: showtimeId,
      status: { $in: ["booked", "sold", "active"] } 
    }).select("seatNumber"); 

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy vé", error: err.message });
  }
};