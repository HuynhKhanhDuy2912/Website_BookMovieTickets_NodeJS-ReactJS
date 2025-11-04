import { useEffect, useState } from "react";
import {
  getAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../api/articleService";

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [tags, setTags] = useState("");
  const [editingId, setEditingId] = useState(null);

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

  // Tạo / cập nhật bài viết
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return alert("Tiêu đề và nội dung là bắt buộc");

    const articleData = {
      title,
      content,
      image: image || null,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    };

    try {
      if (editingId) {
        await updateArticle(editingId, articleData);
        alert("Cập nhật bài viết thành công");
        setEditingId(null);
      } else {
        await createArticle(articleData);
        alert("Tạo bài viết thành công");
      }
      setTitle("");
      setContent("");
      setImage("");
      setTags("");
      fetchArticles();
    } catch (err) {
      alert("Lỗi khi lưu bài viết");
      console.error(err);
    }
  };

  // Xóa bài viết
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await deleteArticle(id);
      alert("Đã xóa bài viết");
      fetchArticles();
    } catch (err) {
      alert("Lỗi khi xóa bài viết");
      console.error(err);
    }
  };

  // Chuẩn bị chỉnh sửa
  const handleEdit = (article) => {
    setTitle(article.title);
    setContent(article.content);
    setImage(article.image || "");
    setTags(article.tags ? article.tags.join(", ") : "");
    setEditingId(article._id);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quản lý bài viết</h1>

      {/* Form tạo/cập nhật */}
      <form onSubmit={handleSubmit} className="mb-6 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">
          {editingId ? "Cập nhật bài viết" : "Tạo bài viết mới"}
        </h2>
        <input
          type="text"
          placeholder="Tiêu đề"
          className="border p-2 w-full mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Nội dung"
          className="border p-2 w-full mb-3"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <input
          type="text"
          placeholder="URL hình ảnh"
          className="border p-2 w-full mb-3"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        <input
          type="text"
          placeholder="Tags (ngăn cách bằng dấu ,)"
          className="border p-2 w-full mb-3"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          {editingId ? "Cập nhật" : "Tạo"}
        </button>
      </form>

      {/* Danh sách bài viết */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Danh sách bài viết</h2>
        {articles.map((article) => (
          <div
            key={article._id}
            className="border p-3 mb-2 rounded flex justify-between items-start"
          >
            <div>
              <h3 className="font-bold">{article.title}</h3>
              {article.image && (
                <img src={article.image} alt={article.title} className="mb-2 max-w-full" />
              )}
              <p>{article.content}</p>
              {article.tags && article.tags.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Tags: {article.tags.join(", ")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(article)}
                className="bg-yellow-400 text-white p-1 rounded"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(article._id)}
                className="bg-red-500 text-white p-1 rounded"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
