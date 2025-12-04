import { useEffect, useState } from "react";
import api from "../../api/axiosConfig"; // ⚠️ Đảm bảo đường dẫn trỏ đúng file axios config
import {
  getAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../../api/articleService";
import { Loader2, Trash2, SquarePen, ImagePlus } from "lucide-react";

// --- HÀM UPLOAD ẢNH (Dùng chung logic với Movie) ---
const uploadFileService = async (file) => {
  const formData = new FormData();
  formData.append("image", file); // Key 'image' phải khớp backend

  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.imageUrl;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false); // Trạng thái đang tải
  const [editingId, setEditingId] = useState(null);

  // Gom nhóm state form
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: "", // Đây là URL ảnh (cũ hoặc sau khi upload xong)
    tags: "", // Nhập chuỗi, sẽ tách thành mảng khi submit
  });

  const [imageFile, setImageFile] = useState(null); // File ảnh mới được chọn

  // Lấy danh sách bài viết
  const fetchArticles = async () => {
    try {
      const { data } = await getAllArticles();
      setArticles(data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách bài viết", err);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Xử lý thay đổi input text
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form về ban đầu
  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: "", content: "", image: "", tags: "" });
    setImageFile(null);
  };

  // Tạo / Cập nhật bài viết
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      return alert("Tiêu đề và nội dung là bắt buộc");
    }

    setLoading(true); // Bắt đầu loading

    try {
      let finalImageUrl = formData.image;

      // 1. Nếu có chọn file ảnh mới -> Upload lên Cloudinary
      if (imageFile) {
        finalImageUrl = await uploadFileService(imageFile);
      }

      // 2. Chuẩn bị dữ liệu gửi đi
      const articleData = {
        title: formData.title,
        content: formData.content,
        image: finalImageUrl || null,
        // Tách chuỗi tags thành mảng, loại bỏ khoảng trắng thừa
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      // 3. Gọi API Lưu
      if (editingId) {
        await updateArticle(editingId, articleData);
        alert("✅ Cập nhật bài viết thành công");
      } else {
        await createArticle(articleData);
        alert("✅ Tạo bài viết thành công");
      }

      resetForm();
      fetchArticles();
    } catch (err) {
      alert("❌ Lỗi khi lưu bài viết: " + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false); // Kết thúc loading
    }
  };

  // Xử lý xóa
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await deleteArticle(id);
      fetchArticles();
    } catch (err) {
      alert("Lỗi khi xóa bài viết");
      console.error(err);
    }
  };

  // Đổ dữ liệu vào form để sửa
  const handleEdit = (article) => {
    setEditingId(article._id);
    setFormData({
      title: article.title,
      content: article.content,
      image: article.image || "",
      tags: article.tags ? article.tags.join(", ") : "",
    });
    setImageFile(null); // Reset file mới
    // Scroll lên đầu trang để sửa cho dễ
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Quản lý Bài Viết</h1>

      {/* Form tạo/cập nhật */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border">
        <h2 className="text-xl font-semibold mb-4 text-blue-600 flex items-center gap-2">
          {editingId ? <SquarePen size={20}/> : <ImagePlus size={20}/>}
          {editingId ? "Cập nhật bài viết" : "Tạo bài viết mới"}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
            <input
              type="text"
              name="title"
              placeholder="Nhập tiêu đề bài viết..."
              className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             {/* Upload Ảnh */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh bìa</label>
                <div className="border border-dashed border-gray-300 p-3 rounded bg-gray-50">
                  {/* Xem trước ảnh */}
                  {(imageFile || formData.image) && (
                    <div className="mb-2">
                       <img 
                          src={imageFile ? URL.createObjectURL(imageFile) : formData.image} 
                          alt="Preview" 
                          className="h-32 w-full object-cover rounded border"
                       />
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => setImageFile(e.target.files[0])}
                  />
                  {formData.image && !imageFile && (
                    <p className="text-xs text-gray-500 mt-1 italic">Đang dùng ảnh cũ. Chọn ảnh mới để thay thế.</p>
                  )}
                </div>
             </div>

             {/* Tags */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (cách nhau dấu phẩy)</label>
                <input
                  type="text"
                  name="tags"
                  placeholder="Ví dụ: Review, Bom tấn, Hành động"
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none h-[42px]" // hack height to match file input area roughly
                  value={formData.tags}
                  onChange={handleChange}
                />
             </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung *</label>
            <textarea
              name="content"
              placeholder="Nội dung chi tiết..."
              className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none min-h-[150px]"
              value={formData.content}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded font-medium flex items-center justify-center gap-2 min-w-[120px] transition disabled:bg-blue-300"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {editingId ? "Lưu thay đổi" : "Đăng bài"}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded font-medium"
              >
                Hủy bỏ
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Danh sách bài viết */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Danh sách ({articles.length})</h2>
        <div className="grid grid-cols-1 gap-4">
          {articles.map((article) => (
            <div
              key={article._id}
              className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition"
            >
              {/* Ảnh thumb */}
              <div className="w-full sm:w-48 h-32 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                 {article.image ? (
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Không có ảnh</div>
                 )}
              </div>

              {/* Nội dung */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{article.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">{article.content}</p>
                  
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map((tag, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full border">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-3 sm:mt-0">
                  <button
                    onClick={() => handleEdit(article)}
                    className="flex items-center gap-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-1.5 rounded text-sm font-medium transition"
                  >
                    <SquarePen size={16} /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(article._id)}
                    className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded text-sm font-medium transition"
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
          {articles.length === 0 && (
             <p className="text-center text-gray-500 py-8">Chưa có bài viết nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}