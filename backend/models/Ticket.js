const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    totalPrice: Number,
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
