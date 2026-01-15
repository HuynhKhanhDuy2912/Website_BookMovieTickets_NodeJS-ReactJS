const Order = require("../models/Order");

// 1. Thống kê Doanh thu (Biểu đồ dòng tiền)
exports.getRevenueStats = async (req, res) => {
  try {
    const { type, year, month } = req.query; 
    // type: 'all' | 'year' | 'month'

    let matchStage = { status: "success" }; // Chỉ tính đơn đã thanh toán
    let groupId = {};
    let sortStage = { "_id": 1 }; // Sắp xếp tăng dần theo thời gian

    const now = new Date();
    const selectedYear = parseInt(year) || now.getFullYear();
    const selectedMonth = parseInt(month) || now.getMonth() + 1;

    // --- LOGIC AGGREGATION ---
    switch (type) {
      case "all":
        // Gom nhóm theo Năm
        groupId = { $year: "$createdAt" };
        break;

      case "year":
        // Lọc năm đó -> Gom nhóm theo Tháng
        const startOfYear = new Date(`${selectedYear}-01-01`);
        const endOfYear = new Date(`${selectedYear}-12-31T23:59:59.999Z`);
        
        matchStage.createdAt = { $gte: startOfYear, $lte: endOfYear };
        groupId = { $month: "$createdAt" }; 
        break;

      case "month":
        // Lọc tháng đó -> Gom nhóm theo Ngày
        const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

        matchStage.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
        groupId = { $dayOfMonth: "$createdAt" }; 
        break;

      default:
        // Mặc định lấy theo ngày trong tháng hiện tại
        groupId = { $dayOfMonth: "$createdAt" };
    }

    // --- THỰC THI QUERY ---
    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupId, 
          totalRevenue: { $sum: "$totalPrice" }, // Tổng tiền
          count: { $sum: 1 } // Tổng số đơn
        }
      },
      { $sort: sortStage }
    ]);

    // Format dữ liệu trả về
    const formattedStats = stats.map(item => ({
      label: type === 'year' ? `Tháng ${item._id}` 
           : type === 'month' ? `Ngày ${item._id}` 
           : type === 'all' ? `Năm ${item._id}`
           : `${item._id}`,
      revenue: item.totalRevenue,
      orders: item.count
    }));

    res.json({
        type,
        data: formattedStats,
        summary: {
            totalRevenue: stats.reduce((acc, curr) => acc + curr.totalRevenue, 0),
            totalOrders: stats.reduce((acc, curr) => acc + curr.count, 0)
        }
    });

  } catch (err) {
    res.status(500).json({ message: "Lỗi thống kê doanh thu", error: err.message });
  }
};

// 2. Thống kê Danh sách Phim (Tất cả)
exports.getMovieStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { status: "success" } }, // Chỉ lấy đơn thành công
      
      // Lookup sang showtimes để lấy phim
      {
        $lookup: {
          from: "showtimes",
          localField: "showtime",
          foreignField: "_id",
          as: "showtimeInfo"
        }
      },
      { $unwind: "$showtimeInfo" },

      // Group theo Phim
      {
        $group: {
          _id: "$showtimeInfo.movie",
          totalRevenue: { $sum: "$totalPrice" }, 
          ticketCount: { $sum: { $size: "$seats" } } 
        }
      },

      // Lookup sang Movies lấy tên
      {
        $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "_id",
          as: "movieInfo"
        }
      },
      { $unwind: "$movieInfo" },

      {
        $project: {
          _id: 0,
          title: "$movieInfo.title",
          revenue: "$totalRevenue",
          tickets: "$ticketCount"
        }
      },
      { $sort: { revenue: -1 } } // Sắp xếp từ cao xuống thấp
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Lỗi thống kê phim", error: err.message });
  }
};

// 3. Thống kê Danh sách Combo (Tất cả)
exports.getComboStats = async (req, res) => {
    try {
        const stats = await Order.aggregate([
            { $match: { status: "success" } },
            { $unwind: "$combos" }, // Tách mảng combo ra từng dòng riêng lẻ

            // Group theo Tên Combo
            {
                $group: {
                    _id: "$combos.name", 
                    totalQuantity: { $sum: "$combos.quantity" }, 
                }
            },
            { $sort: { totalQuantity: -1 } }
        ]);

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: "Lỗi thống kê combo", error: err.message });
    }
};