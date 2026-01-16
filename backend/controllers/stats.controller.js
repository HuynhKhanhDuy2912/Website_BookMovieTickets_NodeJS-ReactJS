const Order = require("../models/Order");
const Showtime = require("../models/Showtime"); // Import thêm nếu cần dùng static methods, ở đây dùng aggregate nên không bắt buộc nhưng tốt cho intellisense
const Movie = require("../models/Movie");
const Combo = require("../models/Combo");

// ============================================================
// 1. THỐNG KÊ DOANH THU TỔNG (Biểu đồ Cột & Chỉ số tổng)
// Nguồn: Lấy trực tiếp từ Order.totalPrice (Số tiền thực khách trả)
// ============================================================
exports.getRevenueStats = async (req, res) => {
  try {
    const { type, year, month } = req.query; 
    
    // Mặc định lấy đơn thành công
    let matchStage = { status: "success" };
    let groupId = {};
    let sortStage = { "_id": 1 }; // Sắp xếp thời gian tăng dần

    const now = new Date();
    const selectedYear = parseInt(year) || now.getFullYear();
    const selectedMonth = parseInt(month) || now.getMonth() + 1;

    // --- Xử lý bộ lọc thời gian ---
    switch (type) {
      case "all":
        // Gom nhóm theo Năm
        groupId = { $year: "$createdAt" };
        break;

      case "year":
        // Lọc theo Năm -> Gom nhóm theo Tháng
        const startOfYear = new Date(`${selectedYear}-01-01`);
        const endOfYear = new Date(`${selectedYear}-12-31T23:59:59.999Z`);
        matchStage.createdAt = { $gte: startOfYear, $lte: endOfYear };
        groupId = { $month: "$createdAt" }; 
        break;

      case "month":
        // Lọc theo Tháng -> Gom nhóm theo Ngày
        const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
        matchStage.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
        groupId = { $dayOfMonth: "$createdAt" }; 
        break;

      default:
        // Mặc định lấy theo ngày trong tháng hiện tại
        groupId = { $dayOfMonth: "$createdAt" };
    }

    // --- Query Aggregation ---
    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupId, 
          totalRevenue: { $sum: "$totalPrice" }, // Tổng tiền thực thu
          count: { $sum: 1 } // Số lượng đơn hàng
        }
      },
      { $sort: sortStage }
    ]);

    // Format dữ liệu cho Frontend dễ vẽ biểu đồ
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
// 2. THỐNG KÊ HIỆU SUẤT PHIM (Bảng chi tiết Phim)
// Nguồn: Tính toán = (Số ghế * Giá vé suất chiếu)
// ============================================================
exports.getMovieStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { status: "success" } }, 
      
      // BƯỚC 1: Xé lẻ mảng combos ra từng dòng để tính cho chắc
      // preserveNullAndEmptyArrays: true để giữ lại các đơn KHÔNG mua combo (để còn tính tiền vé)
      { $unwind: { path: "$combos", preserveNullAndEmptyArrays: true } },

      // BƯỚC 2: Lookup lấy giá tiền cho từng dòng combo
      {
        $lookup: {
          from: "combos",
          localField: "combos.comboId", // ID của combo trong đơn
          foreignField: "_id",          // ID trong bảng Combos
          as: "comboDetail"
        }
      },
      // Vì unwind rồi nên lookup xong chỉ ra 1 mảng 1 phần tử, ta lấy phần tử đầu tiên
      {
         $addFields: { 
            comboPrice: { $ifNull: [ { $arrayElemAt: ["$comboDetail.price", 0] }, 0 ] } 
         }
      },

      // BƯỚC 3: Tính thành tiền của dòng combo đó (Số lượng * Giá)
      {
         $addFields: {
            // Nếu không có combo (đơn chỉ mua vé) thì quantity = 0
            lineComboRevenue: { 
               $multiply: [ 
                  { $ifNull: ["$combos.quantity", 0] }, 
                  "$comboPrice" 
               ] 
            }
         }
      },

      // BƯỚC 4: GOM LẠI VỀ ĐƠN HÀNG (Group theo Order ID)
      // Lúc này ta cộng dồn lineComboRevenue lại để ra Tổng tiền Combo của cả đơn
      {
         $group: {
            _id: "$_id", // Gom về lại từng đơn hàng
            totalPrice: { $first: "$totalPrice" }, // Tổng tiền đơn giữ nguyên
            seats: { $first: "$seats" },           // Danh sách ghế giữ nguyên
            showtime: { $first: "$showtime" },     // Suất chiếu giữ nguyên
            
            // 🔥 TỔNG TIỀN COMBO CỦA ĐƠN NÀY
            orderComboTotal: { $sum: "$lineComboRevenue" } 
         }
      },

      // BƯỚC 5: TÍNH TOÁN PHÂN LOẠI VÉ (Logic trừ lùi thần thánh)
      {
         $addFields: {
             // Tiền vé thực = Tổng đơn - Tổng tiền combo (đã tính chính xác số lượng)
             realTicketRevenue: { $subtract: ["$totalPrice", "$orderComboTotal"] }
         }
      },

      // --- Từ đây trở xuống là logic phân loại VIP/Thường như cũ ---
      
      // Lookup Suất chiếu lấy giá gốc
      {
        $lookup: { from: "showtimes", localField: "showtime", foreignField: "_id", as: "showtimeInfo" }
      },
      { $unwind: "$showtimeInfo" },

      // Tính số ghế VIP dựa trên chênh lệch
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
           // Giả định phụ thu 10k/vé VIP
           vipCount: { $floor: { $divide: ["$surchargeAmount", 10000] } }
        }
      },
      { $addFields: { vipCount: { $max: [0, "$vipCount"] } } }, // Đảm bảo không âm

      // BƯỚC 6: GROUP THEO PHIM (Kết quả cuối cùng)
      {
        $group: {
          _id: "$showtimeInfo.movie",
          totalRevenue: { $sum: "$realTicketRevenue" },
          totalTickets: { $sum: { $size: "$seats" } },
          totalVip: { $sum: "$vipCount" }
        }
      },

      // Lookup tên phim
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
// 3. THỐNG KÊ HIỆU SUẤT COMBO (Bảng chi tiết Combo)
// Nguồn: Tính toán = (Số lượng * Giá Combo gốc)
// ============================================================
exports.getComboStats = async (req, res) => {
    try {
        const stats = await Order.aggregate([
            { $match: { status: "success" } },
            { $unwind: "$combos" }, // Tách mảng combos ra từng dòng

            // B1: Lookup sang bảng Combos để lấy Tên và GIÁ GỐC
            {
                $lookup: {
                    from: "combos",
                    localField: "combos.comboId", // Trường lưu ID combo trong Order
                    foreignField: "_id",
                    as: "comboInfo"
                }
            },
            { $unwind: "$comboInfo" }, 

            // B2: Group và Tính tiền
            {
                $group: {
                    _id: "$comboInfo._id", 
                    name: { $first: "$comboInfo.name" }, 
                    
                    // Tổng số lượng bán ra
                    totalQuantity: { $sum: "$combos.quantity" }, 
                    
                    // 🔥 LOGIC QUAN TRỌNG: Doanh thu = Số lượng * Giá tiền Combo
                    totalRevenue: { $sum: { $multiply: ["$combos.quantity", "$comboInfo.price"] } }
                }
            },
            { $sort: { totalRevenue: -1 } } // Sắp xếp doanh thu giảm dần
        ]);

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: "Lỗi thống kê combo", error: err.message });
    }
};