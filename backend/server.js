const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/cinema", require("./routes/cinema.route"));
app.use("/api/movie", require("./routes/movie.route"));
app.use("/api/article", require("./routes/article.route"));
app.use("/api/combo", require("./routes/combo.route"));
app.use("/api/order", require("./routes/order.route"));
app.use("/api/room", require("./routes/room.route"));
app.use("/api/showtime", require("./routes/showtime.route"));
app.use("/api/ticket", require("./routes/ticket.route"));
app.use("/api/upload", require("./routes/upload.route"));
app.use("/api/user", require("./routes/user.route"));
app.use("/api/review", require("./routes/review.route"));
app.use('/api/admin', require("./routes/index"));
app.use("/api/contact", require("./routes/contact.route"));
app.use("/api/chat", require("./routes/chat.route"));

// --- SOCKET SERVER SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL Frontend
    methods: ["GET", "POST"],
  },
});

let activeUsers = [];

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 👇 1. [MỚI THÊM] QUAN TRỌNG: Cho phép socket tham gia vào phòng chat riêng
  // Nếu không có đoạn này, io.to(conversationId) sẽ gửi vào hư không
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} đã tham gia phòng: ${conversationId}`);
  });

  // 2. User/Guest đăng nhập (Logic hiển thị Online)
  socket.on("register_user", (data) => { // 👈 Sửa tham số nhận vào là object data
    // Client sẽ gửi lên: { username: "Tên", conversationId: "guest_..." }
    const { username, conversationId } = data;

    const existingUser = activeUsers.find((u) => u.socketId === socket.id);
    if (!existingUser) {
      // 👇 LƯU THÊM conversationId VÀO DANH SÁCH ONLINE
      activeUsers.push({
        socketId: socket.id,
        username,
        conversationId: conversationId, // <--- Quan trọng
        role: "client"
      });
    }

    io.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
    console.log("User Registered:", username);
  });

  // 3. Admin đăng nhập
  socket.on("register_admin", () => {
    socket.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
  });

  // 4. KHÁCH GỬI TIN CHO ADMIN
  socket.on("send_to_admin", async (data) => {
    const { message, time, conversationId, username } = data;

    try {
      // A. Lưu vào MongoDB
      const newMessage = new Message({
        conversationId: conversationId || socket.id,
        sender: "client",
        senderName: username || "Khách ẩn danh",
        text: message
      });
      await newMessage.save();

      // B. Gửi Real-time cho Admin
      io.emit("receive_from_client", {
        senderId: conversationId || socket.id,
        senderName: username,
        message: message,
        time: time
      });
    } catch (err) {
      console.error("Lỗi lưu tin nhắn client:", err);
    }
  });

  // 5. ADMIN TRẢ LỜI KHÁCH
  socket.on("send_to_client", async ({ toSocketId, message, time }) => {
    try {
      console.log(`Admin reply to ${toSocketId}: ${message}`);

      // A. Lưu vào MongoDB
      const newMessage = new Message({
        conversationId: toSocketId,
        sender: "admin",
        text: message,
        isRead: true
      });
      await newMessage.save();

      // B. Gửi Real-time tới ĐÚNG phòng (Room) đó
      // Vì Client đã join room 'toSocketId' ở bước 1, nên sẽ nhận được ngay
      io.to(toSocketId).emit("receive_from_admin", {
        message,
        time,
        sender: "ADMIN"
      });
    } catch (err) {
      console.error("Lỗi lưu tin nhắn admin:", err);
    }
  });

  // 6. Ngắt kết nối
  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((u) => u.socketId !== socket.id);
    io.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));