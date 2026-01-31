const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Showtime = require("../models/Showtime");
const Combo = require("../models/Combo");

// --- 1. TẠO ĐƠN HÀNG MỚI (CÓ LOGIC TÍNH GIÁ VIP) ---
exports.createOrder = async (req, res) => {
  try {
    console.log("---------------- START CREATE ORDER (VIP LOGIC) ----------------");
    const { showtimeId, seats, combos, paymentMethod } = req.body;
    const userId = req.user ? req.user._id : req.body.userId;

    // A. LẤY THÔNG TIN SHOWTIME VÀ ROOM
    // Populate 'room' để lấy cấu hình ghế VIP
    const showtimeData = await Showtime.findById(showtimeId).populate("room");
    if (!showtimeData) return res.status(404).json({ message: "Suất chiếu không tồn tại!" });

    const roomData = showtimeData.room;
    if (!roomData) return res.status(404).json({ message: "Dữ liệu phòng chiếu bị lỗi!" });

    // Cấu hình giá
    const basePrice = Number(showtimeData.price) || 50000; // Giá gốc (Standard)
    const vipSurcharge = 20000; // Phụ thu ghế VIP (Có thể thay đổi hoặc lấy từ DB nếu có config)

    console.log(`🎫 Giá gốc: ${basePrice} | Phụ thu VIP: ${vipSurcharge}`);

    // B. KIỂM TRA GHẾ TRÙNG
    const existingTickets = await Ticket.find({ showtime: showtimeId, seatNumber: { $in: seats } });
    if (existingTickets.length > 0) return res.status(400).json({ message: "Ghế đã có người đặt!" });

    // C. TÍNH TIỀN VÉ & XÁC ĐỊNH LOẠI GHẾ
    let ticketTotal = 0;
    const processedTickets = []; // Mảng vé chi tiết để lưu vào Order & Ticket collection

    // Duyệt qua từng ghế khách chọn
    const seatList = Array.isArray(seats) ? seats : [];

    for (const seatLabel of seatList) {
      // Tìm thông tin ghế trong cấu hình Room
      // (Room lưu seats dạng [{ seatNumber: "A1", type: "vip" }, ...])
      const seatConfig = roomData.seats.find(s => s.seatNumber === seatLabel);

      let finalPrice = basePrice;
      let seatType = "standard";

      // Nếu tìm thấy ghế trong config và nó là VIP -> Tính giá VIP
      if (seatConfig && seatConfig.type === "vip") {
        finalPrice = basePrice + vipSurcharge;
        seatType = "vip";
      }

      ticketTotal += finalPrice;

      // Lưu chi tiết từng vé
      processedTickets.push({
        seatNumber: seatLabel,
        type: seatType,
        price: finalPrice
      });
    }

    console.log(`➕ Tổng tiền vé (${seatList.length} ghế): ${ticketTotal}`);

    // D. TÍNH TIỀN COMBO
    let comboTotal = 0;
    const processedCombos = [];
    if (combos && Array.isArray(combos)) {
      for (const item of combos) {
        const comboDb = await Combo.findById(item.comboId || item._id);
        if (comboDb) {
          const qty = parseInt(item.quantity) || 0;
          const price = Number(comboDb.price) || 0;

          if (qty > 0) {
            comboTotal += price * qty;
            processedCombos.push({
              comboId: comboDb._id, name: comboDb.name, quantity: qty, price: price
            });
          }
        }
      }
    }
    console.log(`➕ Tổng tiền Combo: ${comboTotal}`);

    // E. TỔNG TIỀN CUỐI CÙNG
    let finalTotal = ticketTotal + comboTotal;
    if (isNaN(finalTotal) || finalTotal < 0) {
      console.error("⚠️ Lỗi tính toán! Reset về 0.");
      finalTotal = 0;
    }

    console.log(`💰 TỔNG ĐƠN HÀNG: ${finalTotal}`);

    // F. LƯU ĐƠN HÀNG (ORDER)
    const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newOrder = await Order.create({
      user: userId,
      showtime: showtimeId,
      orderCode: orderCode,

      // Lưu mảng vé chi tiết (đã có type vip/standard)
      tickets: processedTickets,

      // Vẫn lưu mảng seats string để tương thích ngược hoặc query nhanh
      seats: seatList,

      totalPrice: finalTotal,
      paymentMethod: paymentMethod || "Cash",
      status: "success",
      combos: processedCombos
    });

    // G. LƯU VÉ (TICKET COLLECTION)
    if (processedTickets.length > 0) {
      const ticketsToSave = processedTickets.map(t => ({
        movie: showtimeData.movie,
        showtime: showtimeId,
        user: userId,
        order: newOrder._id,
        seatNumber: t.seatNumber,
        type: t.type,       // Lưu loại ghế
        price: t.price,     // Lưu giá vé cụ thể của ghế này
        status: "booked"
      }));
      await Ticket.insertMany(ticketsToSave);
    }

    // H. SOCKET REAL-TIME
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