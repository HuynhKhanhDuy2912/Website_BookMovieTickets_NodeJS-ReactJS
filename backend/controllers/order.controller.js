const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Showtime = require("../models/Showtime");
const Combo = require("../models/Combo"); // Import thêm Combo Model để tính tiền

// --- 1. TẠO ĐƠN HÀNG MỚI (BẢO MẬT CAO) ---
exports.createOrder = async (req, res) => {
  try {
    // ⚠️ CHÚ Ý: KHÔNG LẤY 'total' TỪ BODY ĐỂ TRÁNH HACKER SỬA GIÁ
    const { showtimeId, seats, combos, paymentMethod } = req.body;
    
    // Lấy User ID từ Token (An toàn hơn lấy từ body)
    // Giả sử middleware auth đã gán req.user
    const userId = req.user ? req.user._id : req.body.userId; 

    // A. LẤY THÔNG TIN SHOWTIME & KIỂM TRA THỜI GIAN
    const showtimeData = await Showtime.findById(showtimeId);
    if (!showtimeData) {
      return res.status(404).json({ message: "Suất chiếu không tồn tại!" });
    }

    // ⛔ SECURITY: Chặn đặt vé suất đã chiếu (Layer 2 Protection)
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
    // C. TÍNH TIỀN TẠI SERVER (SERVER-SIDE CALCULATION)
    // 1. Tính tiền Vé
    const ticketPrice = showtimeData.price; // Giá mặc định nếu thiếu
    let calculatedTotal = ticketPrice * seats.length;

    // 2. Tính tiền Combo (Phải tra cứu giá gốc từ DB)
    const processedCombos = [];
    if (combos && combos.length > 0) {
      for (const item of combos) {
         const comboDb = await Combo.findById(item.comboId || item._id);
         if (comboDb) {
            const qty = item.quantity || 1;
            // Cộng dồn tiền
            calculatedTotal += comboDb.price * qty;
            
            // Lưu lại thông tin combo chuẩn để nhét vào Order
            processedCombos.push({
               comboId: comboDb._id,
               name: comboDb.name,
               quantity: qty,
               price: comboDb.price // Lưu giá tại thời điểm mua
            });
         }
      }
    }

    // D. TẠO MÃ ĐƠN HÀNG
    const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // E. LƯU ORDER (Với giá tiền do Server tính)
    const newOrder = await Order.create({
      user: userId,
      showtime: showtimeId,
      orderCode: orderCode,
      seats: seats,             
      totalPrice: calculatedTotal, // ✅ AN TOÀN: Dùng giá server tính
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

    res.status(201).json({ message: "Đặt vé thành công", order: newOrder });

  } catch (err) {
    console.error("Lỗi đặt vé:", err);
    res.status(500).json({ message: "Lỗi tạo đơn hàng", error: err.message });
  }
};

// --- 2. LẤY ĐƠN HÀNG CỦA TÔI (PROFILE) ---
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }) // Dùng req.user._id chuẩn xác hơn req.user.id
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
    
    // Xóa luôn Ticket liên quan để nhả ghế ra
    await Ticket.deleteMany({ order: req.params.id });

    res.json({ message: "Xóa đơn hàng và vé liên quan thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa đơn hàng", error: err.message });
  }
};