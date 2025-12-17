import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig"; // Axios instance của bạn
import { Calendar, Clock, ArrowRight, PlayCircle, Ticket } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [banners, setBanners] = useState([]);
  const [moviesNow, setMoviesNow] = useState([]);
  const [moviesComing, setMoviesComing] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab trạng thái: 'now' (Đang chiếu) hoặc 'coming' (Sắp chiếu)
  const [activeTab, setActiveTab] = useState("now");

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Gọi API lấy tất cả phim
        const resMovies = await api.get("/movie");
        const allMovies = resMovies.data;

        // Lọc phim theo trạng thái (Dựa vào Enum trong Model Movie của bạn)
        const nowShowing = allMovies.filter(m => m.status === "now_showing");
        const comingSoon = allMovies.filter(m => m.status === "coming_soon");

        setMoviesNow(nowShowing);
        setMoviesComing(comingSoon);
        
        // Lấy 3 phim mới nhất làm Banner (Slide)
        setBanners(nowShowing.slice(0, 3)); 

        // 2. Gọi API lấy bài viết
        const resArticles = await api.get("/article");
        setArticles(resArticles.data.slice(0, 4)); // Lấy 4 bài mới nhất

      } catch (error) {
        console.error("Lỗi tải dữ liệu Home:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- LOADING UI ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-20">
      
      {/* ================= SECTON 1: HERO BANNER (SLIDER) ================= */}
      <div className="relative w-full h-[500px] overflow-hidden">
        {/* Ở đây mình hiển thị banner đầu tiên (bạn có thể làm slider chạy tự động sau) */}
        {banners.length > 0 && (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-black/50 z-10"></div> {/* Lớp phủ tối */}
            <img 
              src={banners[0].posterUrl} 
              alt={banners[0].title} 
              className="w-full h-full object-cover object-top filter blur-sm scale-110" // Làm mờ nhẹ nền
            />
            
            {/* Nội dung Banner */}
            <div className="absolute inset-0 z-20 container mx-auto px-4 flex items-center h-full">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Poster Chính */}
                <img 
                   src={banners[0].posterUrl} 
                   alt={banners[0].title} 
                   className="w-48 md:w-64 rounded-lg shadow-2xl border-2 border-white/20 hidden md:block"
                />
                
                {/* Thông tin */}
                <div className="max-w-2xl text-center md:text-left">
                   <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block">
                      Phim Hot Nhất
                   </span>
                   <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
                      {banners[0].title}
                   </h1>
                   <div className="flex items-center justify-center md:justify-start gap-4 text-gray-300 text-sm mb-6">
                      <span className="flex items-center gap-1"><Clock size={16}/> {banners[0].duration} phút</span>
                      <span className="flex items-center gap-1"><Calendar size={16}/> {new Date(banners[0].releaseDate).toLocaleDateString('vi-VN')}</span>
                      <span className="border border-gray-500 px-2 rounded text-xs">{banners[0].ageRating}</span>
                   </div>
                   <p className="text-gray-300 mb-8 line-clamp-3 text-lg">
                      {banners[0].description}
                   </p>
                   
                   <div className="flex gap-4 justify-center md:justify-start">
                      <Link 
                        to={`/movie/${banners[0]._id}`} 
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition transform hover:scale-105"
                      >
                         <Ticket size={20}/> Đặt Vé Ngay
                      </Link>
                      <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 backdrop-blur-sm transition">
                         <PlayCircle size={20}/> Xem Trailer
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= SECTION 2: DANH SÁCH PHIM ================= */}
      <div className="container mx-auto px-4 py-16">
        
        {/* Tab Buttons */}
        <div className="flex items-center justify-center gap-8 mb-12">
          <button 
            onClick={() => setActiveTab("now")}
            className={`text-xl md:text-2xl font-bold pb-2 transition relative ${
              activeTab === "now" ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            PHIM ĐANG CHIẾU
            {activeTab === "now" && <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab("coming")}
            className={`text-xl md:text-2xl font-bold pb-2 transition relative ${
              activeTab === "coming" ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            PHIM SẮP CHIẾU
            {activeTab === "coming" && <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-full"></span>}
          </button>
        </div>

        {/* Movie Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {(activeTab === "now" ? moviesNow : moviesComing).map((movie) => (
            <div key={movie._id} className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-2">
              
              {/* Poster Image */}
              <div className="relative aspect-[2/3] overflow-hidden">
                <img 
                  src={movie.posterUrl} 
                  alt={movie.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
                
                {/* Overlay khi Hover */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center gap-4 p-4">
                  <Link 
                    to={`/movie/${movie._id}`} 
                    className="bg-yellow-500 text-black font-bold px-6 py-2 rounded-full hover:bg-yellow-400 w-full text-center"
                  >
                    Mua Vé
                  </Link>
                  <Link 
                    to={`/movie/${movie._id}`} 
                    className="border border-white text-white font-medium px-6 py-2 rounded-full hover:bg-white/10 w-full text-center"
                  >
                    Chi Tiết
                  </Link>
                </div>
                
                {/* Rating Badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold border border-yellow-500/50 text-yellow-500">
                  {movie.ageRating}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 truncate group-hover:text-yellow-400 transition">
                  {movie.title}
                </h3>
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>{movie.genre?.[0]}</span>
                  <span className="flex items-center gap-1"><Clock size={14}/> {movie.duration}'</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nút Xem tất cả */}
        <div className="text-center mt-12">
           <Link to="/movies" className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 font-semibold border border-yellow-500 px-6 py-2 rounded hover:bg-yellow-500/10 transition">
              Xem tất cả phim <ArrowRight size={18} />
           </Link>
        </div>
      </div>

      {/* ================= SECTION 3: TIN TỨC & KHUYẾN MÃI ================= */}
      <div className="bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
             <div>
                <span className="text-yellow-500 font-bold tracking-wider text-sm uppercase">Blog Cinema</span>
                <h2 className="text-3xl font-bold mt-1">Tin Tức & Khuyến Mãi</h2>
             </div>
             <Link to="/articles" className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                Xem thêm <ArrowRight size={16}/>
             </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((article) => (
              <div key={article._id} className="bg-gray-900 rounded-lg overflow-hidden hover:shadow-xl transition cursor-pointer group">
                 <div className="h-48 overflow-hidden">
                    <img 
                      src={article.thumbnail || "https://via.placeholder.com/300x200"} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                 </div>
                 <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-yellow-400 transition">
                      {article.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {article.content}
                    </p>
                    <span className="text-xs text-gray-500 uppercase font-semibold">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}