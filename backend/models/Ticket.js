const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
    seats: [String],
    totalPrice: Number,
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
