import { useEffect, useState } from "react";
import api from "../../api/axiosConfig"; // Import axios config để upload ảnh
import { getAllUsers, createUser, updateUser, deleteUser } from "../../api/userService";
import {
    Loader2, Trash2, SquarePen, User, Shield, Phone, Mail, Camera, Lock
} from "lucide-react";

// --- HÀM UPLOAD ẢNH (Tương tự các trang khác) ---
const uploadFileService = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.imageUrl;
};

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "user",
        avatar: "",
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error("Lỗi lấy danh sách user:", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: "", email: "", password: "", phone: "", role: "user", avatar: ""
        });
        setAvatarFile(null);
    };

    const handleEdit = (user) => {
        setEditingId(user._id);
        setFormData({
            name: user.name,
            email: user.email,
            password: "", // Không hiển thị mật khẩu cũ
            phone: user.phone || "",
            role: user.role || "user",
            avatar: user.avatar || "",
        });
        setAvatarFile(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email) return alert("Tên và Email là bắt buộc!");

        // Nếu tạo mới thì bắt buộc nhập pass, nếu sửa thì ko bắt buộc
        if (!editingId && !formData.password) return alert("Vui lòng nhập mật khẩu cho user mới!");

        setLoading(true);

        try {
            let finalAvatarUrl = formData.avatar;
            if (avatarFile) {
                finalAvatarUrl = await uploadFileService(avatarFile);
            }

            const payload = {
                ...formData,
                avatar: finalAvatarUrl,
            };

            // Nếu đang edit mà ô password trống -> xóa khỏi payload để ko bị hash chuỗi rỗng
            if (editingId && !payload.password) {
                delete payload.password;
            }

            if (editingId) {
                await updateUser(editingId, payload);
                alert("✅ Cập nhật User thành công!");
            } else {
                await createUser(payload);
                alert("✅ Tạo User thành công!");
            }
            resetForm();
            fetchUsers();
        } catch (err) {
            alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa User này?")) return;
        try {
            await deleteUser(id);
            fetchUsers();
        } catch (err) {
            alert("❌ Không thể xóa User!");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
                <User className="text-violet-600" /> Quản lý Người Dùng
            </h2>

            {/* --- FORM --- */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-violet-100">
                <h3 className="text-lg font-semibold mb-4 text-violet-600">
                    {editingId ? "Cập nhật Thông Tin" : "Thêm Người Dùng Mới"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex justify-center mb-4">
                        <div className="relative group cursor-pointer w-24 h-24">
                            <img
                                src={avatarFile ? URL.createObjectURL(avatarFile) : (formData.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png")}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover border-2 border-violet-200 bg-gray-50" 
                            />
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                <Camera size={20} />
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files[0])} />
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-violet-400 outline-none" placeholder="Nguyễn Văn A" />
                        </div>

                        {/* Email (Khóa nếu đang Edit để tránh lỗi logic) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={!!editingId}
                                    className={`border p-2 pl-10 w-full rounded outline-none ${editingId ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-violet-400'}`}
                                    placeholder="example@gmail.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input name="phone" value={formData.phone} onChange={handleChange} className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-violet-400 outline-none" placeholder="09xxxx..." />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò (Role)</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <select name="role" value={formData.role} onChange={handleChange} className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-violet-400 outline-none">
                                    <option value="user">User (Khách hàng)</option>
                                    <option value="staff">Staff (Nhân viên)</option>
                                    <option value="admin">Admin (Quản trị)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {editingId ? "Mật khẩu mới (Để trống nếu ko đổi)" : "Mật khẩu *"}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-violet-400 outline-none"
                                    placeholder="******"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white p-2 rounded font-medium flex justify-center items-center gap-2 transition disabled:bg-violet-300">
                            {loading && <Loader2 className="animate-spin" size={20} />} {editingId ? "Lưu thay đổi" : "Thêm User"}
                        </button>
                        {editingId && <button type="button" onClick={resetForm} disabled={loading} className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition">Hủy</button>}
                    </div>
                </form>
            </div>

            {/* --- LIST USERS --- */}
            <div>
                <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách ({users.length})</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map(user => (
                        <div key={user._id} className="bg-white border p-4 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                <img src={user.avatar || "https://via.placeholder.com/150"} alt={user.name} className="w-full h-full object-cover" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 truncate">{user.name}</h4>
                                <p className="text-xs text-gray-500 truncate mb-1">{user.email}</p>
                                <span className={`text-xs px-2 py-0.5 rounded border uppercase font-bold ${user.role === 'admin' ? 'bg-red-100 text-red-700 border-red-200' :
                                        user.role === 'staff' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                    {user.role}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <button onClick={() => handleEdit(user)} className="p-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition">
                                    <SquarePen size={16} />
                                </button>
                                <button onClick={() => handleDelete(user._id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}