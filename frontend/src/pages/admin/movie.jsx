import { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { getAllMovies, createMovie, updateMovie, deleteMovie } from "../../api/movieService";
import { getAllCinemas } from "../../api/cinemaService"; // Import API lấy rạp
import { Loader2, Trash2, SquarePen, Clapperboard, Image as ImageIcon, MapPin, Calendar } from "lucide-react";

// --- HÀM UPLOAD ẢNH ---
const uploadFileService = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.imageUrl;
};

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [allCinemas, setAllCinemas] = useState([]); // List tất cả rạp để chọn
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [posterFile, setPosterFile] = useState(null);

  const [formData, setFormData] = useState({
    title: "", description: "", director: "", cast: "", genre: "",
    duration: "", language: "", ageRating: "P", releaseDate: "",
    posterUrl: "", trailerUrl: "", status: "coming_soon",
    cinema: [], // 👈 Thay đổi: Đây là mảng chứa nhiều ID rạp
  });

  useEffect(() => { 
    fetchMovies(); 
    fetchCinemasList(); // Lấy danh sách rạp khi load trang
  }, []);

  const fetchMovies = async () => {
    try {
      const { data } = await getAllMovies();
      setMovies(data);
    } catch (err) { console.error(err); }
  };

  const fetchCinemasList = async () => {
    try {
      const { data } = await getAllCinemas();
      // Xử lý dữ liệu tùy backend trả về array hay object
      setAllCinemas(Array.isArray(data) ? data : data.cinema || []);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Hàm xử lý chọn nhiều rạp (Checkbox)
  const handleCinemaToggle = (cinemaId) => {
    setFormData((prev) => {
      const currentCinemas = prev.cinema || [];
      if (currentCinemas.includes(cinemaId)) {
        // Nếu đã có -> Bỏ chọn (Xóa khỏi mảng)
        return { ...prev, cinema: currentCinemas.filter((id) => id !== cinemaId) };
      } else {
        // Nếu chưa có -> Chọn (Thêm vào mảng)
        return { ...prev, cinema: [...currentCinemas, cinemaId] };
      }
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "", description: "", director: "", cast: "", genre: "",
      duration: "", language: "", ageRating: "P", releaseDate: "",
      posterUrl: "", trailerUrl: "", status: "coming_soon",
      cinema: [], // Reset mảng rạp
    });
    setPosterFile(null);
  };

  const handleEdit = (movie) => {
    setEditingId(movie._id);
    
    // Lấy danh sách ID rạp từ movie.cinemas (nếu populate rồi thì map lấy _id, chưa thì lấy trực tiếp)
    const movieCinemaIds = movie.cinema?.map(c => typeof c === 'object' ? c._id : c) || [];

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
      cinema: movieCinemaIds, // Set các rạp đang có
    });
    setPosterFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Tên phim là bắt buộc!");
    
    // Kiểm tra xem đã chọn rạp nào chưa (Tùy chọn)
    if (formData.cinema.length === 0) return alert("Vui lòng chọn ít nhất 1 rạp chiếu!");

    setLoading(true);

    try {
      let finalPosterUrl = formData.posterUrl;
      if (posterFile) finalPosterUrl = await uploadFileService(posterFile);

      const payload = {
        ...formData,
        title: formData.title.trim(),
        cast: formData.cast.split(",").map(c => c.trim()).filter(Boolean),
        genre: formData.genre.split(",").map(g => g.trim()).filter(Boolean),
        duration: formData.duration ? Number(formData.duration) : undefined,
        releaseDate: formData.releaseDate ? new Date(formData.releaseDate) : undefined,
        posterUrl: finalPosterUrl,
        // cinemas đã là mảng ID, gửi trực tiếp
      };

      if (editingId) {
        await updateMovie(editingId, payload);
        alert("✅ Cập nhật phim thành công!");
      } else {
        await createMovie(payload);
        alert("✅ Thêm phim thành công!");
      }
      resetForm();
      fetchMovies();
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa phim này?")) return;
    try {
      await deleteMovie(id);
      alert("✅ Xóa phim thành công!");
      fetchMovies();
    } catch (err) { alert("Không thể xóa phim!"); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
        <Clapperboard className="text-blue-600" /> Quản lý Phim
      </h2>

      {/* Form Phim */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-blue-100">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">
          {editingId ? "Cập nhật Phim" : "Thêm Phim Mới"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên phim *</label>
              <input name="title" value={formData.title} onChange={handleChange} placeholder="Nhập tên phim..." className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select name="status" value={formData.status} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 outline-none">
                <option value="coming_soon">Sắp chiếu (Coming Soon)</option>
                <option value="now_showing">Đang chiếu (Now Showing)</option>
                <option value="ended">Đã kết thúc (Ended)</option>
              </select>
            </div>
          </div>

          {/* --- KHU VỰC CHỌN RẠP (MULTI-SELECT) --- */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Chọn Rạp Chiếu (Có thể chọn nhiều)</label>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 border p-3 rounded bg-gray-50 max-h-40 overflow-y-auto">
                {allCinemas.length > 0 ? allCinemas.map((cinema) => (
                  <label key={cinema._id} className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-1 rounded">
                     <input 
                       type="checkbox" 
                       checked={formData.cinema.includes(cinema._id)}
                       onChange={() => handleCinemaToggle(cinema._id)}
                       className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                     />
                     <span className="text-sm text-gray-700">{cinema.name}</span>
                  </label>
                )) : <p className="text-sm text-gray-400 col-span-full">Chưa có rạp nào.</p>}
             </div>
             <p className="text-xs text-blue-500 mt-1">Đã chọn: {formData.cinema.length} rạp</p>
          </div>

          {/* Các trường input khác */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <input name="director" value={formData.director} onChange={handleChange} placeholder="Đạo diễn" className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" />
             <input name="cast" value={formData.cast} onChange={handleChange} placeholder="Diễn viên (cách nhau dấu phẩy)" className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none md:col-span-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input name="duration" type="number" value={formData.duration} onChange={handleChange} placeholder="Thời lượng (phút)" className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" />
            <input name="language" value={formData.language} onChange={handleChange} placeholder="Ngôn ngữ" className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" />
            <select name="ageRating" value={formData.ageRating} onChange={handleChange} className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none">
              <option value="P">P (Mọi lứa tuổi)</option>
              <option value="C13">C13 (13+)</option>
              <option value="C16">C16 (16+)</option>
              <option value="C18">C18 (18+)</option>
            </select>
            <input name="releaseDate" type="date" value={formData.releaseDate} onChange={handleChange} className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
             <input name="genre" value={formData.genre} onChange={handleChange} placeholder="Hành động, Hài hước..." className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poster Phim</label>
                <div className="flex items-center gap-4 border p-2 rounded bg-gray-50">
                   <input type="file" accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={(e) => setPosterFile(e.target.files[0])} />
                   {(posterFile || formData.posterUrl) && (
                     <img src={posterFile ? URL.createObjectURL(posterFile) : formData.posterUrl} alt="Preview" className="h-12 w-8 object-cover rounded border" />
                   )}
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trailer URL</label>
                <input name="trailerUrl" value={formData.trailerUrl} onChange={handleChange} placeholder="https://youtube.com..." className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 outline-none" />
             </div>
          </div>

          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả nội dung phim..." className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 outline-none h-24" />

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-medium flex justify-center items-center gap-2 transition disabled:bg-blue-300">
              {loading && <Loader2 className="animate-spin" size={20} />} {editingId ? "Cập nhật Phim" : "Thêm Phim"}
            </button>
            {editingId && <button type="button" onClick={resetForm} disabled={loading} className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition">Hủy</button>}
          </div>
        </form>
      </div>

      {/* Danh sách Phim */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách Phim ({movies.length})</h3>
        <div className="grid grid-cols-1 gap-4">
          {movies.map((movie) => (
             <div key={movie._id} className="bg-white border p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-start hover:shadow-md transition">
                {/* Poster */}
                <div className="w-full sm:w-24 h-36 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border relative">
                  {movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={24}/></div>}
                  <span className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">{movie.ageRating}</span>
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <div className="flex justify-between items-start">
                     <h4 className="font-bold text-lg text-gray-900 line-clamp-1">{movie.title}</h4>
                     <span className={`text-xs px-2 py-1 rounded-full border ${movie.status === 'now_showing' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {movie.status === 'now_showing' ? 'Đang chiếu' : movie.status === 'coming_soon' ? 'Sắp chiếu' : 'Đã kết thúc'}
                     </span>
                  </div>
                  
                  {/* Hiển thị danh sách rạp (Dạng tags) */}
                  <div className="flex items-start gap-1 mt-1 mb-2">
                     <MapPin size={14} className="text-red-500 mt-0.5 shrink-0"/>
                     <div className="flex flex-wrap gap-1">
                        {movie.cinema && movie.cinema.length > 0 ? (
                            movie.cinema.map((c, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border">
                                    {typeof c === 'object' ? c.name : 'Rạp ID: ' + c}
                                </span>
                            ))
                        ) : <span className="text-xs text-gray-400 italic">Chưa chọn rạp</span>}
                     </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-1">{movie.director} | {movie.duration} phút</p>
                  
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                     <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"><Calendar size={12}/> {movie.releaseDate?.split('T')[0]}</span>
                     <span className="bg-gray-50 px-2 py-1 rounded border">{movie.genre?.join(", ")}</span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(movie)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition"><SquarePen size={14}/> Sửa</button>
                    <button onClick={() => handleDelete(movie._id)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition"><Trash2 size={14}/> Xóa</button>
                  </div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}