import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  DollarSign, Calendar, TrendingUp, Film, Utensils, Ticket 
} from "lucide-react";

export default function Dashboard() {
  // --- STATE ---
  const [revenueStats, setRevenueStats] = useState([]);
  const [movieStats, setMovieStats] = useState([]);     
  const [comboStats, setComboStats] = useState([]);     
  
  const [summary, setSummary] = useState({ 
    totalRevenue: 0, 
    totalOrders: 0,
    movieRevenue: 0,
    comboRevenue: 0,
    totalCombos: 0   
  });
  
  // Bộ lọc
  const [filterType, setFilterType] = useState("year");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  // Helper format tiền
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Gọi 3 API
        const revenueRes = await api.get(`/admin/stats`, {
            params: { type: filterType, year: selectedYear, month: selectedMonth }
        });
        const movieRes = await api.get("/admin/stats/movies");
        const comboRes = await api.get("/admin/stats/combos");

        // --- TỔNG HỢP SỐ LIỆU ---
        
        // 1. Tổng tiền Vé (Đã bao gồm VIP)
        const totalMovieRev = movieRes.data.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
        
        // 2. Tổng tiền Combo (Đã nhân giá gốc)
        const totalComboRev = comboRes.data.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
        
        // 3. Tổng số lượng Combo
        const totalComboQty = comboRes.data.reduce((acc, curr) => acc + (curr.totalQuantity || 0), 0);

        setRevenueStats(revenueRes.data.data);
        setMovieStats(movieRes.data);
        setComboStats(comboRes.data);
        
        setSummary({
            totalRevenue: revenueRes.data.summary.totalRevenue, // Tổng thực thu từ khách
            totalOrders: revenueRes.data.summary.totalOrders,
            movieRevenue: totalMovieRev,
            comboRevenue: totalComboRev, 
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

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white pb-20">
      
      {/* === HEADER & FILTER === */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-500 uppercase tracking-wide">Dashboard Quản Trị</h1>
          <p className="text-gray-400 text-sm mt-1">Báo cáo hiệu quả kinh doanh & vận hành</p>
        </div>
        
        {/* Bộ lọc thời gian */}
        <div className="bg-gray-800 p-2 rounded-lg flex flex-wrap gap-2 items-center border border-gray-700 shadow-lg">
            <div className="flex items-center gap-2 px-2">
                <Calendar size={18} className="text-gray-400"/>
                <span className="font-bold text-sm text-gray-300">Thời gian:</span>
            </div>
            
            <select 
               value={filterType} 
               onChange={(e) => setFilterType(e.target.value)}
               className="bg-gray-700 text-white text-sm py-1.5 px-3 rounded border border-gray-600 outline-none cursor-pointer"
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
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>Tháng {m}</option>
                  ))}
               </select>
            )}
        </div>
      </div>

      {/* === 1. CARDS CHỈ SỐ (KPIs) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: TỔNG DOANH THU */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-8 bg-yellow-500/10 rounded-bl-full group-hover:bg-yellow-500/20 transition"></div>
              <div className="p-3 bg-yellow-500 rounded-lg text-black shadow-lg shadow-yellow-500/40"><DollarSign size={24} /></div>
              <div>
                  <p className="text-gray-400 text-xs uppercase font-bold">Tổng Doanh Thu</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.totalRevenue)}</h3>
              </div>
          </div>

          {/* Card 2: DOANH THU PHIM */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4 relative overflow-hidden group">
             <div className="absolute right-0 top-0 p-8 bg-blue-500/10 rounded-bl-full group-hover:bg-blue-500/20 transition"></div>
              <div className="p-3 bg-blue-500 rounded-lg text-white shadow-lg shadow-blue-500/40"><Film size={24} /></div>
              <div>
                  <p className="text-gray-400 text-xs uppercase font-bold">Doanh Thu Vé Phim</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.movieRevenue)}</h3>
                  <p className="text-xs text-gray-500 mt-1">Vé thường + Vé VIP</p>
              </div>
          </div>

          {/* Card 3: DOANH THU COMBO */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-8 bg-orange-500/10 rounded-bl-full group-hover:bg-orange-500/20 transition"></div>
              <div className="p-3 bg-orange-500 rounded-lg text-white shadow-lg shadow-orange-500/40"><Utensils size={24} /></div>
              <div>
                  <p className="text-gray-400 text-xs uppercase font-bold">Doanh Thu Combo</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.comboRevenue)}</h3>
                  <p className="text-xs text-gray-500 mt-1">Đã bán {summary.totalCombos} suất</p>
              </div>
          </div>

          {/* Card 4: TỔNG ĐƠN HÀNG */}
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

      {/* === 2. BIỂU ĐỒ CỘT (Bar Chart) === */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl mb-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <TrendingUp className="text-yellow-500" size={20} /> Biểu đồ doanh thu tổng (Bar Chart)
          </h3>
          <div className="h-[350px] w-full text-xs">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenueBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#eab308" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#eab308" stopOpacity={0.6}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis 
                        dataKey="label" stroke="#9ca3af" 
                        tick={{fill: '#9ca3af', fontSize: 12}} tickLine={false} axisLine={false} dy={10}
                    />
                    <YAxis 
                        stroke="#9ca3af" tickFormatter={(value) => `${value / 1000000}M`} 
                        tick={{fill: '#9ca3af', fontSize: 12}} tickLine={false} axisLine={false}
                    />
                    <Tooltip 
                        cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} 
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} 
                        formatter={(value) => [formatCurrency(value), "Doanh thu"]} 
                        labelStyle={{ color: '#eab308', fontWeight: 'bold', marginBottom: '5px' }}
                    />
                    <Bar 
                        dataKey="revenue" name="Doanh Thu" fill="url(#colorRevenueBar)" 
                        radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500}
                    />
                </BarChart>
             </ResponsiveContainer>
          </div>
      </div>

      {/* === 3. BẢNG CHI TIẾT (GRID 2 CỘT) === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* BẢNG 1: HIỆU SUẤT PHIM (CÓ CỘT VIP/THƯỜNG) */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl flex flex-col h-[500px]">
              <div className="p-5 border-b border-gray-700 bg-gray-800/50 backdrop-blur sticky top-0 z-10 rounded-t-xl">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                      🎬 Hiệu Suất Phim ({movieStats.length})
                  </h3>
                  <div className="flex justify-between items-end mt-2">
                      <p className="text-gray-400 text-xs">Sắp xếp theo doanh thu giảm dần</p>
                      <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                          Tổng: {formatCurrency(summary.movieRevenue)}
                      </span>
                  </div>
              </div>
              
              <div className="overflow-y-auto flex-1 custom-scrollbar p-0">
                  <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-gray-900 z-10 text-xs uppercase text-gray-500 font-bold shadow-md">
                          <tr>
                              <th className="py-3 pl-5">Tên Phim</th>
                              {/* Cột Thường và VIP riêng biệt */}
                              <th className="py-3 text-center text-blue-400" title="Ghế Thường">Thường</th>
                              <th className="py-3 text-center text-yellow-500" title="Ghế VIP">VIP</th>
                              <th className="py-3 text-right pr-5">Doanh Thu</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm">
                          {movieStats.map((movie, idx) => (
                              <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700 hover:bg-opacity-40 transition duration-150 group">
                                  <td className="py-4 pl-5 font-medium text-white max-w-[180px]">
                                      <div className="truncate" title={movie.title}>{movie.title}</div>
                                      
                                      {/* THANH TỶ LỆ VIP/THƯỜNG */}
                                      <div className="w-full bg-gray-700 h-1.5 mt-2 rounded-full overflow-hidden flex">
                                          {/* Phần Xanh: Ghế thường */}
                                          <div 
                                              className="bg-blue-500 h-full" 
                                              style={{ width: `${(movie.standardTickets / (movie.tickets || 1)) * 100}%` }}
                                          ></div>
                                          {/* Phần Vàng: Ghế VIP */}
                                          <div 
                                              className="bg-yellow-500 h-full" 
                                              style={{ width: `${(movie.vipTickets / (movie.tickets || 1)) * 100}%` }}
                                          ></div>
                                      </div>
                                  </td>
                                  
                                  {/* Số lượng vé Thường */}
                                  <td className="py-4 text-center text-gray-300 font-mono">
                                      {movie.standardTickets || 0}
                                  </td>

                                  {/* Số lượng vé VIP */}
                                  <td className="py-4 text-center font-bold text-yellow-500 font-mono">
                                      {movie.vipTickets || 0}
                                  </td>

                                  {/* Doanh thu tổng của phim */}
                                  <td className="py-4 text-right font-bold text-green-400 pr-5 font-mono">
                                      {formatCurrency(movie.revenue)}
                                  </td>
                              </tr>
                          ))}
                          {movieStats.length === 0 && (
                              <tr><td colSpan="4" className="text-center py-10 text-gray-500">Chưa có dữ liệu phim</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* BẢNG 2: HIỆU SUẤT COMBO */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl flex flex-col h-[500px]">
              <div className="p-5 border-b border-gray-700 bg-gray-800/50 backdrop-blur sticky top-0 z-10 rounded-t-xl">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                      🍿 Hiệu Suất Combo ({comboStats.length})
                  </h3>
                  <div className="flex justify-between items-end mt-2">
                      <p className="text-gray-400 text-xs">Thống kê doanh thu & số lượng</p>
                      <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                          Tổng: {formatCurrency(summary.comboRevenue)}
                      </span>
                  </div>
              </div>
              
              <div className="overflow-y-auto flex-1 custom-scrollbar p-0">
                  <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-gray-900 z-10 text-xs uppercase text-gray-500 font-bold shadow-md">
                          <tr>
                              <th className="py-3 pl-5">Hạng</th>
                              <th className="py-3 text-left">Tên Combo</th>
                              <th className="py-3 text-right">Qty</th>
                              <th className="py-3 text-right pr-5">Doanh Thu</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm">
                          {comboStats.map((combo, idx) => (
                              <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700 hover:bg-opacity-40 transition duration-150">
                                  <td className="py-4 pl-5">
                                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                          idx < 3 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'
                                      }`}>
                                          #{idx + 1}
                                      </span>
                                  </td>
                                  <td className="py-4 text-left font-medium text-white">
                                      {combo.name || "Combo chưa đặt tên"}
                                  </td>
                                  <td className="py-4 text-right font-bold text-gray-300 font-mono">
                                      {combo.totalQuantity}
                                  </td>
                                  <td className="py-4 text-right pr-5 font-bold text-green-400 font-mono">
                                      {formatCurrency(combo.totalRevenue)}
                                  </td>
                              </tr>
                          ))}
                          {comboStats.length === 0 && (
                              <tr><td colSpan="4" className="text-center py-10 text-gray-500">Chưa có dữ liệu combo</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

      </div>
    </div>
  );
}