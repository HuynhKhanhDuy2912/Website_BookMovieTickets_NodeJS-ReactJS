import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // chỉnh nếu backend của bạn chạy port khác
});

// 🧠 Thêm interceptor để tự động gửi token cho mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
