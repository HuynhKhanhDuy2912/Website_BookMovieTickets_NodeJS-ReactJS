const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Showtime = require("../models/Showtime");
const Combo = require("../models/Combo");

// --- 1. TẠO ĐƠN HÀNG MỚI (BẢO MẬT CAO + REAL-TIME) ---
exports.createOrder = async (req, res) => {
  try {
    console.log("---------------- START CREATE ORDER ----------------"); // 🚩 DẤU HIỆU CODE MỚI
    const { showtimeId, seats, combos, paymentMethod } = req.body;
    const userId = req.user ? req.user._id : req.body.userId;

    // A. LẤY THÔNG TIN SHOWTIME
    const showtimeData = await Showtime.findById(showtimeId);
    if (!showtimeData) return res.status(404).json({ message: "Suất chiếu không tồn tại!" });

    // Ép kiểu giá vé về số (Chống lỗi nếu DB lưu null)
    const ticketPrice = Number(showtimeData.price) || 50000;
    console.log(`🎫 Giá vé gốc: ${ticketPrice}`);

    // B. KIỂM TRA GHẾ TRÙNG
    const existingTickets = await Ticket.find({ showtime: showtimeId, seatNumber: { $in: seats } });
    if (existingTickets.length > 0) return res.status(400).json({ message: "Ghế đã có người đặt!" });

    // C. TÍNH TIỀN (LOGIC BẤT TỬ)
    let calculatedTotal = 0;

    // 1. Tính tiền Vé
    const seatList = Array.isArray(seats) ? seats : [];
    const ticketTotal = ticketPrice * seatList.length;
    calculatedTotal += ticketTotal;
    console.log(`➕ Tiền vé (${seatList.length} ghế): ${ticketTotal}`);

    // 2. Tính tiền Combo
    const processedCombos = [];
    if (combos && Array.isArray(combos)) {
      for (const item of combos) {
        const comboDb = await Combo.findById(item.comboId || item._id);
        if (comboDb) {
          const qty = parseInt(item.quantity) || 0;
          const price = Number(comboDb.price) || 0;

          if (qty > 0) {
            const itemTotal = price * qty;
            calculatedTotal += itemTotal;
            console.log(`➕ Combo ${comboDb.name} (${qty} x ${price}): ${itemTotal}`);

            processedCombos.push({
              comboId: comboDb._id, name: comboDb.name, quantity: qty, price: price
            });
          }
        }
      }
    }

    // ⛔ CHỐT CHẶN CUỐI CÙNG (Fix lỗi NaN)
    if (isNaN(calculatedTotal) || calculatedTotal < 0) {
      console.error("⚠️ PHÁT HIỆN LỖI NaN! Đã Reset về 0.");
      calculatedTotal = 0;
    }

    console.log(`💰 TỔNG TIỀN CHỐT LƯU DB: ${calculatedTotal}`); // 🚩 KIỂM TRA DÒNG NÀY TRÊN TERMINAL

    // D. LƯU ĐƠN
    const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newOrder = await Order.create({
      user: userId,
      showtime: showtimeId,
      orderCode: orderCode,
      seats: seatList,
      totalPrice: calculatedTotal, // Đã được bảo vệ
      paymentMethod: paymentMethod || "Cash",
      status: "success",
      combos: processedCombos
    });

    // E. TẠO TICKET
    if (seatList.length > 0) {
      const tickets = seatList.map(seat => ({
        movie: showtimeData.movie, showtime: showtimeId, user: userId,
        order: newOrder._id, seatNumber: seat, price: ticketPrice, status: "booked"
      }));
      await Ticket.insertMany(tickets);
    }

    // F. SOCKET
    if (req.io) {
      seatList.forEach(seatLabel => req.io.to(showtimeId).emit("seat_sold", seatLabel));
    }

    res.status(201).json({ success: true, order: newOrder });
    console.log("---------------- END CREATE ORDER ----------------");

  } catch (err) {
    console.error("🔥 Lỗi tạo đơn:", err);
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};
// --- 2. LẤY ĐƠN HÀNG CỦA TÔI ---
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
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

// --- 5. XÓA ĐƠN (ADMIN) + SOCKET NHẢ GHẾ ---
exports.deleteOrder = async (req, res) => {
  try {
    // 1. Tìm đơn hàng trước để lấy thông tin showtime và seats
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    const showtimeId = order.showtime.toString(); // Lấy ID phòng để emit socket

    // 2. Tìm các vé liên quan để lấy danh sách ghế cần nhả
    const tickets = await Ticket.find({ order: req.params.id });
    const releasedSeats = tickets.map(t => t.seatNumber);

    // 3. Xóa Order
    await Order.findByIdAndDelete(req.params.id);

    // 4. Xóa Tickets
    await Ticket.deleteMany({ order: req.params.id });

    // 🔥 [SOCKET UPDATE]: Báo cho client biết ghế đã được NHẢ RA (Trống lại)
    if (req.io && releasedSeats.length > 0) {
      releasedSeats.forEach(seatLabel => {
        req.io.to(showtimeId).emit("seat_released", seatLabel);
      });
      console.log(`📡 Socket: Đã nhả ghế ${releasedSeats} cho phòng ${showtimeId}`);
    }

    res.json({ message: "Xóa đơn hàng và vé liên quan thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa đơn hàng", error: err.message });
  }
};