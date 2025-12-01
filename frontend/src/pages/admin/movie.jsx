import { useEffect, useState } from "react";
import {
  getAllMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../../api/movieService";
import { Trash2, SquarePen, Clapperboard } from "lucide-react";

// Hàm giả định để upload file, BẠN CẦN THAY THẾ BẰNG SERVICE API THỰC TẾ
const uploadFileService = async (file) => {
  if (!file) return undefined;
  console.log(
    `⏳ Đang tải file lên server: ${file.name}. Vui lòng thay thế hàm này.`
  ); // **THAY THẾ ĐOẠN CODE DƯỚI ĐÂY BẰNG LOGIC GỌI API UPLOAD FILE CỦA BẠN (ví dụ: dùng FormData)**
  await new Promise((resolve) => setTimeout(resolve, 1500)); // Giả lập độ trễ upload
  return `https://your-cdn.com/posters/${Date.now()}-${file.name}`; // Giả lập URL trả về
};

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [editingId, setEditingId] = useState(null); // Form fields

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [director, setDirector] = useState("");
  const [cast, setCast] = useState(""); // Nhập dạng string, sẽ split thành array
  const [genre, setGenre] = useState(""); // Nhập dạng string, sẽ split thành array
  const [duration, setDuration] = useState("");
  const [language, setLanguage] = useState("");
  const [ageRating, setAgeRating] = useState("P"); // 👈 Đặt giá trị mặc định cho select
  const [releaseDate, setReleaseDate] = useState("");
  const [posterUrl, setPosterUrl] = useState(""); // URL của poster đã lưu
  const [posterFile, setPosterFile] = useState(null); // 👈 State mới để lưu file ảnh
  const [trailerUrl, setTrailerUrl] = useState("");
  const [status, setStatus] = useState("coming_soon");

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const { data } = await getAllMovies();
      setMovies(data);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách phim:", err);
      alert("❌ Lỗi khi lấy danh sách phim! Xem console để biết chi tiết.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDirector("");
    setCast("");
    setGenre("");
    setDuration("");
    setLanguage("");
    setAgeRating("P"); // 👈 Reset về mặc định
    setReleaseDate("");
    setPosterUrl("");
    setPosterFile(null); // 👈 Reset file ảnh
    setTrailerUrl("");
    setStatus("coming_soon");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("❌ Tên phim là bắt buộc!");
      return;
    }

    let finalPosterUrl = posterUrl;
    try {
      // 1. Xử lý Upload Poster File (nếu có file mới)
      if (posterFile) {
        finalPosterUrl = await uploadFileService(posterFile);
      } // 2. Tạo Payload

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        director: director.trim() || undefined,
        cast: cast
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c),
        genre: genre
          .split(",")
          .map((g) => g.trim())
          .filter((g) => g),
        duration: duration ? Number(duration) : undefined,
        language: language.trim() || undefined,
        ageRating: ageRating.trim() || undefined,
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        posterUrl: finalPosterUrl || undefined, // 👈 Sử dụng URL cuối cùng (từ file upload hoặc URL cũ)
        trailerUrl: trailerUrl.trim() || undefined,
        status,
      }; // 3. Gọi API tạo/cập nhật

      if (editingId) {
        await updateMovie(editingId, payload);
        alert("✅ Cập nhật phim thành công!");
      } else {
        await createMovie(payload);
        alert("✅ Thêm phim thành công!");
      }
      resetForm();
      fetchMovies();
    } catch (err) {
      console.error("❌ Lỗi khi tạo/cập nhật phim:", err.response || err);
      alert(
        "❌ Không thể tạo/cập nhật phim: " +
          (err.response?.data?.message || err.message || "Lỗi không xác định")
      );
    }
  };

  const handleEdit = (movie) => {
    setEditingId(movie._id);
    setTitle(movie.title);
    setDescription(movie.description || "");
    setDirector(movie.director || "");
    setCast(movie.cast?.join(", ") || "");
    setGenre(movie.genre?.join(", ") || "");
    setDuration(movie.duration || "");
    setLanguage(movie.language || "");
    setAgeRating(movie.ageRating || "P"); // 👈 Đảm bảo có giá trị cho select
    setReleaseDate(movie.releaseDate ? movie.releaseDate.split("T")[0] : "");
    setPosterUrl(movie.posterUrl || ""); // 👈 Giữ lại URL cũ để hiển thị và sử dụng nếu không có file mới
    setPosterFile(null); // 👈 Reset file khi bắt đầu chỉnh sửa
    setTrailerUrl(movie.trailerUrl || "");
    setStatus(movie.status);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa phim này?")) return;
    try {
      await deleteMovie(id);
      alert("🗑️ Đã xóa phim!");
      fetchMovies();
    } catch (err) {
      console.error("❌ Lỗi khi xóa phim:", err.response || err);
      alert("❌ Không thể xóa phim!");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Quản lý Phim</h2>
      <form
        onSubmit={handleSubmit}
        className="mb-6 space-y-2 border p-4 rounded"
      >
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Tên phim"
            className="border p-2 w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 w-full mt-2"
          >
            <option value="coming_soon">Coming Soon</option>
            <option value="now_showing">Now Showing</option>
            <option value="ended">Ended</option>
          </select>
        </div>

        <div className="flex gap-4 mt-2">
          <input
            type="text"
            placeholder="Đạo diễn"
            className="border p-2 w-full"
            value={director}
            onChange={(e) => setDirector(e.target.value)}
          />
          <input
            type="text"
            placeholder="Diễn viên (phân cách bằng dấu ,)"
            className="border p-2 w-full"
            value={cast}
            onChange={(e) => setCast(e.target.value)}
          />
        </div>

        <div className="flex gap-4 mt-2">
          <input
            type="text"
            placeholder="Thể loại (phân cách bằng dấu ,)"
            className="border p-2 w-full"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
          <input
            type="number"
            placeholder="Thời lượng (phút)"
            className="border p-2 w-full"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        <div className="flex gap-4 mt-2">
          <input
            type="text"
            placeholder="Ngôn ngữ"
            className="border p-2 w-full"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
          <select
            value={ageRating}
            onChange={(e) => setAgeRating(e.target.value)}
            className="border p-2 w-full"
          >
            <option value="P">P (Phổ biến)</option>
            <option value="C13">C13 (Cấm khán giả dưới 13 tuổi)</option>
            <option value="C16">C16 (Cấm khán giả dưới 16 tuổi)</option>
            <option value="C18">C18 (Cấm khán giả dưới 18 tuổi)</option>
          </select>
        </div>

        <div className="flex gap-4 mt-2">
          <input
            type="date"
            placeholder="Ngày ra mắt"
            className="border p-2 w-full"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
          <input
            type="text"
            placeholder="Link trailer"
            className="border p-2 w-full"
            value={trailerUrl}
            onChange={(e) => setTrailerUrl(e.target.value)}
          />
        </div>

        <div className="flex gap-4 mt-2">
          <div className="w-full">
            <label className="text-sm text-gray-700 font-medium">
              Ảnh Poster:
            </label>
            {editingId && posterUrl && (
              <p className="text-xs text-gray-500 italic">
                Poster cũ:{" "}
                <a
                  href={posterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  Xem
                </a>{" "}
                (Chọn file mới để thay)
              </p>
            )}
            <input
              type="file"
              accept="image/*"
              className="border p-2 w-full"
              onChange={(e) => setPosterFile(e.target.files[0])}
            />
          </div>
        </div>

        <textarea
          type="text"
          placeholder="Mô tả"
          className="border p-2 w-full mt-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full mt-4"
        >
          {editingId ? "Cập nhật phim" : "Thêm phim"}
        </button>

        {editingId && (
          <button
            type="button"
            className="bg-gray-400 text-white p-2 rounded w-full mt-2"
            onClick={resetForm}
          >
            Hủy
          </button>
        )}
      </form>

      {/* Danh sách phim */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Danh sách phim Hiện có:</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <li
              key={movie._id}
              className="border p-4 rounded shadow-md flex flex-col justify-between"
            >
              {/* Phần nội dung phim */}
              <div className="flex flex-col h-full">
                {movie.posterUrl && (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="mb-3 w-full h-72 object-cover rounded-md shadow-sm"
                  />
                )}
                <p className="font-bold text-lg mb-1">{movie.title}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {movie.description}
                </p>
                <div className="text-sm space-y-0.5 mt-auto">
                  <p>
                    <span className="font-medium">Đạo diễn:</span>{" "}
                    {movie.director}
                  </p>
                  <p>
                    <span className="font-medium">Thể loại:</span>{" "}
                    {movie.genre?.join(", ")}
                  </p>
                  <p>
                    <span className="font-medium">Độ tuổi:</span>{" "}
                    <span className="text-red-600 font-semibold">
                      {movie.ageRating}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Thời lượng:</span>{" "}
                    {movie.duration} phút
                  </p>
                  <p>
                    <span className="font-medium">Ra mắt:</span>{" "}
                    {movie.releaseDate?.split("T")[0]}
                  </p>
                  <p>
                    <span className="font-medium">Trạng thái:</span>{" "}
                    <span
                      className={`font-semibold ${
                        movie.status === "now_showing"
                          ? "text-green-600"
                          : "text-orange-500"
                      }`}
                    >
                      {movie.status}
                    </span>
                  </p>
                  {movie.trailerUrl && (
                    <a
                      href={movie.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline block mt-2 flex"
                    >
                      <Clapperboard size={18} className="mr-2" color="black" />{" "}
                      Xem trailer
                    </a>
                  )}
                </div>
              </div>

              {/* Các nút hành động */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 justify-end">
                {/* Nút Sửa */}
                <button
                  onClick={() => handleEdit(movie)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs flex justify-center items-center gap-1 transition"
                >
                  <SquarePen size={14} /> <span className="text-sm">Sửa</span>
                </button>

                {/* Nút Xóa */}
                <button
                  onClick={() => handleDelete(movie._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs flex justify-center items-center gap-1 transition"
                >
                  <Trash2 size={14} /> <span className="text-sm">Xóa</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
