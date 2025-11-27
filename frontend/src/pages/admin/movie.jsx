import { useEffect, useState } from "react";
import {
  getAllMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../../api/movieService";

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [director, setDirector] = useState("");
  const [cast, setCast] = useState(""); // Nhập dạng string, sẽ split thành array
  const [genre, setGenre] = useState(""); // Nhập dạng string, sẽ split thành array
  const [duration, setDuration] = useState("");
  const [language, setLanguage] = useState("");
  const [ageRating, setAgeRating] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
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
    setAgeRating("");
    setReleaseDate("");
    setPosterUrl("");
    setTrailerUrl("");
    setStatus("coming_soon");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("❌ Tên phim là bắt buộc!");
      return;
    }

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
      posterUrl: posterUrl.trim() || undefined,
      trailerUrl: trailerUrl.trim() || undefined,
      status,
    };

    try {
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
          (err.response?.data?.message || err.message)
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
    setAgeRating(movie.ageRating || "");
    setReleaseDate(movie.releaseDate ? movie.releaseDate.split("T")[0] : "");
    setPosterUrl(movie.posterUrl || "");
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

      <form onSubmit={handleSubmit} className="mb-6 space-y-2 border p-4 rounded">
        <input
          type="text"
          placeholder="Tên phim"
          className="border p-2 w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Mô tả"
          className="border p-2 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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
        <input
          type="text"
          placeholder="Ngôn ngữ"
          className="border p-2 w-full"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        />
        <input
          type="text"
          placeholder="Độ tuổi (C16, C18, P, ...)"
          className="border p-2 w-full"
          value={ageRating}
          onChange={(e) => setAgeRating(e.target.value)}
        />
        <input
          type="date"
          placeholder="Ngày ra mắt"
          className="border p-2 w-full"
          value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)}
        />
        <input
          type="text"
          placeholder="Link poster"
          className="border p-2 w-full"
          value={posterUrl}
          onChange={(e) => setPosterUrl(e.target.value)}
        />
        <input
          type="text"
          placeholder="Link trailer"
          className="border p-2 w-full"
          value={trailerUrl}
          onChange={(e) => setTrailerUrl(e.target.value)}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="coming_soon">Coming Soon</option>
          <option value="now_showing">Now Showing</option>
          <option value="ended">Ended</option>
        </select>

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full"
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

      <ul className="space-y-3">
        {movies.map((movie) => (
          <li
            key={movie._id}
            className="border p-3 rounded flex justify-between items-start gap-4"
          >
            <div>
              <p className="font-semibold">{movie.title}</p>
              <p>{movie.description}</p>
              <p>Đạo diễn: {movie.director}</p>
              <p>Diễn viên: {movie.cast?.join(", ")}</p>
              <p>Thể loại: {movie.genre?.join(", ")}</p>
              <p>Thời lượng: {movie.duration} phút</p>
              <p>Ngôn ngữ: {movie.language}</p>
              <p>Độ tuổi: {movie.ageRating}</p>
              <p>Ngày ra mắt: {movie.releaseDate?.split("T")[0]}</p>
              <p>Status: {movie.status}</p>
              {movie.posterUrl && (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="mt-2 w-32 h-48 object-cover rounded"
                />
              )}
              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline block mt-1"
                >
                  Xem trailer
                </a>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleEdit(movie)}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(movie._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
