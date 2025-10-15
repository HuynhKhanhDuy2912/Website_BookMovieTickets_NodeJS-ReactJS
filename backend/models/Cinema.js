const mongoose = require("mongoose");

const cinemaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: String,
    phone: String,
    image: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cinema", cinemaSchema);
