import { useEffect, useState, useMemo } from "react";
import {
  getMyOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
} from "../../api/orderService";
// 👇 [QUAN TRỌNG] Import API để lấy danh sách suất chiếu
import api from "../../api/axiosConfig"; 
import {
  Loader2, Trash2, Eye, ShoppingBag,
  CreditCard, User, Ticket, UtensilsCrossed, CheckCircle, Receipt,
  Film, Clock, MapPin, CalendarDays
} from "lucide-react";

export default function Orders({ role }) {
  const [orders, setOrders] = useState([]);
  const [allShowtimes, setAllShowtimes] = useState([]); // 👇 [STATE MỚI] Lưu tất cả suất chiếu
  const [loading, setLoading] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [status, setStatus] = useState("pending");

  // State bộ lọc
  const [selectedShowtimeId, setSelectedShowtimeId] = useState("ALL");

  useEffect(() => {
    fetchData();
  }, [role]);

  // 👇 [LOGIC MỚI] Lấy song song Đơn hàng + Tất cả Suất chiếu
  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, showtimesRes] = await Promise.all([
          role === "user" ? getMyOrders() : getAllOrders(),
          api.get("/showtime") // Gọi API lấy danh sách suất chiếu tổng
      ]);

      setOrders(ordersRes.data);
      setAllShowtimes(showtimesRes.data);
    } catch (err) {
      console.error("❌ Lỗi load data:", err);
    } finally {
      setLoading(false);
    }
  };

  // 👇 [LOGIC MỚI] Map từ danh sách 'allShowtimes' thay vì 'orders'
  const uniqueShowtimes = useMemo(() => {
    // Bước 1: Đếm số lượng đơn hàng cho từng suất chiếu
    const orderCounts = {};
    orders.forEach(order => {
      if (order.showtime && order.showtime._id) {
        const id = order.showtime._id;
        orderCounts[id] = (orderCounts[id] || 0) + 1;
      }
    });

    // Bước 2: Map từ danh sách showtime gốc (để đảm bảo hiện đủ 9 suất)
    const formattedList = allShowtimes.map(st => ({
      id: st._id,
      movieTitle: st.movie?.title || "Phim ?",
      startTime: st.startTime,
      cinemaName: st.cinema?.name || "Rạp ?",
      roomName: st.room?.name || "",
      orderCount: orderCounts[st._id] || 0 // Nếu không có đơn thì là 0
    }));

    // Bước 3: Sắp xếp (Mới nhất lên đầu)
    return formattedList.sort((a, b) => 
      new Date(b.startTime) - new Date(a.startTime)
    );
  }, [orders, allShowtimes]);

  // Helper hiển thị tên trong Dropdown
  const formatDropdownLabel = (st) => {
      const timeStr = new Date(st.startTime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
      const dateStr = new Date(st.startTime).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'});
      // Hiển thị: Avatar (19:30 - 30/01) [5 đơn]
      return `${st.movieTitle} (${timeStr} - ${dateStr}) [${st.orderCount} đơn]`;
  };

  // --- 2. LỌC DANH SÁCH HIỂN THỊ ---
  const filteredOrders = useMemo(() => {
    if (selectedShowtimeId === "ALL") return orders;
    return orders.filter(o => o.showtime?._id === selectedShowtimeId);
  }, [orders, selectedShowtimeId]);


  // ... (Giữ nguyên các hàm xử lý logic cũ) ...
  const handleViewDetail = (order) => {
    setViewingOrder(order);
    setStatus(order.status || "pending");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!viewingOrder) return;
    setLoading(true);
    try {
      await updateOrder(viewingOrder._id, { status: status });
      alert("✅ Cập nhật trạng thái thành công!");
      setViewingOrder(null);
      fetchData(); // Reload lại dữ liệu
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
      fetchData(); // Reload lại dữ liệu
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag className="text-indigo-600" /> Quản lý Đơn Hàng
        </h2>

        {/* --- BỘ LỌC SUẤT CHIẾU (ĐÃ FIX CSS & LOGIC) --- */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm w-full md:w-auto max-w-md">
          <CalendarDays size={20} className="text-indigo-600 shrink-0" />
          <div className="flex flex-col w-full overflow-hidden">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Chọn Suất Chiếu ({uniqueShowtimes.length})
            </span>
            <select
              value={selectedShowtimeId}
              onChange={(e) => setSelectedShowtimeId(e.target.value)}
              className="outline-none text-sm font-bold text-gray-800 bg-transparent cursor-pointer w-full truncate pr-2"
            >
              <option value="ALL">📋 Tất cả ({orders.length} đơn)</option>
              {uniqueShowtimes.map((st) => (
                <option key={st.id} value={st.id}>
                    {/* Nếu 0 đơn thì thêm icon cảnh báo nhẹ */}
                    {st.orderCount === 0 ? "⚠️ " : "✅ "}
                    {formatDropdownLabel(st)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- PHẦN XEM CHI TIẾT (Giữ nguyên UI) --- */}
      {viewingOrder && (
        <div className="bg-white shadow-xl rounded-xl border border-indigo-100 overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Header */}
          <div className="bg-indigo-50 px-6 py-4 flex justify-between items-center border-b border-indigo-100">
            <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
              <Eye size={20} /> Hóa Đơn #{viewingOrder.orderCode || viewingOrder._id.slice(-6).toUpperCase()}
            </h3>
            <button onClick={() => setViewingOrder(null)} className="text-gray-500 hover:text-gray-700 text-sm underline">
              Đóng lại
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cột Trái */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {viewingOrder.user?.name?.charAt(0).toUpperCase() || "K"}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{viewingOrder.user?.name || "Khách vãng lai"}</p>
                  <p className="text-xs text-gray-500">{viewingOrder.user?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(viewingOrder.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Receipt size={14} /> Chi tiết thanh toán</h4>
                <div className="border rounded-lg overflow-hidden text-sm">
                  {/* Vé */}
                  <div className="p-3 bg-white border-b border-gray-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-700 flex items-center gap-2">
                        <Ticket size={16} className="text-blue-500" />
                        Vé xem phim (x{viewingOrder.tickets?.length || viewingOrder.seats?.length || 0})
                      </span>
                      <span className="font-bold text-gray-800">
                        {formatCurrency(viewingOrder.tickets?.length > 0 ? viewingOrder.tickets.reduce((s, t) => s + t.price, 0) : calculateBillDetails(viewingOrder).ticketTotal)}
                      </span>
                    </div>
                    <div className="pl-6 space-y-1">
                      {viewingOrder.tickets && viewingOrder.tickets.length > 0 ? (
                        viewingOrder.tickets.map((t, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-gray-500">
                            <span>Ghế <b className="text-gray-700">{t.seatNumber}</b> {t.type === 'vip' && <span className="text-yellow-600 border border-yellow-200 px-1 rounded bg-yellow-50 text-[10px]">VIP</span>}</span>
                            <span>{formatCurrency(t.price)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span>Ghế: {viewingOrder.seats?.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Combo */}
                  <div className="p-3 bg-white border-b border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-gray-700 flex items-center gap-2"><UtensilsCrossed size={16} className="text-orange-500" /> Bắp nước</span>
                      <span className="font-bold text-gray-800">{formatCurrency(calculateBillDetails(viewingOrder).comboTotal)}</span>
                    </div>
                    {viewingOrder.combos?.length > 0 ? (
                      <div className="pl-6 text-xs text-gray-500 space-y-1">
                        {viewingOrder.combos.map((c, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{c.name} (x{c.quantity})</span>
                            <span>{formatCurrency(c.price * c.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    ) : <div className="pl-6 text-xs text-gray-400 italic">Không có</div>}
                  </div>
                  {/* Tổng */}
                  <div className="bg-indigo-50 p-3 flex justify-between items-center">
                    <span className="font-bold text-indigo-900 uppercase">Tổng thu</span>
                    <span className="text-xl font-extrabold text-red-600">{formatCurrency(viewingOrder.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột Phải: Update Status */}
            <div className="bg-white p-6 rounded-lg border-2 border-dashed border-indigo-200 h-fit">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle className="text-indigo-600" /> Xử lý đơn hàng</h4>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 rounded-lg border-2 font-bold outline-none transition focus:border-indigo-500">
                    <option value="pending">⏳ Chờ thanh toán</option>
                    <option value="success">✅ Đã thanh toán</option>
                    <option value="cancelled">🚫 Đã hủy</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-md transition disabled:bg-gray-300">{loading ? <Loader2 className="animate-spin mx-auto" /> : "Lưu Thay Đổi"}</button>
                  <button type="button" onClick={() => setViewingOrder(null)} className="px-6 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg text-gray-600 transition">Hủy</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- DANH SÁCH ĐƠN HÀNG --- */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            Danh sách Đơn hàng <span className="text-gray-400 text-sm font-normal">({filteredOrders.length})</span>
          </h3>
        </div>

        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition duration-200 flex flex-col md:flex-row gap-5 items-center relative overflow-hidden group">

              {/* Dải màu trạng thái */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'success' ? 'bg-green-500' : order.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>

              <div className="flex-1 w-full space-y-2 pl-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    {/* Poster */}
                    <div className="w-14 h-20 bg-gray-200 rounded overflow-hidden shrink-0 shadow-sm border hidden sm:block group-hover:scale-105 transition-transform duration-300">
                      {order.showtime?.movie?.posterUrl ? (
                        <img src={order.showtime.movie.posterUrl} alt="Poster" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white"><Film size={20} /></div>
                      )}
                    </div>

                    <div>
                      {/* Tên phim + Giờ chiếu */}
                      <h4 className="font-bold text-lg text-gray-900 leading-tight flex flex-col">
                        <span>{order.showtime?.movie?.title || "Phim không xác định"}</span>
                        <span className="text-sm font-normal text-gray-500 flex items-center gap-1 mt-1">
                          <Clock size={14} className="text-indigo-500" />
                          {new Date(order.showtime?.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          <span className="mx-1 text-gray-300">|</span>
                          {new Date(order.showtime?.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </h4>

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded"><MapPin size={12} /> {order.showtime?.room?.name}</span>
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">#{order.orderCode || order._id.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-indigo-600 text-lg">{formatCurrency(order.totalPrice)}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${order.status === 'success' ? 'text-green-600 bg-green-100' :
                        order.status === 'cancelled' ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100'
                      }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút thao tác */}
              <div className="flex gap-2 w-full md:w-auto md:flex-col border-t md:border-t-0 pt-3 md:pt-0">
                <button onClick={() => handleViewDetail(order)} className="flex-1 md:flex-none bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition">
                  <Eye size={16} /> Xem
                </button>
                <button onClick={() => handleDelete(order._id)} className="flex-1 md:flex-none bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition">
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed flex flex-col items-center">
              <Film className="text-gray-300 mb-3" size={48} />
              <p className="text-gray-500 font-medium">Không có đơn hàng nào cho suất chiếu này.</p>
              {selectedShowtimeId !== "ALL" && <button onClick={() => setSelectedShowtimeId("ALL")} className="mt-2 text-indigo-600 text-sm hover:underline">Xem tất cả</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}