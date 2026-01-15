import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar // <--- Đảm bảo có cái này
} from 'recharts';
import {
  DollarSign, ShoppingBag, Calendar, TrendingUp, Film, Utensils, Ticket
} from "lucide-react";

export default function DashboardPage() {
  // --- STATE ---
  const [revenueStats, setRevenueStats] = useState([]); // Dữ liệu biểu đồ xu hướng
  const [movieStats, setMovieStats] = useState([]);     // Dữ liệu bảng phim
  const [comboStats, setComboStats] = useState([]);     // Dữ liệu bảng combo

  // Tổng quan (Lấy từ API hoặc tính toán lại từ các bảng chi tiết)
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    movieRevenue: 0, // Tính tổng tiền từ bảng phim
    totalCombos: 0   // Tính tổng số lượng từ bảng combo
  });

  // Bộ lọc thời gian
  const [filterType, setFilterType] = useState("year"); // 'all' | 'year' | 'month'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [loading, setLoading] = useState(true);

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Lấy thống kê xu hướng (Biểu đồ)
        const revenueRes = await api.get(`/admin/stats`, {
          params: { type: filterType, year: selectedYear, month: selectedMonth }
        });

        // 2. Lấy danh sách tất cả Phim
        const movieRes = await api.get("/admin/stats/movies");

        // 3. Lấy danh sách tất cả Combo
        const comboRes = await api.get("/admin/stats/combos");

        // --- TÍNH TOÁN SỐ LIỆU TỔNG HỢP ---
        // Tính tổng tiền vé từ danh sách phim
        const totalMovieRev = movieRes.data.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
        // Tính tổng số lượng combo bán ra
        const totalComboQty = comboRes.data.reduce((acc, curr) => acc + (curr.totalQuantity || 0), 0);

        setRevenueStats(revenueRes.data.data);
        setMovieStats(movieRes.data);
        setComboStats(comboRes.data);

        setSummary({
          totalRevenue: revenueRes.data.summary.totalRevenue,
          totalOrders: revenueRes.data.summary.totalOrders,
          movieRevenue: totalMovieRev,
          totalCombos: totalComboQty
        });

      } catch (err) {
        console.error("Lỗi tải thống kê:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterType, selectedYear, selectedMonth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-500"></div>
      </div>
    );
  }

  // Tìm phim có doanh thu cao nhất để làm mốc tính % cho thanh Progress bar
  const maxMovieRevenue = movieStats.length > 0 ? Math.max(...movieStats.map(m => m.revenue)) : 1;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white pb-20">

      {/* === HEADER & FILTER === */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-500 uppercase tracking-wide">Dashboard Quản Trị</h1>
          <p className="text-gray-400 text-sm mt-1">Báo cáo hiệu quả kinh doanh & vận hành</p>
        </div>

        {/* Thanh lọc thời gian */}
        <div className="bg-gray-800 p-2 rounded-lg flex flex-wrap gap-2 items-center border border-gray-700 shadow-lg">
          <div className="flex items-center gap-2 px-2">
            <Calendar size={18} className="text-gray-400" />
            <span className="font-bold text-sm text-gray-300">Thời gian:</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-700 text-white text-sm py-1.5 px-3 rounded border border-gray-600 focus:border-yellow-500 outline-none cursor-pointer"
          >
            <option value="all">Tất cả</option>
            <option value="year">Theo Năm</option>
            <option value="month">Theo Tháng</option>
          </select>

          {(filterType === 'year' || filterType === 'month') && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-gray-700 text-white text-sm py-1.5 px-3 rounded border border-gray-600 cursor-pointer"
            >
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}

          {filterType === 'month' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-700 text-white text-sm py-1.5 px-3 rounded border border-gray-600 cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* === 1. CARDS CHỈ SỐ (KPIs) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Tổng Doanh Thu */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-8 bg-yellow-500/10 rounded-bl-full group-hover:bg-yellow-500/20 transition"></div>
          <div className="p-3 bg-yellow-500 rounded-lg text-black shadow-lg shadow-yellow-500/40"><DollarSign size={24} /></div>
          <div>
            <p className="text-gray-400 text-xs uppercase font-bold">Tổng Doanh Thu</p>
            <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.totalRevenue)}</h3>
          </div>
        </div>

        {/* Doanh Thu Vé (Tạm tính từ tổng phim) */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-8 bg-blue-500/10 rounded-bl-full group-hover:bg-blue-500/20 transition"></div>
          <div className="p-3 bg-blue-500 rounded-lg text-white shadow-lg shadow-blue-500/40"><Film size={24} /></div>
          <div>
            <p className="text-gray-400 text-xs uppercase font-bold">Doanh Thu Phim</p>
            <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.movieRevenue)}</h3>
            <p className="text-xs text-gray-500 mt-1">{summary.totalOrders} vé bán ra</p>
          </div>
        </div>

        {/* Số lượng Combo */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-8 bg-orange-500/10 rounded-bl-full group-hover:bg-orange-500/20 transition"></div>
          <div className="p-3 bg-orange-500 rounded-lg text-white shadow-lg shadow-orange-500/40"><Utensils size={24} /></div>
          <div>
            <p className="text-gray-400 text-xs uppercase font-bold">Bắp Nước (Combo)</p>
            <h3 className="text-2xl font-bold text-white mt-1">{summary.totalCombos} <span className="text-sm font-medium text-gray-400">suất</span></h3>
            <p className="text-xs text-gray-500 mt-1">Đã bán kèm vé</p>
          </div>
        </div>

        {/* Tổng Đơn Hàng */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-8 bg-purple-500/10 rounded-bl-full group-hover:bg-purple-500/20 transition"></div>
          <div className="p-3 bg-purple-500 rounded-lg text-white shadow-lg shadow-purple-500/40"><Ticket size={24} /></div>
          <div>
            <p className="text-gray-400 text-xs uppercase font-bold">Tổng Đơn Hàng</p>
            <h3 className="text-2xl font-bold text-white mt-1">{summary.totalOrders}</h3>
            <p className="text-xs text-gray-500 mt-1">Giao dịch thành công</p>
          </div>
        </div>
      </div>

      {/* === 2. BIỂU ĐỒ CỘT DOANH THU (Đã thay thế) === */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl mb-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
          <TrendingUp className="text-yellow-500" size={20} /> Biểu đồ doanh thu (Bar Chart)
        </h3>

        <div className="h-[350px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              {/* Tạo màu gradient cho cột nhìn sang hơn */}
              <defs>
                <linearGradient id="colorRevenueBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eab308" stopOpacity={1} />
                  <stop offset="100%" stopColor="#eab308" stopOpacity={0.6} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />

              <XAxis
                dataKey="label"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={10} // Đẩy chữ xuống dưới một chút cho thoáng
              />

              <YAxis
                stroke="#9ca3af"
                tickFormatter={(value) => `${value / 1000000}M`} // Rút gọn số (ví dụ 1000000 -> 1M)
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} // Hiệu ứng khi rê chuột vào cột
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                formatter={(value) => [formatCurrency(value), "Doanh thu"]}
                labelStyle={{ color: '#eab308', fontWeight: 'bold', marginBottom: '5px' }}
              />

              <Bar
                dataKey="revenue"
                name="Doanh Thu"
                fill="url(#colorRevenueBar)"
                radius={[6, 6, 0, 0]} // Bo tròn 2 góc trên của cột
                barSize={40} // Độ rộng của cột (tùy chỉnh to nhỏ)
                // Animation khi load trang
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* === 3. BẢNG THỐNG KÊ CHI TIẾT (Thay thế biểu đồ Top 5) === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* BẢNG 1: HIỆU SUẤT TẤT CẢ PHIM */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl flex flex-col h-[500px]">
          <div className="p-5 border-b border-gray-700 bg-gray-800/50 backdrop-blur sticky top-0 z-10 rounded-t-xl">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              🎬 Hiệu Suất Phim ({movieStats.length})
            </h3>
            <div className="flex justify-between items-end mt-2">
              <p className="text-gray-400 text-xs">Sắp xếp theo doanh thu giảm dần</p>
              <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                Tổng: {formatCurrency(summary.movieRevenue)}
              </span>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-900 z-10 text-xs uppercase text-gray-500 font-bold shadow-md">
                <tr>
                  <th className="py-3 pl-5">Tên Phim</th>
                  <th className="py-3 text-center">Vé</th>
                  <th className="py-3 text-right pr-5">Doanh Thu</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {movieStats.map((movie, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700 hover:bg-opacity-40 transition duration-150 group">
                    <td className="py-4 pl-5 font-medium text-white max-w-[200px]">
                      <div className="truncate" title={movie.title}>{movie.title}</div>
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-gray-700 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500 group-hover:bg-blue-400"
                          style={{ width: `${(movie.revenue / maxMovieRevenue) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-4 text-center text-gray-300 font-mono">{movie.tickets}</td>
                    <td className="py-4 text-right font-bold text-yellow-400 pr-5 font-mono">
                      {formatCurrency(movie.revenue)}
                    </td>
                  </tr>
                ))}
                {movieStats.length === 0 && (
                  <tr><td colSpan="3" className="text-center py-10 text-gray-500">Chưa có dữ liệu phim</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BẢNG 2: HIỆU SUẤT TẤT CẢ COMBO */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl flex flex-col h-[500px]">
          <div className="p-5 border-b border-gray-700 bg-gray-800/50 backdrop-blur sticky top-0 z-10 rounded-t-xl">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              🍿 Hiệu Suất Combo ({comboStats.length})
            </h3>
            <div className="flex justify-between items-end mt-2">
              <p className="text-gray-400 text-xs">Thống kê số lượng bán ra</p>
              <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                Tổng: {summary.totalCombos} phần
              </span>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-900 z-10 text-xs uppercase text-gray-500 font-bold shadow-md">
                <tr>
                  <th className="py-3 pl-5">Xếp hạng</th>
                  <th className="py-3 text-left">Tên Combo</th>
                  <th className="py-3 text-right pr-5">Đã bán (Qty)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {comboStats.map((combo, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700 hover:bg-opacity-40 transition duration-150">
                    <td className="py-4 pl-5">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' :
                          idx === 1 ? 'bg-gray-400 text-black' :
                            idx === 2 ? 'bg-orange-700 text-white' :
                              'bg-gray-700 text-gray-400'
                        }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-4 text-left font-medium text-white">
                      {combo._id || "Combo chưa đặt tên"}
                    </td>
                    <td className="py-4 text-right pr-5 font-bold text-orange-400 text-lg font-mono">
                      {combo.totalQuantity}
                    </td>
                  </tr>
                ))}
                {comboStats.length === 0 && (
                  <tr><td colSpan="3" className="text-center py-10 text-gray-500">Chưa có dữ liệu combo</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}