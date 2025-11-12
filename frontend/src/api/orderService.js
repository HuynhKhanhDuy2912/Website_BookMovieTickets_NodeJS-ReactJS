import api from "./axiosConfig";

// Lấy danh sách đơn hàng của chính user
export const getMyOrders = () => api.get("/order/my-orders");

// Lấy tất cả đơn hàng (staff/admin)
export const getAllOrders = () => api.get("/order");

// Tạo đơn hàng mới (user)
export const createOrder = (data) => api.post("/order", data);

// Cập nhật đơn hàng (staff/admin)
export const updateOrder = (id, data) => api.put(`/order/${id}`, data);

// Xóa đơn hàng (admin)
export const deleteOrder = (id) => api.delete(`/order/${id}`);
