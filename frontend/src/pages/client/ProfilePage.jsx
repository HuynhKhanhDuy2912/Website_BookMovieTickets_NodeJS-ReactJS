import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import { 
  Ticket, MapPin, Calendar, Clock, QrCode, Armchair, Utensils, History, PlayCircle, CheckCircle 
} from "lucide-react";

// Helper xử lý ảnh
const getImageUrl = (imageField) => {
  if (!imageField) return "https://placehold.co/150x200?text=No+Image";
  if (typeof imageField === 'object' && imageField !== null) return imageField.secure_url || imageField.url || imageField.path;
  if (typeof imageField === 'string') {
    if (imageField.startsWith("http")) return imageField;
    return `http://localhost:5000/${imageField.replace(/\\/g, '/').replace(/^\//, '')}`;
  }
  return "https://placehold.co/150x200?text=Error";
};

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

export default function ProfilePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' | 'history'

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get("/order/my-orders");
        // Sắp xếp: Vé mới nhất lên đầu
        const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sorted);
      } catch (err) {
        console.error("Lỗi tải đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // --- LOGIC PHÂN LOẠI VÉ ---
  const now = new Date();

  const getTicketStatus = (startTime) => {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + 120 * 60000); // Giả sử phim 2 tiếng

      if (now < start) return { label: "Sắp chiếu", color: "bg-green-500", icon: <Calendar size={12}/>, type: 'upcoming' };
      if (now >= start && now <= end) return { label: "Đang chiếu", color: "bg-yellow-500 animate-pulse", icon: <PlayCircle size={12}/>, type: 'showing' };
      return { label: "Đã chiếu", color: "bg-gray-500", icon: <CheckCircle size={12}/>, type: 'expired' };
  };

  // Lọc danh sách theo Tab
  const filteredOrders = orders.filter(order => {
      const showtime = order.showtime || {};
      const status = getTicketStatus(showtime.startTime);
      
      if (activeTab === 'upcoming') {
          return status.type === 'upcoming' || status.type === 'showing';
      } else {
          return status.type === 'expired';
      }
  });

  return (
    <div className="bg-gray-900 min-h-screen text-white py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* HEADER & TABS */}
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="bg-yellow-500 p-2 rounded-lg text-black"><Ticket size={24} /></div>
                Vé Của Tôi
            </h2>

            {/* TAB BUTTONS */}
            <div className="flex bg-gray-800 p-1 rounded-xl w-full md:w-fit">
                <button 
                    onClick={() => setActiveTab("upcoming")}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === 'upcoming' ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Ticket size={16}/> Vé Sắp Tới
                </button>
                <button 
                    onClick={() => setActiveTab("history")}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-gray-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <History size={16}/> Lịch Sử
                </button>
            </div>
        </div>

        {/* DANH SÁCH VÉ */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-500"></div></div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-6 animate-fade-in-up">
            {filteredOrders.map((order) => {
              const showtime = order.showtime || {};
              const movie = showtime.movie || {};
              const cinema = showtime.cinema || {};
              const statusInfo = getTicketStatus(showtime.startTime);
              const isExpired = statusInfo.type === 'expired';

              return (
                <div key={order._id} className={`rounded-2xl overflow-hidden border transition-all duration-300 shadow-xl flex flex-col md:flex-row group ${isExpired ? 'bg-gray-800 border-gray-700 opacity-75 grayscale hover:grayscale-0 hover:opacity-100' : 'bg-gray-800 border-gray-600 hover:border-yellow-500'}`}>
                  
                  {/* 1. POSTER */}
                  <div className="md:w-48 h-48 md:h-auto shrink-0 bg-gray-900 relative">
                    <img 
                      src={getImageUrl(movie.posterUrl)} 
                      alt={movie.title} 
                      className="w-full h-full object-cover"
                    />
                    {/* Badge Trạng thái Phim */}
                    <div className="absolute top-3 left-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase shadow-md flex items-center gap-1 text-white ${statusInfo.color}`}>
                           {statusInfo.icon} {statusInfo.label}
                        </span>
                    </div>
                  </div>

                  {/* 2. INFO */}
                  <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-yellow-500 transition">
                        {movie.title || "Tên phim không tồn tại"}
                      </h3>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-2"><MapPin size={14} className="text-yellow-500"/> {cinema.name} - {showtime.room?.name}</span>
                        <span className="flex items-center gap-2 font-bold text-white"><Calendar size={14} className="text-yellow-500"/> {showtime.startTime ? new Date(showtime.startTime).toLocaleDateString('vi-VN') : ""}</span>
                        <span className="flex items-center gap-2 font-bold text-yellow-400"><Clock size={14} className="text-yellow-500"/> {showtime.startTime ? new Date(showtime.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ""}</span>
                      </div>

                      {/* Thông tin Ghế & Combo */}
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50 flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                             <Armchair size={16} className="text-gray-500 mt-1"/>
                             <span className="text-white font-bold">{order.seats && order.seats.length > 0 ? order.seats.join(", ") : "N/A"}</span>
                          </div>
                          {order.combos && order.combos.length > 0 && (
                             <div className="flex items-start gap-2 border-t border-gray-700/50 pt-2">
                                <Utensils size={16} className="text-gray-500 mt-1"/>
                                <span className="text-sm text-gray-300">
                                   {order.combos.map(c => `${c.quantity}x ${c.comboId?.name || c.name}`).join(", ")}
                                </span>
                             </div>
                          )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-end">
                       <div className="text-xs text-gray-500">Mã: <span className="font-mono text-white">{order.orderCode}</span></div>
                       <div className="text-xl font-bold text-yellow-500">{formatCurrency(order.totalPrice)}</div>
                    </div>
                  </div>

                  {/* 3. QR CODE (Chỉ hiện nếu chưa hết hạn) */}
                  {!isExpired && (
                    <div className="bg-white md:w-36 flex flex-col items-center justify-center p-4 gap-2 border-l-4 border-gray-900 border-dashed relative">
                      <div className="absolute -left-2 top-0 bottom-0 w-4 flex flex-col justify-between py-2">
                        {[...Array(6)].map((_,i) => <div key={i} className="w-4 h-4 bg-gray-900 rounded-full -ml-2"></div>)}
                      </div>
                      <QrCode size={80} className="text-black" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Scan Entry</span>
                    </div>
                  )}

                  {/* Nếu hết hạn thì hiện cột xám */}
                  {isExpired && (
                      <div className="bg-gray-700 md:w-12 flex items-center justify-center border-l border-gray-600">
                          <span className="transform -rotate-90 whitespace-nowrap text-xs font-bold text-gray-400 uppercase tracking-widest">Đã sử dụng</span>
                      </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-gray-800 rounded-2xl border border-dashed border-gray-700">
             <Ticket size={48} className="text-gray-600 mx-auto mb-4"/>
             <h3 className="text-xl font-bold text-white mb-2">
                 {activeTab === 'upcoming' ? "Bạn không có vé sắp chiếu" : "Lịch sử trống"}
             </h3>
             <p className="text-gray-400 mb-6">Hãy đặt vé ngay để thưởng thức những bộ phim bom tấn!</p>
             <Link to="/" className="bg-yellow-500 text-black font-bold py-3 px-8 rounded-full shadow-lg hover:bg-yellow-400 transition">Đặt vé ngay</Link>
          </div>
        )}
      </div>
    </div>
  );
}