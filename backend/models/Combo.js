const mongoose = require("mongoose");

const comboSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    category: { type: String, enum: ["food", "drink", "combo"], default: "combo" },
    items: [String],
    price: { type: Number, required: true },
    image: String,
    status: { type: String, enum: ["available", "unavailable"], default: "available" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Combo", comboSchema);
