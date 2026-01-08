const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // Link tới đơn hàng gốc
    
    // 👇👇👇 QUAN TRỌNG: PHẢI CÓ 2 TRƯỜNG NÀY 👇👇👇
    seatNumber: { type: String, required: true }, // Lưu tên ghế: "H10", "A1"
    status: { 
        type: String, 
        enum: ["booked", "sold", "active", "cancelled"], 
        default: "booked" 
    },
    
    price: Number, // Giá vé tại thời điểm mua
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);