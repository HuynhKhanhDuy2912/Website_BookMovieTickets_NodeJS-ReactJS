const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message"); // Model tin nhắn

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// 1. SETUP SOCKET IO
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

// --- GLOBAL VARIABLES (BOOKING) ---
const HOLD_DURATION = 5 * 60 * 1000; 
const CHECKOUT_DURATION = 10 * 60 * 1000; 
const DISCONNECT_GRACE_PERIOD = 2 * 60 * 1000; 

let seatHoldMap = {}; // { showtimeId: { "A1": { ... } } }

// --- GLOBAL VARIABLES (CHAT) ---
let activeChatUsers = []; // Danh sách user đang online chat

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
    io.to(showtimeId).emit("refresh_seats"); 
};

app.use((req, res, next) => {
  req.io = io;
  req.clearSeatHold = clearSeatHold;
  next();
});

app.use(cors());
app.use(express.json());

// ... (Routes giữ nguyên) ...
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

  // ==================================================================
  // PHẦN 1: CHAT SUPPORT SYSTEM (ADMIN <-> CLIENT)
  // ==================================================================

  // 1. Client/Admin Join Room Chat
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    // console.log(`User/Admin joined chat room: ${conversationId}`);
  });

  // 2. Client gửi tin nhắn cho Admin
  socket.on("send_to_admin", async (data) => {
    const { conversationId, username, message, time } = data;
    
    // Lưu vào DB
    try {
        const newMessage = new Message({
            conversationId,
            sender: "client",
            text: message
        });
        await newMessage.save();
    } catch (err) {
        console.error("Lỗi lưu tin nhắn:", err);
    }

    // Gửi tới Admin (Admin cũng join room conversationId này)
    socket.to(conversationId).emit("receive_from_client", data);
    
    // Cập nhật danh sách user online cho Admin (Dashboard)
    const existingUser = activeChatUsers.find(u => u.conversationId === conversationId);
    if (!existingUser) {
        activeChatUsers.push({ conversationId, username, socketId: socket.id, lastMessage: message, time });
    } else {
        existingUser.lastMessage = message;
        existingUser.time = time;
        existingUser.username = username; // Cập nhật tên mới nhất
    }
    io.emit("update_user_list", activeChatUsers);
  });

  // 3. Admin gửi tin nhắn cho Client
  socket.on("send_to_client", async (data) => {
    const { conversationId, message, time } = data;

    // Lưu vào DB
    try {
        const newMessage = new Message({
            conversationId,
            sender: "admin",
            text: message
        });
        await newMessage.save();
    } catch (err) {
        console.error("Lỗi lưu tin nhắn Admin:", err);
    }

    // Gửi về Client
    socket.to(conversationId).emit("receive_from_admin", data);
  });

  // 4. Đăng ký user online (khi client vào ContactPage)
  socket.on("register_user", (userData) => {
      const { conversationId, username } = userData;
      const existing = activeChatUsers.find(u => u.conversationId === conversationId);
      if (!existing) {
          activeChatUsers.push({ 
              conversationId, 
              username: username || "Khách", 
              socketId: socket.id,
              role: "client"
          });
      } else {
          existing.socketId = socket.id; // Update socket id mới nếu F5
      }
      io.emit("update_user_list", activeChatUsers);
  });


  // ==================================================================
  // PHẦN 2: BOOKING SYSTEM (REAL-TIME SEATS)
  // ==================================================================

  // 1. JOIN ROOM BOOKING
  socket.on("join_showtime", ({ showtimeId, userId }) => {
    const roomId = showtimeId.toString();
    socket.join(roomId);
    
    const holdsInRoom = seatHoldMap[roomId] || {};
    const myHolds = [];
    const othersHolds = {}; 

    for (const seat in holdsInRoom) {
      const holder = holdsInRoom[seat];
      if (holder.userId === userId) {
        myHolds.push({ seat, expiresAt: holder.expiresAt });
      } else {
        othersHolds[seat] = { userId: holder.userId, status: holder.status };
      }
    }
    socket.emit("load_initial_seats", { myHolds, othersHolds });
  });

  socket.on("join_room", (showtimeId) => { // Admin Join
      const roomId = showtimeId.toString();
      socket.join(roomId);
      const holds = seatHoldMap[roomId] || {};
      const holdingSeats = Object.keys(holds).map(key => ({
          seat: key,
          status: holds[key].status
      }));
      socket.emit("current_holds", holdingSeats); 
  });

  // 2. GIỮ GHẾ
  socket.on("hold_seat", ({ showtimeId, seatLabel, userId }) => {
    const roomId = showtimeId.toString();
    if (!seatHoldMap[roomId]) seatHoldMap[roomId] = {};
    
    const currentHolder = seatHoldMap[roomId][seatLabel];
    if (currentHolder && currentHolder.userId !== userId) {
      socket.emit("seat_unavailable", seatLabel);
      return;
    }
    if (currentHolder?.timeoutId) clearTimeout(currentHolder.timeoutId);

    const timeoutId = setTimeout(() => {
      if (seatHoldMap[roomId] && seatHoldMap[roomId][seatLabel]?.userId === userId) {
        delete seatHoldMap[roomId][seatLabel];
        io.to(roomId).emit("seat_released", seatLabel);
        io.to(roomId).emit("seat_unselected", { seat: seatLabel }); 
      }
    }, HOLD_DURATION);

    seatHoldMap[roomId][seatLabel] = { 
        userId, 
        socketId: socket.id, 
        timeoutId, 
        expiresAt: Date.now() + HOLD_DURATION,
        status: 'SELECTING'
    };

    io.to(roomId).emit("seat_held", { seatLabel, holderId: userId, status: 'SELECTING' });
    io.to(roomId).emit("seat_selected", { seat: seatLabel, userId });
  });

  // 3. BỎ GIỮ GHẾ
  socket.on("unhold_seat", ({ showtimeId, seatLabel, userId }) => {
    const roomId = showtimeId.toString();
    const currentHolder = seatHoldMap[roomId]?.[seatLabel];

    if (currentHolder && currentHolder.userId === userId) {
      clearTimeout(currentHolder.timeoutId);
      delete seatHoldMap[roomId][seatLabel];
      io.to(roomId).emit("seat_released", seatLabel);
      io.to(roomId).emit("seat_unselected", { seat: seatLabel });
    }
  });

  // 4. VÀO CHECKOUT (KHÓA GHẾ)
  socket.on("client_enter_checkout", ({ showtimeId, seats }) => {
      const roomId = showtimeId.toString();
      if (!seatHoldMap[roomId]) return;

      seats.forEach(seatLabel => {
          if (seatHoldMap[roomId][seatLabel]) {
              seatHoldMap[roomId][seatLabel].status = 'CHECKOUT';
              clearTimeout(seatHoldMap[roomId][seatLabel].timeoutId);
              
              seatHoldMap[roomId][seatLabel].timeoutId = setTimeout(() => {
                  if (seatHoldMap[roomId][seatLabel]) {
                      delete seatHoldMap[roomId][seatLabel];
                      io.to(roomId).emit("seat_released", seatLabel);
                      io.to(roomId).emit("seat_unselected", { seat: seatLabel });
                  }
              }, CHECKOUT_DURATION);
              
              seatHoldMap[roomId][seatLabel].expiresAt = Date.now() + CHECKOUT_DURATION;
          }
      });
      io.to(roomId).emit("seats_update_status", { seats, status: 'CHECKOUT' });
  });

  // 5. QUAY LẠI CHỌN GHẾ (MỞ KHÓA)
  socket.on("reset_checkout_status", ({ showtimeId, userId }) => {
      const roomId = showtimeId.toString();
      if (!seatHoldMap[roomId]) return;
      const updatedSeats = [];

      for (const [seatLabel, holder] of Object.entries(seatHoldMap[roomId])) {
          if (holder.userId === userId && holder.status === 'CHECKOUT') {
              holder.status = 'SELECTING';
              clearTimeout(holder.timeoutId);
              
              holder.timeoutId = setTimeout(() => {
                  if (seatHoldMap[roomId][seatLabel]) {
                      delete seatHoldMap[roomId][seatLabel];
                      io.to(roomId).emit("seat_released", seatLabel);
                      io.to(roomId).emit("seat_unselected", { seat: seatLabel });
                  }
              }, HOLD_DURATION); 
              
              holder.expiresAt = Date.now() + HOLD_DURATION;
              updatedSeats.push(seatLabel);
          }
      }
      if (updatedSeats.length > 0) {
          io.to(roomId).emit("seats_update_status", { seats: updatedSeats, status: 'SELECTING' });
      }
  });

  // 6. ADMIN CƯỚP GHẾ
  socket.on("admin_force_select", ({ showtimeId, seatLabel }) => {
      const roomId = showtimeId.toString();
      if (seatHoldMap[roomId] && seatHoldMap[roomId][seatLabel]) {
          const currentHolder = seatHoldMap[roomId][seatLabel];
          if (currentHolder.status === 'CHECKOUT') return; 

          io.to(currentHolder.socketId).emit("seat_stolen_by_admin", seatLabel);
          clearTimeout(currentHolder.timeoutId);
          io.to(roomId).emit("seat_released", seatLabel);
      }

      const timeoutId = setTimeout(() => {
          if (seatHoldMap[roomId] && seatHoldMap[roomId][seatLabel]?.userId === "ADMIN_POS") {
              delete seatHoldMap[roomId][seatLabel];
              io.to(roomId).emit("seat_released", seatLabel);
              io.to(roomId).emit("seat_unselected", { seat: seatLabel });
          }
      }, HOLD_DURATION);

      if (!seatHoldMap[roomId]) seatHoldMap[roomId] = {};
      seatHoldMap[roomId][seatLabel] = {
          userId: "ADMIN_POS",
          socketId: socket.id,
          timeoutId,
          expiresAt: Date.now() + HOLD_DURATION,
          status: 'SELECTING'
      };

      io.to(roomId).emit("seat_held", { seatLabel, holderId: "ADMIN_POS", status: 'SELECTING' });
      io.to(roomId).emit("seat_selected", { seat: seatLabel, userId: "ADMIN_POS" });
  });

  // 7. ADMIN CÁC EVENT KHÁC
  socket.on("select_seat", ({ showtimeId, seat }) => {
      io.to(showtimeId.toString()).emit("seat_held", { seatLabel: seat, holderId: "ADMIN_POS", status: 'SELECTING' });
  });
  socket.on("unselect_seat", ({ showtimeId, seat }) => {
      io.to(showtimeId.toString()).emit("seat_released", seat);
  });


  // ==================================================================
  // DISCONNECT & CLEANUP (CHUNG CHO CẢ 2)
  // ==================================================================
  socket.on("disconnect", () => {
    // 1. Xử lý Chat Offline
    activeChatUsers = activeChatUsers.filter((u) => u.socketId !== socket.id);
    io.emit("update_user_list", activeChatUsers);

    // 2. Xử lý Booking Offline (Rút ngắn thời gian giữ ghế)
    for (const sId in seatHoldMap) {
      const seats = seatHoldMap[sId];
      for (const seatLabel in seats) {
        if (seats[seatLabel].socketId === socket.id) {
          // Chỉ rút ngắn nếu đang SELECTING, còn CHECKOUT thì giữ nguyên 10p
          if (seats[seatLabel].status === 'SELECTING') {
              clearTimeout(seats[seatLabel].timeoutId);
              seats[seatLabel].timeoutId = setTimeout(() => {
                 if (seatHoldMap[sId] && seatHoldMap[sId][seatLabel]) {
                     delete seatHoldMap[sId][seatLabel];
                     io.to(sId).emit("seat_released", seatLabel);
                     io.to(sId).emit("seat_unselected", { seat: seatLabel });
                 }
              }, DISCONNECT_GRACE_PERIOD);
          }
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));