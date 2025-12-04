import api from "./axiosConfig"; // Import axios instance đã cấu hình

const BASE_URL = "/showtime"; // Đảm bảo khớp với server.js (app.use('/api/showtime', ...))

// Lấy tất cả suất chiếu
export const getAllShowtimes = () => api.get(BASE_URL);

// Lấy chi tiết suất chiếu
export const getShowtimeById = (id) => api.get(`${BASE_URL}/${id}`);

// Thêm suất chiếu
export const createShowtime = (data) => api.post(BASE_URL, data);

// Cập nhật suất chiếu
export const updateShowtime = (id, data) => api.put(`${BASE_URL}/${id}`, data);

// Xóa suất chiếu
export const deleteShowtime = (id) => api.delete(`${BASE_URL}/${id}`);

// Lấy suất chiếu theo Phim
export const getShowtimesByMovie = (movieId) => api.get(`${BASE_URL}/movie/${movieId}`);

// Lấy suất chiếu theo Rạp
export const getShowtimesByCinema = (cinemaId) => api.get(`${BASE_URL}/cinema/${cinemaId}`);