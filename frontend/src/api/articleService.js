import api from "./axiosConfig";

// Lấy tất cả bài viết
export const getAllArticles = () => api.get("/article");

// Lấy chi tiết 1 bài viết
export const getArticleById = (id) => api.get(`/article/${id}`);

// Tạo bài viết (user/staff/admin đều có thể)
export const createArticle = (data) => api.post("/article", data);

// Cập nhật bài viết
export const updateArticle = (id, data) => api.put(`/article/${id}`, data);

// Xóa bài viết
export const deleteArticle = (id) => api.delete(`/article/${id}`);
