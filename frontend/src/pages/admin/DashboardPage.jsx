import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { DollarSign, ShoppingBag, Calendar } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0 });
  const [filterType, setFilterType] = useState("year"); // all | year | month
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);

  // Format tiền tệ
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Gọi API với query param
        const res = await api.get(`/admin/stats`, {
            params: { 
                type: filterType,
                year: selectedYear,
                month: selectedMonth
            }
        });
        setStats(res.data.data);
        setSummary(res.data.summary);
      } catch (err) {
        console.error("Lỗi lấy thống kê:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [filterType, selectedYear, selectedMonth]);

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-yellow-500 uppercase">Dashboard Thống Kê</h1>

      {/* 1. THANH BỘ LỌC (FILTER) */}
      <div className="bg-gray-800 p-4 rounded-xl mb-8 flex flex-wrap gap-4 items-center border border-gray-700">
          <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-400"/>
              <span className="font-bold">Xem theo:</span>
          </div>
          
          <select 
             value={filterType} 
             onChange={(e) => setFilterType(e.target.value)}
             className="bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-yellow-500 outline-none"
          >
              <option value="all">Tất cả các năm</option>
              <option value="year">Trong năm</option>
              <option value="month">Trong tháng</option>
          </select>

          {/* Nếu chọn Year hoặc Month thì hiện ô chọn Năm */}
          {(filterType === 'year' || filterType === 'month') && (
             <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-gray-700 text-white p-2 rounded border border-gray-600"
             >
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
             </select>
          )}

          {/* Nếu chọn Month thì hiện thêm ô chọn Tháng */}
          {filterType === 'month' && (
             <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-gray-700 text-white p-2 rounded border border-gray-600"
             >
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>Tháng {m}</option>
                ))}
             </select>
          )}
      </div>

      {/* 2. THẺ CHỈ SỐ TỔNG QUAN (SUMMARY CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card Doanh Thu */}
          <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-full"><DollarSign size={32} /></div>
              <div>
                  <p className="text-green-100 text-sm">Tổng Doanh Thu (Kỳ này)</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</h3>
              </div>
          </div>

          {/* Card Số Đơn */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-full"><ShoppingBag size={32} /></div>
              <div>
                  <p className="text-blue-100 text-sm">Tổng Vé Đã Bán</p>
                  <h3 className="text-2xl font-bold">{summary.totalOrders} vé</h3>
              </div>
          </div>
      </div>

      {/* 3. BIỂU ĐỒ (CHART) */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              📊 Biểu đồ doanh thu
          </h3>
          
          <div className="h-[400px] w-full text-black">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="label" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `${value / 1000}k`}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                        formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Doanh Thu"
                        stroke="#eab308" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                    />
                </AreaChart>
             </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
}