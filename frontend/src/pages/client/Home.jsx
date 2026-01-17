import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig"; 
import { 
  Calendar, Clock, ArrowRight, PlayCircle, Ticket, 
  Search, X, ChevronLeft, ChevronRight 
} from "lucide-react"; // Thêm icon điều hướng

export default function Home() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [banners, setBanners] = useState([]);
  const [moviesNow, setMoviesNow] = useState([]);
  const [moviesComing, setMoviesComing] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("now");
  const [searchTerm, setSearchTerm] = useState("");

  // State cho Slider
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const resMovies = await api.get("/movie");
        const allMovies = resMovies.data;

        const nowShowing = allMovies.filter(m => m.status === "now_showing");
        const comingSoon = allMovies.filter(m => m.status === "coming_soon");

        setMoviesNow(nowShowing);
        setMoviesComing(comingSoon);
        
        // Lấy 5 phim làm slider cho phong phú
        if(nowShowing.length > 0) {
             setBanners(nowShowing.slice(0, 5)); 
        } else if (allMovies.length > 0) {
             setBanners(allMovies.slice(0, 5));
        }

        const resArticles = await api.get("/article");
        setArticles(resArticles.data.slice(0, 4));

      } catch (error) {
        console.error("Lỗi tải dữ liệu Home:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- LOGIC AUTO SLIDER ---
  useEffect(() => {
    if (banners.length === 0) return;

    // Tự động chuyển slide sau 5 giây
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);

    // Xóa interval khi unmount hoặc khi banners thay đổi
    return () => clearInterval(interval);
  }, [banners]);

  // Hàm chuyển slide thủ công
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // --- LOGIC LỌC PHIM ---
  const originalList = activeTab === "now" ? moviesNow : moviesComing;
  const displayedMovies = originalList.filter(movie => 
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-20">
      
      {/* ================= SECTION 1: HERO BANNER SLIDER ================= */}
      <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden group">
        {banners.length > 0 && (
          <>
            {/* Render danh sách banners xếp chồng lên nhau */}
            {banners.map((banner, index) => (
                <div 
                    key={banner._id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                >
                    {/* Background Image mờ */}
                    <div className="absolute inset-0 bg-black/50 z-10"></div> 
                    <img 
                      src={banner.posterUrl} 
                      alt={banner.title} 
                      className="w-full h-full object-cover object-top filter blur-sm scale-110" 
                    />
                    
                    {/* Content */}
                    <div className="absolute inset-0 z-20 container mx-auto px-4 flex items-center h-full">
                      <div className="flex flex-col md:flex-row gap-8 items-center w-full mt-10 md:mt-0">
                        {/* Poster chính (có hiệu ứng animate khi active) */}
                        <img 
                           src={banner.posterUrl} 
                           alt={banner.title} 
                           className={`w-40 md:w-64 rounded-lg shadow-2xl border-2 border-white/20 hidden md:block transition-transform duration-700 ${
                               index === currentIndex ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                           }`}
                        />
                        
                        <div className={`max-w-2xl text-center md:text-left transition-all duration-700 delay-200 ${
                             index === currentIndex ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
                        }`}>
                           <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block">
                              Đang chiếu
                           </span>
                           <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight drop-shadow-lg">
                              {banner.title}
                           </h1>
                           <div className="flex items-center justify-center md:justify-start gap-4 text-gray-300 text-sm mb-6">
                              <span className="flex items-center gap-1"><Clock size={16}/> {banner.duration} phút</span>
                              <span className="flex items-center gap-1"><Calendar size={16}/> {new Date(banner.releaseDate).toLocaleDateString('vi-VN')}</span>
                              <span className="border border-gray-500 px-2 rounded text-xs">{banner.ageRating}</span>
                           </div>
                           <p className="text-gray-300 mb-8 line-clamp-2 md:line-clamp-3 text-base md:text-lg drop-shadow-md">
                              {banner.description}
                           </p>
                           
                           <div className="flex gap-4 justify-center md:justify-start">
                              <Link 
                                to={`/movie/${banner._id}`} 
                                className="bg-red-600 hover:bg-red-700 text-white px-6 md:px-8 py-3 rounded-full font-bold flex items-center gap-2 transition transform hover:scale-105 shadow-lg shadow-red-600/30"
                              >
                                 <Ticket size={20}/> Đặt Vé
                              </Link>
                              <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 backdrop-blur-sm transition border border-white/30">
                                 <PlayCircle size={20}/> Trailer
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                </div>
            ))}

            {/* Nút Điều Hướng (Chỉ hiện khi hover vào banner) */}
            <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-yellow-500 hover:text-black text-white p-3 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-yellow-500 hover:text-black text-white p-3 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
            >
                <ChevronRight size={24} />
            </button>

            {/* Dots Indicator (Dấu chấm tròn bên dưới) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {banners.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            idx === currentIndex ? "bg-yellow-500 w-8" : "bg-white/50 hover:bg-white"
                        }`}
                    />
                ))}
            </div>
          </>
        )}
      </div>

      {/* ================= SECTION 2: DANH SÁCH PHIM & TÌM KIẾM ================= */}
      <div className="container mx-auto px-4 py-16">
        
        {/* --- THANH TÌM KIẾM --- */}
        <div className="max-w-xl mx-auto mb-10 relative">
            <div className="relative group">
                <input 
                    type="text" 
                    placeholder="Tìm kiếm phim theo tên..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-full py-3 pl-12 pr-10 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition shadow-lg"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition" size={20} />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm("")}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center justify-center gap-8 mb-12">
          <button 
            onClick={() => { setActiveTab("now"); setSearchTerm(""); }}
            className={`text-xl md:text-2xl font-bold pb-2 transition relative ${
              activeTab === "now" ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            PHIM ĐANG CHIẾU
            {activeTab === "now" && <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-full"></span>}
          </button>
          <button 
            onClick={() => { setActiveTab("coming"); setSearchTerm(""); }}
            className={`text-xl md:text-2xl font-bold pb-2 transition relative ${
              activeTab === "coming" ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            PHIM SẮP CHIẾU
            {activeTab === "coming" && <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-full"></span>}
          </button>
        </div>

        {/* Movie Grid */}
        {displayedMovies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {displayedMovies.map((movie) => (
                <div key={movie._id} className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-2">
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <img 
                      src={movie.posterUrl} 
                      alt={movie.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center gap-4 p-4">
                      <Link to={`/movie/${movie._id}`} className="bg-yellow-500 text-black font-bold px-6 py-2 rounded-full hover:bg-yellow-400 w-full text-center shadow-lg">Mua Vé</Link>
                      <Link to={`/movie/${movie._id}`} className="border border-white text-white font-medium px-6 py-2 rounded-full hover:bg-white/10 w-full text-center">Chi Tiết</Link>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold border border-yellow-500/50 text-yellow-500">
                      {movie.ageRating}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 truncate group-hover:text-yellow-400 transition">{movie.title}</h3>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>{movie.genre?.[0]}</span>
                      <span className="flex items-center gap-1"><Clock size={14}/> {movie.duration}'</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        ) : (
            <div className="text-center py-16">
                <div className="inline-block p-4 rounded-full bg-gray-800 mb-4"><Search className="text-gray-500" size={48} /></div>
                <h3 className="text-xl font-bold text-gray-300">Không tìm thấy phim nào</h3>
                <p className="text-gray-500 mt-2">Thử tìm kiếm với từ khóa khác xem sao!</p>
            </div>
        )}

        <div className="text-center mt-12">
           <Link to="/movies" className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 font-semibold border border-yellow-500 px-6 py-2 rounded hover:bg-yellow-500/10 transition">
              Xem tất cả phim <ArrowRight size={18} />
           </Link>
        </div>
      </div>

      {/* ================= SECTION 3: TIN TỨC ================= */}
      <div className="bg-gray-800 py-16 border-t border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
             <div>
                <span className="text-yellow-500 font-bold tracking-wider text-sm uppercase">Blog Cinema</span>
                <h2 className="text-3xl font-bold mt-1">Tin Tức & Khuyến Mãi</h2>
             </div>
             <Link to="/articles" className="text-gray-400 hover:text-white flex items-center gap-1 text-sm group">
                Xem thêm <ArrowRight size={16} className="group-hover:translate-x-1 transition"/>
             </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((article) => (
              <div key={article._id} className="bg-gray-900 rounded-lg overflow-hidden hover:shadow-xl transition cursor-pointer group border border-gray-800 hover:border-gray-700">
                 <div className="h-48 overflow-hidden relative">
                    <img src={article.image || "https://via.placeholder.com/300x200"} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
                 </div>
                 <div className="p-4 relative">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-yellow-400 transition h-[3.5rem]">{article.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 h-[2.5rem]">{article.content}</p>
                    <span className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1"><Calendar size={12}/> {new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}