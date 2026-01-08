const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // THÊM: Để biết đơn này thuộc suất chiếu nào (lấy tên phim, rạp)
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },

    // THÊM: Để hiển thị nhanh danh sách ghế ở trang Profile (VD: ["A1", "A2"])
    seats: [{ type: String }], 

    // SỬA: Lưu chi tiết combo (số lượng, tên, giá lúc mua)
    combos: [
      {
        comboId: { type: mongoose.Schema.Types.ObjectId, ref: "Combo" },
        name: String,
        quantity: Number,
        price: Number
      }
    ],

    // SỬA: Đổi tên thành totalPrice cho khớp với Controller
    totalPrice: { type: Number, required: true },
    
    orderCode: { type: String, unique: true },
    
    paymentMethod: {
      type: String,
      // Mở rộng thêm các loại thanh toán
      enum: ["Momo", "ZaloPay", "VNPAY", "ATM", "Card", "Cash"], 
      default: "Cash",
    },

    // Status của đơn hàng
    status: { 
      type: String, 
      enum: ["pending", "success", "failed", "cancelled"], 
      default: "pending" 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);