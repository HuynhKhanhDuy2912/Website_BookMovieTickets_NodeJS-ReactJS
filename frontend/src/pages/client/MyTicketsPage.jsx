import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { 
  Ticket, MapPin, Calendar, Clock, ArrowLeft, 
  History, Film, QrCode, Home
} from "lucide-react";

// --- HELPERS ---
const getImageUrl = (imageField) => {
  if (typeof imageField === 'string' && imageField.startsWith("http")) return imageField;
  if (typeof imageField === 'string') return `http://localhost:5000/${imageField.replace(/\\/g, '/').replace(/^\//, '')}`;
  return "https://via.placeholder.com/150";
};

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MyTicketsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' | 'history'
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/order/my-orders");
        // Sắp xếp vé mới nhất lên đầu
        setOrders(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error("Lỗi tải vé:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // --- LOGIC PHÂN LOẠI VÉ ---
  const now = new Date();
  
  // Vé sắp chiếu: Thời gian chiếu > Thời gian hiện tại
  const upcomingOrders = orders.filter(order => new Date(order.showtime?.startTime) > now);
  
  // Vé lịch sử: Thời gian chiếu <= Thời gian hiện tại
  const historyOrders = orders.filter(order => new Date(order.showtime?.startTime) <= now);

  // Chọn danh sách vé hiển thị theo Tab
  const displayOrders = activeTab === 'upcoming' ? upcomingOrders : historyOrders;

  return (
    <div className="bg-gray-900 min-h-screen text-white py-10 font-sans">
      <div className="container mx-auto px-4">
        
        {/* Container căn giữa với độ rộng tối đa 5xl (khoảng 1024px) */}
        <div className="max-w-5xl mx-auto">

            <div className="bg-gray-800 rounded-2xl p-6 md:p-10 border border-gray-700 shadow-2xl min-h-[600px]">
                
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-700 pb-6 gap-6">
                    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Ticket className="text-yellow-500" size={32}/> Vé Của Tôi
                    </h3>
                    
                    {/* Tab Switcher - Giao diện Pill */}
                    <div className="flex bg-gray-900 p-1.5 rounded-xl border border-gray-700">
                        <button 
                            onClick={() => setActiveTab("upcoming")}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'upcoming' ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Film size={18}/> Sắp Chiếu 
                            {upcomingOrders.length > 0 && <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs ml-1">{upcomingOrders.length}</span>}
                        </button>
                        <button 
                            onClick={() => setActiveTab("history")}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'history' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <History size={18}/> Lịch Sử
                            {historyOrders.length > 0 && <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs ml-1">{historyOrders.length}</span>}
                        </button>
                    </div>
                </div>
                
                {/* List Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-pulse">
                        <Ticket size={48} className="mb-4 opacity-50"/>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : displayOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-gray-900/30 rounded-2xl border border-gray-700/50 border-dashed">
                        <Ticket size={64} className="mx-auto mb-4 opacity-20 text-yellow-500"/>
                        <p className="text-lg font-medium text-gray-300">Không tìm thấy vé nào ở mục này</p>
                        <Link to="/" className="mt-4 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition">
                            Đặt vé ngay bây giờ
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {displayOrders.map((order) => {
                            const showtime = order.showtime || {};
                            const movie = showtime.movie || {};
                            const cinema = showtime.cinema || {};
                            const startTime = new Date(showtime.startTime);
                            const isHistory = activeTab === 'history';
                            
                            return (
                                <div 
                                    key={order._id} 
                                    className={`relative group bg-gray-900 border rounded-2xl overflow-hidden flex flex-col sm:flex-row transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl 
                                        ${isHistory ? 'border-gray-700 opacity-75 hover:opacity-100' : 'border-gray-600 hover:border-yellow-500'}`}
                                >
                                    {/* Poster Section */}
                                    <div className="sm:w-48 h-48 sm:h-auto bg-black relative shrink-0">
                                        <img 
                                            src={getImageUrl(movie.posterUrl)} 
                                            className={`w-full h-full object-cover transition duration-500 group-hover:scale-110 ${isHistory ? 'grayscale group-hover:grayscale-0' : ''}`} 
                                            alt={movie.title}
                                        />
                                        {/* Overlay gradient cho mobile */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent sm:hidden"/>
                                        
                                        {/* Badge trạng thái */}
                                        <div className="absolute top-3 left-3 z-10">
                                            {isHistory ? (
                                                <span className="bg-gray-800/90 backdrop-blur-md text-[10px] uppercase font-bold text-gray-300 px-3 py-1 rounded-md shadow-lg border border-gray-600">Đã chiếu</span>
                                            ) : (
                                                <span className="bg-green-600/90 backdrop-blur-md text-[10px] uppercase font-bold text-white px-3 py-1 rounded-md shadow-lg border border-green-400 animate-pulse flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"/> Sắp chiếu
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Section */}
                                    <div className="p-6 flex-1 flex flex-col justify-between relative">
                                        {/* Watermark QR (Decoration) */}
                                        <QrCode className="absolute right-6 bottom-6 text-white/5 w-32 h-32 rotate-12 pointer-events-none"/>

                                        <div>
                                            <h4 className="font-bold text-2xl text-white mb-3 line-clamp-1 group-hover:text-yellow-500 transition">
                                                {movie.title || "Tên phim đang cập nhật"}
                                            </h4>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-400">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-yellow-500 shrink-0">
                                                        <MapPin size={16}/> 
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Rạp chiếu</p>
                                                        <span className="text-gray-200 font-medium">{cinema.name} - Phòng {showtime.room?.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-yellow-500 shrink-0">
                                                        <Calendar size={16}/> 
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Ngày chiếu</p>
                                                        <span className="text-white font-medium">{formatDate(startTime)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-yellow-500 shrink-0">
                                                        <Clock size={16}/> 
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Giờ chiếu</p>
                                                        <span className="text-white font-bold text-lg">{formatTime(startTime)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-gray-800 flex flex-wrap justify-between items-end gap-4 relative z-10">
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 tracking-wider">Ghế đã chọn</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {order.seats?.map((seat, idx) => (
                                                        <span key={idx} className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-2.5 py-1 rounded border border-gray-600 transition">
                                                            {seat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5 tracking-wider">Tổng thanh toán</p>
                                                <p className="text-2xl text-yellow-500 font-extrabold tracking-tight leading-none">
                                                    {formatCurrency(order.totalPrice)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}