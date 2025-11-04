import api from "./axiosConfig";

// Lấy tất cả rạp
export const getAllCinemas = () => api.get("/cinema");

// Lấy chi tiết 1 rạp
export const getCinemaById = (id) => api.get(`/cinema/${id}`);

// Tạo mới rạp (chỉ admin)
export const createCinema = (data) => api.post("/cinema", data);

// Cập nhật rạp (chỉ admin)
export const updateCinema = (id, data) => api.put(`/cinema/${id}`, data);

// Xóa rạp (chỉ admin)
export const deleteCinema = (id) => api.delete(`/cinema/${id}`);
