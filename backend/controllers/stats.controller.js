const Order = require("../models/Order");
const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const Combo = require("../models/Combo");

// --- HELPER: TẠO BỘ LỌC CHUNG CHO CẢ 3 API ---
const createMatchStage = (query) => {
    const { type, year, month } = query;
    const now = new Date();
    const selectedYear = parseInt(year) || now.getFullYear();
    const selectedMonth = parseInt(month) || now.getMonth() + 1;

    let matchStage = { status: "success" }; // Điều kiện tiên quyết

    if (type === 'year') {
        const startOfYear = new Date(`${selectedYear}-01-01`);
        const endOfYear = new Date(`${selectedYear}-12-31T23:59:59.999Z`);
        matchStage.createdAt = { $gte: startOfYear, $lte: endOfYear };
    } else if (type === 'month') {
        const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
        matchStage.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
    }
    // Nếu type='all' hoặc không truyền -> Lấy hết (nhưng vẫn phải status: success)
    
    return matchStage;
};

// ============================================================
// 1. THỐNG KÊ DOANH THU TỔNG
// ============================================================
exports.getRevenueStats = async (req, res) => {
  try {
    const { type } = req.query;
    const matchStage = createMatchStage(req.query); // Dùng Helper
    
    let groupId = {};
    let sortStage = { "_id": 1 };

    switch (type) {
      case "all": groupId = { $year: "$createdAt" }; break;
      case "year": groupId = { $month: "$createdAt" }; break;
      case "month": groupId = { $dayOfMonth: "$createdAt" }; break;
      default: groupId = { $dayOfMonth: "$createdAt" }; // Mặc định
    }

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupId, 
          totalRevenue: { $sum: "$totalPrice" }, 
          count: { $sum: 1 }
        }
      },
      { $sort: sortStage }
    ]);

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

// ============================================================
// 2. THỐNG KÊ HIỆU SUẤT PHIM (Đã thêm Filter Thời Gian)
// ============================================================
exports.getMovieStats = async (req, res) => {
  try {
    const matchStage = createMatchStage(req.query); // 🔥 THÊM FILTER THỜI GIAN

    const stats = await Order.aggregate([
      { $match: matchStage },
      
      // ... (Giữ nguyên logic unwind, lookup, calculate cũ của bạn) ...
      { $unwind: { path: "$combos", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "combos",
          localField: "combos.comboId",
          foreignField: "_id",
          as: "comboDetail"
        }
      },
      {
         $addFields: { 
            comboPrice: { $ifNull: [ { $arrayElemAt: ["$comboDetail.price", 0] }, 0 ] } 
         }
      },
      {
         $addFields: {
            lineComboRevenue: { 
              $multiply: [ { $ifNull: ["$combos.quantity", 0] }, "$comboPrice" ] 
            }
         }
      },
      {
         $group: {
            _id: "$_id", 
            totalPrice: { $first: "$totalPrice" }, 
            seats: { $first: "$seats" }, 
            showtime: { $first: "$showtime" }, 
            orderComboTotal: { $sum: "$lineComboRevenue" } 
         }
      },
      {
         $addFields: {
             realTicketRevenue: { $subtract: ["$totalPrice", "$orderComboTotal"] }
         }
      },
      {
        $lookup: { from: "showtimes", localField: "showtime", foreignField: "_id", as: "showtimeInfo" }
      },
      { $unwind: "$showtimeInfo" },
      {
        $addFields: {
           baseRevenueExpectation: { $multiply: [{ $size: "$seats" }, "$showtimeInfo.price"] },
           surchargeAmount: { 
               $subtract: ["$realTicketRevenue", { $multiply: [{ $size: "$seats" }, "$showtimeInfo.price"] }] 
           }
        }
      },
      {
        $addFields: {
           vipCount: { $floor: { $divide: ["$surchargeAmount", 10000] } }
        }
      },
      { $addFields: { vipCount: { $max: [0, "$vipCount"] } } },

      {
        $group: {
          _id: "$showtimeInfo.movie",
          totalRevenue: { $sum: "$realTicketRevenue" },
          totalTickets: { $sum: { $size: "$seats" } },
          totalVip: { $sum: "$vipCount" }
        }
      },
      { $lookup: { from: "movies", localField: "_id", foreignField: "_id", as: "movieInfo" } },
      { $unwind: "$movieInfo" },
      
      {
        $project: {
          _id: 0,
          title: "$movieInfo.title",
          revenue: "$totalRevenue",
          tickets: "$totalTickets",
          vipTickets: "$totalVip",
          standardTickets: { $subtract: ["$totalTickets", "$totalVip"] }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Lỗi thống kê phim", error: err.message });
  }
};

// ============================================================
// 3. THỐNG KÊ HIỆU SUẤT COMBO (Đã thêm Filter Thời Gian)
// ============================================================
exports.getComboStats = async (req, res) => {
    try {
        const matchStage = createMatchStage(req.query); // 🔥 THÊM FILTER THỜI GIAN

        const stats = await Order.aggregate([
            { $match: matchStage },
            { $unwind: "$combos" }, 

            {
                $lookup: {
                    from: "combos",
                    localField: "combos.comboId", 
                    foreignField: "_id",
                    as: "comboInfo"
                }
            },
            { $unwind: "$comboInfo" }, 

            {
                $group: {
                    _id: "$comboInfo._id", 
                    name: { $first: "$comboInfo.name" }, 
                    totalQuantity: { $sum: "$combos.quantity" }, 
                    
                    // Logic tính tiền: Vẫn dùng giá hiện tại (chấp nhận sai số nhỏ nếu giá đổi)
                    // Nếu muốn chính xác tuyệt đối, bạn phải lưu giá combo vào trong Order lúc mua.
                    totalRevenue: { $sum: { $multiply: ["$combos.quantity", "$comboInfo.price"] } }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: "Lỗi thống kê combo", error: err.message });
    }
};