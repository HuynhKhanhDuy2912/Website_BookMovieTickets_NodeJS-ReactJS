const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
    orderCode: { type: String, required: true, unique: true },

    // 👇 QUAN TRỌNG: Phải khai báo là mảng Object, KHÔNG ĐƯỢC để [String]
    tickets: [
      {
        seatNumber: { type: String }, 
        type: { type: String, default: 'standard' },       
        price: { type: Number }       
      }
    ],

    // Vẫn giữ seats mảng string để tương thích ngược nếu cần
    seats: [String],

    totalPrice: { type: Number, required: true, default: 0 },
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