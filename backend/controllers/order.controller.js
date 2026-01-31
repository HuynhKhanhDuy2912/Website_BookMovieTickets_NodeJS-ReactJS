const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Showtime = require("../models/Showtime");
const Combo = require("../models/Combo");

// --- 1. TẠO ĐƠN HÀNG MỚI (CÓ LOGIC TÍNH GIÁ VIP) ---
exports.createOrder = async (req, res) => {
  try {
    console.log("---------------- START CREATE ORDER (FIXED SCHEMA) ----------------");
    const { showtimeId, seats, combos, paymentMethod, guestName } = req.body;
    
    // 1. Xử lý User ID (Cho phép null)
    const userId = (req.user && req.user._id) ? req.user._id : (req.body.userId || null);

    // A. LẤY THÔNG TIN SHOWTIME VÀ ROOM
    const showtimeData = await Showtime.findById(showtimeId).populate("room");
    if (!showtimeData) return res.status(404).json({ message: "Suất chiếu không tồn tại!" });

    const roomData = showtimeData.room;
    if (!roomData) return res.status(404).json({ message: "Dữ liệu phòng chiếu bị lỗi!" });

    const basePrice = Number(showtimeData.price) || 50000; 
    const vipSurcharge = 20000; 

    // B. KIỂM TRA GHẾ TRÙNG
    const seatList = Array.isArray(seats) ? seats : [];
    if (seatList.length === 0) return res.status(400).json({ message: "Vui lòng chọn ghế!" });

    // Logic kiểm tra trùng khớp với POS: Check mảng seats
    const existingTickets = await Ticket.find({ 
        showtime: showtimeId, 
        status: { $ne: "cancelled" },
        seats: { $in: seatList } 
    });
    
    if (existingTickets.length > 0) {
        const takenSeats = existingTickets.flatMap(t => t.seats).filter(s => seatList.includes(s));
        return res.status(400).json({ message: `Ghế ${takenSeats.join(", ")} đã có người đặt!` });
    }

    // C. TÍNH TIỀN VÉ
    let ticketTotal = 0;
    const processedTickets = []; 

    for (const seatLabel of seatList) {
      const seatConfig = roomData.seats ? roomData.seats.find(s => s.seatNumber === seatLabel) : null;
      let finalPrice = basePrice;
      let seatType = "standard";

      if (seatConfig && seatConfig.type === "vip") {
        finalPrice = basePrice + vipSurcharge;
        seatType = "vip";
      }

      ticketTotal += finalPrice;
      processedTickets.push({ seatNumber: seatLabel, type: seatType, price: finalPrice });
    }

    // D. TÍNH TIỀN COMBO
    let comboTotal = 0;
    const processedCombos = [];
    if (combos && Array.isArray(combos)) {
      for (const item of combos) {
        const comboId = item.comboId || item._id;
        if (!comboId) continue;
        const comboDb = await Combo.findById(comboId);
        if (comboDb) {
          const qty = parseInt(item.quantity) || 0;
          const price = Number(comboDb.price) || 0;
          if (qty > 0) {
            comboTotal += price * qty;
            processedCombos.push({ comboId: comboDb._id, name: comboDb.name, quantity: qty, price: price });
          }
        }
      }
    }

    // E. TỔNG TIỀN
    let finalTotal = ticketTotal + comboTotal;
    if (isNaN(finalTotal)) finalTotal = 0;

    // F. LƯU ĐƠN HÀNG (ORDER)
    const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newOrder = await Order.create({
      user: userId,
      showtime: showtimeId,
      orderCode: orderCode,
      tickets: processedTickets, // Lưu chi tiết để hiển thị trong lịch sử
      seats: seatList,
      totalPrice: finalTotal,
      paymentMethod: paymentMethod || "Cash",
      status: "success", // Giả sử thanh toán luôn thành công
      combos: processedCombos
    });

    // G. LƯU VÉ (TICKET COLLECTION) - 👇 ĐÃ SỬA LẠI CHO KHỚP SCHEMA MỚI 👇
    // Thay vì insertMany vé lẻ, ta tạo 1 Ticket gộp (giống POS)
    if (seatList.length > 0) {
      await Ticket.create({
        movie: showtimeData.movie,
        showtime: showtimeId,
        user: userId,
        guestName: guestName || "Khách Online",
        order: newOrder._id, // Link tới Order
        
        seats: seatList,         // ✅ Đúng Schema: Mảng ghế ["A1", "A2"]
        totalPrice: ticketTotal, // ✅ Đúng Schema: Tổng tiền vé
        
        status: "booked", 
        paymentStatus: "paid",   // Vì Order success nên Ticket là paid
        isManual: false
      });
    }

    // H. SOCKET REAL-TIME (Đồng bộ với Admin POS)
    if (req.io) {
        req.io.to(showtimeId.toString()).emit("seat_sold", seatList);
    }
    
    // Xóa timer giữ ghế nếu có
    if (req.clearSeatHold) {
        req.clearSeatHold(showtimeId.toString(), seatList);
    }

    res.status(201).json({ success: true, message: "Đặt vé thành công", order: newOrder });
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
        // 👇 QUAN TRỌNG: Populate thêm cinema và room
        populate: [
          { path: "movie", select: "title posterUrl" },
          { path: "cinema", select: "name" }, // Lấy tên rạp (VD: CGV Vincom)
          { path: "room", select: "name" }    // Lấy tên phòng (VD: Phòng 2)
        ]
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