const Ticket = require("../models/Ticket");
const Showtime = require("../models/Showtime");
const User = require("../models/User");
const Order = require("../models/Order");

// Tạo vé mới
exports.createTicket = async (req, res) => {
  try {
    const { user, showtime, seats, totalPrice, paymentStatus, order } = req.body;

    // Kiểm tra showtime và user có tồn tại không
    const foundShowtime = await Showtime.findById(showtime);
    const foundUser = await User.findById(user);

    if (!foundShowtime) return res.status(404).json({ message: "Showtime not found" });
    if (!foundUser) return res.status(404).json({ message: "User not found" });

    const ticket = new Ticket({
      user,
      showtime,
      seats,
      totalPrice,
      paymentStatus,
      order,
    });

    await ticket.save();

    res.status(201).json({ message: "Ticket created successfully", ticket });
  } catch (error) {
    res.status(500).json({ message: "Error creating ticket", error: error.message });
  }
};

// Lấy vé của chính người dùng (dựa theo token đăng nhập)
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title" },
          { path: "cinema", select: "name" },
          { path: "room", select: "name" },
        ],
      })
      .populate("order", "orderCode paymentStatus totalAmount")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user tickets", error: error.message });
  }
};

// Lấy tất cả vé
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("user", "name email")
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title duration" },
          { path: "cinema", select: "name location" },
          { path: "room", select: "name" },
        ],
      })
      .populate("order", "orderCode paymentStatus totalAmount")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets", error: error.message });
  }
};

// Lấy vé theo ID
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title" },
          { path: "cinema", select: "name" },
          { path: "room", select: "name" },
        ],
      })
      .populate("order", "orderCode paymentStatus totalAmount");

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ticket", error: error.message });
  }
};

// Cập nhật vé
exports.updateTicket = async (req, res) => {
  try {
    const { seats, totalPrice, paymentStatus, order } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { seats, totalPrice, paymentStatus, order },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    res.status(200).json({ message: "Ticket updated successfully", ticket });
  } catch (error) {
    res.status(500).json({ message: "Error updating ticket", error: error.message });
  }
};

// Xóa vé
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ticket", error: error.message });
  }
};
