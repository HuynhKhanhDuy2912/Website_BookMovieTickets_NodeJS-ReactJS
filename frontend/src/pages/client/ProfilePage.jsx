import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { 
  Ticket, MapPin, Calendar, Clock, QrCode, Armchair, Utensils 
} from "lucide-react";

// Helper xử lý ảnh
const getImageUrl = (imageField) => {
  if (!imageField) return "https://placehold.co/150x200?text=No+Image";
  if (typeof imageField === 'object' && imageField !== null) {
    return imageField.secure_url || imageField.url || imageField.path;
  }
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

  // Chỉ gọi API lấy vé ngay khi vào trang
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get("/order/my-orders");
        setOrders(res.data);
      } catch (err) {
        console.error("Lỗi tải đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen text-white py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header trang */}
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-700">
           <div className="bg-yellow-500 p-2 rounded-lg text-black">
              <Ticket size={24} />
           </div>
           <h2 className="text-3xl font-bold text-white">Vé Của Tôi</h2>
        </div>

        {/* Nội dung danh sách vé */}
        {loading ? (
          <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-500"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6 animate-fade-in-up">
            {orders.map((order) => {
              const showtime = order.showtime || {};
              const movie = showtime.movie || {};
              const cinema = showtime.cinema || {};

              return (
                <div key={order._id} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-yellow-500 transition-all duration-300 shadow-xl flex flex-col md:flex-row group">
                  
                  {/* 1. POSTER PHIM */}
                  <div className="md:w-48 h-64 md:h-auto shrink-0 bg-gray-900 relative">
                    <img 
                      src={getImageUrl(movie.posterUrl)} 
                      alt={movie.title} 
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition duration-500"
                    />
                    <div className="absolute top-3 left-3">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase shadow-md ${order.status === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                          {order.status === 'success' ? 'Đã Thanh Toán' : order.status}
                       </span>
                    </div>
                  </div>

                  {/* 2. THÔNG TIN CHI TIẾT */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-yellow-500 transition">
                        {movie.title || "Tên phim không tồn tại"}
                      </h3>
                      
                      {/* Thông tin Rạp & Giờ */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400 mb-5">
                        <span className="flex items-center gap-2"><MapPin size={16} className="text-yellow-500"/> {cinema.name} - {showtime.room?.name}</span>
                        <span className="flex items-center gap-2"><Calendar size={16} className="text-yellow-500"/> {showtime.startTime ? new Date(showtime.startTime).toLocaleDateString('vi-VN') : ""}</span>
                        <span className="flex items-center gap-2"><Clock size={16} className="text-yellow-500"/> {showtime.startTime ? new Date(showtime.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ""}</span>
                      </div>

                      {/* KHỐI THÔNG TIN GHẾ & COMBO (QUAN TRỌNG) */}
                      <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700 space-y-3">
                         
                         {/* Dòng hiển thị Ghế */}
                         <div className="flex items-start gap-3">
                            <Armchair size={20} className="text-yellow-500 shrink-0 mt-0.5" />
                            <div>
                               <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Ghế đã đặt</span>
                               <span className="text-white font-bold text-lg tracking-wider">
                                  {order.seats && order.seats.length > 0 ? order.seats.join(", ") : "Chưa có dữ liệu ghế"}
                               </span>
                            </div>
                         </div>

                         {/* Dòng hiển thị Combo (Chỉ hiện nếu có) */}
                         {order.combos && order.combos.length > 0 && (
                            <div className="flex items-start gap-3 pt-3 border-t border-gray-700/50">
                               <Utensils size={20} className="text-orange-500 shrink-0 mt-0.5" />
                               <div>
                                  <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Combo Bắp Nước</span>
                                  <div className="text-gray-200 text-sm font-medium">
                                     {order.combos.map((c, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                           <span className="text-orange-400 font-bold">{c.quantity}x</span> 
                                           <span>{c.comboId?.name || c.name || "Combo"}</span>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         )}
                      </div>
                    </div>

                    {/* Footer của Card: Mã đơn & Giá */}
                    <div className="mt-5 pt-4 border-t border-gray-700 flex justify-between items-end">
                       <div>
                          <p className="text-xs text-gray-500 mb-1">Mã đơn hàng</p>
                          <p className="font-mono font-bold text-white bg-gray-700 px-2 py-1 rounded inline-block text-sm">{order.orderCode}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Tổng tiền</p>
                          <p className="text-2xl font-bold text-yellow-500">{formatCurrency(order.totalPrice)}</p>
                       </div>
                    </div>
                  </div>

                  {/* 3. MÃ QR (Bên phải) */}
                  <div className="bg-white md:w-36 flex flex-col items-center justify-center p-4 gap-2 border-l-4 border-gray-900 border-dashed relative">
                     {/* Tạo hiệu ứng răng cưa vé (Optional visual) */}
                     <div className="absolute -left-2 top-0 bottom-0 w-4 flex flex-col justify-between py-2">
                        {[...Array(8)].map((_,i) => <div key={i} className="w-4 h-4 bg-gray-900 rounded-full -ml-2"></div>)}
                     </div>

                     <QrCode size={80} className="text-black" />
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Scan Entry</span>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-gray-800 rounded-2xl border border-dashed border-gray-700">
             <div className="bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket size={40} className="text-gray-400"/>
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Chưa có vé nào</h3>
             <p className="text-gray-400 mb-6">Bạn chưa thực hiện giao dịch nào gần đây.</p>
             <a href="/" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-full transition shadow-lg shadow-yellow-500/20">
                Đặt vé ngay
             </a>
          </div>
        )}
      </div>
    </div>
  );
}