import { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { getAllArticles, createArticle, updateArticle, deleteArticle } from "../../api/articleService";
import { Loader2, Trash2, SquarePen, Newspaper, Image as ImageIcon } from "lucide-react";

const uploadFileService = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
  return response.data.imageUrl;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "", image: "", tags: "" });

  useEffect(() => { fetchArticles(); }, []);

  const fetchArticles = async () => {
    try { const { data } = await getAllArticles(); setArticles(data); } catch (err) { console.error(err); }
  };

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: "", content: "", image: "", tags: "" });
    setImageFile(null);
  };

  const handleEdit = (article) => {
    setEditingId(article._id);
    setFormData({ title: article.title, content: article.content, image: article.image || "", tags: article.tags ? article.tags.join(", ") : "" });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return alert("Tiêu đề và nội dung là bắt buộc");
    setLoading(true);

    try {
      let finalImageUrl = formData.image;
      if (imageFile) finalImageUrl = await uploadFileService(imageFile);

      const articleData = { ...formData, image: finalImageUrl || null, tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [] };

      if (editingId) { await updateArticle(editingId, articleData); alert("✅ Cập nhật thành công"); } 
      else { await createArticle(articleData); alert("✅ Tạo bài viết thành công"); }
      
      resetForm();
      fetchArticles();
    } catch (err) { alert("❌ Lỗi: " + err.message); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa bài viết này?")) return;
    try { await deleteArticle(id); fetchArticles(); } catch (err) { alert("Lỗi khi xóa"); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
        <Newspaper className="text-teal-600" /> Quản lý Tin Tức
      </h2>

      {/* Form Article - Teal Theme */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-teal-100">
        <h3 className="text-lg font-semibold mb-4 text-teal-600">{editingId ? "Cập nhật Bài Viết" : "Soạn Bài Mới"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
            <input name="title" value={formData.title} onChange={handleChange} placeholder="Tiêu đề bài viết..." className="border p-2 w-full rounded focus:ring-2 focus:ring-teal-400 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh bìa</label>
                <div className="flex items-center gap-4 border p-2 rounded bg-gray-50">
                   <input type="file" accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" onChange={(e) => setImageFile(e.target.files[0])} />
                   {(imageFile || formData.image) && <img src={imageFile ? URL.createObjectURL(imageFile) : formData.image} alt="Preview" className="h-12 w-16 object-cover rounded border" />}
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input name="tags" value={formData.tags} onChange={handleChange} placeholder="Review, Khuyến mãi..." className="border p-2 w-full rounded focus:ring-2 focus:ring-teal-400 outline-none h-[58px]" />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung *</label>
            <textarea name="content" value={formData.content} onChange={handleChange} placeholder="Nội dung chi tiết..." className="border p-2 w-full rounded focus:ring-2 focus:ring-teal-400 outline-none min-h-[150px]" />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white p-2 rounded font-medium flex justify-center items-center gap-2 transition disabled:bg-teal-300">
              {loading && <Loader2 className="animate-spin" size={20} />} {editingId ? "Lưu thay đổi" : "Đăng bài"}
            </button>
            {editingId && <button type="button" onClick={resetForm} disabled={loading} className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition">Hủy</button>}
          </div>
        </form>
      </div>

      {/* Danh sách Bài viết */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách ({articles.length})</h3>
        <div className="grid grid-cols-1 gap-4">
          {articles.map((article) => (
            <div key={article._id} className="bg-white border p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-start hover:shadow-md transition">
              <div className="w-full sm:w-40 h-28 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border">
                 {article.image ? <img src={article.image} alt={article.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={24}/></div>}
              </div>

              <div className="flex-1 w-full">
                <h4 className="font-bold text-lg text-gray-900 line-clamp-1">{article.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2 mt-1">{article.content}</p>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {article.tags.map((tag, idx) => <span key={idx} className="bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded border border-teal-100">#{tag}</span>)}
                  </div>
                )}
                
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleEdit(article)} className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition"><SquarePen size={12}/> Sửa</button>
                  <button onClick={() => handleDelete(article._id)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition"><Trash2 size={12}/> Xóa</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}