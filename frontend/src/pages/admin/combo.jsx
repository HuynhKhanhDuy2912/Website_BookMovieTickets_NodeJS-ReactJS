import { useEffect, useState } from "react";
import api from "../../api/axiosConfig"; // ⚠️ Đảm bảo đường dẫn trỏ đúng file axios config
import {
  getAllCombos,
  createCombo,
  updateCombo,
  deleteCombo,
} from "../../api/comboService";
import { Loader2, Trash2, SquarePen, Utensils, Image as ImageIcon } from "lucide-react";

// --- HÀM UPLOAD ẢNH ---
const uploadFileService = async (file) => {
  const formData = new FormData();
  formData.append("image", file); // Key 'image' phải khớp backend

  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.imageUrl;
};

export default function Combo() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Gom nhóm state form
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "combo",
    items: "", // Chuỗi nhập vào
    price: "",
    image: "", // URL ảnh
    status: "available",
  });

  const [imageFile, setImageFile] = useState(null); // File ảnh mới

  // Lấy danh sách combo
  const fetchCombos = async () => {
    try {
      const { data } = await getAllCombos();
      setCombos(data);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách combo:", err);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "", description: "", category: "combo", items: "",
      price: "", image: "", status: "available",
    });
    setImageFile(null);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.price === "") {
      alert("❌ Tên và giá combo là bắt buộc!");
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = formData.image;

      // 1. Upload ảnh nếu có chọn file mới
      if (imageFile) {
        finalImageUrl = await uploadFileService(imageFile);
      }

      // 2. Tạo payload
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        items: formData.items
          ? formData.items.split(",").map((i) => i.trim()).filter(Boolean)
          : [],
        price: Number(formData.price),
        image: finalImageUrl || undefined,
        status: formData.status,
      };

      // 3. Gọi API
      if (editingId) {
        await updateCombo(editingId, payload);
        alert("✅ Cập nhật combo thành công!");
      } else {
        await createCombo(payload);
        alert("✅ Thêm combo thành công!");
      }
      
      resetForm();
      fetchCombos();
    } catch (err) {
      console.error("Lỗi:", err);
      alert("❌ Có lỗi xảy ra: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Đổ dữ liệu vào form để sửa
  const handleEdit = (combo) => {
    setEditingId(combo._id);
    setFormData({
      name: combo.name,
      description: combo.description || "",
      category: combo.category,
      items: combo.items?.join(", ") || "",
      price: combo.price,
      image: combo.image || "",
      status: combo.status,
    });
    setImageFile(null);
    // Scroll lên đầu trang
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Xóa combo
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa combo này?")) return;
    try {
      await deleteCombo(id);
      fetchCombos(); // Load lại ngầm
    } catch (err) {
      console.error("Lỗi xóa:", err);
      alert("❌ Không thể xóa combo!");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
        <Utensils className="text-orange-500"/> Quản lý Combo & Đồ ăn
      </h2>

      {/* Form Combo */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-orange-100">
        <h3 className="text-lg font-semibold mb-4 text-orange-600">
          {editingId ? "Cập nhật Món" : "Thêm Món Mới"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tên món/combo *</label>
               <input
                 type="text"
                 name="name"
                 placeholder="Ví dụ: Combo Bắp Nước Lớn"
                 className="border p-2 w-full rounded focus:ring-2 focus:ring-orange-400 outline-none"
                 value={formData.name}
                 onChange={handleChange}
               />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-orange-400 outline-none"
                  >
                    <option value="combo">Combo</option>
                    <option value="food">Đồ ăn</option>
                    <option value="drink">Nước uống</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ) *</label>
                  <input
                    type="number"
                    name="price"
                    placeholder="50000"
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-orange-400 outline-none"
                    value={formData.price}
                    onChange={handleChange}
                  />
               </div>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Thành phần (cho Combo)</label>
             <input
               type="text"
               name="items"
               placeholder="Ví dụ: 1 Bắp Lớn, 2 Coca Vừa (cách nhau dấu phẩy)"
               className="border p-2 w-full rounded focus:ring-2 focus:ring-orange-400 outline-none"
               value={formData.items}
               onChange={handleChange}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
                <div className="flex items-center gap-4 border p-2 rounded bg-gray-50">
                   <input
                     type="file"
                     accept="image/*"
                     className="w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                     onChange={(e) => setImageFile(e.target.files[0])}
                   />
                   {(imageFile || formData.image) && (
                     <img 
                       src={imageFile ? URL.createObjectURL(imageFile) : formData.image} 
                       alt="Preview" 
                       className="h-12 w-12 object-cover rounded border"
                     />
                   )}
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  <option value="available">Còn hàng (Available)</option>
                  <option value="unavailable">Hết hàng (Unavailable)</option>
                </select>
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
             <input
               type="text"
               name="description"
               placeholder="Mô tả ngắn về sản phẩm..."
               className="border p-2 w-full rounded focus:ring-2 focus:ring-orange-400 outline-none"
               value={formData.description}
               onChange={handleChange}
             />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded font-medium flex justify-center items-center gap-2 transition disabled:bg-orange-300"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {editingId ? "Cập nhật Combo" : "Thêm Combo"}
            </button>
            {editingId && (
              <button
                type="button"
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition"
                onClick={resetForm}
                disabled={loading}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Danh sách Combo */}
      <div>
         <h3 className="text-lg font-bold mb-4 text-gray-800">Menu hiện tại ({combos.length})</h3>
         <div className="grid grid-cols-1 gap-4">
           {combos.map((combo) => (
             <div
               key={combo._id}
               className={`bg-white border p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-md transition ${combo.status === 'unavailable' ? 'opacity-70 bg-gray-50' : ''}`}
             >
               {/* Ảnh Thumbnail */}
               <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border relative">
                 {combo.image ? (
                   <img src={combo.image} alt={combo.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={24}/></div>
                 )}
                 {combo.status === 'unavailable' && (
                    <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold uppercase">Hết hàng</span>
                 )}
               </div>

               {/* Thông tin */}
               <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="font-bold text-lg text-gray-900">{combo.name}</p>
                       <p className="text-orange-600 font-bold">{combo.price.toLocaleString()} ₫</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                        combo.category === 'combo' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        combo.category === 'food' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                        {combo.category.toUpperCase()}
                    </span>
                 </div>
                 
                 <p className="text-sm text-gray-600 mt-1 line-clamp-1">{combo.description}</p>
                 {combo.items && combo.items.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1 italic">Gồm: {combo.items.join(", ")}</p>
                 )}
               </div>

               {/* Nút thao tác */}
               <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                 <button
                   onClick={() => handleEdit(combo)}
                   className="flex-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-1.5 rounded text-sm font-medium flex items-center justify-center gap-1 transition"
                 >
                   <SquarePen size={16}/> Sửa
                 </button>
                 <button
                   onClick={() => handleDelete(combo._id)}
                   className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded text-sm font-medium flex items-center justify-center gap-1 transition"
                 >
                   <Trash2 size={16}/> Xóa
                 </button>
               </div>
             </div>
           ))}
           {combos.length === 0 && <p className="text-gray-500 text-center py-4">Chưa có món nào trong menu.</p>}
         </div>
      </div>
    </div>
  );
}