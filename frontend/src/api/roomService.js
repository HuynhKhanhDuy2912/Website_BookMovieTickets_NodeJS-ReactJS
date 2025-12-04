import axios from "axios";

const API_URL = "http://localhost:5000/api/room"; 


const getAuthConfig = () => {
  // Lấy token từ localStorage (Hãy đảm bảo key 'token' trùng với lúc bạn lưu khi login)
  const token = localStorage.getItem("token"); 
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// 1. Lấy danh sách tất cả phòng
// Method: GET /api/rooms
export const getAllRooms = () => {
  return axios.get(API_URL);
};

// 2. Lấy chi tiết phòng theo ID
// Method: GET /api/rooms/:id
export const getRoomById = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

// 3. Tạo phòng mới
// Method: POST /api/rooms
// Yêu cầu: Token + Admin role
export const createRoom = (data) => {
  return axios.post(API_URL, data, getAuthConfig());
};

// 4. Cập nhật phòng
// Method: PUT /api/rooms/:id
// Yêu cầu: Token + Admin role
export const updateRoom = (id, data) => {
  return axios.put(`${API_URL}/${id}`, data, getAuthConfig());
};

// 5. Xóa phòng
// Method: DELETE /api/rooms/:id
// Yêu cầu: Token + Admin role
export const deleteRoom = (id) => {
  return axios.delete(`${API_URL}/${id}`, getAuthConfig());
};