import api from "../api/axiosConfig"; // Axios config

const BASE_URL = "/user";

export const getAllUsers = () => api.get(BASE_URL);
export const createUser = (data) => api.post(BASE_URL, data);
export const updateUser = (id, data) => api.put(`${BASE_URL}/${id}`, data);
export const deleteUser = (id) => api.delete(`${BASE_URL}/${id}`);