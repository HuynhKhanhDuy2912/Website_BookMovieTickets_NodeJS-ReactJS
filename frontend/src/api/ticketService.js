import api from "./axiosConfig"; // Import axios instance

const BASE_URL = "/ticket"; // Đảm bảo backend app.use('/api/ticket', ...)

// Lấy tất cả vé (Admin/Staff)
export const getAllTickets = () => api.get(BASE_URL);

// Lấy vé của tôi (Client)
export const getMyTickets = () => api.get(`${BASE_URL}/my-tickets`);

// Lấy chi tiết vé
export const getTicketById = (id) => api.get(`${BASE_URL}/${id}`);

// Tạo vé mới
export const createTicket = (data) => api.post(BASE_URL, data);

// Cập nhật vé
export const updateTicket = (id, data) => api.put(`${BASE_URL}/${id}`, data);

// Xóa vé
export const deleteTicket = (id) => api.delete(`${BASE_URL}/${id}`);