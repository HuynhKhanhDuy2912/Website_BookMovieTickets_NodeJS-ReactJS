const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http");
const {Server} = require("socket.io");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
})

let activeUsers = [];

io.on("connection", (socket) => {
  socket.on("register_user", (username) => {
    const existingUser = activeUsers.find((u) => u.socketId === socket.id);
    if (!existingUser) {
      activeUsers.push({ socketId: socket.id, username, role: "client" });
    }
    io.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
    console.log("User Registered:", username);
  });
  socket.on("register_admin", () => {
    socket.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
  });
  socket.on("send_to_admin", (data) => {
    io.emit("receive_from_client", {
        ...data,
        senderId: socket.id, 
    });
  });
  socket.on("send_to_client", ({ toSocketId, message, time }) => {
    console.log(`Admin reply to ${toSocketId}: ${message}`);
    io.to(toSocketId).emit("receive_from_admin", {
        message,
        time,
        sender: "ADMIN"
    });
  });
  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((u) => u.socketId !== socket.id);
    io.emit("update_user_list", activeUsers.filter(u => u.role === "client"));
    console.log("User disconnected:", socket.id);
  });
  console.log(`User connected: ${socket.id}`);
  socket.on("send_message", (data) => {
    console.log("Message received:", data);
    io.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));

