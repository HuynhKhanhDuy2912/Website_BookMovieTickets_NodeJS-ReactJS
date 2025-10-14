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

// Route bảo vệ (test)
const { verifyToken, isAdmin } = require("./middleware/authMiddleware");
app.get("/api/protected/user", verifyToken, (req, res) => {
  res.json({ message: "Bạn đã xác thực", user: req.user });
});
app.get("/api/protected/admin", verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Bạn là admin" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
