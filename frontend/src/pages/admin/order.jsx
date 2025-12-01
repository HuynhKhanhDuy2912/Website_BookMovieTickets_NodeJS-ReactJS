import { useEffect, useState } from "react";
import {
  getMyOrders,
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../../api/orderService";

export default function Orders({ role }) {
  const [orders, setOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Form fields
  const [tickets, setTickets] = useState(""); // Nhập dạng "ticketId1,ticketId2"
  const [combos, setCombos] = useState(""); // Nhập dạng "comboId1,comboId2"
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response =
        role === "user" ? await getMyOrders() : await getAllOrders();
      setOrders(response.data); // <--- nhớ dùng response.data
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đơn hàng:", err);
      alert("❌ Lỗi khi lấy danh sách đơn hàng! Xem console để biết chi tiết.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTickets("");
    setCombos("");
    setTotalAmount("");
    setPaymentMethod("cash");
    setPaymentStatus("unpaid");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      tickets: tickets
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t),
      combos: combos
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c),
      totalAmount: totalAmount ? Number(totalAmount) : 0,
      paymentMethod,
      paymentStatus,
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
      console.error("❌ Lỗi khi tạo/cập nhật đơn hàng:", err.response || err);
      alert(
        "❌ Không thể tạo/cập nhật đơn hàng: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleEdit = (order) => {
    setEditingId(order._id);
    setTickets(order.tickets?.map((t) => t._id || t).join(", ") || "");
    setCombos(order.combos?.map((c) => c._id || c).join(", ") || "");
    setTotalAmount(order.totalAmount || "");
    setPaymentMethod(order.paymentMethod);
    setPaymentStatus(order.paymentStatus);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
    try {
      await deleteOrder(id);
      alert("🗑️ Đã xóa đơn hàng!");
      fetchOrders();
    } catch (err) {
      console.error("❌ Lỗi khi xóa đơn hàng:", err.response || err);
      alert("❌ Không thể xóa đơn hàng!");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Quản lý Đơn hàng</h2>

      {/* Form tạo/cập nhật */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2 border p-4 rounded">
        <input
          type="text"
          placeholder="Tickets (ID, phân cách bằng ,)"
          className="border p-2 w-full"
          value={tickets}
          onChange={(e) => setTickets(e.target.value)}
        />
        <input
          type="text"
          placeholder="Combos (ID, phân cách bằng ,)"
          className="border p-2 w-full"
          value={combos}
          onChange={(e) => setCombos(e.target.value)}
        />
        <input
          type="number"
          placeholder="Tổng tiền"
          className="border p-2 w-full"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
        />
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="cash">Tiền mặt</option>
          <option value="momo">VNPay</option>
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="unpaid">Chưa thanh toán</option>
          <option value="paid">Đã thanh toán</option>
        </select>

        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
          {editingId ? "Cập nhật đơn hàng" : "Tạo đơn hàng"}
        </button>
        {editingId && (
          <button
            type="button"
            className="bg-gray-400 text-white p-2 rounded w-full mt-2"
            onClick={resetForm}
          >
            Hủy
          </button>
        )}
      </form>

      {/* Danh sách đơn hàng */}
      <ul className="space-y-3">
        {orders.map((order) => (
          <li
            key={order._id}
            className="border p-3 rounded flex justify-between items-start gap-4"
          >
            <div>
              <p><strong>Order Code:</strong> {order.orderCode}</p>
              <p><strong>User:</strong> {order.user?.name || order.user}</p>
              <p><strong>Tickets:</strong> {order.tickets?.map((t) => t.name || t).join(", ")}</p>
              <p><strong>Combos:</strong> {order.combos?.map((c) => c.name || c).join(", ")}</p>
              <p><strong>Total Amount:</strong> {order.totalAmount}</p>
              <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
              <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
              <p><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</p>
              <p><strong>Updated At:</strong> {new Date(order.updatedAt).toLocaleString()}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleEdit(order)}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(order._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
