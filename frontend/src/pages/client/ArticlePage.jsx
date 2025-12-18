import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import { Calendar, Search, Tag } from "lucide-react"; // Đã bỏ ArrowRight vì ko dùng Hero nữa

export default function ArticlePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/article");
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

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* === GRID LIST ARTICLES (TẤT CẢ BÀI VIẾT) === */}
        {filteredArticles.length > 0 ? (
          // Grid: Mobile 1 cột, Tablet 2 cột, PC 4 cột
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredArticles.map((article) => (
              <Link key={article._id} to={`/articles/${article._id}`} className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500/50 hover:shadow-xl transition duration-300 flex flex-col h-full">
                
                {/* Thumbnail */}
                <div className="h-40 overflow-hidden relative">
                   <img 
                     src={article.image || "https://via.placeholder.com/400x300"} 
                     alt={article.title}
                     className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                   />
                   <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1">
                      <Tag size={10} className="text-yellow-500"/> TIN TỨC
                   </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                   <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition">
                     {article.title}
                   </h3>
                   <p className="text-gray-400 text-xs line-clamp-3 mb-4 flex-1">
                     {articleContentPreview(article.content)}
                   </p>
                   
                   <div className="flex items-center justify-between pt-3 border-t border-gray-700 mt-auto text-[10px] text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span className="group-hover:translate-x-1 transition duration-300 text-yellow-500 font-medium cursor-pointer">Chi tiết &rarr;</span>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p>Chưa có bài viết nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const articleContentPreview = (content) => {
  if (!content) return "";
  return content.substring(0, 100) + "..."; 
};