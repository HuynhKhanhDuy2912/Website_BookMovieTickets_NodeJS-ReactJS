import api from "../api/axiosConfig"; // Axios config

const BASE_URL = "/user";

export const getAllUsers = () => api.get(BASE_URL);
export const createUser = (data) => api.post(BASE_URL, data);
export const updateUser = (id, data) => api.put(`${BASE_URL}/${id}`, data);
export const deleteUser = (id) => api.delete(`${BASE_URL}/${id}`);
export const toggleBlockUser = (id) => api.put(`/user/block/${id}`);
export const changePassword = (data) => api.put(`${BASE_URL}/change-password`, data);
export const updateProfile = (data) => api.put(`${BASE_URL}/update-profile`, data);
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("image", file); // Key 'image' phải khớp với cấu hình Multer ở Backend
  
  // Gọi API upload (thường là /api/upload)
  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  
  // Trả về đường dẫn ảnh từ server
  return response.data.imageUrl; 
};