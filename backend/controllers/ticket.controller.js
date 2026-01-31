const Ticket = require("../models/Ticket");
const Showtime = require("../models/Showtime");
const User = require("../models/User");

// 1. TẠO VÉ MỚI (Dùng cho POS/Admin bán vé)
exports.createTicket = async (req, res) => {
  try {
    const { showtime, seats, user, guestName, totalPrice, paymentStatus, isManual } = req.body;

    console.log("📦 [POS] Đang tạo vé:", req.body);

    // 1. Validate
    if (!showtime || !seats || seats.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn suất chiếu và ghế." });
    }

    // 2. Check trùng ghế trong DB
    const existingTickets = await Ticket.find({
      showtime,
      status: { $ne: "cancelled" },
      seats: { $in: seats } 
    });

    if (existingTickets.length > 0) {
      const takenSeats = existingTickets.flatMap(t => t.seats).filter(s => seats.includes(s));
      return res.status(400).json({ message: `Ghế ${takenSeats.join(", ")} vừa có người khác đặt xong!` });
    }

    // 3. Tạo Vé
    const ticket = new Ticket({
      user: user || null,
      guestName: guestName || "Khách vãng lai",
      showtime,
      seats, // Lưu mảng ghế
      totalPrice: totalPrice || 0,
      paymentStatus: paymentStatus || "unpaid",
      status: "success",
      isManual: isManual || false
    });

    await ticket.save();

    // 4. Update lịch sử mua của User (nếu có)
    if (user) {
        await User.findByIdAndUpdate(user, { $push: { tickets: ticket._id } });
    }

    // 5. 🔥 SOCKET REAL-TIME (QUAN TRỌNG NHẤT)
    if (req.io) {
        // Ép kiểu showtime sang String để đảm bảo đúng Room ID
        const showtimeRoom = showtime.toString(); 

        // Gửi sự kiện 'seat_sold' kèm MẢNG ghế vừa bán
        req.io.to(showtimeRoom).emit("seat_sold", seats);
        
        console.log(`📡 Socket emitted: seat_sold ${JSON.stringify(seats)} to room ${showtimeRoom}`);
    }

    // 6. Xóa Timer giữ ghế (nếu đang giữ) để tránh tự nhả ghế sau 5p
    if (req.clearSeatHold) {
        req.clearSeatHold(showtime.toString(), seats);
    }

    res.status(201).json({ message: "Xuất vé thành công", ticket });

  } catch (error) {
    console.error("❌ Lỗi Create Ticket:", error);
    res.status(500).json({ message: "Lỗi server khi tạo vé", error: error.message });
  }
};

// 2. LẤY VÉ CỦA TÔI
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

// 5. CẬP NHẬT VÉ
exports.updateTicket = async (req, res) => {
  try {
    const { seats, price, status } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { seats, price, status },
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

    // SOCKET: Báo ghế trống lại
    if (req.io) {
        const showtimeRoom = ticket.showtime.toString(); 
        
        // Xử lý nếu ticket lưu mảng ghế
        if (ticket.seats && ticket.seats.length > 0) {
             ticket.seats.forEach(seat => {
                 req.io.to(showtimeRoom).emit("seat_released", seat);
             });
        } 
        // Fallback cho ticket cũ lưu seatNumber
        else if (ticket.seatNumber) { 
             req.io.to(showtimeRoom).emit("seat_released", ticket.seatNumber);
        }
        
        console.log(`📡 Socket emitted: seat_released [${ticket.seats || ticket.seatNumber}]`);
    }

    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ticket", error: error.message });
  }
};

// 7. LẤY DANH SÁCH GHẾ ĐÃ BÁN (Dùng cho Client load ban đầu)
exports.getTicketsByShowtime = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    
    // Chỉ lấy vé trạng thái hợp lệ
    const tickets = await Ticket.find({ 
      showtime: showtimeId,
      status: { $in: ["booked", "sold", "active", "success"] } 
    }).select("seats seatNumber"); // Lấy cả 2 trường để Frontend tự gộp

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy vé", error: err.message });
  }
};