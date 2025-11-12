import api from "./axiosConfig";

// Lấy tất cả phim
export const getAllMovies = () => api.get("/movie");

// Lấy chi tiết 1 phim theo ID
export const getMovieById = (id) => api.get(`/movie/${id}`);

// Tạo phim mới (chỉ admin/staff)
export const createMovie = (data) => api.post("/movie", data);

// Cập nhật phim (chỉ admin/staff)
export const updateMovie = (id, data) => api.put(`/movie/${id}`, data);

// Xóa phim (chỉ admin)
export const deleteMovie = (id) => api.delete(`/movie/${id}`);
