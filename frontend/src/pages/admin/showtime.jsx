import { useEffect, useState, useMemo } from "react";
import {
  getAllShowtimes,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} from "../../api/showtimeService";
import { getAllMovies } from "../../api/movieService";
import { getAllCinemas } from "../../api/cinemaService";
import { getAllRooms } from "../../api/roomService";

import { 
  Loader2, Trash2, SquarePen, CalendarClock, Film, MapPin, Armchair, 
  ArrowRight, Search, PlusCircle, Save, X 
} from "lucide-react";

// Helper lấy ảnh poster (hoặc placeholder)
const getPosterUrl = (movie) => {
    if (movie?.posterUrl) return movie.posterUrl;
    if (movie?.image) return movie.image;
    return "https://placehold.co/100x150?text=No+Img";
};

export default function Showtimes() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    movie: "", cinema: "", room: "", startTime: "", price: "",
  });

  // --- 1. Fetch Data ---
  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      const [resShowtimes, resMovies, resCinemas, resRooms] = await Promise.all([
        getAllShowtimes(), getAllMovies(), getAllCinemas(), getAllRooms()
      ]);
      setShowtimes(resShowtimes.data.sort((a,b) => new Date(b.startTime) - new Date(a.startTime)));
      setMovies(resMovies.data);
      setCinemas(Array.isArray(resCinemas.data) ? resCinemas.data : resCinemas.data.cinemas || []);
      setAllRooms(resRooms.data);
    } catch (err) { console.error("Error:", err); }
  };

  // --- 2. Filter Rooms ---
  useEffect(() => {
    if (formData.cinema) {
      const rooms = allRooms.filter(r => (r.cinema?._id || r.cinema) === formData.cinema);
      setFilteredRooms(rooms);
    } else {
      setFilteredRooms([]);
    }
  }, [formData.cinema, allRooms]);

  // --- 3. Handlers ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setEditingId(null);
    setFormData({ movie: "", cinema: "", room: "", startTime: "", price: "" });
    setFilteredRooms([]);
  };

  const calculateEndTime = () => {
    if (!formData.movie || !formData.startTime) return null;
    const selectedMovie = movies.find(m => m._id === formData.movie);
    if (!selectedMovie) return null;
    return new Date(new Date(formData.startTime).getTime() + selectedMovie.duration * 60000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movie || !formData.cinema || !formData.room || !formData.startTime || !formData.price) return alert("Thiếu thông tin!");
    setLoading(true);
    const payload = {
        ...formData,
        endTime: calculateEndTime(),
        price: Number(formData.price)
    };
    try {
        if (editingId) {
            await updateShowtime(editingId, payload);
            alert("✅ Cập nhật thành công!");
        } else {
            await createShowtime(payload);
            alert("✅ Tạo mới thành công!");
        }
        resetForm();
        const { data } = await getAllShowtimes();
        setShowtimes(data.sort((a,b) => new Date(b.startTime) - new Date(a.startTime)));
    } catch (err) { alert("Lỗi: " + err.message); } 
    finally { setLoading(false); }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    const formatDate = (iso) => iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : "";
    setFormData({
      movie: item.movie?._id || item.movie,
      cinema: item.cinema?._id || item.cinema,
      room: item.room?._id || item.room,
      startTime: formatDate(item.startTime),
      price: item.price,
    });
    // Set rooms immediately for edit mode
    const cid = item.cinema?._id || item.cinema;
    setFilteredRooms(allRooms.filter(r => (r.cinema?._id || r.cinema) === cid));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa suất chiếu này?")) return;
    try {
        await deleteShowtime(id);
        setShowtimes(prev => prev.filter(s => s._id !== id));
    } catch (e) { alert("Lỗi xóa!"); }
  };

  // Filter Showtimes
  const filteredShowtimes = useMemo(() => {
      if (!searchTerm) return showtimes;
      const lower = searchTerm.toLowerCase();
      return showtimes.filter(s => 
          s.movie?.title?.toLowerCase().includes(lower) || 
          s.cinema?.name?.toLowerCase().includes(lower)
      );
  }, [showtimes, searchTerm]);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                <CalendarClock className="text-rose-600" size={32} /> 
                Quản lý Suất Chiếu
            </h2>
            <p className="text-gray-500 text-sm mt-1 ml-11">Lên lịch chiếu phim cho toàn hệ thống rạp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* --- CỘT TRÁI: FORM (CARD NỔI) --- */}
        <div className="lg:col-span-1 bg-white shadow-xl shadow-rose-100 rounded-2xl p-6 border-t-4 border-rose-500 sticky top-6">
            <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
                {editingId ? <SquarePen className="text-blue-500"/> : <PlusCircle className="text-green-500"/>}
                {editingId ? "Cập nhật Suất Chiếu" : "Thêm Suất Chiếu Mới"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Phim */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phim</label>
                    <div className="relative">
                        <Film className="absolute left-3 top-3 text-gray-400" size={16}/>
                        <select name="movie" value={formData.movie} onChange={handleChange} 
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition">
                            <option value="">-- Chọn Phim --</option>
                            {movies.map(m => <option key={m._id} value={m._id}>{m.title} ({m.duration}p)</option>)}
                        </select>
                    </div>
                </div>

                {/* Rạp & Phòng */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rạp</label>
                        <select name="cinema" value={formData.cinema} onChange={(e) => { handleChange(e); setFormData(p => ({...p, room: ""})); }} 
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500 transition">
                            <option value="">-- Rạp --</option>
                            {cinemas.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phòng</label>
                        <select name="room" value={formData.room} onChange={handleChange} disabled={!formData.cinema}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500 transition disabled:bg-gray-100">
                            <option value="">-- Phòng --</option>
                            {filteredRooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Thời gian & Giá */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bắt đầu</label>
                        <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} 
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giá vé</label>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="75000"
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-rose-600 outline-none focus:ring-2 focus:ring-rose-500" />
                    </div>
                </div>

                {/* Info Box */}
                {calculateEndTime() && (
                    <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 text-xs text-rose-800 flex items-center gap-2">
                        <div className="w-1 h-8 bg-rose-400 rounded-full"></div>
                        <div>
                            <span className="font-bold block">Kết thúc dự kiến:</span>
                            {calculateEndTime().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {calculateEndTime().toLocaleDateString()}
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={loading} 
                        className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white py-2.5 rounded-lg font-bold shadow-lg shadow-rose-500/30 flex justify-center items-center gap-2 transition active:scale-[0.98]">
                        {loading ? <Loader2 className="animate-spin"/> : <Save size={18}/>}
                        {editingId ? "Lưu" : "Tạo Mới"}
                    </button>
                    {editingId && (
                        <button type="button" onClick={resetForm} 
                            className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold transition">
                            <X size={18}/>
                        </button>
                    )}
                </div>
            </form>
        </div>

        {/* --- CỘT PHẢI: LIST (TIMELINE STYLE) --- */}
        <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-700">
                    Danh sách ({filteredShowtimes.length})
                </h3>
                {/* Search nhỏ */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Tìm phim, rạp..." 
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 w-48 transition-all focus:w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredShowtimes.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <CalendarClock className="mx-auto text-gray-300 mb-3" size={48}/>
                        <p className="text-gray-400 font-medium">Chưa có lịch chiếu nào.</p>
                    </div>
                ) : (
                    filteredShowtimes.map((item) => {
                        const isPast = new Date(item.startTime) < new Date();
                        return (
                            <div key={item._id} 
                                className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group flex flex-col sm:flex-row gap-5 items-stretch ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                
                                {/* Poster (Mini) */}
                                <div className="w-full sm:w-24 h-36 bg-gray-200 rounded-lg overflow-hidden shrink-0 shadow-md relative">
                                    <img src={getPosterUrl(item.movie)} alt="Poster" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                                    {isPast && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold uppercase">Đã chiếu</div>}
                                </div>

                                {/* Thông tin chính */}
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-bold text-gray-500">
                                            <span className={`px-2 py-0.5 rounded ${isPast ? 'bg-gray-100' : 'bg-rose-100 text-rose-600'}`}>
                                                {new Date(item.startTime).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                                                <MapPin size={10}/> {item.cinema?.name}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-xl text-gray-800 mb-1 line-clamp-1 group-hover:text-rose-600 transition-colors">
                                            {item.movie?.title || "Phim không xác định"}
                                        </h4>
                                        
                                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mt-2">
                                            <div className="bg-gray-50 border px-3 py-1 rounded-md flex items-center gap-2">
                                                <span className="text-gray-900">{new Date(item.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                <ArrowRight size={12} className="text-gray-400"/>
                                                <span className="text-gray-400">{item.endTime ? new Date(item.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</span>
                                            </div>
                                            <span className="text-gray-400 text-xs px-2">•</span>
                                            <span className="flex items-center gap-1 text-gray-500 text-xs">
                                                <Armchair size={12}/> {item.room?.name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer Item */}
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-gray-100">
                                        <span className="font-bold text-lg text-rose-600">
                                            {item.price?.toLocaleString()} <span className="text-xs text-gray-400 font-normal">vnđ</span>
                                        </span>
                                        
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg" title="Sửa"><SquarePen size={16}/></button>
                                            <button onClick={() => handleDelete(item._id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg" title="Xóa"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>

      </div>
    </div>
  );
}