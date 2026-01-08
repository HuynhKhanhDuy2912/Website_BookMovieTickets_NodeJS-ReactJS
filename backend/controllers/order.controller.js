const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Showtime = require("../models/Showtime");

// --- 1. TẠO ĐƠN HÀNG MỚI ---
exports.createOrder = async (req, res) => {
  try {
    // Lưu ý: Frontend có thể gửi 'total' hoặc 'totalPrice', ta map về 1 biến finalPrice
    const { showtimeId, userId, seats, total, totalPrice, combos, paymentMethod } = req.body;
    const finalPrice = totalPrice || total;

    // A. LẤY THÔNG TIN SHOWTIME (để lấy Movie ID và giá vé chuẩn)
    const showtimeData = await Showtime.findById(showtimeId);
    if (!showtimeData) {
      return res.status(404).json({ message: "Suất chiếu không tồn tại!" });
    }

    // B. KIỂM TRA GHẾ TRÙNG (QUAN TRỌNG NHẤT)
    // Bước này chặn việc 2 người đặt cùng 1 ghế
    const existingTickets = await Ticket.find({
      showtime: showtimeId,
      seatNumber: { $in: seats }
    });

    if (existingTickets.length > 0) {
      const takenSeats = existingTickets.map(t => t.seatNumber).join(", ");
      return res.status(400).json({ 
        message: `Ghế ${takenSeats} đã vừa có người khác đặt. Vui lòng chọn ghế khác!` 
      });
    }

    // C. TẠO MÃ ĐƠN HÀNG (Unique)
    const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // D. TẠO ORDER (Lưu cả seats và combos chi tiết để hiện ở Profile)
    // Map lại combo cho đúng cấu trúc Schema mới
    const processedCombos = combos ? combos.map(c => ({
      comboId: c.comboId || c._id, // Tùy frontend gửi ID ở trường nào
      name: c.name,                // Lưu tên để hiển thị nhanh
      quantity: c.quantity,
      price: c.price
    })) : [];

    const newOrder = await Order.create({
      user: userId,
      showtime: showtimeId,
      orderCode: orderCode,
      seats: seats,             // <--- QUAN TRỌNG: Lưu mảng ghế ["A1", "A2"] để hiện ở Profile
      totalPrice: finalPrice,
      paymentMethod: paymentMethod || "Cash",
      status: "success",        // Giả lập thanh toán thành công
      combos: processedCombos
    });

    // E. TẠO TICKET (Để khóa ghế trong database, chặn người sau đặt)
    const tickets = seats.map(seat => ({
      movie: showtimeData.movie, // Lấy ID phim từ showtime
      showtime: showtimeId,
      user: userId,
      order: newOrder._id,
      seatNumber: seat,          // <--- QUAN TRỌNG: Tên field phải là seatNumber khớp với Ticket Model
      price: showtimeData.price || 75000, 
      status: "booked"           // Đánh dấu ghế đã bán
    }));

    await Ticket.insertMany(tickets);

    res.status(201).json({ message: "Đặt vé thành công", order: newOrder });

  } catch (err) {
    console.error("Lỗi đặt vé:", err);
    res.status(500).json({ message: "Lỗi tạo đơn hàng", error: err.message });
  }
};

// --- 2. LẤY ĐƠN HÀNG CỦA TÔI (PROFILE) ---
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate({
        path: "showtime",
        populate: [
            { path: "movie", select: "title posterUrl duration" }, 
            { path: "cinema", select: "name" },   
            { path: "room", select: "name" }      
        ]
      })
      .sort({ createdAt: -1 }); 

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách vé", error: err.message });
  }
};

// --- 3. LẤY TẤT CẢ ĐƠN (ADMIN) ---
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate({
        path: "showtime",
        select: "startTime",
        populate: { path: "movie", select: "title" }
      })
      .sort({ createdAt: -1 });
      
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách tất cả đơn hàng", error: err.message });
  }
};

// --- 4. CẬP NHẬT ĐƠN (ADMIN) ---
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    res.json({ message: "Cập nhật đơn hàng thành công", order });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi cập nhật đơn hàng", error: err.message });
  }
};

// --- 5. XÓA ĐƠN (ADMIN) ---
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    
    // Lưu ý: Xóa Order thì phải xóa luôn Ticket liên quan để nhả ghế ra
    await Ticket.deleteMany({ order: req.params.id });

    res.json({ message: "Xóa đơn hàng và vé liên quan thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa đơn hàng", error: err.message });
  }
};