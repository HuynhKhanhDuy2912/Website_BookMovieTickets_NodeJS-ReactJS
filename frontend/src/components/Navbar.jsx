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
      // Nếu dữ liệu lỗi, xóa đi để tránh lỗi lần sau
      console.error("Dữ liệu user trong localStorage bị lỗi:", error);
      localStorage.removeItem("user");
    }
  }

  const role = user?.role;

  // 2. Kiểm tra xem có phải Admin không (chấp nhận cả số 1 và chữ "admin")
  const isAdmin = role === "admin" || role === 1 || role === "1";

  // 3. Hàm Đăng xuất
  const handleLogout = () => {
    // Xóa token và thông tin user
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Điều hướng về trang đăng nhập
    navigate("/login");
    alert("Đăng xuất thành công!");
    
    // (Tùy chọn) Reload lại trang để Navbar cập nhật lại trạng thái ngay lập tức
    window.location.reload(); 
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
      {/* --- PHẦN MENU BÊN TRÁI --- */}
      <div className="flex gap-4">
        {/* Link Trang chủ ai cũng thấy */}
        <Link to="/" className="hover:text-yellow-400 font-bold text-lg">
          Cinema App
        </Link>

        {/* Chỉ hiện các Menu Quản lý nếu là ADMIN */}
        {isAdmin && (
          <>
            <Link to="/order" className="hover:underline hover:text-gray-300 transition">Order</Link>
            <Link to="/movie" className="hover:underline hover:text-gray-300 transition">Phim</Link>
            <Link to="/combo" className="hover:underline hover:text-gray-300 transition">Combo</Link>
            <Link to="/cinema" className="hover:underline hover:text-gray-300 transition">Rạp</Link>
            <Link to="/articles" className="hover:underline hover:text-gray-300 transition">Bài viết</Link>
            <Link to="/room" className="hover:underline hover:text-gray-300 transition">Phòng chiếu</Link>
            <Link to="/showtime" className="hover:underline hover:text-gray-300 transition">Suất chiếu</Link>
            <Link to="/ticket" className="hover:underline hover:text-gray-300 transition">Vé đặt</Link>
          </>
        )}
      </div>

      {/* --- PHẦN TÀI KHOẢN BÊN PHẢI --- */}
      <div className="flex gap-4 items-center">
        {user ? (
          // Nếu ĐÃ ĐĂNG NHẬP
          <>
            <span className="text-gray-300">
              Xin chào, <span className="font-bold text-white">{user.name}</span>
            </span>
            <button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          // Nếu CHƯA ĐĂNG NHẬP
          <>
            <Link to="/login" className="hover:underline text-gray-300">
              Đăng nhập
            </Link>
            <Link 
              to="/register" 
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white transition"
            >
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}