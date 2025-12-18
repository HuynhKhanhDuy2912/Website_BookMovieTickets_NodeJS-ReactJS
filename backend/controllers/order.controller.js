const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
// Tạo đơn hàng mới (User đặt vé, combo, v.v.)
exports.createOrder = async (req, res) => {
  try {
    const { showtimeId, userId, seats, total, combos, paymentMethod } = req.body;

    // --- BƯỚC 1: LẤY THÔNG TIN SHOWTIME ĐỂ BIẾT MOVIE ID ---
    const showtimeData = await Showtime.findById(showtimeId);
    if (!showtimeData) {
      return res.status(404).json({ message: "Suất chiếu không tồn tại!" });
    }

    // --- BƯỚC 2: KIỂM TRA GHẾ TRÙNG ---
    const existingTickets = await Ticket.find({
      showtime: showtimeId,
      seatNumber: { $in: seats }
    });

    if (existingTickets.length > 0) {
      return res.status(400).json({ message: "Ghế đã có người đặt, vui lòng chọn ghế khác!" });
    }

    // --- BƯỚC 3: TẠO MÃ ĐƠN HÀNG ---
    const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // --- BƯỚC 4: TẠO ORDER ---
    const newOrder = await Order.create({
      orderCode: orderCode,
      user: userId,
      showtime: showtimeId,
      totalPrice: total,
      paymentMethod: paymentMethod || "Momo",
      status: "success", 
      combos: combos || []
    });

    // --- BƯỚC 5: TẠO VÉ (TICKET) ---
    // Bây giờ ta đã có showtimeData.movie để gán vào vé
    const tickets = seats.map(seat => ({
      movie: showtimeData.movie, // <--- QUAN TRỌNG: THÊM DÒNG NÀY ĐỂ HẾT LỖI
      showtime: showtimeId,
      user: userId,
      order: newOrder._id,
      seatNumber: seat,
      price: showtimeData.price || 75000, // Lấy luôn giá từ showtime cho chuẩn
      status: "active"
    }));

    await Ticket.insertMany(tickets);

    res.status(201).json({ message: "Đặt vé thành công", order: newOrder });

  } catch (err) {
    console.error("Lỗi đặt vé:", err);
    res.status(500).json({ message: "Lỗi tạo đơn hàng", error: err.message });
  }
};

// Lấy danh sách đơn hàng của chính người dùng
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng", error: err.message });
  }
};

// Lấy tất cả đơn hàng (staff + admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách tất cả đơn hàng", error: err.message });
  }
};

// Cập nhật đơn hàng (staff + admin)
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    res.json({ message: "Cập nhật đơn hàng thành công", order });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi cập nhật đơn hàng", error: err.message });
  }
};

// Xóa đơn hàng (chỉ admin)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    res.json({ message: "Xóa đơn hàng thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa đơn hàng", error: err.message });
  }
};
