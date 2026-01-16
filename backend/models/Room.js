const mongoose = require("mongoose");

function generateSeatLabel(rowIndex, colIndex) {
  const rowLetter = String.fromCharCode("A".charCodeAt(0) + rowIndex);
  return `${rowLetter}${colIndex + 1}`;
}

const roomSchema = new mongoose.Schema(
  {
    cinema: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cinema",
      required: true,
    },
    name: { type: String, required: true },
    seatCount: Number,
    rows: Number,
    cols: Number,
    // THÊM TRƯỜNG NÀY ĐỂ NHẬN DỮ LIỆU TỪ FRONTEND
    vipRows: [String],
    seats: [
      {
        seatNumber: String,
        type: { type: String, enum: ["standard", "vip"], default: "standard" },
        status: {
          type: String,
          enum: ["active", "maintenance"],
          default: "active",
        },
      },
    ],
  },
  { timestamps: true }
);

roomSchema.pre("save", function (next) {
  // Chỉ tự động sinh ghế nếu mảng seats đang trống và có đủ rows, cols
  if ((!this.seats || this.seats.length === 0) && this.rows && this.cols) {
    const seats = [];
    for (let r = 0; r < this.rows; r++) {
      const rowLetter = String.fromCharCode(65 + r);

      // Kiểm tra xem hàng hiện tại có nằm trong danh sách hàng VIP không
      const isVip = this.vipRows && this.vipRows.includes(rowLetter);
      const type = isVip ? "vip" : "standard";

      for (let c = 0; c < this.cols; c++) {
        const seatNumber = generateSeatLabel(r, c);
        seats.push({ seatNumber, type, status: "active" });
      }
    }
    this.seats = seats;
    this.seatCount = seats.length;
  } else if (this.seats) {
    this.seatCount = this.seats.length;
  }
  next();
});

module.exports = mongoose.model("Room", roomSchema);
