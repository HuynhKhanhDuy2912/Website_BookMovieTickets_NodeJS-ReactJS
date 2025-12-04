import { useEffect, useState } from "react";
import {
  getMyOrders,
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../../api/orderService";
import { 
  Loader2, 
  Trash2, 
  SquarePen, 
  ShoppingBag, 
  CreditCard, 
  User, 
  Calendar,
  Ticket,
  UtensilsCrossed
} from "lucide-react";

export default function Orders({ role }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Gom nhóm state form
  const [formData, setFormData] = useState({
    tickets: "", // Nhập chuỗi ID
    combos: "",  // Nhập chuỗi ID
    totalAmount: "",
    paymentMethod: "cash",
    paymentStatus: "unpaid",
  });

  useEffect(() => {
    fetchOrders();
  }, [role]);

  const fetchOrders = async () => {
    try {
      const response = role === "user" ? await getMyOrders() : await getAllOrders();
      setOrders(response.data);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đơn hàng:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      tickets: "",
      combos: "",
      totalAmount: "",
      paymentMethod: "cash",
      paymentStatus: "unpaid",
    });
  };

  const handleEdit = (order) => {
    setEditingId(order._id);
    setFormData({
      tickets: order.tickets?.map((t) => t._id || t).join(", ") || "",
      combos: order.combos?.map((c) => c._id || c).join(", ") || "",
      totalAmount: order.totalAmount || "",
      paymentMethod: order.paymentMethod || "cash",
      paymentStatus: order.paymentStatus || "unpaid",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      tickets: formData.tickets ? formData.tickets.split(",").map((t) => t.trim()).filter(Boolean) : [],
      combos: formData.combos ? formData.combos.split(",").map((c) => c.trim()).filter(Boolean) : [],
      totalAmount: formData.totalAmount ? Number(formData.totalAmount) : 0,
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
    };

    try {
      if (editingId) {
        await updateOrder(editingId, payload);
        alert("✅ Cập nhật đơn hàng thành công!");
      } else {
        await createOrder(payload);
        alert("✅ Tạo đơn hàng thành công!");
      }
      resetForm();
      fetchOrders();
    } catch (err) {
      console.error("Lỗi:", err);
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
    try {
      await deleteOrder(id);
      fetchOrders();
    } catch (err) {
      alert("❌ Không thể xóa đơn hàng!");
    }
  };

  // Helper format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
        <ShoppingBag className="text-indigo-600" /> Quản lý Đơn Hàng
      </h2>

      {/* Form Order - Indigo Theme */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-indigo-100">
        <h3 className="text-lg font-semibold mb-4 text-indigo-600">
          {editingId ? "Cập nhật Đơn Hàng" : "Tạo Đơn Hàng Mới"}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Danh sách Tickets (ID)</label>
               <div className="relative">
                 <Ticket className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                 <input
                   name="tickets"
                   value={formData.tickets}
                   onChange={handleChange}
                   placeholder="ID1, ID2..."
                   className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                 />
               </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Danh sách Combos (ID)</label>
               <div className="relative">
                 <UtensilsCrossed className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                 <input
                   name="combos"
                   value={formData.combos}
                   onChange={handleChange}
                   placeholder="ID1, ID2..."
                   className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                 />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tổng tiền (VNĐ)</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                placeholder="0"
                className="border p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức TT</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="border p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="cash">Tiền mặt (Cash)</option>
                <option value="momo">Ví điện tử (Momo/VNPay)</option>
                <option value="card">Thẻ (Card)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="border p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="unpaid">Chưa thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded font-medium flex justify-center items-center gap-2 transition disabled:bg-indigo-300"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {editingId ? "Cập nhật Đơn" : "Tạo Đơn"}
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

      {/* Danh sách Đơn hàng */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách Đơn hàng ({orders.length})</h3>
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white border p-4 rounded-lg shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-4 items-start"
            >
              {/* Cột thông tin chính */}
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-2">
                   <div>
                      <p className="font-bold text-gray-800 text-lg">
                        #{order.orderCode || order._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <User size={14}/> {order.user?.name || "Khách vãng lai"}
                      </p>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-indigo-600 text-lg">{formatCurrency(order.totalAmount)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                        order.paymentStatus === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                         order.paymentStatus === 'cancelled' ? 'Đã hủy' : 'Chưa thanh toán'}
                      </span>
                   </div>
                </div>

                <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 space-y-1 mb-3 border border-gray-100">
                   <p className="flex items-start gap-2">
                      <Ticket size={16} className="mt-0.5 text-indigo-400"/> 
                      <span className="font-medium">Vé:</span> 
                      {order.tickets?.length > 0 ? order.tickets.map(t => t.name || t._id || "Vé").join(", ") : <span className="text-gray-400 italic">Không có</span>}
                   </p>
                   <p className="flex items-start gap-2">
                      <UtensilsCrossed size={16} className="mt-0.5 text-orange-400"/> 
                      <span className="font-medium">Combo:</span> 
                      {order.combos?.length > 0 ? order.combos.map(c => c.name || c._id || "Combo").join(", ") : <span className="text-gray-400 italic">Không có</span>}
                   </p>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                   <span className="flex items-center gap-1"><CreditCard size={12}/> TT: {order.paymentMethod.toUpperCase()}</span>
                   <span className="flex items-center gap-1"><Calendar size={12}/> Tạo: {new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Cột thao tác */}
              <div className="flex md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                <button
                  onClick={() => handleEdit(order)}
                  className="flex-1 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1 transition"
                >
                  <SquarePen size={16} /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(order._id)}
                  className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1 transition"
                >
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-gray-500 text-center py-6">Chưa có đơn hàng nào.</p>}
        </div>
      </div>
    </div>
  );
}