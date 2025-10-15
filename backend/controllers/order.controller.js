const Order = require("../models/Order");

// Tạo đơn hàng mới (User đặt vé, combo, v.v.)
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create({
      user: req.user._id,
      ...req.body,
    });
    res.status(201).json({ message: "Tạo đơn hàng thành công", order });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi tạo đơn hàng", error: err.message });
  }
};

// Lấy danh sách đơn hàng của chính người dùng
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng", error: err.message });
  }
};

// Lấy tất cả đơn hàng (staff + admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách tất cả đơn hàng", error: err.message });
  }
};

// Cập nhật đơn hàng (staff + admin)
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    res.json({ message: "Cập nhật đơn hàng thành công", order });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi cập nhật đơn hàng", error: err.message });
  }
};

// Xóa đơn hàng (chỉ admin)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    res.json({ message: "Xóa đơn hàng thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa đơn hàng", error: err.message });
  }
};
