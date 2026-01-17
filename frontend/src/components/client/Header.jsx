import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, LogOut, Ticket, LayoutDashboard } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  // 1. Lấy user từ LocalStorage
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  
  // Check quyền Admin để hiện nút tắt vào trang quản lý
  const isAdmin = user?.role === "admin" || user?.role === 1;

  // 2. Xử lý Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Đăng xuất thành công!");
    navigate("/login");
    window.location.reload();
  };

  // 3. Xử lý Tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      // Điều hướng sang trang tìm kiếm (Bạn sẽ làm trang này sau)
      navigate(`/search?q=${keyword}`); 
    }
  };

  return (
    <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-50 border-b border-gray-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* --- LOGO --- */}
        <Link to="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 tracking-tighter shrink-0">
          POPCORN<span className="text-white">CINEMA</span>
        </Link>

        {/* --- MENU DESKTOP --- */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
          <Link to="/" className="hover:text-yellow-400 transition">Trang Chủ</Link>
          <Link to="/movies" className="hover:text-yellow-400 transition">Phim Đang Chiếu</Link>
          <Link to="/cinemas" className="hover:text-yellow-400 transition">Rạp Chiếu</Link>
          <Link to="/articles" className="hover:text-yellow-400 transition">Tin Tức</Link>
          <Link to="/profile" className="hover:text-yellow-400 transition">Vé của tôi</Link>
        </nav>
        {/* --- USER ACTIONS --- */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Nếu là Admin thì hiện nút vào Dashboard nhanh */}
              {isAdmin && (
                <Link 
                  to="/admin" 
                  title="Vào trang quản lý"
                  className="hidden lg:flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1.5 rounded-full border border-gray-600 transition"
                >
                  <LayoutDashboard size={14} /> Admin
                </Link>
              )}

              <div className="flex items-center gap-2 group relative cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-gray-900">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:block text-sm font-medium max-w-[100px] truncate">
                  {user.name}
                </span>

                {/* Dropdown Menu User */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-sm">
                    <User size={16}/> Hồ sơ cá nhân
                  </Link>
                  <Link to="/profile?tab=history" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-sm">
                    <Ticket size={16}/> Vé của tôi
                  </Link>
                  <div className="border-t my-1"></div>
                  <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 text-sm text-left"
                  >
                    <LogOut size={16}/> Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Link to="/login" className="hover:text-white text-gray-300 transition">Đăng nhập</Link>
              <Link to="/register" className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-1.5 rounded font-bold transition">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}