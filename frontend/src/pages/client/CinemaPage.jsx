import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import { MapPin, Navigation, Search, Building2, ArrowRight } from "lucide-react";

export default function CinemaPage() {
  const [cinemas, setCinemas] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("Tất cả");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/cinema"); // Gọi API lấy danh sách rạp
        
        // 1. Lưu danh sách rạp
        // Nếu API trả về dạng { cinemas: [...] } thì sửa thành data.cinemas
        const list = Array.isArray(data) ? data : data.cinemas || []; 
        setCinemas(list);

        // 2. Lọc ra danh sách Thành Phố (loại bỏ trùng lặp)
        const uniqueCities = ["Tất cả", ...new Set(list.map((c) => c.city).filter(Boolean))];
        setCities(uniqueCities);

      } catch (err) {
        console.error("Lỗi tải danh sách rạp:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCinemas();
  }, []);

  // --- FILTER LOGIC ---
  const filteredCinemas = cinemas.filter((cinema) => {
    const matchCity = selectedCity === "Tất cả" || cinema.city === selectedCity;
    const matchSearch = cinema.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        cinema.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCity && matchSearch;
  });

  // --- LOADING UI ---
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
        
        {/* === HEADER === */}
        <div className="text-center mb-12">
           <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase tracking-wide">
              Hệ Thống Rạp Chiếu
           </h1>
           <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
             Trải nghiệm điện ảnh đỉnh cao với hệ thống màn hình IMAX, âm thanh Dolby Atmos tại các rạp chiếu hiện đại nhất trên toàn quốc.
           </p>
        </div>

        {/* === TOOLBAR (CITY FILTER & SEARCH) === */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg mb-10 border border-gray-700 flex flex-col md:flex-row gap-6 justify-between items-center">
           
           {/* 1. Các nút chọn Thành Phố */}
           <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition ${
                    selectedCity === city 
                      ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/30" 
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                  }`}
                >
                  {city}
                </button>
              ))}
           </div>

           {/* 2. Ô tìm kiếm rạp */}
           <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm rạp hoặc địa chỉ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-yellow-500 transition"
              />
           </div>
        </div>

        {/* === GRID LIST RẠP === */}
        {filteredCinemas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCinemas.map((cinema) => (
              <div key={cinema._id} className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/10 transition duration-300 flex flex-col h-full">
                
                {/* Hình ảnh Rạp (Nếu chưa có ảnh thật thì dùng ảnh placeholder xịn) */}
                <div className="h-48 overflow-hidden relative">
                   <img 
                     src={cinema.image || "https://images.unsplash.com/photo-1517604931442-710e8ed05feb?q=80&w=1000&auto=format&fit=crop"} 
                     alt={cinema.name}
                     className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                   />
                   <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
                      <MapPin size={12} className="text-yellow-500"/>
                      <span className="text-xs font-bold text-white uppercase">{cinema.city}</span>
                   </div>
                </div>

                {/* Nội dung */}
                <div className="p-6 flex-1 flex flex-col">
                   <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition">
                     {cinema.name}
                   </h3>
                   
                   <div className="flex items-start gap-2 text-gray-400 text-sm mb-4 flex-1">
                      <Navigation size={16} className="mt-1 text-gray-500 shrink-0"/>
                      <p>{cinema.address}</p>
                   </div>

                   {/* Nút hành động */}
                   <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700">
                      {/* Vì bạn chưa làm trang chi tiết rạp, tạm thời link về trang chọn phim hoặc alert */}
                      <Link 
                        to={`/cinema/${cinema._id}`}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2.5 rounded-lg text-center transition flex items-center justify-center gap-2"
                      >
                        <Building2 size={18} /> Xem Lịch Chiếu
                      </Link>
                      
                      <button 
                         className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition"
                         title="Xem bản đồ"
                         onClick={() => alert(`Đang mở bản đồ tới: ${cinema.address}`)}
                      >
                         <Navigation size={20} />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
             <div className="bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 size={32} className="text-gray-400" />
             </div>
             <h3 className="text-xl font-bold text-gray-300">Không tìm thấy rạp nào</h3>
             <p className="text-gray-500 mt-2">Vui lòng thử chọn khu vực khác hoặc tìm kiếm từ khóa khác.</p>
          </div>
        )}

      </div>
    </div>
  );
}