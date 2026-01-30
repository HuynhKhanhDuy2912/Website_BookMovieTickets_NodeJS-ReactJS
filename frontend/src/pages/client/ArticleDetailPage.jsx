import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import { Calendar, ArrowLeft, Share2, Clock } from "lucide-react";

export default function ArticleDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]); // Bài viết liên quan
  const [loading, setLoading] = useState(true);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: article.title,
      text: `Đọc bài viết "${article.title}" tại Cinema Web nè!`,
      url: url,
    };

    try {
      // ƯU TIÊN 1: Share xịn trên điện thoại (Zalo, Mess...)
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      // ƯU TIÊN 2: Copy bằng API hiện đại (Chỉ chạy trên HTTPS/Localhost)
      try {
        await navigator.clipboard.writeText(url);
        alert("✅ Đã sao chép liên kết!");
      } catch (err) {
        throw new Error("Clipboard API failed"); // Ném lỗi để nhảy xuống fallback
      }

    } catch (err) {
      // ƯU TIÊN 3: CHIÊU CUỐI (Fallback thủ công - Chạy mọi lúc mọi nơi)
      try {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        
        // Giấu nó đi nhưng vẫn để nó thuộc về trang web
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        
        // Chọn và Copy
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea); // Xóa sau khi dùng xong

        if (successful) {
             alert("✅ Đã sao chép liên kết (Fallback)!");
        } else {
             alert("❌ Không thể sao chép, hãy copy thủ công từ thanh địa chỉ.");
        }
      } catch (fallbackErr) {
        console.error("Lỗi chia sẻ:", fallbackErr);
        alert("❌ Lỗi không xác định khi chia sẻ.");
      }
    }
  };
  
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        // 1. Lấy chi tiết bài viết
        const { data } = await api.get(`/article/${id}`); // API lấy 1 bài theo ID (nếu chưa có API này thì dùng get all rồi find)
        
        // Nếu API của bạn là getAll và lọc ở client (trường hợp backend chưa hỗ trợ getByID)
        // const list = await api.get("/article");
        // const found = list.data.find(a => a._id === id);
        
        // Giả sử backend đã hỗ trợ getByID chuẩn:
        setArticle(data);

        // 2. Lấy bài viết liên quan (Gọi lại get all và lấy ngẫu nhiên 3 bài khác)
        const allRes = await api.get("/article");
        const others = allRes.data.filter(a => a._id !== id).slice(0, 3);
        setRelatedArticles(others);

      } catch (err) {
        console.error("Lỗi tải bài viết:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo(0, 0); // Cuộn lên đầu trang khi chuyển bài
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!article) return <div className="text-center py-20 text-white">Bài viết không tồn tại.</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-20 pt-6">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Breadcrumb / Back Button */}
        <Link to="/articles" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 mb-6 transition">
           <ArrowLeft size={18} /> Quay lại Tin tức
        </Link>

        {/* === ARTICLE HEADER === */}
        <div className="mb-8">
           <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6 text-white">
              {article.title}
           </h1>
           
           <div className="flex flex-wrap items-center gap-6 text-gray-400 text-sm border-b border-gray-800 pb-6">
              <span className="flex items-center gap-2">
                 <Calendar size={16} className="text-yellow-500"/> 
                 {new Date(article.createdAt).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-2">
                 <Clock size={16} className="text-yellow-500"/> 5 phút đọc
              </span>
              <button onClick={handleShare} className="ml-auto flex items-center gap-2 text-blue-400 hover:text-blue-300 transition">
                 <Share2 size={16}/> Chia sẻ
              </button>
           </div>
        </div>

        {/* === FEATURED IMAGE === */}
        <div className="w-full h-[300px] md:h-[500px] rounded-2xl overflow-hidden mb-10 shadow-2xl">
           <img 
             src={article.image} 
             alt={article.title} 
             className="w-full h-full object-cover"
           />
        </div>

        {/* === CONTENT === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           
           {/* Cột Trái: Nội dung chính */}
           <div className="lg:col-span-2">
              <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed">
                 {/* Lưu ý: Nếu nội dung lưu dạng HTML (từ Editor), dùng dangerouslySetInnerHTML.
                    Nếu lưu dạng text thường, chỉ cần hiển thị trực tiếp.
                 */}
                 <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }} />
              </div>
           </div>

           {/* Cột Phải: Bài viết liên quan */}
           <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl p-6 sticky top-24">
                 <h3 className="text-xl font-bold mb-6 border-l-4 border-yellow-500 pl-3">Tin liên quan</h3>
                 <div className="flex flex-col gap-6">
                    {relatedArticles.map(item => (
                       <Link key={item._id} to={`/articles/${item._id}`} className="group flex gap-3 items-start">
                          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                             <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition"/>
                          </div>
                          <div>
                             <h4 className="font-bold text-sm line-clamp-2 group-hover:text-yellow-400 transition mb-1">
                                {item.title}
                             </h4>
                             <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                       </Link>
                    ))}
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}