const Combo = require("../models/Combo");

// Lấy danh sách tất cả combo
exports.getAllCombos = async (req, res) => {
  try {
    const combos = await Combo.find();
    res.json(combos);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách combo", error: err.message });
  }
};

// Lấy combo theo ID
exports.getComboById = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    if (!combo) return res.status(404).json({ message: "Không tìm thấy combo" });
    res.json(combo);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin combo", error: err.message });
  }
};

// Tạo combo mới
exports.createCombo = async (req, res) => {
  try {
    const combo = await Combo.create(req.body);
    res.status(201).json({ message: "Thêm combo thành công", combo });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi thêm combo", error: err.message });
  }
};

// Cập nhật combo
exports.updateCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!combo) return res.status(404).json({ message: "Không tìm thấy combo" });
    res.json({ message: "Cập nhật combo thành công", combo });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi cập nhật combo", error: err.message });
  }
};

// Xóa combo
exports.deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndDelete(req.params.id);
    if (!combo) return res.status(404).json({ message: "Không tìm thấy combo" });
    res.json({ message: "Xóa combo thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa combo", error: err.message });
  }
};
