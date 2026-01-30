const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Showtime = require("../models/Showtime");
const Combo = require("../models/Combo");

// --- 1. TẠO ĐƠN HÀNG MỚI (BẢO MẬT CAO + REAL-TIME) ---
exports.createOrder = async (req, res) => {
  try {
    // ⚠️ CHÚ Ý: KHÔNG LẤY 'total' TỪ BODY ĐỂ TRÁNH HACKER SỬA GIÁ
    const { showtimeId, seats, combos, paymentMethod } = req.body;
    
    // Lấy User ID từ Token (An toàn hơn lấy từ body)
    const userId = req.user ? req.user._id : req.body.userId; 

    // A. LẤY THÔNG TIN SHOWTIME & KIỂM TRA THỜI GIAN
    const showtimeData = await Showtime.findById(showtimeId);
    if (!showtimeData) {
      return res.status(404).json({ message: "Suất chiếu không tồn tại!" });
    }

    // ⛔ SECURITY: Chặn đặt vé suất đã chiếu
    const now = new Date();
    const startTime = new Date(showtimeData.startTime);
    if (now >= startTime) {
         return res.status(400).json({ message: "Suất chiếu đã bắt đầu hoặc kết thúc, không thể đặt vé!" });
    }

    // B. KIỂM TRA GHẾ TRÙNG (QUAN TRỌNG NHẤT)
    const existingTickets = await Ticket.find({
      showtime: showtimeId,
      seatNumber: { $in: seats }
    });

    if (existingTickets.length > 0) {
      const takenSeats = existingTickets.map(t => t.seatNumber).join(", ");
      return res.status(400).json({ 
        message: `Ghế ${takenSeats} đã vừa có người khác nhanh tay đặt trước. Vui lòng chọn ghế khác!` 
      });
    }
    
    if (!showtimeData.price) {
        return res.status(500).json({ 
            message: "Lỗi hệ thống: Suất chiếu này chưa được cấu hình giá vé. Vui lòng liên hệ Admin!" 
        });
    }

    // C. TÍNH TIỀN TẠI SERVER
    // 1. Tính tiền Vé
    const ticketPrice = showtimeData.price; 
    let calculatedTotal = ticketPrice * seats.length;

    // 2. Tính tiền Combo
    const processedCombos = [];
    if (combos && combos.length > 0) {
      for (const item of combos) {
         const comboDb = await Combo.findById(item.comboId || item._id);
         if (comboDb) {
            const qty = item.quantity || 1;
            calculatedTotal += comboDb.price * qty;
            
            processedCombos.push({
               comboId: comboDb._id,
               name: comboDb.name,
               quantity: qty,
               price: comboDb.price 
            });
         }
      }
    }

    // D. TẠO MÃ ĐƠN HÀNG
    const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // E. LƯU ORDER
    const newOrder = await Order.create({
      user: userId,
      showtime: showtimeId,
      orderCode: orderCode,
      seats: seats,             
      totalPrice: calculatedTotal,
      paymentMethod: paymentMethod || "Cash",
      status: "success",        
      combos: processedCombos
    });

    // F. TẠO TICKET (Khóa ghế)
    const tickets = seats.map(seat => ({
      movie: showtimeData.movie, 
      showtime: showtimeId,
      user: userId,
      order: newOrder._id,
      seatNumber: seat,         
      price: ticketPrice, 
      status: "booked"          
    }));

    await Ticket.insertMany(tickets);

    // 🔥 [SOCKET UPDATE]: Báo cho tất cả client khác biết ghế này ĐÃ BÁN
    if (req.io) {
        seats.forEach(seatLabel => {
            // Gửi sự kiện 'seat_sold' tới phòng 'showtimeId'
            req.io.to(showtimeId).emit("seat_sold", seatLabel);
        });
        console.log(`📡 Socket: Đã báo bán ghế ${seats} cho phòng ${showtimeId}`);
    }

    res.status(201).json({ message: "Đặt vé thành công", order: newOrder });

  } catch (err) {
    console.error("Lỗi đặt vé:", err);
    res.status(500).json({ message: "Lỗi tạo đơn hàng", error: err.message });
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