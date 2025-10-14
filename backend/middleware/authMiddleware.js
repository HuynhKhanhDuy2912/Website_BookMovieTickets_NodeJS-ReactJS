const jwt = require("jsonwebtoken");

// Verify token (attach req.user = { id, role })
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "Không có token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ" });
  }
};

// Check admin
const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Chưa xác thực" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Chỉ admin mới được phép" });
  next();
};

// Check staff or admin
const isStaffOrAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Chưa xác thực" });
  if (req.user.role === "staff" || req.user.role === "admin") return next();
  return res.status(403).json({ message: "Chỉ staff hoặc admin mới được phép" });
};

module.exports = { verifyToken, isAdmin, isStaffOrAdmin };
