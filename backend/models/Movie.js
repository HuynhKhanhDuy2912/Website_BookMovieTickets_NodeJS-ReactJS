const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    director: String,
    cast: [String],
    genre: [String],
    duration: Number, // phút
    language: String,
    ageRating: String, // C16, C18, P,...
    releaseDate: Date,
    posterUrl: String,
    trailerUrl: String,
    status: {
      type: String,
      enum: ["coming_soon", "now_showing", "ended"],
      default: "coming_soon",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
