import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { 
  User, Lock, Ticket, Camera, Save, LogOut, 
  MapPin, Calendar, Clock, PlayCircle, CheckCircle, QrCode, 
  Utensils, Armchair, History
} from "lucide-react";

// --- HELPER ẢNH ---
const getImageUrl = (imageField) => {
  if (!imageField) return "https://ui-avatars.com/api/?name=User&background=random";
  if (typeof imageField === 'object' && imageField !== null) return imageField.secure_url || imageField.url;
  if (typeof imageField === 'string') {
    if (imageField.startsWith("http")) return imageField;
    return `http://localhost:5000/${imageField.replace(/\\/g, '/').replace(/^\//, '')}`;
  }
  return "https://ui-avatars.com/api/?name=User&background=random";
};

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'password' | 'tickets'
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  
  // State User Info
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: ""
  });

  // State Password
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // --- 1. LOAD DATA ---
  useEffect(() => {
    fetchProfile();
    fetchOrders();
  }, []);

  const fetchProfile = async () => {
    try {
        // Giả sử API lấy info là /users/profile hoặc lấy từ localStorage
        // Ở đây mình lấy từ localStorage cho nhanh, bạn có thể thay bằng API call
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
            setUser({
                name: storedUser.name || "",
                email: storedUser.email || "",
                phone: storedUser.phone || "",
                avatar: storedUser.avatar || ""
            });
        }
    } catch (err) {
        console.error("Lỗi tải hồ sơ", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get("/order/my-orders");
      setOrders(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error("Lỗi tải vé:", err);
    }
  };

  // --- 2. HANDLERS ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        // Gọi API cập nhật (thay đường dẫn API của bạn vào đây)
        await api.put("/users/update-profile", { 
            name: user.name, 
            phone: user.phone 
        });
        
        // Cập nhật lại LocalStorage
        const currentUser = JSON.parse(localStorage.getItem("user"));
        localStorage.setItem("user", JSON.stringify({ ...currentUser, name: user.name, phone: user.phone }));
        
        alert("✅ Cập nhật thông tin thành công!");
    } catch (err) {
        alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
        setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
        return alert("❌ Mật khẩu xác nhận không khớp!");
    }
    setLoading(true);
    try {
        await api.put("/users/change-password", {
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword
        });
        alert("✅ Đổi mật khẩu thành công!");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
        alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
  };

  // --- RENDER CONTENT THEO TAB ---
  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Thông Tin Cá Nhân</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Avatar Upload (Mock UI) */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-500 relative group">
                    <img src={getImageUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                        <Camera size={20} className="text-white"/>
                    </div>
                </div>
                <div>
                    <p className="text-sm text-gray-400">Ảnh đại diện</p>
                    <p className="text-xs text-gray-500">JPG, PNG tối đa 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Họ và tên</label>
                    <input 
                        type="text" 
                        value={user.name} 
                        onChange={e => setUser({...user, name: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Số điện thoại</label>
                    <input 
                        type="text" 
                        value={user.phone} 
                        onChange={e => setUser({...user, phone: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none transition"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email (Không thể thay đổi)</label>
                    <input 
                        type="email" 
                        value={user.email} 
                        disabled 
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-400 cursor-not-allowed"
                    />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                    {loading ? "Đang lưu..." : <><Save size={18}/> Lưu Thay Đổi</>}
                </button>
              </div>
            </form>
          </div>
        );

      case "password":
        return (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Đổi Mật Khẩu</h3>
            <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Mật khẩu hiện tại</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-500" size={18}/>
                        <input 
                            type="password" 
                            value={passwords.currentPassword}
                            onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-yellow-500 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Mật khẩu mới</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-500" size={18}/>
                        <input 
                            type="password" 
                            value={passwords.newPassword}
                            onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-yellow-500 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-500" size={18}/>
                        <input 
                            type="password" 
                            value={passwords.confirmPassword}
                            onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-yellow-500 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <div className="pt-4">
                    <button type="submit" disabled={loading} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                        {loading ? "Đang xử lý..." : "Đổi Mật Khẩu"}
                    </button>
                </div>
            </form>
          </div>
        );

      case "tickets":
        return (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Vé Của Tôi ({orders.length})</h3>
            
            {orders.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    <Ticket size={48} className="mx-auto mb-3 opacity-50"/>
                    <p>Bạn chưa mua vé nào.</p>
                    <Link to="/" className="text-yellow-500 hover:underline mt-2 inline-block">Đặt vé ngay</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const showtime = order.showtime || {};
                        const movie = showtime.movie || {};
                        const cinema = showtime.cinema || {};
                        const now = new Date();
                        const start = new Date(showtime.startTime);
                        const isExpired = now > new Date(start.getTime() + 120*60000);
                        
                        return (
                            <div key={order._id} className={`bg-gray-800 border rounded-xl overflow-hidden flex flex-col sm:flex-row transition hover:shadow-lg ${isExpired ? 'border-gray-700 opacity-70' : 'border-gray-600 hover:border-yellow-500'}`}>
                                <div className="sm:w-32 h-32 bg-gray-900 shrink-0">
                                    <img src={getImageUrl(movie.posterUrl)} className="w-full h-full object-cover"/>
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg text-white mb-1 line-clamp-1">{movie.title}</h4>
                                            <p className="text-sm text-gray-400 flex items-center gap-1"><MapPin size={12}/> {cinema.name} - {showtime.room?.name}</p>
                                            <p className="text-sm text-yellow-500 flex items-center gap-1 font-bold mt-1">
                                                <Calendar size={12}/> {start.toLocaleDateString('vi-VN')} - <Clock size={12}/> {start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {isExpired ? (
                                                <span className="bg-gray-600 text-xs px-2 py-1 rounded text-white flex items-center gap-1">Đã chiếu</span>
                                            ) : (
                                                <span className="bg-green-600 text-xs px-2 py-1 rounded text-white flex items-center gap-1 animate-pulse"><PlayCircle size={10}/> Sắp chiếu</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-end">
                                        <div className="text-xs text-gray-400">
                                            Ghế: <span className="text-white font-bold text-sm">{order.seats?.join(", ")}</span>
                                        </div>
                                        <div className="text-yellow-500 font-bold">{formatCurrency(order.totalPrice)}</div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white py-8 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* SIDEBAR MENU */}
            <div className="lg:col-span-1">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-4">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-700 mb-3 shadow-lg">
                            <img src={getImageUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover"/>
                        </div>
                        <h2 className="text-xl font-bold text-white">{user.name || "User Name"}</h2>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>

                    <nav className="space-y-2">
                        <button 
                            onClick={() => setActiveTab("profile")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'profile' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                        >
                            <User size={18}/> Hồ Sơ Của Tôi
                        </button>
                        <button 
                            onClick={() => setActiveTab("password")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'password' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                        >
                            <Lock size={18}/> Đổi Mật Khẩu
                        </button>
                        <button 
                            onClick={() => setActiveTab("tickets")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'tickets' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                        >
                            <Ticket size={18}/> Vé Đã Mua
                        </button>
                        <div className="border-t border-gray-700 my-2 pt-2">
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                            >
                                <LogOut size={18}/> Đăng Xuất
                            </button>
                        </div>
                    </nav>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="lg:col-span-3">
                <div className="bg-gray-800 rounded-xl p-6 md:p-8 border border-gray-700 shadow-xl min-h-[500px]">
                    {renderContent()}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}