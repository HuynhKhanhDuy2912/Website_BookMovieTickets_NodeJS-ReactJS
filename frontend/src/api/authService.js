import api from "./axiosConfig";

//Gọi API đăng ký:
export const registerUser = (name, email, password) =>
    api.post("/auth/register", {name, email, password});

//Gọi API đăng nhập:
export const loginUser = (email, password) =>
    api.post("/auth/login", {email, password});