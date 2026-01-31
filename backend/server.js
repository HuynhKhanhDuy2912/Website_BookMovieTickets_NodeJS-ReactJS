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
    origin: "*", // Chấp nhận mọi nguồn (Admin + Client)
    methods: ["GET", "POST"],
  },
});

// --- GLOBAL VARIABLES ---
const HOLD_DURATION = 5 * 60 * 1000; // 5 Phút
let activeUsers = [];
// Cấu trúc: { showtimeId: { "A1": { userId, socketId, timeoutId } } }
let seatHoldMap = {};

// Helper: Xóa giữ ghế khi bán thành công
const clearSeatHold = (showtimeId, seatsArray) => {
  if (!seatHoldMap[showtimeId]) return;
  seatsArray.forEach(seatLabel => {
    if (seatHoldMap[showtimeId][seatLabel]) {
      console.log(`✅ Vé đã bán: Xóa timer ghế ${seatLabel}`);
      clearTimeout(seatHoldMap[showtimeId][seatLabel].timeoutId);
      delete seatHoldMap[showtimeId][seatLabel];
    }
  });
  // Báo cho Admin/Client biết để reload lại dữ liệu mới nhất từ DB
  io.to(showtimeId).emit("refresh_seats");
};

// Middleware
app.use((req, res, next) => {
  req.io = io;
  req.clearSeatHold = clearSeatHold;
  next();
});

app.use(cors());
app.use(express.json());

// ... (Khai báo các routes như cũ) ...
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


// --- SOCKET LOGIC ---
io.on("connection", (socket) => {
  // console.log(`Socket connected: ${socket.id}`);

  // 1. JOIN ROOM (Quan trọng: showtimeId phải là String)
  socket.on("join_showtime", ({ showtimeId, userId }) => {
    const roomId = showtimeId.toString();
    socket.join(roomId);

    // Gửi lại danh sách ghế đang giữ cho người mới vào
    const holdsInRoom = seatHoldMap[roomId] || {};
    const myHolds = [];
    const othersHolds = {};

    for (const seat in holdsInRoom) {
      const holder = holdsInRoom[seat];
      if (holder.userId === userId) {
        myHolds.push({ seat, expiresAt: holder.expiresAt });
      } else {
        othersHolds[seat] = holder.userId;
      }
    }
    socket.emit("load_initial_seats", { myHolds, othersHolds });

    // Admin dùng sự kiện khác ('join_room') nhưng cũng join cùng ID
    // Logic này handle cho cả hai nếu dùng chung event name
  });

  // Admin join room (event cũ)
  socket.on("join_room", (showtimeId) => {
    const roomId = showtimeId.toString();
    socket.join(roomId);
    // Gửi list ghế đang giữ cho Admin vẽ màu xanh
    const holds = seatHoldMap[roomId] || {};
    const holdingSeats = Object.keys(holds);
    socket.emit("current_holds", holdingSeats);
  });


  // 2. GIỮ GHẾ (HOLD SEAT) - Client click chọn ghế
  socket.on("hold_seat", ({ showtimeId, seatLabel, userId }) => {
    const roomId = showtimeId.toString();
    if (!seatHoldMap[roomId]) seatHoldMap[roomId] = {};

    const currentHolder = seatHoldMap[roomId][seatLabel];

    // Nếu ghế đã bị người khác giữ -> Báo lỗi
    if (currentHolder && currentHolder.userId !== userId) {
      socket.emit("seat_unavailable", seatLabel);
      return;
    }

    // Reset timer cũ nếu có
    if (currentHolder && currentHolder.timeoutId) {
      clearTimeout(currentHolder.timeoutId);
    }

    // Timer: Nhả ghế sau 5 phút
    const timeoutId = setTimeout(() => {
      if (seatHoldMap[roomId] && seatHoldMap[roomId][seatLabel]?.userId === userId) {
        delete seatHoldMap[roomId][seatLabel];
        // Báo mọi người: Ghế nhả ra
        io.to(roomId).emit("seat_released", seatLabel);
        // Admin dùng sự kiện 'seat_unselected'
        io.to(roomId).emit("seat_unselected", { seat: seatLabel });
      }
    }, HOLD_DURATION);

    // Lưu thông tin
    seatHoldMap[roomId][seatLabel] = {
      userId,
      socketId: socket.id,
      timeoutId,
      expiresAt: Date.now() + HOLD_DURATION
    };

    console.log(`🔒 Ghế ${seatLabel} được giữ bởi ${userId} tại phòng ${roomId}`);

    // 🔥 QUAN TRỌNG: Phát sự kiện cho TẤT CẢ mọi người trong phòng
    // Client nghe 'seat_held' để tô màu xanh/cam
    io.to(roomId).emit("seat_held", { seatLabel, holderId: userId });

    // Admin nghe 'seat_selected' để tô màu xanh dương
    io.to(roomId).emit("seat_selected", { seat: seatLabel, userId });
  });


  // 3. BỎ GIỮ GHẾ (UNHOLD)
  socket.on("unhold_seat", ({ showtimeId, seatLabel, userId }) => {
    const roomId = showtimeId.toString();
    const currentHolder = seatHoldMap[roomId]?.[seatLabel];

    if (currentHolder && currentHolder.userId === userId) {
      clearTimeout(currentHolder.timeoutId);
      delete seatHoldMap[roomId][seatLabel];

      console.log(`🔓 Ghế ${seatLabel} được nhả bởi ${userId}`);

      io.to(roomId).emit("seat_released", seatLabel);
      io.to(roomId).emit("seat_unselected", { seat: seatLabel });
    }
  });

  // 4. ADMIN CHỌN GHẾ (POS)
  socket.on("select_seat", ({ showtimeId, seat }) => {
    // Báo cho Client biết Admin đang chọn (để hiện màu Cam - ADMIN_POS)
    io.to(showtimeId.toString()).emit("seat_held", { seatLabel: seat, holderId: "ADMIN_POS" });
  });

  socket.on("unselect_seat", ({ showtimeId, seat }) => {
    io.to(showtimeId.toString()).emit("seat_released", seat);
  });


  // 5. DISCONNECT & CLEANUP
  socket.on("disconnect", () => {
    // Xử lý chat user offline...
    activeUsers = activeUsers.filter((u) => u.socketId !== socket.id);
    io.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
    const DISCONNECT_GRACE_PERIOD = 2 * 60 * 1000; // 2 Phút

    for (const sId in seatHoldMap) {
      const seats = seatHoldMap[sId];
      for (const seatLabel in seats) {
        if (seats[seatLabel].socketId === socket.id) {

          // 1. Xóa timer cũ (5 phút)
          clearTimeout(seats[seatLabel].timeoutId);

          console.log(`⚠️ User thoát: Ghế ${seatLabel} sẽ tự nhả sau 2 phút nữa...`);

          // 2. Tạo timer mới ngắn hơn (2 phút)
          seats[seatLabel].timeoutId = setTimeout(() => {
            // Kiểm tra lại lần cuối xem ghế còn tồn tại không
            if (seatHoldMap[sId] && seatHoldMap[sId][seatLabel]) {
              delete seatHoldMap[sId][seatLabel];

              // Báo mọi người ghế đã trống
              io.to(sId).emit("seat_released", seatLabel);
              io.to(sId).emit("seat_unselected", { seat: seatLabel });

              console.log(`♻️ Hết hạn chờ disconnect: Đã nhả ghế ${seatLabel}`);
            }
          }, DISCONNECT_GRACE_PERIOD);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));