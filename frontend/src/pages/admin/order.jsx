import { useEffect, useState } from "react";
import {
  getMyOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
} from "../../api/orderService";
import { 
  Loader2, Trash2, Eye, ShoppingBag, 
  CreditCard, User, Calendar, Ticket, UtensilsCrossed, CheckCircle
} from "lucide-react";

export default function Orders({ role }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null); // Thay đổi: Chỉ dùng để xem/update status

  // Form State (Chỉ dùng để Update Status)
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    fetchOrders();
  }, [role]);

  const fetchOrders = async () => {
    try {
      const response = role === "user" ? await getMyOrders() : await getAllOrders();
      setOrders(response.data);
    } catch (err) {
      console.error("❌ Lỗi load orders:", err);
    }
  };

  // Hàm mở xem chi tiết & Cập nhật trạng thái
  const handleViewDetail = (order) => {
    setViewingOrder(order);
    setStatus(order.status || "pending"); // Load status hiện tại lên form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!viewingOrder) return;
    setLoading(true);

    try {
      // Chỉ gửi mỗi status lên server để update
      await updateOrder(viewingOrder._id, { status: status });
      alert("✅ Cập nhật trạng thái thành công!");
      setViewingOrder(null); // Đóng form
      fetchOrders(); // Reload list
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
      fetchOrders();
    } catch (err) {
      alert("❌ Không thể xóa!");
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 đ";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
        <ShoppingBag className="text-indigo-600" /> Quản lý Đơn Hàng
      </h2>

      {/* --- PHẦN XEM CHI TIẾT & CẬP NHẬT TRẠNG THÁI --- */}
      {viewingOrder && (
        <div className="bg-white shadow-xl rounded-xl border border-indigo-100 overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Header Form */}
            <div className="bg-indigo-50 px-6 py-4 flex justify-between items-center border-b border-indigo-100">
                <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                    <Eye size={20}/> Chi Tiết Đơn Hàng #{viewingOrder.orderCode || viewingOrder._id.slice(-6).toUpperCase()}
                </h3>
                <button onClick={() => setViewingOrder(null)} className="text-gray-500 hover:text-gray-700 text-sm underline">
                    Đóng lại
                </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cột Trái: Thông tin vé cố định (Read-Only) */}
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Thông tin khách hàng</label>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600"><User size={20}/></div>
                            <div>
                                <p className="font-bold text-gray-800">{viewingOrder.user?.name || "Khách vãng lai"}</p>
                                <p className="text-xs text-gray-500">{viewingOrder.user?.email}</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 mt-3 pt-3 border-t border-gray-200">
                            <p><span className="font-semibold">Ngày đặt:</span> {new Date(viewingOrder.createdAt).toLocaleString('vi-VN')}</p>
                            <p><span className="font-semibold">Thanh toán:</span> {viewingOrder.paymentMethod}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Chi tiết vé & Combo</label>
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-indigo-50 p-2 text-sm font-semibold text-indigo-700 flex justify-between">
                                <span>Loại</span>
                                <span>Chi tiết</span>
                            </div>
                            <div className="p-3 bg-white space-y-3">
                                {/* Vé */}
                                <div className="flex items-start gap-3">
                                    <Ticket size={18} className="text-indigo-500 mt-0.5"/>
                                    <div>
                                        <p className="font-bold text-gray-800">Vé xem phim</p>
                                        <p className="text-sm text-gray-600">
                                            Ghế: <span className="font-bold text-indigo-600">{viewingOrder.seats?.join(", ") || "Không có"}</span>
                                        </p>
                                    </div>
                                </div>
                                {/* Combo */}
                                <div className="flex items-start gap-3 pt-2 border-t border-dashed">
                                    <UtensilsCrossed size={18} className="text-orange-500 mt-0.5"/>
                                    <div className="w-full">
                                        <p className="font-bold text-gray-800">Bắp nước</p>
                                        {viewingOrder.combos?.length > 0 ? (
                                            <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                                {viewingOrder.combos.map((c, idx) => (
                                                    <li key={idx} className="flex justify-between">
                                                        <span>• {c.name || c.comboId?.name} (x{c.quantity})</span>
                                                        <span className="font-medium text-gray-400">{formatCurrency((c.price || 0) * (c.quantity || 1))}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-sm text-gray-400 italic">Không chọn combo</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-100 p-3 flex justify-between items-center font-bold text-gray-800 border-t">
                                <span>TỔNG TIỀN</span>
                                <span className="text-lg text-red-600">{formatCurrency(viewingOrder.totalPrice)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cột Phải: Form Cập nhật trạng thái */}
                <div className="bg-white p-6 rounded-lg border-2 border-dashed border-indigo-200 h-fit">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="text-indigo-600"/> Cập nhật Trạng thái
                    </h4>
                    <form onSubmit={handleUpdateStatus} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái hiện tại</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={`w-full p-3 rounded-lg border-2 font-bold outline-none transition ${
                                    status === 'success' ? 'border-green-500 text-green-700 bg-green-50' : 
                                    status === 'cancelled' ? 'border-red-500 text-red-700 bg-red-50' : 
                                    'border-yellow-500 text-yellow-700 bg-yellow-50'
                                }`}
                            >
                                <option value="pending">⏳ Chờ xử lý (Pending)</option>
                                <option value="success">✅ Đã thanh toán (Success)</option>
                                <option value="cancelled">🚫 Đã hủy (Cancelled)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                * Lưu ý: Chỉ cập nhật trạng thái khi đã nhận tiền hoặc khách hủy vé. Không thể sửa chi tiết vé đã đặt.
                            </p>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-indigo-200 transition transform active:scale-95 disabled:bg-gray-400"
                            >
                                {loading ? <Loader2 className="animate-spin mx-auto" /> : "Lưu Trạng Thái"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewingOrder(null)}
                                className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg transition"
                            >
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* --- DANH SÁCH ĐƠN HÀNG --- */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách Đơn hàng ({orders.length})</h3>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition duration-200 flex flex-col md:flex-row gap-5 items-center">
              
              {/* Thông tin tóm tắt */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          order.status === 'success' ? 'bg-green-500' : order.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}>
                          {order.user?.name?.charAt(0).toUpperCase() || "K"}
                      </div>
                      <div>
                          <p className="font-bold text-gray-800">#{order.orderCode || order._id.slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-indigo-600">{formatCurrency(order.totalPrice)}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          order.status === 'success' ? 'text-green-600 bg-green-100' : 
                          order.status === 'cancelled' ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100'
                      }`}>
                          {order.status}
                      </span>
                   </div>
                </div>
              </div>

              {/* Nút thao tác */}
              <div className="flex gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                <button 
                    onClick={() => handleViewDetail(order)} 
                    className="flex-1 md:flex-none bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                >
                  <Eye size={16} /> Xem & Xử lý
                </button>
                <button 
                    onClick={() => handleDelete(order._id)} 
                    className="flex-1 md:flex-none bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                >
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-gray-500 text-center py-10 bg-gray-50 rounded-lg border border-dashed">Chưa có đơn hàng nào.</p>}
        </div>
      </div>
    </div>
  );
}