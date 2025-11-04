import { useEffect, useState } from "react";
import { getAllCinemas, createCinema, deleteCinema } from "../api/cinemaService";

export default function Cinemas() {
  const [cinemas, setCinemas] = useState([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  // Lấy danh sách rạp
  const fetchCinemas = async () => {
    try {
      const { data } = await getAllCinemas();
      setCinemas(data);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách rạp:", err);
      alert("❌ Lỗi khi lấy danh sách rạp! Xem console để biết chi tiết.");
    }
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  // Thêm rạp mới
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation dữ liệu
    if (!name.trim() || !location.trim()) {
      alert("❌ Tên và địa chỉ rạp không được để trống!");
      return;
    }

    const payload = { name: name.trim(), location: location.trim() };
    console.log("Gửi lên backend:", payload);

    try {
      await createCinema(payload);
      alert("✅ Thêm rạp thành công!");
      setName("");
      setLocation("");
      fetchCinemas();
    } catch (err) {
      console.error("Lỗi khi tạo rạp:", err.response || err);
      alert(
        "❌ Không thể thêm rạp: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // Xóa rạp
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa rạp này?")) return;
    try {
      await deleteCinema(id);
      alert("🗑️ Đã xóa rạp!");
      fetchCinemas();
    } catch (err) {
      console.error("Lỗi khi xóa rạp:", err.response || err);
      alert("❌ Không thể xóa rạp!");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Danh sách rạp chiếu phim</h2>

      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Tên rạp"
          className="border p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Địa chỉ rạp"
          className="border p-2 w-full"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          Thêm rạp
        </button>
      </form>

      <ul className="space-y-3">
        {cinemas.map((cinema) => (
          <li
            key={cinema._id}
            className="border p-3 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{cinema.name}</p>
              <p className="text-gray-500">{cinema.location}</p>
            </div>
            <button
              onClick={() => handleDelete(cinema._id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Xóa
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
