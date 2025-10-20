// src/api/cinemaApi.js

const BASE_URL = "http://localhost:5000/api";

// 🧱 Hàm đăng nhập
export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Đăng nhập thất bại");
  return res.json(); // trả về token, user, v.v.
}

// 🧱 Lấy tất cả rạp
export async function getCinemas() {
  const res = await fetch(`${BASE_URL}/cinemas`);
  if (!res.ok) throw new Error("Không lấy được danh sách rạp");
  return res.json();
}

// 🧱 Thêm rạp (cần token admin)
export async function createCinema(cinemaData, token) {
  const res = await fetch(`${BASE_URL}/cinemas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cinemaData),
  });

  if (!res.ok) throw new Error("Không thể thêm rạp");
  return res.json();
}

// 🧱 Cập nhật rạp
export async function updateCinema(id, cinemaData, token) {
  const res = await fetch(`${BASE_URL}/cinemas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cinemaData),
  });

  if (!res.ok) throw new Error("Không thể cập nhật rạp");
  return res.json();
}

// 🧱 Xóa rạp
export async function deleteCinema(id, token) {
  const res = await fetch(`${BASE_URL}/cinemas/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Không thể xóa rạp");
  return res.json();
}
