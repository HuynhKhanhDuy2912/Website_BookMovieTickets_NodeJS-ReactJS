import { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { getAllCinemas, createCinema, updateCinema, deleteCinema } from "../../api/cinemaService";
import { Loader2, Trash2, MapPin, Phone, Image as ImageIcon, Building2, SquarePen } from "lucide-react";

// --- UPLOAD IMAGE ---
const uploadFileService = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.imageUrl;
};

export default function Cinemas() {
  const [cinemas, setCinemas] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    image: "",
  });

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    try {
      const { data } = await getAllCinemas();
      setCinemas(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      address: "",
      city: "",
      phone: "",
      image: "",
    });
    setImageFile(null);
  };

  // --- Load Cinema vào Form để Cập nhật ---
  const handleEdit = (cinema) => {
    setEditingId(cinema._id);
    setFormData({
      name: cinema.name,
      address: cinema.address,
      city: cinema.city || "",
      phone: cinema.phone || "",
      image: cinema.image || "",
    });

    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Submit Form (Add hoặc Update giống Movies.jsx) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.address.trim()) {
      return alert("Tên và địa chỉ rạp không được để trống!");
    }

    setLoading(true);

    try {
      let finalImageUrl = formData.image;

      if (imageFile) {
        finalImageUrl = await uploadFileService(imageFile);
      }

      const payload = {
        ...formData,
        name: formData.name.trim(),
        address: formData.address.trim(),
        image: finalImageUrl,
      };

      if (editingId) {
        await updateCinema(editingId, payload);
        alert("✅ Cập nhật rạp thành công!");
      } else {
        await createCinema(payload);
        alert("✅ Thêm rạp thành công!");
      }

      resetForm();
      fetchCinemas();
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa rạp này?")) return;

    try {
      await deleteCinema(id);
      fetchCinemas();
    } catch (err) {
      alert("❌ Không thể xóa rạp!");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
        <Building2 className="text-red-600" /> Quản lý Rạp Chiếu
      </h2>

      {/* FORM */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-red-100">
        <h3 className="text-lg font-semibold mb-4 text-red-600">
          {editingId ? "Cập nhật Rạp Chiếu" : "Thêm Rạp Mới"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên rạp *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border p-2 w-full rounded focus:ring-2 focus:ring-red-400"
                placeholder="Ví dụ: CGV Vincom..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="border p-2 w-full rounded focus:ring-2 focus:ring-red-400"
                placeholder="Hà Nội, TP.HCM..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-red-400"
                  placeholder="Số nhà, đường..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotline</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-red-400"
                  placeholder="098..."
                />
              </div>
            </div>
          </div>

          {/* IMAGE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh rạp</label>
            <div className="flex items-center gap-4 border p-2 rounded bg-gray-50">
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:bg-red-50 file:text-red-700"
                onChange={(e) => setImageFile(e.target.files[0])}
              />

              {(imageFile || formData.image) && (
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : formData.image}
                  className="h-12 w-12 object-cover rounded border"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded w-full font-medium flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (editingId ? "Cập nhật Rạp" : "Thêm Rạp")}
          </button>
        </form>
      </div>

      {/* LIST */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách Rạp ({cinemas.length})</h3>

        <div className="grid grid-cols-1 gap-4">
          {cinemas.map((cinema) => (
            <div
              key={cinema._id}
              className="bg-white border p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-start hover:shadow-md"
            >
              <div className="w-full sm:w-32 h-20 bg-gray-100 rounded-md overflow-hidden border">
                {cinema.image ? (
                  <img src={cinema.image} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h4 className="font-bold text-lg">{cinema.name}</h4>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {cinema.address}
                </p>

                {cinema.city && (
                  <span className="inline-block bg-gray-100 text-sm px-2 py-0.5 rounded mt-1">
                    {cinema.city}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleEdit(cinema)}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded flex items-center gap-2 text-sm"
              >
                <SquarePen size={16} /> Cập nhật
              </button>

              <button
                onClick={() => handleDelete(cinema._id)}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded flex items-center gap-2 text-sm"
              >
                <Trash2 size={16} /> Xóa
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
