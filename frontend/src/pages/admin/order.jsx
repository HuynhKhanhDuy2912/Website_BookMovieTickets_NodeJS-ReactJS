import React, { useEffect, useState, useMemo } from "react";
import {
  getMyOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
} from "../../api/orderService";
import api from "../../api/axiosConfig"; 
import {
  Loader2, Trash2, Eye, ShoppingBag,
  CreditCard, User, Ticket, UtensilsCrossed, CheckCircle, Receipt,
  Film, Clock, MapPin, CalendarDays, Search, XCircle
} from "lucide-react";

export default function Orders({ role }) {
  const [orders, setOrders] = useState([]);
  const [allShowtimes, setAllShowtimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [status, setStatus] = useState("pending");

  // State bộ lọc
  const [selectedShowtimeId, setSelectedShowtimeId] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState(""); // Thêm tìm kiếm nhanh

  useEffect(() => {
    fetchData();
  }, [role]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, showtimesRes] = await Promise.all([
          role === "user" ? getMyOrders() : getAllOrders(),
          api.get("/showtime")
      ]);

      // Sort đơn mới nhất lên đầu
      const sortedOrders = (ordersRes.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
      setAllShowtimes(showtimesRes.data || []);
    } catch (err) {
      console.error("❌ Lỗi load data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Logic tạo danh sách filter suất chiếu (Giữ nguyên logic của bạn)
  const uniqueShowtimes = useMemo(() => {
    const orderCounts = {};
    orders.forEach(order => {
      if (order.showtime && order.showtime._id) {
        const id = order.showtime._id;
        orderCounts[id] = (orderCounts[id] || 0) + 1;
      }
    });

    const formattedList = allShowtimes.map(st => ({
      id: st._id,
      movieTitle: st.movie?.title || "Phim ?",
      startTime: st.startTime,
      cinemaName: st.cinema?.name || "Rạp ?",
      roomName: st.room?.name || "",
      orderCount: orderCounts[st._id] || 0
    }));

    // Sắp xếp (Mới nhất lên đầu)
    return formattedList.sort((a, b) => 
      new Date(b.startTime) - new Date(a.startTime)
    );
  }, [orders, allShowtimes]);

  // 🔥 Helper hiển thị tên trong Dropdown (Đã thêm Tên Rạp)
  const formatDropdownLabel = (st) => {
      const timeStr = new Date(st.startTime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
      const dateStr = new Date(st.startTime).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'});
      // Hiển thị: Phim (19:30 - 30/01) (Rạp) [5 đơn]
      return `${st.movieTitle} (${timeStr} - ${dateStr}) (${st.cinemaName}) [${st.orderCount} đơn]`;
  };

  // --- LỌC DANH SÁCH HIỂN THỊ ---
  const filteredOrders = useMemo(() => {
    let result = orders;

    // 1. Lọc theo suất chiếu
    if (selectedShowtimeId !== "ALL") {
        result = result.filter(o => o.showtime?._id === selectedShowtimeId);
    }

    // 2. Lọc theo từ khóa tìm kiếm (Mã đơn, Tên khách)
    if (searchTerm.trim()) {
        const lowerSearch = searchTerm.toLowerCase();
        result = result.filter(o => 
            (o.orderCode || o._id).toLowerCase().includes(lowerSearch) ||
            (o.user?.name || o.guestName || "").toLowerCase().includes(lowerSearch)
        );
    }

    return result;
  }, [orders, selectedShowtimeId, searchTerm]);


  // ... (Giữ nguyên các hàm xử lý logic cũ) ...
  const handleViewDetail = (order) => {
    setViewingOrder(order);
    setStatus(order.status || "pending");
    // Scroll nhẹ lên phần chi tiết
    document.getElementById("detail-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!viewingOrder) return;
    setLoading(true);
    try {
      await updateOrder(viewingOrder._id, { status: status });
      alert("✅ Cập nhật trạng thái thành công!");
      setViewingOrder(null);
      fetchData(); 
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn này vĩnh viễn?")) return;
    try {
      await deleteOrder(id);
      fetchData(); 
    } catch (err) {
      alert("❌ Không thể xóa!");
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 đ";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const calculateBillDetails = (order) => {
    const comboTotal = order.combos?.reduce((sum, c) => sum + (c.price * c.quantity), 0) || 0;
    const ticketTotal = (order.totalPrice || 0) - comboTotal;
    const seatCount = order.seats?.length || 0;
    const avgTicketPrice = seatCount > 0 ? ticketTotal / seatCount : 0;
    return { comboTotal, ticketTotal, avgTicketPrice, seatCount };
  };

  // Helper lấy ảnh (hoặc placeholder)
  const getImageUrl = (url) => {
      if (!url) return "https://placehold.co/50x75?text=No+Img";
      return url;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      
      {/* HEADER & FILTER TOOLBAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        
        {/* 1. TIÊU ĐỀ */}
        <div className="shrink-0">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 whitespace-nowrap">
              <ShoppingBag className="text-indigo-600" /> Quản lý Đơn Hàng
            </h2>
            <p className="text-sm text-gray-500 mt-1">Tổng cộng: {orders.length} đơn hàng</p>
        </div>

        {/* 2. CÔNG CỤ LỌC */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Search Box */}
            <div className="relative group w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition" size={18} />
                <input 
                    type="text" 
                    placeholder="Tìm mã, tên khách..." 
                    className="pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white w-full transition text-sm h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200 w-full sm:w-[320px] h-10 transition-colors hover:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white">
                <CalendarDays size={18} className="text-indigo-600 shrink-0" />
                <div className="flex flex-col w-full overflow-hidden justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Lọc theo suất chiếu</span>
                    <select
                        value={selectedShowtimeId}
                        onChange={(e) => setSelectedShowtimeId(e.target.value)}
                        className="outline-none text-sm font-semibold text-gray-700 bg-transparent cursor-pointer w-full truncate h-5 leading-tight"
                    >
                        <option value="ALL">📋 Tất cả ({orders.length} đơn)</option>
                        {uniqueShowtimes.map((st) => (
                            <option key={st.id} value={st.id}>
                                {st.orderCount === 0 ? "⚪ " : "🟢 "}
                                {formatDropdownLabel(st)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
      </div>

      {/* --- PHẦN XEM CHI TIẾT (POPUP/SECTION) --- */}
      {viewingOrder && (
        <div id="detail-section" className="bg-white shadow-xl rounded-xl border border-indigo-100 overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-300 ring-4 ring-indigo-50/50">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 flex justify-between items-center border-b border-indigo-100">
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <Receipt size={20} className="text-indigo-600"/> Chi tiết đơn hàng #{viewingOrder.orderCode || viewingOrder._id.slice(-6).toUpperCase()}
            </h3>
            <button onClick={() => setViewingOrder(null)} className="text-gray-400 hover:text-red-500 transition p-1 hover:bg-red-50 rounded-full">
              <XCircle size={24} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cột 1: Thông tin vé & khách */}
            <div className="lg:col-span-2 space-y-6">
                {/* Thông tin khách */}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
                        {viewingOrder.user?.name?.charAt(0).toUpperCase() || "K"}
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 text-lg">{viewingOrder.user?.name || viewingOrder.guestName || "Khách vãng lai"}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1"><User size={12}/> {viewingOrder.user?.email || "Không có email"}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={12}/> {new Date(viewingOrder.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                </div>

                {/* Chi tiết Items */}
                <div className="border rounded-xl overflow-hidden text-sm shadow-sm">
                    {/* Vé */}
                    <div className="p-4 bg-white border-b border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-700 flex items-center gap-2">
                                <Ticket size={16} className="text-blue-500" /> Vé xem phim
                            </span>
                            <span className="font-bold text-gray-800">
                                {formatCurrency(viewingOrder.tickets?.length > 0 ? viewingOrder.tickets.reduce((s, t) => s + t.price, 0) : calculateBillDetails(viewingOrder).ticketTotal)}
                            </span>
                        </div>
                        <div className="pl-6 space-y-1">
                            {viewingOrder.tickets && viewingOrder.tickets.length > 0 ? (
                                viewingOrder.tickets.map((t, idx) => (
                                    <div key={idx} className="flex justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                        <span>Ghế <b className="text-gray-900">{t.seatNumber}</b> {t.type === 'vip' && <span className="text-yellow-600 bg-yellow-100 px-1 rounded text-[10px] ml-1 font-bold">VIP</span>}</span>
                                        <span>{formatCurrency(t.price)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">Ghế: {viewingOrder.seats?.join(", ")}</div>
                            )}
                        </div>
                    </div>

                    {/* Combo */}
                    <div className="p-4 bg-white border-b border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-700 flex items-center gap-2">
                                <UtensilsCrossed size={16} className="text-orange-500" /> Combo
                            </span>
                            <span className="font-bold text-gray-800">{formatCurrency(calculateBillDetails(viewingOrder).comboTotal)}</span>
                        </div>
                        {viewingOrder.combos?.length > 0 ? (
                            <div className="pl-6 space-y-1">
                                {viewingOrder.combos.map((c, idx) => (
                                    <div key={idx} className="flex justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                        <span>{c.name} <b className="text-gray-900">x{c.quantity}</b></span>
                                        <span>{formatCurrency(c.price * c.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <div className="pl-6 text-xs text-gray-400 italic">Không chọn Combo</div>}
                    </div>

                    {/* Tổng tiền */}
                    <div className="bg-indigo-50 p-4 flex justify-between items-center">
                        <span className="font-bold text-indigo-900 uppercase text-sm">Tổng thanh toán</span>
                        <span className="text-xl font-extrabold text-red-600">{formatCurrency(viewingOrder.totalPrice)}</span>
                    </div>
                </div>
            </div>

            {/* Cột 2: Xử lý trạng thái */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-fit">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle className="text-green-600" /> Cập nhật trạng thái</h4>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Trạng thái hiện tại</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)} 
                    className={`w-full p-3 rounded-lg border-2 font-bold outline-none transition cursor-pointer
                        ${status === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 
                          status === 'cancelled' ? 'border-red-200 bg-red-50 text-red-700' : 
                          'border-yellow-200 bg-yellow-50 text-yellow-700'}
                    `}
                  >
                    <option value="pending">⏳ Chờ thanh toán</option>
                    <option value="success">✅ Đã thanh toán</option>
                    <option value="cancelled">🚫 Đã hủy</option>
                  </select>
                </div>
                
                <div className="pt-4 flex flex-col gap-2">
                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-md transition disabled:bg-gray-300 flex justify-center items-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : "Lưu Thay Đổi"}
                  </button>
                  <button type="button" onClick={() => setViewingOrder(null)} className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-100 font-bold rounded-lg text-gray-600 transition">
                    Đóng
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- DANH SÁCH ĐƠN HÀNG (TABLE VIEW CỐ ĐỊNH) --- */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            {/* 🔥 QUAN TRỌNG: Thêm table-fixed và gán cứng width cho các cột */}
            <table className="w-full text-left border-collapse table-fixed">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                        {/* 1. Phim - Rộng nhất */}
                        <th className="p-4 font-bold w-[250px]">Thông tin Phim</th>
                        {/* 2. Suất chiếu - Vừa phải */}
                        <th className="p-4 font-bold w-[220px]">Suất chiếu & Rạp</th>
                        {/* 3. Khách - Vừa phải */}
                        <th className="p-4 font-bold w-[180px]">Khách hàng</th>
                        {/* 4. Ghế - Vừa phải */}
                        <th className="p-4 font-bold text-center w-[150px]">Ghế / Combo</th>
                        {/* 5. Tiền - Nhỏ */}
                        <th className="p-4 font-bold text-right w-[120px]">Tổng tiền</th>
                        {/* 6. Trạng thái - Nhỏ */}
                        <th className="p-4 font-bold text-center w-[130px]">Trạng thái</th>
                        {/* 7. Action - Nhỏ nhất */}
                        <th className="p-4 font-bold text-center w-[100px]">Hành động</th>
                    </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="p-12 text-center">
                                <div className="flex flex-col items-center justify-center text-gray-400">
                                    <ShoppingBag size={48} className="mb-3 opacity-20"/>
                                    <p>Không tìm thấy đơn hàng nào.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredOrders.map(order => {
                            const isPaid = order.status === 'success' || order.paymentStatus === 'paid';
                            const isCancelled = order.status === 'cancelled';
                            
                            return (
                                <tr key={order._id} className="hover:bg-blue-50/30 transition duration-150 group">
                                    {/* 1. Thông tin phim */}
                                    <td className="p-4 align-top">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-14 rounded overflow-hidden shadow-sm border border-gray-200 shrink-0">
                                                <img 
                                                    src={getImageUrl(order.showtime?.movie?.posterUrl)} 
                                                    alt="poster" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="font-bold text-gray-800 truncate" title={order.showtime?.movie?.title}>
                                                    {order.showtime?.movie?.title || "Phim không xác định"}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-1 bg-gray-100 px-1.5 py-0.5 rounded w-fit">
                                                    #{order.orderCode || order._id.slice(-6).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 2. Suất chiếu */}
                                    <td className="p-4 align-top">
                                        <div className="flex flex-col gap-1 text-gray-600">
                                            <div className="flex items-center gap-1.5 font-medium text-indigo-600">
                                                <Clock size={14} className="shrink-0"/> 
                                                {order.showtime ? new Date(order.showtime.startTime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : "--:--"}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <CalendarDays size={14} className="text-gray-400 shrink-0"/>
                                                {order.showtime ? new Date(order.showtime.startTime).toLocaleDateString('vi-VN') : "--/--/--"}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1" title={`${order.showtime?.cinema?.name} - ${order.showtime?.room?.name}`}>
                                                <MapPin size={14} className="text-red-400 shrink-0"/>
                                                <span className="truncate block max-w-[180px]">
                                                    {order.showtime?.cinema?.name} - {order.showtime?.room?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 3. Khách hàng */}
                                    <td className="p-4 align-top">
                                        <div className="font-medium text-gray-800 truncate" title={order.user?.name || order.guestName}>
                                            {order.user?.name || order.guestName || "Khách lẻ"}
                                        </div>
                                        {order.user?.email && (
                                            <div className="text-xs text-gray-500 mt-0.5 truncate" title={order.user.email}>
                                                {order.user.email}
                                            </div>
                                        )}
                                    </td>

                                    {/* 4. Ghế & Combo */}
                                    <td className="p-4 align-top text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {order.seats?.length > 0 ? (
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {order.seats.slice(0, 4).map((seat, idx) => (
                                                        <span key={idx} className="bg-gray-100 border border-gray-300 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                            {seat.name || seat}
                                                        </span>
                                                    ))}
                                                    {order.seats.length > 4 && <span className="text-xs text-gray-400">+{order.seats.length - 4}</span>}
                                                </div>
                                            ) : <span className="text-gray-400 italic text-xs">--</span>}
                                            
                                            {order.combos?.length > 0 && (
                                                <div className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-bold mt-1 whitespace-nowrap">
                                                    +{order.combos.reduce((acc, c) => acc + c.quantity, 0)} Combo
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* 5. Tổng tiền */}
                                    <td className="p-4 align-top text-right">
                                        <span className="font-bold text-base text-gray-900 block">
                                            {formatCurrency(order.totalPrice)}
                                        </span>
                                    </td>

                                    {/* 6. Trạng thái */}
                                    <td className="p-4 align-top text-center">
                                        {isPaid ? (
                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-green-200">
                                                Thành công
                                            </span>
                                        ) : isCancelled ? (
                                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-red-200">
                                                Đã hủy
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-yellow-200">
                                                Chờ xử lý
                                            </span>
                                        )}
                                    </td>

                                    {/* 7. Hành động */}
                                    <td className="p-4 align-top text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleViewDetail(order)} 
                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition" 
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            
                                            {/* <button 
                                                onClick={() => handleDelete(order._id)}
                                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition" 
                                                title="Xóa đơn hàng"
                                            >
                                                <Trash2 size={16} />
                                            </button> */}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Footer bảng */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
            <span>Hiển thị {filteredOrders.length} kết quả</span>
        </div>
      </div>
    </div>
  );
}