import { useEffect, useState } from "react";
import { getAllCinemas, createCinema, deleteCinema } from "../api/cinemaService";

export default function Cinemas() {
  const [cinemas, setCinemas] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState("");

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

    if (!name.trim() || !address.trim()) {
      alert("❌ Tên và địa chỉ rạp không được để trống!");
      return;
    }

    const payload = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim() || undefined,
      phone: phone.trim() || undefined,
      image: image.trim() || undefined,
    };
    console.log("Gửi lên backend:", payload);

    try {
      await createCinema(payload);
      alert("✅ Thêm rạp thành công!");
      setName("");
      setAddress("");
      setCity("");
      setPhone("");
      setImage("");
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
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          type="text"
          placeholder="Thành phố"
          className="border p-2 w-full"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          type="text"
          placeholder="Số điện thoại"
          className="border p-2 w-full"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="text"
          placeholder="Link ảnh"
          className="border p-2 w-full"
          value={image}
          onChange={(e) => setImage(e.target.value)}
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
              <p className="text-gray-500">{cinema.address}</p>
              {cinema.city && <p className="text-gray-400">{cinema.city}</p>}
              {cinema.phone && <p className="text-gray-400">{cinema.phone}</p>}
              {cinema.image && (
                <img
                  src={cinema.image}
                  alt={cinema.name}
                  className="mt-2 w-32 h-20 object-cover rounded"
                />
              )}
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
