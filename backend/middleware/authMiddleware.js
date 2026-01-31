const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 1. Xác thực Token (Giữ nguyên vì đã ổn)
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
        return res.status(401).json({ message: "Vui lòng đăng nhập (Thiếu Token)" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
        return res.status(404).json({ message: "Người dùng không còn tồn tại" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

// 2. Kiểm tra quyền (CẬP NHẬT MỚI 🔥)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // A. Lấy role của user hiện tại (chuẩn hóa về chữ thường)
    const userRole = req.user.role ? req.user.role.toLowerCase() : "user";
    
    // B. Chuẩn hóa danh sách quyền cho phép về chữ thường
    const rolesToCheck = allowedRoles.map(role => role.toLowerCase());

    console.log(`🔍 Check Quyền: User là [${userRole}] - Yêu cầu [${rolesToCheck.join(", ")}]`);

    // C. Logic kiểm tra "Thoáng":
    // 1. Nếu user có field isAdmin = true -> CHO QUA LUÔN (Super Admin)
    // 2. Hoặc nếu role của user nằm trong danh sách cho phép
    if (req.user.isAdmin === true || rolesToCheck.includes(userRole)) {
      next();
    } else {
      return res.status(403).json({ 
        message: `Bạn không có quyền thực hiện hành động này. (Role của bạn: ${req.user.role})` 
      });
    }
  };
};

module.exports = { verifyToken, authorizeRoles };