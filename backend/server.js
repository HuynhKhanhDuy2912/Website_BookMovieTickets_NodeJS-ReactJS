const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

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


const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));

app.get('/api/hello', (req, res) => {
  res.json({ message: '✅ Kết nối React ↔ Node.js thành công!' });
});
