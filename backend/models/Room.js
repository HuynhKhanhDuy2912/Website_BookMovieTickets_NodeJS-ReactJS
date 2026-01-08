// models/Room.js
const mongoose = require("mongoose");

function generateSeatLabel(rowIndex, colIndex) {
  // rowIndex 0 -> 'A', 1 -> 'B', ...
  const rowLetter = String.fromCharCode("A".charCodeAt(0) + rowIndex);
  return `${rowLetter}${colIndex + 1}`; // A1, A2, ...
}

const roomSchema = new mongoose.Schema(
  {
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: "Cinema", required: true },
    name: { type: String, required: true },
    seatCount: Number,
    // optional: rows, cols để hook biết cách sinh
    rows: Number,
    cols: Number,
    seats: [
      {
        seatNumber: String,
        type: { type: String, enum: ["standard", "vip"], default: "standard" },
        status: { type: String, enum: ["active", "maintenance"], default: "active" },
      },
    ],
  },
  { timestamps: true }
);

// pre-save hook: nếu chưa có seats nhưng có rows & cols => generate
roomSchema.pre("save", function (next) {
  if ((!this.seats || this.seats.length === 0) && this.rows && this.cols) {
    const seats = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const seatNumber = generateSeatLabel(r, c);
        // Ví dụ: hàng A là VIP -> bạn có thể điều chỉnh theo rule
        const type = r === 0 ? "vip" : "standard"; // ví dụ: hàng 0 (A) là VIP
        seats.push({ seatNumber, type, status: "available" });
      }
    }
    this.seats = seats;
    this.seatCount = seats.length;
  } else if (this.seats && this.seats.length) {
    // luôn đồng bộ seatCount với độ dài mảng seats
    this.seatCount = this.seats.length;
  }
  next();
});

module.exports = mongoose.model("Room", roomSchema);
