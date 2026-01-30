const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message"); // 👈 QUAN TRỌNG: Import Model để lưu tin nhắn

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

let activeUsers = []; // Lưu danh sách user đang online (Optional)

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. User/Guest đăng nhập vào chat
  socket.on("register_user", (username) => {
    const existingUser = activeUsers.find((u) => u.socketId === socket.id);
    if (!existingUser) {
      activeUsers.push({ socketId: socket.id, username, role: "client" });
    }
    // Gửi danh sách user online cho Admin (nếu cần hiển thị ai đang onl)
    io.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
    console.log("User Registered:", username);
  });

  // 2. Admin đăng nhập vào chat
  socket.on("register_admin", () => {
    // Admin join thì gửi ngay danh sách user đang onl cho Admin
    socket.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
  });

  // 3. KHÁCH GỬI TIN CHO ADMIN (Có lưu DB)
// 3. KHÁCH GỬI TIN CHO ADMIN
  socket.on("send_to_admin", async (data) => {
    // 👇 Lấy conversationId và username từ client gửi lên
    const { message, time, conversationId, username } = data; 

    try {
      // A. Lưu vào MongoDB
      const newMessage = new Message({
        // 👇 QUAN TRỌNG: Dùng conversationId cố định, KHÔNG dùng socket.id nữa
        conversationId: conversationId || socket.id, 
        sender: "client",
        senderName: username || "Khách ẩn danh",
        text: message
      });
      await newMessage.save();

      // B. Gửi Real-time cho Admin
      io.emit("receive_from_client", {
        // 👇 Gửi ID cố định này cho Admin để Admin biết ai là ai
        senderId: conversationId || socket.id, 
        senderName: username,
        message: message,
        time: time
      });
    } catch (err) {
      console.error("Lỗi lưu tin nhắn client:", err);
    }
  });

  // 4. ADMIN TRẢ LỜI KHÁCH (Có lưu DB)
  socket.on("send_to_client", async ({ toSocketId, message, time }) => {
    try {
      console.log(`Admin reply to ${toSocketId}: ${message}`);

      // A. Lưu vào MongoDB
      const newMessage = new Message({
        conversationId: toSocketId, // Lưu vào cuộc trò chuyện của khách đó
        sender: "admin",
        text: message,
        isRead: true // Admin nhắn thì coi như đã xem
      });
      await newMessage.save();

      // B. Gửi Real-time tới ĐÚNG ông khách đó
      io.to(toSocketId).emit("receive_from_admin", {
        message,
        time,
        sender: "ADMIN"
      });
    } catch (err) {
      console.error("Lỗi lưu tin nhắn admin:", err);
    }
  });

  // 5. Ngắt kết nối
  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((u) => u.socketId !== socket.id);
    io.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));