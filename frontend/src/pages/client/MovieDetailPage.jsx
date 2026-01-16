import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { 
  Calendar, Clock, Star, PlayCircle, MapPin, 
  ChevronRight, Ticket, User, ArrowLeft 
} from "lucide-react";

// --- 1. HELPER XỬ LÝ ẢNH ---
const getImageUrl = (imageField) => {
  if (!imageField) return "https://placehold.co/400x600?text=No+Image";
  if (typeof imageField === 'object' && imageField !== null) {
    return imageField.secure_url || imageField.url || imageField.path || "https://placehold.co/400x600?text=Error+Obj";
  }
  if (typeof imageField === 'string') {
    if (imageField.startsWith("http")) return imageField;
    return `http://localhost:5000/${imageField.replace(/\\/g, '/').replace(/^\//, '')}`;
  }
  return "https://placehold.co/400x600?text=Format+Error";
};

// --- Helper ngày tháng ---
const getNext7Days = () => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State lịch chiếu
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // 1. FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [movieRes, showtimeRes, reviewRes] = await Promise.all([
          api.get(`/movie/${id}`),             
          api.get(`/showtime`),                
          api.get(`/review?movieId=${id}`)     
        ]);

        setMovie(movieRes.data);
        
        const allShowtimes = Array.isArray(showtimeRes.data) ? showtimeRes.data : [];
        const movieShowtimes = allShowtimes.filter(st => 
            (st.movie && (st.movie._id === id || st.movie === id))
        );
        setShowtimes(movieShowtimes);

        if(reviewRes?.data) setReviews(reviewRes.data);

      } catch (error) {
        console.error("Lỗi tải chi tiết phim:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id]);


  // 2. XỬ LÝ LỊCH CHIẾU
  const filteredShowtimes = showtimes.filter(st => {
    const stDate = new Date(st.startTime).toISOString().split('T')[0];
    const selectDateStr = formatDate(selectedDate);
    return stDate === selectDateStr;
  });

  const groupedShowtimes = filteredShowtimes.reduce((acc, st) => {
    const cinemaId = st.cinema?._id || st.cinema;
    if (!acc[cinemaId]) {
      acc[cinemaId] = { info: st.cinema, times: [] };
    }
    acc[cinemaId].times.push(st);
    return acc;
  }, {});

  // Loading UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!movie) return <div className="text-white text-center py-20">Không tìm thấy phim.</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-20">
      
      {/* ================= HERO SECTION ================= */}
      <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center blur-sm opacity-50 scale-110"
          style={{ backgroundImage: `url(${getImageUrl(movie.posterUrl)})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>

        <div className="container mx-auto px-4 h-full relative z-10 flex flex-col md:flex-row items-center md:items-end pb-10 gap-8 pt-20 md:pt-0">
          
          <Link to="/" className="absolute top-4 left-4 md:hidden text-white bg-black/50 p-2 rounded-full">
            <ArrowLeft size={24} />
          </Link>

          <div className="w-48 md:w-64 shrink-0 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20 relative group">
             <img 
               src={getImageUrl(movie.posterUrl)} 
               alt={movie.title} 
               className="w-full h-full object-cover"
               onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x600?text=Error"; }}
             />
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <PlayCircle size={48} className="text-white"/>
             </div>
          </div>

          <div className="flex-1 text-center md:text-left">
             <span className={`text-xs font-bold px-2 py-1 rounded uppercase mb-3 inline-block ${
                movie.status === 'now_showing' ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'
             }`}>
               {movie.status === 'now_showing' ? 'Đang chiếu' : 'Sắp chiếu'}
             </span>
             <h1 className="text-3xl md:text-5xl font-extrabold mb-2 text-white drop-shadow-lg">{movie.title}</h1>
             <p className="text-gray-300 text-lg mb-4 italic font-medium">
                {Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre}
             </p>
             
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-gray-200 mb-6">
               <span className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/10">
                 <Clock size={16} className="text-yellow-500"/> {movie.duration} phút
               </span>
               <span className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/10">
                 <Calendar size={16} className="text-yellow-500"/> {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}
               </span>
               <span className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/10">
                 <Star size={16} className="text-yellow-500"/> {movie.rating || 0}/10 ({reviews.length} đánh giá)
               </span>
             </div>

             <div className="flex gap-4 justify-center md:justify-start">
               {movie.trailerUrl && (
                 <button 
                    onClick={() => window.open(movie.trailerUrl, '_blank')}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 md:px-8 py-3 rounded-full font-bold flex items-center gap-2 transition shadow-lg hover:shadow-red-600/40"
                 >
                   <PlayCircle size={20}/> Trailer
                 </button>
               )}
               <button 
                  onClick={() => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' })}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 md:px-8 py-3 rounded-full font-bold flex items-center gap-2 transition shadow-lg hover:shadow-yellow-500/40"
               >
                  <Ticket size={20}/> Mua Vé
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* ================= NỘI DUNG CHÍNH ================= */}
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* CỘT TRÁI: LỊCH CHIẾU & NỘI DUNG */}
        <div className="lg:col-span-2">
          
          {/* 1. Nội dung phim */}
          <section className="mb-10 bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 border-l-4 border-yellow-500 pl-3 text-white">Nội Dung Phim</h2>
            <p className="text-gray-300 leading-relaxed text-justify mb-6">
              {movie.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-gray-700 pt-4">
               <div><span className="text-gray-500">Đạo diễn:</span> <span className="text-white font-medium ml-2">{movie.director || "Đang cập nhật"}</span></div>
               <div><span className="text-gray-500">Diễn viên:</span> <span className="text-white font-medium ml-2">{movie.actor || "Đang cập nhật"}</span></div>
               <div><span className="text-gray-500">Quốc gia:</span> <span className="text-white font-medium ml-2">{movie.country || "Đang cập nhật"}</span></div>
               <div><span className="text-gray-500">Độ tuổi:</span> <span className="text-white font-medium ml-2 bg-red-600 px-2 rounded text-xs">{movie.ageRating || "P"}</span></div>
            </div>
          </section>

          {/* 2. Lịch chiếu (Booking Section) */}
          <section id="booking-section" className="mb-10">
             <h2 className="text-2xl font-bold mb-6 border-l-4 border-yellow-500 pl-3 text-white">Lịch Chiếu</h2>
             
             {/* Chọn Ngày */}
             <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-gray-700">
                {getNext7Days().map((date, idx) => {
                   const isActive = formatDate(date) === formatDate(selectedDate);
                   const dayName = idx === 0 ? "Hôm nay" : `Thứ ${date.getDay() + 1 === 1 ? 'CN' : date.getDay() + 1}`;
                   return (
                      <button 
                        key={idx}
                        onClick={() => setSelectedDate(date)}
                        className={`min-w-[80px] p-3 rounded-xl text-center transition border ${
                           isActive 
                             ? "bg-yellow-500 text-black border-yellow-500 font-bold shadow-lg shadow-yellow-500/20" 
                             : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
                        }`}
                      >
                         <div className="text-xs uppercase mb-1">{dayName}</div>
                         <div className="text-xl font-bold">{date.getDate()}/{date.getMonth() + 1}</div>
                      </button>
                   )
                })}
             </div>

             {/* Danh sách Rạp & Giờ chiếu */}
             <div className="space-y-4">
                {Object.keys(groupedShowtimes).length > 0 ? (
                   Object.keys(groupedShowtimes).map(cinemaId => {
                      const { info, times } = groupedShowtimes[cinemaId];
                      return (
                         <div key={cinemaId} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition">
                            {/* Tên rạp */}
                            <div className="flex items-start gap-4 mb-5 border-b border-gray-700 pb-4">
                               <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center shrink-0 border border-gray-600">
                                  <MapPin size={24} className="text-yellow-500"/>
                               </div>
                               <div>
                                  <h3 className="font-bold text-lg text-white group-hover:text-yellow-500 transition">{info?.name || "Cụm rạp"}</h3>
                                  <p className="text-sm text-gray-400 mt-1">{info?.address || "Địa chỉ đang cập nhật"}</p>
                               </div>
                            </div>
                            
                            {/* List Giờ chiếu (ĐÃ CẬP NHẬT LOGIC ẨN GIỜ) */}
                            <div>
                               <span className="text-xs font-bold text-gray-500 mb-3 block uppercase tracking-wider">2D Phụ đề</span>
                               <div className="flex flex-wrap gap-3">
                                  {times
                                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                                    .map(st => {
                                      const now = new Date();
                                      const startTime = new Date(st.startTime);
                                      // Kiểm tra xem suất chiếu đã qua chưa
                                      const isExpired = startTime <= now;

                                      if (isExpired) {
                                        return (
                                          <span 
                                            key={st._id} 
                                            className="px-5 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-500 text-sm font-bold cursor-not-allowed select-none opacity-60"
                                            title="Suất chiếu đã bắt đầu"
                                          >
                                            {startTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                        );
                                      }

                                      return (
                                        <Link 
                                           key={st._id} 
                                           to={`/booking/${st._id}`} 
                                           className="px-5 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition text-sm font-bold shadow-sm"
                                        >
                                           {startTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                        </Link>
                                      );
                                    })
                                  }
                               </div>
                            </div>
                         </div>
                      )
                   })
                ) : (
                   <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-dashed border-gray-700 text-gray-500">
                      <Calendar size={48} className="mx-auto mb-3 opacity-30"/>
                      <p>Chưa có lịch chiếu nào cho ngày này.</p>
                   </div>
                )}
             </div>
          </section>

          {/* 3. Review Section */}
          <section>
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold border-l-4 border-yellow-500 pl-3 text-white">Bình Luận</h2>
                <button className="text-yellow-500 hover:text-yellow-400 text-sm font-bold flex items-center gap-1">
                   Viết đánh giá <ChevronRight size={16}/>
                </button>
             </div>
             
             <div className="space-y-4">
                {reviews.length > 0 ? reviews.map((review, idx) => (
                   <div key={idx} className="bg-gray-800 p-5 rounded-xl flex gap-4 border border-gray-700">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-lg">
                         {review.user?.name?.charAt(0) || <User size={20}/>}
                      </div>
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white">{review.user?.name || "Người dùng ẩn danh"}</span>
                            <div className="flex text-yellow-500 text-xs gap-0.5">
                               {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={12} fill={i < (review.rating || 5) ? "currentColor" : "none"} className={i >= (review.rating || 5) ? "text-gray-600" : ""}/>
                               ))}
                            </div>
                         </div>
                         <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                         <span className="text-xs text-gray-500 mt-2 block">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                   </div>
                )) : (
                   <div className="text-center py-8 text-gray-500 bg-gray-800/30 rounded-lg">
                      Chưa có đánh giá nào. Hãy là người đầu tiên!
                   </div>
                )}
             </div>
          </section>

        </div>

        {/* CỘT PHẢI: PHIM LIÊN QUAN */}
        <div className="hidden lg:block">
           <div className="bg-gray-800 rounded-xl p-6 sticky top-24 border border-gray-700 shadow-xl">
              <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                 <Star size={20} className="text-yellow-500" fill="currentColor"/> Phim Đang Hot
              </h3>
              <div className="space-y-5">
                 {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4 group cursor-pointer border-b border-gray-700 pb-4 last:border-0 last:pb-0">
                       <div className="w-16 h-24 bg-gray-700 rounded-lg overflow-hidden shrink-0 shadow-md">
                          <img src={`https://placehold.co/100x150?text=Phim+${i}`} alt="Related" className="w-full h-full object-cover group-hover:scale-110 transition duration-500"/>
                       </div>
                       <div>
                          <h4 className="font-bold text-sm mb-1 text-white group-hover:text-yellow-500 transition line-clamp-2">Siêu Phẩm Hành Động {i}</h4>
                          <p className="text-xs text-gray-500 mb-1">Hành động, Phiêu lưu</p>
                          <span className="text-xs text-yellow-500 font-bold flex items-center gap-1">
                             <Star size={10} fill="currentColor"/> 9.{i}
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
              <Link to="/movies" className="block mt-6 text-center text-sm font-bold text-gray-400 hover:text-white border border-gray-600 rounded-lg py-3 hover:bg-gray-700 transition">
                 Xem tất cả phim
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
}