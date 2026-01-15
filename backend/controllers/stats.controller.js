const Order = require("../models/Order");

exports.getRevenueStats = async (req, res) => {
  try {
    const { type, year, month, week, day } = req.query; 
    // type: 'all' | 'year' | 'month' | 'week'

    let matchStage = { status: "success" }; // Chỉ tính đơn đã thanh toán
    let groupId = {};
    let sortStage = { "_id": 1 }; // Sắp xếp tăng dần theo thời gian

    const now = new Date();
    const selectedYear = parseInt(year) || now.getFullYear();
    const selectedMonth = parseInt(month) || now.getMonth() + 1;

    // --- LOGIC AGGREGATION ---
    switch (type) {
      case "all":
        // 1. TẤT CẢ CÁC NĂM: Gom nhóm theo Năm
        // Output: [{ _id: 2024, total: 500 }, { _id: 2025, total: 1000 }]
        groupId = { $year: "$createdAt" };
        break;

      case "year":
        // 2. THEO NĂM CỤ THỂ: Lọc năm đó -> Gom nhóm theo Tháng
        const startOfYear = new Date(`${selectedYear}-01-01`);
        const endOfYear = new Date(`${selectedYear}-12-31T23:59:59.999Z`);
        
        matchStage.createdAt = { $gte: startOfYear, $lte: endOfYear };
        groupId = { $month: "$createdAt" }; // Trả về 1, 2, ..., 12
        break;

      case "month":
        // 3. THEO THÁNG CỤ THỂ: Lọc tháng đó -> Gom nhóm theo Ngày
        const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

        matchStage.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
        groupId = { $dayOfMonth: "$createdAt" }; // Trả về 1, 2, ..., 31
        break;

      // case "week": Xử lý tương tự month nhưng range ngắn hơn (7 ngày)
      default:
        // Mặc định lấy 7 ngày gần nhất
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

    // Format dữ liệu trả về cho đẹp để Frontend dễ dùng
    // Ví dụ: Map _id thành label (Tháng 1, Tháng 2...)
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
    res.status(500).json({ message: "Lỗi thống kê", error: err.message });
  }
};