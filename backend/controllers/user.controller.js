const User = require("../models/User");
const bcrypt = require("bcryptjs");

// 1. Lấy tất cả users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// 2. Tạo user mới (Admin tạo)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, avatar } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email đã tồn tại" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Logic ảnh mặc định
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || "user",
      avatar: avatar || defaultAvatar
    });

    res.status(201).json({ message: "Tạo user thành công", user });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// 3. Cập nhật user
exports.updateUser = async (req, res) => {
  try {
    const { name, phone, role, avatar, password } = req.body;
    let updateData = { name, phone, role, avatar };

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    res.json({ message: "Cập nhật thành công", user });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// 4. Xóa user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Xóa user thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};