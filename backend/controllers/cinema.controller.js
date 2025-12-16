const Cinema = require("../models/Cinema");

exports.getAllCinemas = async (req, res) => {
  try {
    const cinemas = await Cinema.find().populate("rooms");
    res.json(cinemas);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách rạp", error: err.message });
  }
};

exports.getCinemaById = async (req, res) => {
  try {
    const cinema = await Cinema.findById(req.params.id).populate("rooms");
    if (!cinema) return res.status(404).json({ message: "Không tìm thấy rạp" });
    res.json(cinema);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy thông tin rạp", error: err.message });
  }
};

// exports.createCinema = async (req, res) => {
//   try {
//     const cinema = await Cinema.create(req.body);
//     res.status(201).json({ message: "Thêm rạp thành công", cinema });
//   } catch (err) {
//     res.status(400).json({ message: "Lỗi khi thêm rạp", error: err.message });
//   }
// };
exports.createCinema = async (req, res) => {
  console.log("BODY received:", req.body);
  try {
    const cinema = await Cinema.create(req.body);
    res.status(201).json({ message: "Thêm rạp thành công", cinema });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Lỗi khi thêm rạp", error: err.message });
  }
};

exports.updateCinema = async (req, res) => {
  try {
    const { name, address, city, phone, image } = req.body; // Lấy dữ liệu từ request body
    const { id } = req.params; // Lấy ID từ tham số route

    // Kiểm tra xem rạp phim có tồn tại không
    const cinema = await Cinema.findById(id);
    if (!cinema) {
      return res.status(404).json({ message: "Không tìm thấy rạp" });
    }

    // Cập nhật thông tin rạp với các trường mới
    cinema.name = name || cinema.name;
    cinema.address = address || cinema.address;
    cinema.city = city || cinema.city;
    cinema.phone = phone || cinema.phone;
    cinema.image = image || cinema.image;

    // Lưu lại thay đổi
    const updatedCinema = await cinema.save();

    res.json({ message: "Cập nhật rạp thành công", cinema: updatedCinema });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ message: "Lỗi khi cập nhật rạp", error: err.message });
  }
};

exports.deleteCinema = async (req, res) => {
  try {
    const cinema = await Cinema.findByIdAndDelete(req.params.id);
    if (!cinema) return res.status(404).json({ message: "Không tìm thấy rạp" });
    res.json({ message: "Đã xóa rạp thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa rạp", error: err.message });
  }
};
