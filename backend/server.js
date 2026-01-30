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
const server = http.createServer(app);

// 1. SETUP SOCKET IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL Frontend
    methods: ["GET", "POST"],
  },
});

// 2. MIDDLEWARE (Gắn io vào req để Controller dùng được)
app.use((req, res, next) => {
  req.io = io;
  next();
});

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

// --- GLOBAL VARIABLES & CONSTANTS ---
const HOLD_DURATION = 5 * 60 * 1000; // 5 Phút (Tính bằng ms) - QUAN TRỌNG!
let activeUsers = [];   // Danh sách user online (Chat)
let seatHoldMap = {};   // Danh sách ghế đang giữ (Booking)

// --- SOCKET CONNECTION LOGIC ---
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // ==========================
  // PHẦN 1: CHAT SYSTEM
  // ==========================

  // 1.1. Join Room Chat
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined Chat Room: ${conversationId}`);
  });

  // 1.2. User Login
  socket.on("register_user", (data) => {
    const { username, conversationId } = data;
    const existingUser = activeUsers.find((u) => u.socketId === socket.id);
    if (!existingUser) {
      activeUsers.push({
        socketId: socket.id,
        username,
        conversationId,
        role: "client"
      });
    }
    io.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
  });

  // 1.3. Admin Login
  socket.on("register_admin", () => {
    socket.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
  });

  // 1.4. Client -> Admin
  socket.on("send_to_admin", async (data) => {
    const { message, time, conversationId, username } = data;
    try {
      const newMessage = new Message({
        conversationId: conversationId || socket.id,
        sender: "client",
        senderName: username || "Khách ẩn danh",
        text: message
      });
      await newMessage.save();

      io.emit("receive_from_client", {
        senderId: conversationId || socket.id,
        senderName: username,
        message: message,
        time: time
      });
    } catch (err) {
      console.error("Chat Error (Client):", err);
    }
  });

  // 1.5. Admin -> Client
  socket.on("send_to_client", async ({ toSocketId, message, time }) => {
    try {
      const newMessage = new Message({
        conversationId: toSocketId,
        sender: "admin",
        text: message,
        isRead: true
      });
      await newMessage.save();

      io.to(toSocketId).emit("receive_from_admin", {
        message,
        time,
        sender: "ADMIN"
      });
    } catch (err) {
      console.error("Chat Error (Admin):", err);
    }
  });


  // ==========================
  // PHẦN 2: BOOKING SYSTEM (REAL-TIME + TIMER)
  // ==========================

  // 2.1. Join Room Suất Chiếu
  socket.on("join_showtime", ({ showtimeId, userId }) => {
    socket.join(showtimeId);
    const holdsInRoom = seatHoldMap[showtimeId] || {};
    
    // Phân loại ghế để trả về Client
    const myHolds = [];
    const othersHolds = {};

    for (const seat in holdsInRoom) {
      const holder = holdsInRoom[seat];
      if (holder.userId === userId) {
        // Trả về ghế của mình + thời gian hết hạn (để hiện lại đồng hồ khi F5)
        myHolds.push({ seat, expiresAt: holder.expiresAt }); 
      } else {
        othersHolds[seat] = holder.userId;
      }
    }

    socket.emit("load_initial_seats", { myHolds, othersHolds });
  });

  // 2.2. Giữ Ghế (CÓ TIMER)
  socket.on("hold_seat", ({ showtimeId, seatLabel, userId }) => {
    if (!seatHoldMap[showtimeId]) seatHoldMap[showtimeId] = {};
    const currentHolder = seatHoldMap[showtimeId][seatLabel];

    // Chặn nếu ghế đang bị người khác giữ
    if (currentHolder && currentHolder.userId !== userId) {
      socket.emit("seat_unavailable", seatLabel);
      return;
    }

    // 1. Xóa timer cũ nếu có (reset lại 5 phút từ đầu)
    if (currentHolder && currentHolder.timeoutId) {
      clearTimeout(currentHolder.timeoutId);
    }

    // 2. Tạo Timer mới: Sau 5 phút tự động nhả ghế
    const timeoutId = setTimeout(() => {
      // Check kỹ lại lần cuối trước khi xóa (tránh xóa nhầm ghế đã mua)
      if (seatHoldMap[showtimeId] && seatHoldMap[showtimeId][seatLabel]?.userId === userId) {
        console.log(`⏳ Hết giờ! Tự động nhả ghế ${seatLabel} của ${userId}`);
        delete seatHoldMap[showtimeId][seatLabel];
        
        // Báo cho cả phòng biết
        io.to(showtimeId).emit("seat_released", seatLabel);
      }
    }, HOLD_DURATION);

    // 3. Lưu thông tin kèm thời gian hết hạn
    const expiresAt = Date.now() + HOLD_DURATION;
    seatHoldMap[showtimeId][seatLabel] = { userId, socketId: socket.id, timeoutId, expiresAt };

    // Báo cho client tô màu
    io.to(showtimeId).emit("seat_held", { seatLabel, holderId: userId });
  });

  // 2.3. Nhả Ghế (Unhold)
  socket.on("unhold_seat", ({ showtimeId, seatLabel, userId }) => {
    const currentHolder = seatHoldMap[showtimeId]?.[seatLabel];
    
    // Chỉ cho phép hủy nếu chính mình là người đang giữ
    if (currentHolder && currentHolder.userId === userId) {
      clearTimeout(currentHolder.timeoutId); // Xóa timer để tránh memory leak
      
      delete seatHoldMap[showtimeId][seatLabel];
      io.to(showtimeId).emit("seat_released", seatLabel);
    }
  });


  // ==========================
  // PHẦN 3: DISCONNECT (DỌN DẸP)
  // ==========================
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // A. Xử lý Chat Offline
    activeUsers = activeUsers.filter((u) => u.socketId !== socket.id);
    io.emit("update_user_list", activeUsers.filter(u => u.role === "client"));

    // B. Xử lý Booking (Nhả ghế khi thoát hẳn)
    for (const showtimeId in seatHoldMap) {
      const seats = seatHoldMap[showtimeId];
      for (const seatLabel in seats) {
        // Nếu ghế này do socket vừa thoát đang giữ
        if (seats[seatLabel].socketId === socket.id) {
          clearTimeout(seats[seatLabel].timeoutId); // Xóa timer
          delete seats[seatLabel]; // Xóa ghế
          io.to(showtimeId).emit("seat_released", seatLabel); // Báo mọi người
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));