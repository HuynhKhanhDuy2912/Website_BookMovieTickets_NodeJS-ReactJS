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
//Chặn
exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Không cho phép chặn chính mình hoặc chặn Admin khác (nếu cần)
    if (user._id.toString() === req.user.id) {
        return res.status(400).json({ message: "Không thể tự chặn chính mình" });
    }

    user.isBlocked = !user.isBlocked; // Đảo trạng thái
    await user.save();

    res.json({ 
        message: user.isBlocked ? "Đã chặn người dùng" : "Đã bỏ chặn người dùng", 
        isBlocked: user.isBlocked 
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
//Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    // 1. Lấy ID user từ token (middleware verifyToken đã gán vào req.user)
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // 2. Validate dữ liệu đầu vào
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới" });
    }

    // 3. Tìm user trong DB
    // Lưu ý: Nếu trong Model bạn để password { select: false }, cần thêm .select('+password')
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // 4. Kiểm tra mật khẩu cũ có đúng không
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng!" });
    }

    // 5. Mã hóa (Hash) mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 6. Cập nhật và lưu
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};
//Cập nhật hồ sơ cá nhân
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy ID từ token
    const { name, phone, avatar } = req.body; // Lấy dữ liệu từ client gửi lên

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Cập nhật dữ liệu (chỉ cập nhật nếu có gửi lên)
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar; // Lưu link ảnh mới

    await user.save();

    // Trả về thông tin user mới nhất (để frontend lưu lại)
    res.json({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};