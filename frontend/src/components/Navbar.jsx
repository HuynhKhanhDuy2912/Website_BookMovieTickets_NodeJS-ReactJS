import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  // 1. Lấy thông tin User từ LocalStorage
  const userString = localStorage.getItem("user");
  let user = null;

  if (userString && userString !== "undefined") {
    try {
      user = JSON.parse(userString);
    } catch (error) {
      console.error("Dữ liệu user trong localStorage bị lỗi:", error);
      localStorage.removeItem("user");
    }
  }

  const role = user?.role;

  // 2. Kiểm tra Admin
  const isAdmin = role === "admin" || role === 1 || role === "1";

  // 3. Hàm Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    alert("Đăng xuất thành công!");
    window.location.reload();
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-50">
      {/* --- PHẦN MENU BÊN TRÁI --- */}
      <div className="flex gap-6 items-center">
        {/* LOGO */}
        <Link to="/" className="hover:text-yellow-400 font-bold text-xl flex items-center gap-2">
           🎬 Cinema App
        </Link>

        {/* --- LINK VỀ TRANG CLIENT (MỚI THÊM) --- */}
        <Link 
          to="/" 
          className="text-gray-300 hover:text-white font-medium border-b-2 border-transparent hover:border-yellow-400 transition"
        >
          Trang chủ
        </Link>

        {/* MENU ADMIN (Chỉ hiện khi là Admin) */}
        {isAdmin && (
          <div className="hidden md:flex gap-3 text-sm font-medium border-l border-gray-600 pl-4 ml-2">
            <Link to="/admin/order" className="hover:text-yellow-300 transition">Order</Link>
            <Link to="/admin/movie" className="hover:text-yellow-300 transition">Phim</Link>
            <Link to="/admin/combo" className="hover:text-yellow-300 transition">Combo</Link>
            <Link to="/admin/cinema" className="hover:text-yellow-300 transition">Rạp</Link>
            <Link to="/admin/articles" className="hover:text-yellow-300 transition">Bài viết</Link>
            <Link to="/admin/room" className="hover:text-yellow-300 transition">Phòng</Link>
            <Link to="/admin/showtime" className="hover:text-yellow-300 transition">Suất chiếu</Link>
            <Link to="/admin/ticket" className="hover:text-yellow-300 transition">Vé</Link>
            <Link to="/admin/user" className="hover:text-yellow-300 transition">Tài khoản</Link>
            <Link to="/admin/adminChat" className="hover:text-yellow-300 transition">Liên hệ</Link>
          </div>
        )}
      </div>

      {/* --- PHẦN TÀI KHOẢN BÊN PHẢI --- */}
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <span className="text-gray-300 hidden sm:inline">
              Xin chào, <span className="font-bold text-white">{user.name}</span>
            </span>
            <button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm transition font-medium"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline text-gray-300 font-medium">
              Đăng nhập
            </Link>
            <Link 
              to="/register" 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded text-white transition font-medium"
            >
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}