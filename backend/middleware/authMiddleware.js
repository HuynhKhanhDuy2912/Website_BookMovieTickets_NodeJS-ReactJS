const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Xác thực người dùng
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Thiếu token, vui lòng đăng nhập" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

// Kiểm tra vai trò người dùng
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Bạn không có quyền (${req.user.role}) để thực hiện hành động này` });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
