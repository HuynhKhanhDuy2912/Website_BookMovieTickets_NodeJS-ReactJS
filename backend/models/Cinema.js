const mongoose = require("mongoose");

const cinemaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: String,
    phone: String,
    image: String,
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }], // thêm dòng này
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cinema", cinemaSchema);
