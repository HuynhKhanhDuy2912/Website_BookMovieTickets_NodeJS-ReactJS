import api from "./axiosConfig";

export const getAllCombos = () => api.get("/combo");
export const getComboById = (id) => api.get(`/combo/${id}`);
export const createCombo = (data) => api.post("/combo", data);
export const updateCombo = (id, data) => api.put(`/combo/${id}`, data);
export const deleteCombo = (id) => api.delete(`/combo/${id}`);
