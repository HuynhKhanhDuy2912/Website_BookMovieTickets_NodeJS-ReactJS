import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Clapperboard, 
  Utensils, 
  MapPin, 
  Newspaper, 
  MonitorPlay, 
  CalendarClock, 
  Ticket, 
  Users, 
  LogOut, 
  Home
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation(); // Để kiểm tra đang ở trang nào và highlight

  // 1. Lấy user từ LocalStorage
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  // 2. Hàm Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    alert("Đăng xuất thành công!");
    window.location.reload();
  };

  // Danh sách menu để map cho gọn
  const menuItems = [
    { path: "/admin/dashboard", label: "Báo cáo thống kê", icon: <LayoutDashboard size={20} /> },    
    { path: "/admin/movie", label: "Quản lý Phim", icon: <Clapperboard size={20} /> },
    { path: "/admin/combo", label: "Quản lý Combo", icon: <Utensils size={20} /> },
    { path: "/admin/cinema", label: "Quản lý Rạp", icon: <MapPin size={20} /> },
    { path: "/admin/articles", label: "Tin tức & Sự kiện", icon: <Newspaper size={20} /> },
    { path: "/admin/room", label: "Quản lý Phòng chiếu", icon: <MonitorPlay size={20} /> },
    { path: "/admin/showtime", label: "Quản lý Suất chiếu", icon: <CalendarClock size={20} /> },
    { path: "/admin/ticket", label: "Quản lý Vé đặt", icon: <Ticket size={20} /> },
    { path: "/admin/order", label: "Quản lý Đơn hàng", icon: <ShoppingBag size={20} /> },
    { path: "/admin/user", label: "Quản lý Tài khoản", icon: <Users size={20} /> },
    { path: "/admin/adminChat", label: "Quản lý Liên hệ", icon: <Users size={20} /> },

  ];

  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0 shadow-xl z-50">
      
      {/* --- HEADER SIDEBAR --- */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800">
        <Link to="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 tracking-tighter shrink-0">
          POPCORN<span className="text-white">CINEMA</span>
        </Link>
      </div>

      {/* --- USER INFO NHỎ --- */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
          {user?.name?.charAt(0).toUpperCase() || "A"}
        </div>
        <div>
          <p className="text-sm font-semibold truncate w-32">{user?.name}</p>
          <p className="text-xs text-green-400">● Online</p>
        </div>
      </div>

      {/* --- MENU LIST --- */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        
        {/* Nút về trang chủ Client */}
        <Link 
          to="/" 
          className="flex items-center gap-3 px-6 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Home size={20} />
          <span className="font-medium">Trang chủ Client</span>
        </Link>

        <div className="border-t border-gray-800 my-2 mx-4"></div>

        {/* Các mục quản lý */}
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive 
                  ? "bg-blue-600 text-white border-r-4 border-yellow-400" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* --- FOOTER SIDEBAR --- */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-gray-800 rounded transition"
        >
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}