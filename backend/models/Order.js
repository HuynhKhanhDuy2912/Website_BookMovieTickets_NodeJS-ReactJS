const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }],
    combos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Combo" }],
    totalAmount: Number,
    orderCode: { type: String, unique: true },
    paymentMethod: {
      type: String,
      enum: ["Momo", "ZaloPay", "cash"],
      default: "cash",
    },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
