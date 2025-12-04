import { useEffect, useState } from "react";
// Import api instance đã cấu hình (có base URL và token)
import api from "../../api/axiosConfig"; // ⚠️ Sửa đường dẫn này trỏ đúng vào file axios config của bạn
import {
  getAllMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../../api/movieService";
import { Trash2, SquarePen, Clapperboard, Loader2 } from "lucide-react";

// --- HÀM UPLOAD THẬT ---
const uploadFileService = async (file) => {
  const formData = new FormData();
  formData.append("image", file); // Key 'image' khớp với backend

  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.imageUrl;
};
// -----------------------

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false); // 🆕 Thêm trạng thái Loading

  // Gom State cho gọn gàng (Best Practice)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    director: "",
    cast: "",
    genre: "",
    duration: "",
    language: "",
    ageRating: "P",
    releaseDate: "",
    posterUrl: "",
    trailerUrl: "",
    status: "coming_soon",
  });
  
  const [posterFile, setPosterFile] = useState(null); // File ảnh người dùng chọn

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const { data } = await getAllMovies();
      setMovies(data);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách:", err);
    }
  };

  // Hàm handle change chung cho input text
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "", description: "", director: "", cast: "", genre: "",
      duration: "", language: "", ageRating: "P", releaseDate: "",
      posterUrl: "", trailerUrl: "", status: "coming_soon",
    });
    setPosterFile(null);
  };

  const handleEdit = (movie) => {
    setEditingId(movie._id);
    setFormData({
      title: movie.title,
      description: movie.description || "",
      director: movie.director || "",
      cast: movie.cast?.join(", ") || "",
      genre: movie.genre?.join(", ") || "",
      duration: movie.duration || "",
      language: movie.language || "",
      ageRating: movie.ageRating || "P",
      releaseDate: movie.releaseDate ? movie.releaseDate.split("T")[0] : "",
      posterUrl: movie.posterUrl || "",
      trailerUrl: movie.trailerUrl || "",
      status: movie.status || "coming_soon",
    });
    setPosterFile(null); // Reset file mới
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Tên phim là bắt buộc!");

    setLoading(true); // ⏳ Bắt đầu loading

    try {
      let finalPosterUrl = formData.posterUrl;

      // 1. Nếu có chọn file mới -> Upload lên Cloudinary
      if (posterFile) {
        finalPosterUrl = await uploadFileService(posterFile);
      }

      // 2. Chuẩn bị dữ liệu gửi đi
      const payload = {
        ...formData,
        title: formData.title.trim(),
        cast: formData.cast.split(",").map(c => c.trim()).filter(Boolean),
        genre: formData.genre.split(",").map(g => g.trim()).filter(Boolean),
        duration: formData.duration ? Number(formData.duration) : undefined,
        releaseDate: formData.releaseDate ? new Date(formData.releaseDate) : undefined,
        posterUrl: finalPosterUrl, // Dùng link ảnh mới (hoặc cũ)
      };

      // 3. Gọi API Create/Update
      if (editingId) {
        await updateMovie(editingId, payload);
        alert("✅ Cập nhật thành công!");
      } else {
        await createMovie(payload);
        alert("✅ Thêm phim thành công!");
      }
      
      resetForm();
      fetchMovies();
    } catch (err) {
      console.error("Lỗi:", err);
      alert("❌ Có lỗi xảy ra: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false); // 🏁 Kết thúc loading
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa phim này?")) return;
    try {
      await deleteMovie(id);
      fetchMovies();
    } catch (err) {
      alert("Không thể xóa phim!");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Quản lý Phim</h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-3 border p-4 rounded bg-white shadow-sm">
        
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="title" value={formData.title} onChange={handleChange} placeholder="Tên phim *" className="border p-2 rounded w-full" />
          <select name="status" value={formData.status} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="coming_soon">Coming Soon</option>
            <option value="now_showing">Now Showing</option>
            <option value="ended">Ended</option>
          </select>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="director" value={formData.director} onChange={handleChange} placeholder="Đạo diễn" className="border p-2 rounded w-full" />
          <input name="cast" value={formData.cast} onChange={handleChange} placeholder="Diễn viên (cách nhau dấu phẩy)" className="border p-2 rounded w-full" />
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="genre" value={formData.genre} onChange={handleChange} placeholder="Thể loại (cách nhau dấu phẩy)" className="border p-2 rounded w-full" />
          <input name="duration" type="number" value={formData.duration} onChange={handleChange} placeholder="Thời lượng (phút)" className="border p-2 rounded w-full" />
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="language" value={formData.language} onChange={handleChange} placeholder="Ngôn ngữ" className="border p-2 rounded w-full" />
          <select name="ageRating" value={formData.ageRating} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="P">P (Phổ biến)</option>
            <option value="C13">C13 (Trên 13 tuổi)</option>
            <option value="C16">C16 (Trên 16 tuổi)</option>
            <option value="C18">C18 (Trên 18 tuổi)</option>
          </select>
        </div>

        {/* Row 5 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="releaseDate" type="date" value={formData.releaseDate} onChange={handleChange} className="border p-2 rounded w-full" />
          <input name="trailerUrl" value={formData.trailerUrl} onChange={handleChange} placeholder="Link Trailer (YouTube...)" className="border p-2 rounded w-full" />
        </div>

        {/* Upload Ảnh */}
        <div className="border border-dashed p-4 rounded bg-gray-50">
           <label className="block text-sm font-medium mb-1">Ảnh Poster:</label>
           
           {/* Nếu đang sửa và đã có ảnh cũ */}
           {formData.posterUrl && !posterFile && (
             <div className="mb-2">
               <img src={formData.posterUrl} alt="Poster cũ" className="h-20 object-cover rounded border" />
               <p className="text-xs text-gray-500 mt-1">Đang dùng ảnh cũ. Chọn file mới để thay thế.</p>
             </div>
           )}

           <input 
             type="file" 
             accept="image/*" 
             onChange={(e) => setPosterFile(e.target.files[0])} 
             className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
           />
        </div>

        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả nội dung phim..." className="border p-2 rounded w-full h-24" />

        {/* Buttons */}
        <div className="flex gap-2">
            <button 
              type="submit" 
              disabled={loading} // 🔒 Khóa nút khi đang tải
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-medium flex justify-center items-center gap-2 transition disabled:bg-blue-300"
            >
              {loading && <Loader2 className="animate-spin" size={20}/>}
              {editingId ? "Cập nhật Phim" : "Thêm Phim Mới"}
            </button>
            
            {editingId && (
              <button type="button" onClick={resetForm} disabled={loading} className="px-6 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium">
                Hủy
              </button>
            )}
        </div>
      </form>

      {/* List Movies (Giữ nguyên logic của bạn, chỉ sửa CSS grid cho đẹp nếu cần) */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách phim ({movies.length})</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
             <li key={movie._id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                <div className="relative h-64 w-full bg-gray-100">
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400"><Clapperboard size={40}/></div>
                  )}
                  <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{movie.ageRating}</span>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="font-bold text-lg mb-1 truncate" title={movie.title}>{movie.title}</h4>
                  <p className="text-sm text-gray-500 mb-2 truncate">{movie.director}</p>
                  
                  <div className="mt-auto flex justify-end gap-2 pt-3 border-t">
                    <button onClick={() => handleEdit(movie)} className="text-yellow-600 hover:bg-yellow-50 p-1.5 rounded"><SquarePen size={18}/></button>
                    <button onClick={() => handleDelete(movie._id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={18}/></button>
                  </div>
                </div>
             </li>
          ))}
        </ul>
      </div>
    </div>
  );
}