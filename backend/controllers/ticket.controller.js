const Ticket = require("../models/Ticket");
const Showtime = require("../models/Showtime");
const User = require("../models/User");

// 1. TẠO VÉ MỚI (Dùng cho Admin hoặc test lẻ)
// Lưu ý: Nếu hệ thống đặt vé chính nằm ở orderController, bạn nhớ copy logic req.io sang bên đó nữa nhé!
exports.createTicket = async (req, res) => {
  try {
    // 1. Nhận đúng dữ liệu từ Frontend (POS)
    const { showtime, seats, user, guestName, totalPrice, paymentStatus, isManual } = req.body;

    console.log("📦 Dữ liệu nhận được:", req.body); // Log ra để debug

    // 2. Validate dữ liệu đầu vào
    if (!showtime || !seats || seats.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn suất chiếu và ghế." });
    }

    // 3. Kiểm tra xem các ghế này đã bị ai mua chưa
    const existingTickets = await Ticket.find({
      showtime,
      status: { $ne: "cancelled" }, // Bỏ qua vé đã hủy
      // Kiểm tra xem trong mảng ghế đã bán có chứa bất kỳ ghế nào khách đang chọn không
      seats: { $in: seats } 
    });

    if (existingTickets.length > 0) {
      // Tìm ra ghế nào bị trùng để báo lỗi chi tiết
      const takenSeats = existingTickets.flatMap(t => t.seats).filter(s => seats.includes(s));
      return res.status(400).json({ message: `Ghế ${takenSeats.join(", ")} đã có người đặt rồi!` });
    }

    // 4. Tạo vé mới (Lưu mảng ghế)
    const ticket = new Ticket({
      user: user || null, // Nếu null thì lưu null (Khách vãng lai)
      guestName: guestName || "Khách vãng lai",
      showtime,
      seats: seats, // Lưu cả mảng ["A1", "A2"] vào 1 vé duy nhất
      totalPrice: totalPrice || 0, // Frontend đã tính toán rồi
      paymentStatus: paymentStatus || "unpaid",
      status: "success", // Bán tại quầy thì mặc định là thành công
      isManual: isManual || false // Đánh dấu vé POS
    });

    await ticket.save();

    // 5. Cập nhật lịch sử mua vé cho User (Nếu là thành viên)
    if (user) {
        await User.findByIdAndUpdate(user, { $push: { tickets: ticket._id } });
    }

    // 🔥 [SOCKET REAL-TIME]: Báo cho tất cả client khác biết ghế đã bán
    if (req.io) {
        // Emit danh sách ghế vừa bán để các máy khác cập nhật thành màu đỏ
        seats.forEach(seat => {
            req.io.to(showtime).emit("seat_sold", seat);
        });
        console.log(`📡 Socket emitted: Sold seats [${seats}] for showtime ${showtime}`);
    }

    res.status(201).json({ message: "Xuất vé thành công", ticket });

  } catch (error) {
    console.error("❌ Lỗi Create Ticket:", error);
    res.status(500).json({ message: "Lỗi server khi tạo vé", error: error.message });
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