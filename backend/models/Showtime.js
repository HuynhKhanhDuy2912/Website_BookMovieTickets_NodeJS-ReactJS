const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: "Cinema", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Showtime", showtimeSchema);
