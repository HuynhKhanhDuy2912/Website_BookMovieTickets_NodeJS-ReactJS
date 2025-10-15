const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: "Cinema", required: true },
    name: { type: String, required: true },
    seatCount: Number,
    seats: [
      {
        seatNumber: String, // ví dụ: A1, A2
        type: { type: String, enum: ["standard", "vip"], default: "standard" },
        status: { type: String, enum: ["available", "booked"], default: "available" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
