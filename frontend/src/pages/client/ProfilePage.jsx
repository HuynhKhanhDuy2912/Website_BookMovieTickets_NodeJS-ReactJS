import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import Link
import api from "../../api/axiosConfig";
import { updateProfile, changePassword, uploadAvatar } from "../../api/userService"; 
import { 
  User, Lock, Ticket, Camera, Save, LogOut, Loader2
} from "lucide-react";

// Helper hiển thị ảnh
const getImageUrl = (imageField) => {
  if (!imageField) return "https://ui-avatars.com/api/?name=User&background=random";
  if (imageField instanceof File) return URL.createObjectURL(imageField);
  if (typeof imageField === 'object' && imageField !== null) return imageField.secure_url || imageField.url;
  if (typeof imageField === 'string') {
    if (imageField.startsWith("http")) return imageField;
    return `http://localhost:5000/${imageField.replace(/\\/g, '/').replace(/^\//, '')}`;
  }
  return "https://ui-avatars.com/api/?name=User&background=random";
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile"); 
  const [loading, setLoading] = useState(false);
  
  // State User Info
  const [user, setUser] = useState({
    name: "", email: "", phone: "", avatar: "" 
  });
  const [avatarFile, setAvatarFile] = useState(null);

  // State Password
  const [passwords, setPasswords] = useState({
    currentPassword: "", newPassword: "", confirmPassword: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarFile(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        let finalAvatarUrl = user.avatar; 
        if (avatarFile) finalAvatarUrl = await uploadAvatar(avatarFile);

        const updateData = { name: user.name, phone: user.phone, avatar: finalAvatarUrl };
        await updateProfile(updateData);
        
        const currentUser = JSON.parse(localStorage.getItem("user"));
        localStorage.setItem("user", JSON.stringify({ ...currentUser, ...updateData }));
        
        setUser(prev => ({ ...prev, avatar: finalAvatarUrl }));
        setAvatarFile(null); 
        alert("✅ Cập nhật thông tin thành công!");
    } catch (err) {
        alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
        setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return alert("❌ Mật khẩu xác nhận không khớp!");
    setLoading(true);
    try {
        await changePassword({
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

  return (
    <div className="bg-gray-900 min-h-screen text-white py-8 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* SIDEBAR MENU */}
            <div className="lg:col-span-1">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-4">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-700 mb-3 shadow-lg">
                            <img src={avatarFile ? URL.createObjectURL(avatarFile) : getImageUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover"/>
                        </div>
                        <h2 className="text-xl font-bold text-white">{user.name || "User Name"}</h2>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>

                    <nav className="space-y-2">
                        <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'profile' ? 'bg-yellow-500 text-black font-bold shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                            <User size={18}/> Hồ Sơ Của Tôi
                        </button>

                        <button onClick={() => setActiveTab("password")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'password' ? 'bg-yellow-500 text-black font-bold shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                            <Lock size={18}/> Đổi Mật Khẩu
                        </button>

                        <div className="border-t border-gray-700 my-2 pt-2">
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition">
                                <LogOut size={18}/> Đăng Xuất
                            </button>
                        </div>
                    </nav>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="lg:col-span-3">
                <div className="bg-gray-800 rounded-xl p-6 md:p-8 border border-gray-700 shadow-xl min-h-[500px]">
                    {/* Render Profile */}
                    {activeTab === "profile" && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Thông Tin Cá Nhân</h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-5">
                                {/* Avatar UI */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-500 relative group cursor-pointer">
                                        <img src={avatarFile ? URL.createObjectURL(avatarFile) : getImageUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover"/>
                                        <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                            <Camera size={20} className="text-white"/>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Ảnh đại diện</p>
                                        <p className="text-xs text-gray-500">Nhấn vào hình để thay đổi (JPG, PNG)</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Họ và tên</label>
                                        <input type="text" value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none transition"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Số điện thoại</label>
                                        <input type="text" value={user.phone} onChange={e => setUser({...user, phone: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none transition" placeholder="Nhập số điện thoại..."/>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Email (Không thể thay đổi)</label>
                                        <input type="email" value={user.email} disabled className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-400 cursor-not-allowed"/>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button type="submit" disabled={loading} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                                        {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Render Password */}
                    {activeTab === "password" && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Đổi Mật Khẩu</h3>
                            <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Mật khẩu hiện tại</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 text-gray-500" size={18}/>
                                        <input type="password" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-yellow-500 focus:outline-none" placeholder="••••••••"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Mật khẩu mới</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 text-gray-500" size={18}/>
                                        <input type="password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-yellow-500 focus:outline-none" placeholder="••••••••"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Xác nhận mật khẩu mới</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 text-gray-500" size={18}/>
                                        <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-yellow-500 focus:outline-none" placeholder="••••••••"/>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button type="submit" disabled={loading} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                                        {loading ? "Đang xử lý..." : "Đổi Mật Khẩu"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}