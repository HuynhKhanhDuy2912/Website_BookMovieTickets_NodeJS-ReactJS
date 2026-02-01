import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Clapperboard, 
  UtensilsCrossed, // Đổi sang icon dao nĩa chéo nhìn đẹp hơn cho Combo
  Building2,       // Đổi sang icon tòa nhà cho Rạp (thay vì MapPin)
  Newspaper, 
  MonitorPlay, 
  CalendarClock, 
  Ticket, 
  Users, 
  LogOut, 
  Home,
  MessageSquareText // Icon tin nhắn cho mục Liên hệ/Chat
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Danh sách menu đã cập nhật icon
  const menuItems = [
    { path: "/admin/dashboard", label: "Báo cáo thống kê", icon: <LayoutDashboard size={20} /> },    
    { path: "/admin/movie", label: "Quản lý Phim", icon: <Clapperboard size={20} /> },
    { path: "/admin/combo", label: "Quản lý Combo", icon: <UtensilsCrossed size={20} /> }, // Icon mới
    { path: "/admin/cinema", label: "Quản lý Rạp", icon: <Building2 size={20} /> },        // Icon mới
    { path: "/admin/articles", label: "Tin tức & Sự kiện", icon: <Newspaper size={20} /> },
    { path: "/admin/room", label: "Quản lý Phòng chiếu", icon: <MonitorPlay size={20} /> },
    { path: "/admin/showtime", label: "Quản lý Suất chiếu", icon: <CalendarClock size={20} /> },
    { path: "/admin/ticket", label: "Quản lý Vé đặt", icon: <Ticket size={20} /> },
    { path: "/admin/order", label: "Quản lý Đơn hàng", icon: <ShoppingBag size={20} /> },
    { path: "/admin/user", label: "Quản lý Tài khoản", icon: <Users size={20} /> },
    { path: "/admin/adminChat", label: "Hỗ trợ khách hàng", icon: <MessageSquareText size={20} /> }, // Icon mới & Đổi tên label cho hay hơn
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
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg border-2 border-blue-400">
          {user?.name?.charAt(0).toUpperCase() || "A"}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold truncate text-gray-100">{user?.name || "Admin"}</p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-xs text-gray-400">Online</p>
          </div>
        </div>
      </div>

      {/* --- MENU LIST --- */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
        
        {/* Nút về trang chủ Client */}
        <Link 
          to="/" 
          className="flex items-center gap-3 px-6 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200 group"
        >
          <Home size={20} className="group-hover:text-blue-400 transition-colors"/>
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
              className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 border-l-4 ${
                isActive 
                  ? "bg-gray-800 text-white border-yellow-500" 
                  : "border-transparent text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-600"
              }`}
            >
              <span className={isActive ? "text-yellow-500" : ""}>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* --- FOOTER SIDEBAR --- */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-400 bg-gray-800 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}