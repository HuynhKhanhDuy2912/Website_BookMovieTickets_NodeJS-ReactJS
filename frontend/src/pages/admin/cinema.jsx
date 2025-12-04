import { useEffect, useState } from "react";
import api from "../../api/axiosConfig"; // ⚠️ Đảm bảo đường dẫn trỏ đúng file axios config
import { 
  getAllCinemas, 
  createCinema, 
  deleteCinema 
} from "../../api/cinemaService";
import { Loader2, Trash2, MapPin, Phone, Image as ImageIcon } from "lucide-react";

// --- HÀM UPLOAD ẢNH ---
const uploadFileService = async (file) => {
  const formData = new FormData();
  formData.append("image", file); // Key 'image' phải khớp backend

  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.imageUrl;
};

export default function Cinemas() {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(false); // Trạng thái loading khi submit

  // Gom nhóm state của form
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    image: "", // Lưu URL sau khi upload
  });

  const [imageFile, setImageFile] = useState(null); // Lưu file ảnh người dùng chọn

  // Lấy danh sách rạp
  const fetchCinemas = async () => {
    try {
      const { data } = await getAllCinemas();
      setCinemas(data);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách rạp:", err);
    }
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  // Xử lý thay đổi input text
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: "", address: "", city: "", phone: "", image: "" });
    setImageFile(null);
  };

  // Thêm rạp mới
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.address.trim()) {
      alert("❌ Tên và địa chỉ rạp không được để trống!");
      return;
    }

    setLoading(true); // Bắt đầu tải

    try {
      let finalImageUrl = formData.image;

      // 1. Upload ảnh nếu có chọn file
      if (imageFile) {
        finalImageUrl = await uploadFileService(imageFile);
      }

      // 2. Tạo payload gửi đi
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        image: finalImageUrl || undefined,
      };

      console.log("Gửi lên backend:", payload);

      // 3. Gọi API tạo rạp
      await createCinema(payload);
      
      alert("✅ Thêm rạp thành công!");
      resetForm();
      fetchCinemas();

    } catch (err) {
      console.error("Lỗi khi tạo rạp:", err.response || err);
      alert("❌ Không thể thêm rạp: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false); // Kết thúc tải
    }
  };

  // Xóa rạp
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa rạp này?")) return;
    try {
      await deleteCinema(id);
      fetchCinemas(); // Load lại danh sách ngầm, không cần alert phiền phức
    } catch (err) {
      console.error("Lỗi khi xóa rạp:", err.response || err);
      alert("❌ Không thể xóa rạp!");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Quản lý Rạp Chiếu Phim</h2>

      {/* Form Thêm Rạp */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">Thêm Rạp Mới</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên rạp *</label>
              <input
                type="text"
                name="name"
                placeholder="Ví dụ: CGV Vincom..."
                className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
              <input
                type="text"
                name="city"
                placeholder="Ví dụ: Hà Nội"
                className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18}/>
              <input
                type="text"
                name="address"
                placeholder="Số nhà, đường, phường..."
                className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
               <div className="relative">
                 <Phone className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                 <input
                   type="text"
                   name="phone"
                   placeholder="098..."
                   className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
                   value={formData.phone}
                   onChange={handleChange}
                 />
               </div>
            </div>
            
            {/* Input Upload Ảnh */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh rạp</label>
               <div className="flex items-center gap-4">
                 <input
                   type="file"
                   accept="image/*"
                   className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                   onChange={(e) => setImageFile(e.target.files[0])}
                 />
                 {/* Preview ảnh nhỏ bên cạnh nếu đã chọn */}
                 {imageFile && (
                   <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-10 w-10 object-cover rounded border"/>
                 )}
               </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded w-full font-medium flex justify-center items-center gap-2 transition disabled:bg-blue-300"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Thêm rạp"}
          </button>
        </form>
      </div>

      {/* Danh sách rạp */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách hiện có ({cinemas.length})</h3>
        <ul className="grid grid-cols-1 gap-4">
          {cinemas.map((cinema) => (
            <li
              key={cinema._id}
              className="bg-white border p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-md transition"
            >
              {/* Ảnh Thumbnail */}
              <div className="w-full sm:w-32 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border">
                {cinema.image ? (
                  <img
                    src={cinema.image}
                    alt={cinema.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon size={24}/>
                  </div>
                )}
              </div>

              {/* Thông tin */}
              <div className="flex-1">
                <p className="font-bold text-lg text-gray-900">{cinema.name}</p>
                <div className="text-sm text-gray-600 space-y-1 mt-1">
                   <p className="flex items-center gap-1"><MapPin size={14}/> {cinema.address}</p>
                   {cinema.city && <p className="ml-5 text-gray-500">TP: {cinema.city}</p>}
                   {cinema.phone && <p className="flex items-center gap-1"><Phone size={14}/> {cinema.phone}</p>}
                </div>
              </div>

              {/* Nút Xóa */}
              <button
                onClick={() => handleDelete(cinema._id)}
                className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded font-medium flex items-center gap-2 transition text-sm w-full sm:w-auto justify-center"
              >
                <Trash2 size={16}/> Xóa
              </button>
            </li>
          ))}
          {cinemas.length === 0 && (
            <p className="text-gray-500 text-center py-4">Chưa có rạp nào được thêm.</p>
          )}
        </ul>
      </div>
    </div>
  );
}