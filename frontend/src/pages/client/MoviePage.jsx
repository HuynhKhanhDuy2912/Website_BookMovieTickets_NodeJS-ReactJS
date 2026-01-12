import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/axiosConfig";
import { Search, Filter, Calendar, Clock, Ticket, Info } from "lucide-react";

export default function MoviePage() {
  const [searchParams] = useSearchParams();
  
  // --- STATE ---
  const [movies, setMovies] = useState([]); // Dữ liệu gốc
  const [filteredMovies, setFilteredMovies] = useState([]); // Dữ liệu đã lọc để hiển thị
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]); // Danh sách thể loại lấy từ phim

  // --- FILTER STATE ---
  // Lấy giá trị status từ URL nếu có (VD: /movies?status=now)
  const initialStatus = searchParams.get("status") === "now" ? "now_showing" 
                      : searchParams.get("status") === "coming" ? "coming_soon" 
                      : "all";

  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [filterGenre, setFilterGenre] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/movie");
        setMovies(data);
        setFilteredMovies(data);

        // Trích xuất tất cả thể loại từ danh sách phim (Làm phẳng mảng và loại bỏ trùng lặp)
        const allGenres = [...new Set(data.flatMap((movie) => movie.genre))];
        setGenres(allGenres.sort());
      } catch (err) {
        console.error("Lỗi tải phim:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  // --- 2. XỬ LÝ LỌC (Chạy mỗi khi filter thay đổi) ---
  useEffect(() => {
    let result = movies;

    // Lọc theo Trạng thái
    if (filterStatus !== "all") {
      result = result.filter((m) => m.status === filterStatus);
    }

    // Lọc theo Thể loại
    if (filterGenre !== "all") {
      result = result.filter((m) => m.genre?.includes(filterGenre));
    }

    // Lọc theo Từ khóa tìm kiếm
    if (searchTerm.trim() !== "") {
      result = result.filter((m) => 
        m.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMovies(result);
  }, [filterStatus, filterGenre, searchTerm, movies]);

  // --- UI LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-20 pt-10">
      <div className="container mx-auto px-4">
        
        {/* === TIÊU ĐỀ === */}
        <div className="text-center mb-10">
           <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 uppercase tracking-wide pt-10">
              Kho Phim Khổng Lồ
           </h1>
           <p className="text-gray-400 mt-2">Cập nhật liên tục các bộ phim hot nhất thị trường</p>
        </div>

        {/* === THANH CÔNG CỤ (FILTER BAR) === */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
             
             {/* 1. Bộ lọc Trạng thái (Tabs) */}
             <div className="flex bg-gray-900 rounded-lg p-1">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "now_showing", label: "Đang Chiếu" },
                  { id: "coming_soon", label: "Sắp Chiếu" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      filterStatus === tab.id 
                        ? "bg-yellow-500 text-black shadow" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
             </div>

             {/* 2. Bộ lọc Thể loại & Tìm kiếm */}
             <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                
                {/* Dropdown Thể loại */}
                <div className="relative">
                   <Filter size={18} className="absolute left-3 top-2.5 text-gray-400" />
                   <select 
                      value={filterGenre}
                      onChange={(e) => setFilterGenre(e.target.value)}
                      className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-10 p-2.5 outline-none appearance-none cursor-pointer hover:bg-gray-700 transition"
                   >
                      <option value="all">Tất cả thể loại</option>
                      {genres.map((g, idx) => (
                        <option key={idx} value={g}>{g}</option>
                      ))}
                   </select>
                </div>

                {/* Input Tìm kiếm */}
                <div className="relative">
                   <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                   <input 
                      type="text" 
                      placeholder="Tìm tên phim..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-10 p-2.5 outline-none focus:w-64 transition-all duration-300"
                   />
                </div>
             </div>
          </div>
        </div>

        {/* === DANH SÁCH PHIM (GRID) === */}
        {filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredMovies.map((movie) => (
              <div key={movie._id} className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300">
                
                {/* Poster & Overlay */}
                <div className="relative aspect-[2/3] overflow-hidden">
                   <img 
                     src={movie.posterUrl} 
                     alt={movie.title} 
                     className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                   />
                   
                   {/* Nhãn trạng thái */}
                   <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded uppercase shadow-md ${
                     movie.status === 'now_showing' 
                       ? 'bg-green-600 text-white' 
                       : 'bg-orange-500 text-white'
                   }`}>
                      {movie.status === 'now_showing' ? 'Đang chiếu' : 'Sắp chiếu'}
                   </span>

                   {/* Overlay Hover */}
                   <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-center items-center gap-3 p-4">
                      {movie.status === 'now_showing' && (
                        <Link 
                          to={`/movie/${movie._id}`} 
                          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded-full flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition duration-300"
                        >
                           <Ticket size={18}/> Mua Vé
                        </Link>
                      )}
                      
                      <Link 
                        to={`/movie/${movie._id}`} 
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-full flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition duration-300 delay-75"
                      >
                         <Info size={18}/> Chi Tiết
                      </Link>
                   </div>
                </div>

                {/* Thông tin Phim */}
                <div className="p-3">
                   <h3 className="font-bold text-base text-white mb-1 truncate group-hover:text-yellow-400 transition" title={movie.title}>
                      {movie.title}
                   </h3>
                   <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="flex items-center gap-1"><Clock size={12}/> {movie.duration}'</span>
                      <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 border border-gray-600">
                        {movie.ageRating}
                      </span>
                   </div>
                   <div className="text-xs text-gray-500 truncate">
                      {movie.genre?.join(", ")}
                   </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
             <div className="bg-gray-800 p-6 rounded-full mb-4">
                <Search size={48} className="text-gray-600" />
             </div>
             <p className="text-xl font-medium">Không tìm thấy phim nào phù hợp.</p>
             <button 
                onClick={() => {setFilterStatus("all"); setFilterGenre("all"); setSearchTerm("")}}
                className="mt-4 text-yellow-500 hover:underline"
             >
                Xóa bộ lọc
             </button>
          </div>
        )}

      </div>
    </div>
  );
}