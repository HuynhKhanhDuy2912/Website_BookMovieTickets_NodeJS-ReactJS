import { useEffect, useState } from "react";
import {
  getAllTickets,
  createTicket,
  updateTicket,
  deleteTicket,
} from "../../api/ticketService";
import { 
  Loader2, 
  Trash2, 
  SquarePen, 
  Ticket, 
  User, 
  Calendar, 
  MapPin, 
  CreditCard 
} from "lucide-react";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    user: "",       // Nhập User ID
    showtime: "",   // Nhập Showtime ID
    seats: "",      // Nhập chuỗi "A1, A2"
    totalPrice: "",
    paymentStatus: "unpaid",
  });

  // Fetch dữ liệu
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data } = await getAllTickets();
      setTickets(data);
    } catch (err) {
      console.error("❌ Lỗi tải danh sách vé:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      user: "",
      showtime: "",
      seats: "",
      totalPrice: "",
      paymentStatus: "unpaid",
    });
  };

  const handleEdit = (ticket) => {
    setEditingId(ticket._id);
    setFormData({
      user: ticket.user?._id || ticket.user || "",
      showtime: ticket.showtime?._id || ticket.showtime || "",
      seats: ticket.seats ? ticket.seats.join(", ") : "",
      totalPrice: ticket.totalPrice || 0,
      paymentStatus: ticket.paymentStatus || "unpaid",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Chuyển chuỗi ghế thành mảng
    const seatsArray = formData.seats
      ? formData.seats.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      ...formData,
      seats: seatsArray,
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
      fetchTickets();
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
      fetchTickets();
    } catch (err) {
      alert("❌ Không thể xóa vé!");
    }
  };

  // Helper: Format tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
        <Ticket className="text-amber-600" /> Quản lý Vé Đặt (Tickets)
      </h2>

      {/* Form Ticket - Amber Theme */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-amber-100">
        <h3 className="text-lg font-semibold mb-4 text-amber-600">
          {editingId ? "Cập nhật Thông Tin Vé" : "Tạo Vé Thủ Công"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
               <input
                 name="user"
                 value={formData.user}
                 onChange={handleChange}
                 placeholder="Nhập ID người dùng..."
                 className="border p-2 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none"
                 // Nếu đang edit thì thường không cho sửa User/Showtime để tránh lỗi logic, tùy bạn chọn
                 disabled={!!editingId} 
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Showtime ID</label>
               <input
                 name="showtime"
                 value={formData.showtime}
                 onChange={handleChange}
                 placeholder="Nhập ID suất chiếu..."
                 className="border p-2 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none"
                 disabled={!!editingId}
               />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghế (Seats)</label>
                <input
                  name="seats"
                  value={formData.seats}
                  onChange={handleChange}
                  placeholder="A1, A2, B5..."
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tổng tiền (VNĐ)</label>
                <input
                  type="number"
                  name="totalPrice"
                  value={formData.totalPrice}
                  onChange={handleChange}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái TT</label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none"
                >
                  <option value="unpaid">Chưa thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                </select>
             </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white p-2 rounded font-medium flex justify-center items-center gap-2 transition disabled:bg-amber-300"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {editingId ? "Cập nhật Vé" : "Tạo Vé"}
            </button>
            {editingId && (
              <button
                type="button"
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition"
                onClick={resetForm}
                disabled={loading}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Danh sách Vé */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách Vé ({tickets.length})</h3>
        
        {tickets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có vé nào được đặt.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="bg-white border p-4 rounded-lg shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-4 items-start"
              >
                {/* Icon Vé trang trí */}
                <div className="hidden md:flex flex-col items-center justify-center w-20 h-24 bg-amber-50 rounded border border-amber-100 text-amber-500">
                   <Ticket size={32} />
                   <span className="text-[10px] font-bold mt-1 uppercase">{ticket.paymentStatus}</span>
                </div>

                {/* Thông tin chính */}
                <div className="flex-1 w-full">
                   <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-gray-900">
                        {ticket.showtime?.movie?.title || "Phim không xác định"}
                      </h4>
                      <p className="font-bold text-amber-600 text-lg">
                        {formatCurrency(ticket.totalPrice)}
                      </p>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                      <p className="flex items-center gap-2">
                         <MapPin size={14} className="text-gray-400"/>
                         {ticket.showtime?.cinema?.name} - {ticket.showtime?.room?.name}
                      </p>
                      <p className="flex items-center gap-2">
                         <Calendar size={14} className="text-gray-400"/>
                         {ticket.showtime?.startTime ? new Date(ticket.showtime.startTime).toLocaleString('vi-VN') : "N/A"}
                      </p>
                      <p className="flex items-center gap-2">
                         <User size={14} className="text-gray-400"/>
                         {ticket.user?.name || ticket.user?.email || "User ẩn"}
                      </p>
                      <p className="flex items-center gap-2">
                         <CreditCard size={14} className="text-gray-400"/>
                         <span className={`font-semibold ${ticket.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-500'}`}>
                            {ticket.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                         </span>
                      </p>
                   </div>

                   <div className="bg-gray-50 p-2 rounded border border-gray-100 text-sm">
                      <span className="font-semibold text-gray-700">Ghế đặt: </span>
                      {ticket.seats && ticket.seats.length > 0 ? (
                        <span className="font-bold text-gray-900 tracking-wider">{ticket.seats.join(", ")}</span>
                      ) : (
                        <span className="italic text-gray-400">Chưa chọn ghế</span>
                      )}
                   </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                  <button
                    onClick={() => handleEdit(ticket)}
                    className="flex-1 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1 transition"
                  >
                    <SquarePen size={16} /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(ticket._id)}
                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1 transition"
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}