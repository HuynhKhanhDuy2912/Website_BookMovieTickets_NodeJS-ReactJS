import { useEffect, useState } from "react";
// Giả sử bạn có các API này, nếu chưa hãy tạo thêm trong service
import { 
  getAllTickets, 
  createTicket, 
  updateTicket, 
  deleteTicket 
} from "../../api/ticketService";
import { getAllUsers } from "../../api/userService";       // Import API lấy Users
import { getAllShowtimes } from "../../api/showtimeService"; // Import API lấy Suất chiếu

import { 
  Loader2, Trash2, SquarePen, Ticket, User, 
  Calendar, MapPin, CreditCard, Armchair 
} from "lucide-react";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);         // State lưu danh sách Users
  const [showtimes, setShowtimes] = useState([]); // State lưu danh sách Suất chiếu
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    user: "",       // Sẽ lưu User ID chọn từ Select
    showtime: "",   // Sẽ lưu Showtime ID chọn từ Select
    seats: "",      // Chuỗi "A1, A2"
    totalPrice: 0,
    paymentStatus: "unpaid",
    isManual: true, // Flag đánh dấu vé này do Admin tạo
  });

  // 1. Fetch toàn bộ dữ liệu cần thiết
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Dùng Promise.all để gọi song song cho nhanh
        const [ticketsRes, usersRes, showtimesRes] = await Promise.all([
          getAllTickets(),
          getAllUsers(),
          getAllShowtimes()
        ]);

        setTickets(ticketsRes.data);
        setUsers(usersRes.data || []); // API trả về mảng users
        setShowtimes(showtimesRes.data || []); // API trả về mảng showtimes
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
      }
    };

    fetchAllData();
  }, []);

  // 2. Tự động tính tiền khi thay đổi Ghế hoặc Suất chiếu
  useEffect(() => {
    if (!formData.showtime || !formData.seats) return;

    // Tìm suất chiếu đang chọn để lấy giá vé
    const selectedShowtime = showtimes.find(s => s._id === formData.showtime);
    if (selectedShowtime) {
      const seatCount = formData.seats.split(",").filter(s => s.trim()).length;
      // Giả sử selectedShowtime.price là giá vé gốc
      const price = selectedShowtime.price || 50000; 
      
      setFormData(prev => ({
        ...prev,
        totalPrice: seatCount * price
      }));
    }
  }, [formData.showtime, formData.seats, showtimes]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      user: "", showtime: "", seats: "", totalPrice: 0, paymentStatus: "unpaid", isManual: true
    });
  };

  const handleEdit = (ticket) => {
    // CHẶN: Nếu không phải vé Admin tạo thì không cho sửa (Logic FE)
    // Lưu ý: Backend cần có trường isManual hoặc source: 'offline' để check chính xác
    // Ở đây mình ví dụ: nếu vé có nguồn gốc online (thường user đặt), ta return.
    
    setEditingId(ticket._id);
    setFormData({
      user: ticket.user?._id || ticket.user || "",
      showtime: ticket.showtime?._id || ticket.showtime || "",
      seats: Array.isArray(ticket.seats) ? ticket.seats.map(s => s.name || s).join(", ") : "",
      totalPrice: ticket.totalPrice || 0,
      paymentStatus: ticket.paymentStatus || "unpaid",
      isManual: true
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Chuyển chuỗi ghế thành mảng object hoặc string tùy Backend yêu cầu
    const seatsArray = formData.seats
      ? formData.seats.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      ...formData,
      seats: seatsArray, // Backend cần xử lý mảng này
      totalPrice: Number(formData.totalPrice),
    };

    try {
      if (editingId) {
        await updateTicket(editingId, payload);
        alert("✅ Cập nhật vé thành công!");
      } else {
        await createTicket(payload);
        alert("✅ Tạo vé thành công!");
      }
      resetForm();
      // Reload tickets only
      const { data } = await getAllTickets();
      setTickets(data);
    } catch (err) {
      console.error("Lỗi:", err);
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa vé này?")) return;
    try {
      await deleteTicket(id);
      const { data } = await getAllTickets();
      setTickets(data);
    } catch (err) {
      alert("❌ Không thể xóa vé!");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
        <Ticket className="text-amber-600" /> Quản lý Vé & Đặt Chỗ
      </h2>

      {/* FORM TẠO VÉ (Chỉ dành cho Admin tạo vé thủ công tại quầy) */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border-l-4 border-amber-500">
        <h3 className="text-lg font-semibold mb-4 text-amber-600 flex items-center gap-2">
           <SquarePen size={20}/> {editingId ? "Cập nhật Vé (Admin)" : "Bán Vé Tại Quầy (Admin)"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. SELECT USER */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
               <select
                 name="user"
                 value={formData.user}
                 onChange={handleChange}
                 className="border p-2.5 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                 disabled={!!editingId}
               >
                 <option value="">-- Chọn khách hàng --</option>
                 {users.map(u => (
                   <option key={u._id} value={u._id}>
                     {u.name} ({u.email})
                   </option>
                 ))}
               </select>
            </div>

            {/* 2. SELECT SHOWTIME */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Suất chiếu</label>
               <select
                 name="showtime"
                 value={formData.showtime}
                 onChange={handleChange}
                 className="border p-2.5 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                 disabled={!!editingId}
               >
                 <option value="">-- Chọn suất chiếu --</option>
                 {showtimes.map(s => (
                   <option key={s._id} value={s._id}>
                     {s.movie?.title} - {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({s.room?.name})
                   </option>
                 ))}
               </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* 3. INPUT SEATS */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghế (VD: A1, A2)</label>
                <input
                  name="seats"
                  value={formData.seats}
                  onChange={handleChange}
                  placeholder="Nhập số ghế..."
                  className="border p-2.5 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none"
                />
             </div>
             
             {/* 4. TOTAL PRICE (Auto calculated) */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tổng tiền (Tự động)</label>
                <div className="relative">
                  <input
                    type="number"
                    name="totalPrice"
                    value={formData.totalPrice}
                    readOnly // Chỉ đọc, tự động tính
                    className="border p-2.5 w-full rounded bg-gray-100 font-bold text-gray-700 outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500 text-sm">VNĐ</span>
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thanh toán</label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  className="border p-2.5 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                >
                  <option value="unpaid">Chưa thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                </select>
             </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !formData.user || !formData.showtime}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white p-2.5 rounded shadow-sm font-medium flex justify-center items-center gap-2 transition disabled:bg-gray-300"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {editingId ? "Lưu thay đổi" : "Xuất Vé Ngay"}
            </button>
            {editingId && (
              <button
                type="button"
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition"
                onClick={resetForm}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* DANH SÁCH VÉ */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-800">Lịch sử Đặt Vé ({tickets.length})</h3>
        
        {tickets.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
            <Ticket className="mx-auto text-gray-300 mb-2" size={48} />
            <p className="text-gray-500">Chưa có dữ liệu vé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket) => {
              // LOGIC QUAN TRỌNG: Kiểm tra xem vé này có được phép sửa/xóa không?
              // Nếu Backend không có trường 'source', bạn có thể dựa vào paymentStatus (ví dụ 'paid' online thì không sửa)
              // Hoặc thêm trường 'isManual' vào schema.
              // Ở đây mình giả định: Vé nào có seats dạng string là admin nhập tay, còn User đặt là Array Object (tùy DB của bạn)
              // Cách tốt nhất: Backend trả về field `canEdit: true/false`.
              
              const isClientBooking = !ticket.isManual; // Ví dụ: Giả định DB có trường này
              // Nếu không có trường isManual, bạn có thể tạm thời cho phép xóa nhưng cảnh báo.

              return (
                <div
                  key={ticket._id}
                  className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-4 items-stretch overflow-hidden ${isClientBooking ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-amber-500'}`}
                >
                  {/* Cột trái: Status */}
                  <div className="hidden md:flex flex-col items-center justify-center w-24 bg-gray-50 text-center p-2 border-r">
                     <span className="text-xs font-bold text-gray-400 uppercase mb-1">
                        {isClientBooking ? "Online" : "Tại quầy"}
                     </span>
                     <div className={`p-2 rounded-full mb-1 ${ticket.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {ticket.paymentStatus === 'paid' ? <CreditCard size={20}/> : <Loader2 size={20}/>}
                     </div>
                     <span className={`text-[10px] font-bold uppercase ${ticket.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-500'}`}>
                       {ticket.paymentStatus}
                     </span>
                  </div>

                  {/* Thông tin chính */}
                  <div className="flex-1 py-4 px-2 md:px-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1 pr-4">
                      <h4 className="font-bold text-lg text-gray-900 leading-tight">
                        {ticket.showtime?.movie?.title || "Phim không xác định"}
                      </h4>
                      <p className="font-bold text-amber-600 text-lg whitespace-nowrap ml-2">
                        {formatCurrency(ticket.totalPrice)}
                      </p>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                       <div className="flex items-center gap-2">
                          <User size={14} className="text-blue-500"/> 
                          <span className="font-medium text-gray-800">
                            {ticket.user?.name || ticket.user?.email || "Khách vãng lai"}
                          </span>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                             <Calendar size={14}/> 
                             {ticket.showtime?.startTime ? new Date(ticket.showtime.startTime).toLocaleString('vi-VN') : "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                             <MapPin size={14}/> 
                             {ticket.showtime?.room?.name}
                          </span>
                       </div>
                    </div>

                    {/* Ghế ngồi */}
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded max-w-max">
                       <Armchair size={16} className="text-gray-400"/>
                       <span className="text-sm font-bold text-gray-800">
                         {Array.isArray(ticket.seats) 
                            ? ticket.seats.map(s => s.name || s).join(", ") // Xử lý nếu seats là mảng object hoặc mảng string
                            : ticket.seats || "Chưa chọn ghế"
                         }
                       </span>
                    </div>
                  </div>

                  {/* Actions - Chỉ hiện cho vé Admin tạo hoặc có quyền */}
                  {!isClientBooking && (
                    <div className="flex md:flex-col border-t md:border-t-0 md:border-l w-full md:w-20 divide-x md:divide-x-0 md:divide-y bg-gray-50">
                      <button
                        onClick={() => handleEdit(ticket)}
                        className="flex-1 flex items-center justify-center text-amber-600 hover:bg-amber-100 p-3 transition"
                        title="Sửa vé này"
                      >
                        <SquarePen size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(ticket._id)}
                        className="flex-1 flex items-center justify-center text-red-600 hover:bg-red-100 p-3 transition"
                        title="Xóa vé này"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                  
                  {/* Nếu là vé Online thì hiện label read-only */}
                  {isClientBooking && (
                    <div className="flex md:flex-col border-t md:border-t-0 md:border-l w-full md:w-20 items-center justify-center bg-gray-50 text-gray-400 text-xs text-center p-2">
                       <span className="hidden md:block">Client Booking</span>
                       <span className="md:hidden">Vé Online (Không thể sửa)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}