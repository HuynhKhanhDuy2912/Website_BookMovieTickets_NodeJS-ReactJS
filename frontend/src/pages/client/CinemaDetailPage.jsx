import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import { MapPin, Calendar, Clock, Film, ChevronRight } from "lucide-react";

export default function CinemaDetailPage() {
    const { id } = useParams(); // Lấy ID rạp từ URL
    const [cinema, setCinema] = useState(null);
    const [moviesByShowtime, setMoviesByShowtime] = useState([]); // Danh sách phim đã được gom nhóm
    const [loading, setLoading] = useState(true);
    const API_BASE_URL = "http://localhost:5000";
    const PLACEHOLDER_IMG = "https://placehold.co/150x200?text=No+Image";

    const getImageUrl = (imageField) => {
        // 1. Trường hợp không có dữ liệu
        if (!imageField) return PLACEHOLDER_IMG;

        // 2. Trường hợp là Object (dữ liệu từ Cloudinary hoặc Multer trả về)
        if (typeof imageField === 'object') {
            return imageField.secure_url || imageField.url || PLACEHOLDER_IMG;
        }

        // 3. Trường hợp là String (đường dẫn ảnh)
        if (typeof imageField === 'string') {
            // Nếu là link online (bắt đầu bằng http hoặc https) -> Trả về luôn
            if (imageField.startsWith("http")) return imageField;

            // Nếu là đường dẫn local -> Xử lý dấu gạch chéo và ghép với server URL
            const cleanPath = imageField.replace(/\\/g, '/').replace(/^\//, '');
            return `${API_BASE_URL}/${cleanPath}`;
        }

        // 4. Trường hợp dữ liệu rác/không hợp lệ
        return PLACEHOLDER_IMG;
    };
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Lấy thông tin Rạp
                try {
                    const cinemaRes = await api.get(`/cinema/${id}`);
                    setCinema(cinemaRes.data);
                } catch (e) {
                    console.warn("Lỗi lấy info rạp");
                }

                // 2. Lấy danh sách suất chiếu (DÙNG API MỚI) 👇
                // API này đã được backend populate đầy đủ posterUrl
                const showtimeRes = await api.get(`/showtime/cinema/${id}`);
                const cinemaShowtimes = showtimeRes.data;

                // 3. GOM NHÓM (Logic giữ nguyên)
                const grouped = {};
                cinemaShowtimes.forEach(st => {
                    const movie = st.movie;
                    if (!movie) return;
                    const movieId = movie._id || movie;

                    if (!grouped[movieId]) {
                        grouped[movieId] = {
                            movie: movie,
                            showtimes: []
                        };
                    }
                    grouped[movieId].showtimes.push(st);
                });

                setMoviesByShowtime(Object.values(grouped));

            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-gray-900 flex justify-center items-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-yellow-500"></div></div>;

    return (
        <div className="bg-gray-900 min-h-screen text-white pb-20 pt-10">
            <div className="container mx-auto px-4">

                {/* HEADER THÔNG TIN RẠP */}
                <div className="bg-gray-800 rounded-xl p-8 mb-10 border border-gray-700 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-yellow-500 mb-2 uppercase">{cinema?.name || "Chi Tiết Rạp"}</h1>
                        <p className="text-gray-400 flex items-center gap-2 text-lg"><MapPin size={20} /> {cinema?.address}</p>
                    </div>
                    {/* Background mờ ảo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                </div>

                {/* DANH SÁCH PHIM ĐANG CHIẾU TẠI RẠP NÀY */}
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-l-4 border-yellow-500 pl-4">
                    <Film /> Phim Đang Chiếu
                </h2>

                {moviesByShowtime.length > 0 ? (
                    <div className="space-y-6">
                        {moviesByShowtime.map((item) => (
                            <div key={item.movie._id} className="bg-gray-800/50 rounded-xl p-4 md:p-6 border border-gray-700 flex flex-col md:flex-row gap-6 hover:border-gray-600 transition">

                                {/* 1. Poster Phim */}
                                <div className="w-full md:w-32 md:h-48 shrink-0 rounded-lg overflow-hidden bg-black">
                                    <img
                                        src={getImageUrl(item.movie.posterUrl)}
                                        alt={item.movie.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* 2. Thông tin & Suất chiếu */}
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-2">{item.movie.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.movie.description || "Mô tả đang cập nhật..."}</p>

                                    <div className="bg-black/20 rounded-lg p-4">
                                        <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                                            <Calendar size={14} /> Lịch chiếu hôm nay:
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            {item.showtimes
                                                .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)) // Sắp xếp giờ tăng dần
                                                .map((st) => (
                                                    <Link
                                                        key={st._id}
                                                        to={`/booking/${st._id}`}
                                                        className="bg-gray-700 hover:bg-yellow-500 hover:text-black text-white px-4 py-2 rounded-lg text-sm font-bold border border-gray-600 transition flex items-center gap-2 group"
                                                    >
                                                        {new Date(st.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all w-0 group-hover:w-auto" />
                                                    </Link>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-800 rounded-xl border border-dashed border-gray-700">
                        <p className="text-gray-400">Hiện tại rạp này chưa có lịch chiếu nào.</p>
                    </div>
                )}

            </div>
        </div>
    );
}