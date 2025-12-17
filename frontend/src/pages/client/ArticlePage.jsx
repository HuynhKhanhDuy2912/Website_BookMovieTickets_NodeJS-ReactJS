import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import { Calendar, ArrowRight, Search, Tag } from "lucide-react";

export default function ArticlePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/article");
        // Sắp xếp bài mới nhất lên đầu
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setArticles(sorted);
      } catch (err) {
        console.error("Lỗi tải tin tức:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  {articles.map((article) => {
   console.log("Dữ liệu bài viết:", article); // <--- THÊM DÒNG NÀY
   console.log("Link ảnh:", article.thumbnail); // <--- THÊM DÒNG NÀY ĐỂ SOI
   
   return (
      <div key={article._id}>...</div>
   )
})}
  // --- FILTER ---
  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tách bài mới nhất làm Hero (Bài nổi bật)
  const heroArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const listArticles = filteredArticles.length > 0 ? filteredArticles.slice(1) : [];

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
        
        {/* === HEADER & SEARCH === */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
             <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 uppercase">
                Tin Tức & Sự Kiện
             </h1>
             <p className="text-gray-400 mt-2">Cập nhật tin điện ảnh, khuyến mãi và review phim mới nhất.</p>
          </div>
          
          <div className="relative w-full md:w-72">
             <Search size={18} className="absolute left-3 top-3 text-gray-400" />
             <input 
               type="text" 
               placeholder="Tìm bài viết..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-gray-800 border border-gray-700 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-yellow-500 transition"
             />
          </div>
        </div>

        {/* === HERO SECTION (BÀI MỚI NHẤT) === */}
        {heroArticle && !searchTerm && (
          <div className="mb-16 relative group cursor-pointer">
            <Link to={`/articles/${heroArticle._id}`} className="block relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroArticle.thumbnail || "https://via.placeholder.com/1200x600"} 
                alt={heroArticle.title} 
                className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 p-6 md:p-10 max-w-3xl">
                 <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded uppercase mb-3 inline-block">
                    Mới Nhất
                 </span>
                 <h2 className="text-2xl md:text-4xl font-bold mb-3 leading-tight group-hover:text-yellow-400 transition">
                    {heroArticle.title}
                 </h2>
                 <p className="text-gray-300 line-clamp-2 md:line-clamp-3 mb-4 text-base md:text-lg">
                    {articleContentPreview(heroArticle.content)}
                 </p>
                 <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><Calendar size={16}/> {new Date(heroArticle.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span className="flex items-center gap-1 text-yellow-500 font-semibold">Đọc tiếp <ArrowRight size={16}/></span>
                 </div>
              </div>
            </Link>
          </div>
        )}

        {/* === GRID LIST ARTICLES === */}
        {listArticles.length > 0 || (heroArticle && searchTerm) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(searchTerm ? filteredArticles : listArticles).map((article) => (
              <Link key={article._id} to={`/articles/${article._id}`} className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500/50 hover:shadow-xl transition duration-300 flex flex-col h-full">
                
                {/* Thumbnail */}
                <div className="h-48 overflow-hidden relative">
                   <img 
                     src={article.thumbnail || "https://via.placeholder.com/400x300"} 
                     alt={article.title}
                     className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                   />
                   <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1">
                      <Tag size={10} className="text-yellow-500"/> TIN TỨC
                   </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                   <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition">
                     {article.title}
                   </h3>
                   <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                     {articleContentPreview(article.content)}
                   </p>
                   
                   <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-auto text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span className="group-hover:translate-x-1 transition duration-300 text-yellow-500 font-medium">Chi tiết &rarr;</span>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          !heroArticle && (
            <div className="text-center py-20 text-gray-500">
              <p>Chưa có bài viết nào.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// Helper cắt ngắn nội dung (nếu backend ko có field summary)
const articleContentPreview = (content) => {
  if (!content) return "";
  // Nếu content là HTML, bạn có thể cần dùng thư viện strip-html
  return content.substring(0, 150) + "..."; 
};