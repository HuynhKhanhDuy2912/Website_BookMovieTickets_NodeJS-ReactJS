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
app.use("/api/ticket", require("./routes/ticket.route")); // API vé (có dùng req.io)
app.use("/api/upload", require("./routes/upload.route"));
app.use("/api/user", require("./routes/user.route"));
app.use("/api/review", require("./routes/review.route"));
app.use('/api/admin', require("./routes/index"));
app.use("/api/contact", require("./routes/contact.route"));
app.use("/api/chat", require("./routes/chat.route"));

// --- GLOBAL VARIABLES ---
let activeUsers = [];   // Danh sách user online (Chat)
let seatHoldMap = {};   // Danh sách ghế đang giữ (Booking)

// --- SOCKET CONNECTION LOGIC (GỘP CHUNG) ---
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

  // 1.2. User Login (Báo danh Online)
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
  // PHẦN 2: BOOKING SYSTEM
  // ==========================

  // 2.1. Join Room Suất Chiếu
  socket.on("join_showtime", ({ showtimeId, userId }) => {
    socket.join(showtimeId); // Join vào room của suất chiếu đó

    // Lấy danh sách ghế đang giữ trong phòng này
    const holdsInRoom = seatHoldMap[showtimeId] || {};
    
    // Phân loại: Ghế của TÔI vs Ghế NGƯỜI KHÁC
    const myHolds = [];
    const othersHolds = {};

    for (const seat in holdsInRoom) {
        const holder = holdsInRoom[seat];
        if (holder.userId === userId) {
            myHolds.push(seat); // Ghế của mình (để Client tô lại màu xanh)
        } else {
            othersHolds[seat] = holder.userId; // Ghế người khác (Client tô màu vàng)
        }
    }

    // Gửi dữ liệu khởi tạo về cho Client
    socket.emit("load_initial_seats", { myHolds, othersHolds });
  });

  // 2.2. Giữ Ghế (Hold)
  socket.on("hold_seat", ({ showtimeId, seatLabel, userId }) => {
    if (!seatHoldMap[showtimeId]) seatHoldMap[showtimeId] = {};

    const currentHolder = seatHoldMap[showtimeId][seatLabel];

    // Nếu ghế đã có người giữ và không phải là mình -> Báo lỗi
    if (currentHolder && currentHolder.userId !== userId) {
        socket.emit("seat_unavailable", seatLabel);
        return;
    }

    // Lưu trạng thái giữ ghế
    seatHoldMap[showtimeId][seatLabel] = { userId, socketId: socket.id };

    // Báo cho mọi người trong phòng biết
    io.to(showtimeId).emit("seat_held", { seatLabel, holderId: userId });
  });

  // 2.3. Nhả Ghế (Unhold)
  socket.on("unhold_seat", ({ showtimeId, seatLabel, userId }) => {
    const currentHolder = seatHoldMap[showtimeId]?.[seatLabel];

    // Chỉ cho phép hủy nếu mình là chủ sở hữu
    if (currentHolder && currentHolder.userId === userId) {
        delete seatHoldMap[showtimeId][seatLabel];
        io.to(showtimeId).emit("seat_released", seatLabel);
    }
  });


  // ==========================
  // PHẦN 3: DISCONNECT (CHUNG)
  // ==========================
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // A. Xử lý Chat Offline
    activeUsers = activeUsers.filter((u) => u.socketId !== socket.id);
    io.emit("update_user_list", activeUsers.filter(u => u.role === "client"));

    // B. Xử lý Booking (Nhả ghế khi thoát)
    // Duyệt qua tất cả các phòng chiếu
    for (const showtimeId in seatHoldMap) {
        const seats = seatHoldMap[showtimeId];
        for (const seatLabel in seats) {
            // Nếu ghế này do socket vừa thoát giữ -> Xóa luôn
            if (seats[seatLabel].socketId === socket.id) {
                delete seats[seatLabel];
                io.to(showtimeId).emit("seat_released", seatLabel);
            }
        }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));