const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Liên kết với suất chiếu
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
    },
    orderCode: {
      type: String,
      required: true,
      unique: true,
    },
    // 👇 QUAN TRỌNG: Phải có dòng này thì mới lưu được danh sách ghế (Mảng chuỗi)
    seats: [String], 

    // 👇 QUAN TRỌNG: Phải có dòng này thì mới lưu được Tổng tiền (Tránh NaN)
    totalPrice: {
      type: Number,
      required: true,
      default: 0
    },
    paymentMethod: {
      type: String,
      enum: ["Momo", "ZaloPay", "VNPAY", "ATM", "Card", "Cash"],
      default: "Cash",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
    },
    // Lưu danh sách combo (nếu có)
    combos: [
      {
        comboId: { type: mongoose.Schema.Types.ObjectId, ref: "Combo" },
        name: String,
        quantity: Number,
        price: Number
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);