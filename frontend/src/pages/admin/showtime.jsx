import { useEffect, useState } from "react";
import {
  getAllShowtimes,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} from "../../api/showtimeService";
// Cần import thêm các service khác để lấy dữ liệu cho Dropdown
import { getAllMovies } from "../../api/movieService";
import { getAllCinemas } from "../../api/cinemaService";
import { getAllRooms } from "../../api/roomService";

import { 
  Loader2, 
  Trash2, 
  SquarePen, 
  CalendarClock, 
  Film, 
  MapPin, 
  Armchair, 
  ArrowRight 
} from "lucide-react";

export default function Showtimes() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [allRooms, setAllRooms] = useState([]); // Tất cả phòng
  const [filteredRooms, setFilteredRooms] = useState([]); // Phòng lọc theo rạp đã chọn
  
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    movie: "",
    cinema: "",
    room: "",
    startTime: "",
    price: "",
  });

  // 1. Fetch tất cả dữ liệu cần thiết khi vào trang
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Dùng Promise.all để gọi song song cho nhanh
      const [resShowtimes, resMovies, resCinemas, resRooms] = await Promise.all([
        getAllShowtimes(),
        getAllMovies(),
        getAllCinemas(),
        getAllRooms()
      ]);

      setShowtimes(resShowtimes.data);
      setMovies(resMovies.data);
      
      // Xử lý Cinemas (đề phòng API trả về dạng { cinemas: [...] })
      const cinemaList = Array.isArray(resCinemas.data) ? resCinemas.data : resCinemas.data.cinemas || [];
      setCinemas(cinemaList);

      setAllRooms(resRooms.data);
    } catch (err) {
      console.error("❌ Lỗi tải dữ liệu:", err);
      alert("Lỗi khi tải dữ liệu ban đầu!");
    }
  };

  // 2. Xử lý khi chọn Cinema -> Lọc ra các Room thuộc Cinema đó
  useEffect(() => {
    if (formData.cinema) {
      // Lọc phòng có cinema._id hoặc cinema (string) trùng với formData.cinema
      const rooms = allRooms.filter(r => {
        const rCinemaId = r.cinema?._id || r.cinema;
        return rCinemaId === formData.cinema;
      });
      setFilteredRooms(rooms);
    } else {
      setFilteredRooms([]);
    }
  }, [formData.cinema, allRooms]);

  // 3. Xử lý Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      movie: "",
      cinema: "",
      room: "",
      startTime: "",
      price: "",
    });
    setFilteredRooms([]);
  };

  // Helper: Tính EndTime (Optional - Backend có thể tự tính hoặc Frontend gửi lên)
  // Ở đây backend model có endTime, ta có thể tính toán để gửi lên hoặc hiển thị cho user xem
  const calculateEndTime = () => {
    if (!formData.movie || !formData.startTime) return null;
    const selectedMovie = movies.find(m => m._id === formData.movie);
    if (!selectedMovie) return null;

    const start = new Date(formData.startTime);
    const end = new Date(start.getTime() + selectedMovie.duration * 60000); // duration (phút) * 60000 (ms)
    return end;
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movie || !formData.cinema || !formData.room || !formData.startTime || !formData.price) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setLoading(true);

    const endTime = calculateEndTime();
    
    const payload = {
      movie: formData.movie,
      cinema: formData.cinema,
      room: formData.room,
      startTime: formData.startTime,
      endTime: endTime, // Gửi endTime đã tính toán lên server
      price: Number(formData.price),
    };

    try {
      if (editingId) {
        await updateShowtime(editingId, payload);
        alert("✅ Cập nhật suất chiếu thành công!");
      } else {
        await createShowtime(payload);
        alert("✅ Tạo suất chiếu thành công!");
      }
      resetForm();
      // Chỉ cần load lại showtimes, các cái khác không đổi
      const { data } = await getAllShowtimes();
      setShowtimes(data);
    } catch (err) {
      console.error("Lỗi:", err);
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Edit Handler
  const handleEdit = (item) => {
    setEditingId(item._id);
    
    // Format datetime-local value: YYYY-MM-DDTHH:mm
    const formatDateForInput = (isoDate) => {
      if (!isoDate) return "";
      const date = new Date(isoDate);
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); // Adjust timezone
      return date.toISOString().slice(0, 16);
    };

    setFormData({
      movie: item.movie?._id || item.movie,
      cinema: item.cinema?._id || item.cinema,
      // Lưu ý: room phải set sau khi cinema được set để useEffect lọc room chạy
      room: item.room?._id || item.room, 
      startTime: formatDateForInput(item.startTime),
      price: item.price,
    });
    
    // Cần set filteredRooms thủ công ngay lập tức để dropdown Room hiển thị đúng giá trị hiện tại
    const currentCinemaId = item.cinema?._id || item.cinema;
    const relatedRooms = allRooms.filter(r => (r.cinema?._id || r.cinema) === currentCinemaId);
    setFilteredRooms(relatedRooms);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa suất chiếu này?")) return;
    try {
      await deleteShowtime(id);
      const { data } = await getAllShowtimes();
      setShowtimes(data);
    } catch (err) {
      alert("❌ Không thể xóa suất chiếu!");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
        <CalendarClock className="text-rose-600" /> Quản lý Suất Chiếu (Showtimes)
      </h2>

      {/* FORM INPUT */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-rose-100">
        <h3 className="text-lg font-semibold mb-4 text-rose-600">
          {editingId ? "Cập nhật Suất Chiếu" : "Thêm Suất Chiếu Mới"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chọn Phim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Phim *</label>
              <div className="relative">
                <Film className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                <select
                  name="movie"
                  value={formData.movie}
                  onChange={handleChange}
                  className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-rose-400 outline-none"
                >
                  <option value="">-- Chọn Phim --</option>
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>{m.title} ({m.duration}p)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chọn Rạp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Rạp *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                <select
                  name="cinema"
                  value={formData.cinema}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData(prev => ({ ...prev, room: "" })); // Reset room khi đổi rạp
                  }}
                  className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-rose-400 outline-none"
                >
                  <option value="">-- Chọn Rạp --</option>
                  {cinemas.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} - {c.city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {/* Chọn Phòng */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Phòng *</label>
                <div className="relative">
                  <Armchair className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                  <select
                    name="room"
                    value={formData.room}
                    onChange={handleChange}
                    disabled={!formData.cinema} // Khóa nếu chưa chọn rạp
                    className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-rose-400 outline-none disabled:bg-gray-100"
                  >
                    <option value="">-- Chọn Phòng --</option>
                    {filteredRooms.map((r) => (
                      <option key={r._id} value={r._id}>{r.name} ({r.seats?.length || 'N/A'} ghế)</option>
                    ))}
                  </select>
                </div>
                {formData.cinema && filteredRooms.length === 0 && (
                   <p className="text-xs text-red-500 mt-1">Rạp này chưa có phòng nào.</p>
                )}
             </div>

             {/* Giờ chiếu */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu *</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-rose-400 outline-none"
                />
             </div>

             {/* Giá vé */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá vé cơ bản (VNĐ) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="VD: 75000"
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-rose-400 outline-none"
                />
             </div>
          </div>

          {/* Hiển thị thời gian kết thúc dự kiến */}
          {calculateEndTime() && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex items-center gap-2">
              <span className="font-semibold">Dự kiến kết thúc:</span> 
              {calculateEndTime().toLocaleString('vi-VN')} 
              (dựa trên thời lượng {movies.find(m => m._id === formData.movie)?.duration} phút)
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white p-2 rounded font-medium flex justify-center items-center gap-2 transition disabled:bg-rose-300"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {editingId ? "Cập nhật Suất Chiếu" : "Tạo Suất Chiếu"}
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

      {/* LIST SHOWTIMES */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách Suất Chiếu ({showtimes.length})</h3>
        
        {showtimes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Chưa có suất chiếu nào.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {showtimes.map((item) => (
              <div 
                key={item._id} 
                className="bg-white border p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-start hover:shadow-md transition"
              >
                {/* Cột thông tin Phim & Rạp */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded">
                      {new Date(item.startTime).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="text-gray-400 text-xs">|</span>
                    <span className="font-bold text-lg text-gray-800">
                      {new Date(item.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <ArrowRight size={14} className="text-gray-400"/>
                    <span className="text-gray-500 text-sm">
                      {item.endTime ? new Date(item.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '...'}
                    </span>
                  </div>

                  <h4 className="font-bold text-xl text-rose-600 mb-1">
                    {item.movie?.title || "Phim đã xóa"}
                  </h4>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-gray-400"/>
                      <span className="font-medium">{item.cinema?.name}</span> 
                      <span className="text-gray-400">- {item.cinema?.city}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Armchair size={14} className="text-gray-400"/>
                      <span>Phòng: <strong>{item.room?.name}</strong></span>
                    </p>
                  </div>
                </div>

                {/* Cột Giá & Action */}
                <div className="flex flex-row md:flex-col justify-between items-end gap-3 w-full md:w-auto">
                   <div className="text-right">
                      <p className="text-sm text-gray-500">Giá vé</p>
                      <p className="font-bold text-lg text-gray-900">
                        {item.price?.toLocaleString()} ₫
                      </p>
                   </div>

                   <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition"
                      >
                        <SquarePen size={14} /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition"
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}