import { useEffect, useState } from "react";
import {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../api/roomService";
import { getAllCinemas } from "../../api/cinemaService"; // Cần API này để chọn Rạp
import { Trash2, SquarePen, Armchair, Grid3X3, MapPin } from "lucide-react";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]); // State lưu danh sách rạp để chọn
  const [editingId, setEditingId] = useState(null);

  // Form fields
  const [cinemaId, setCinemaId] = useState("");
  const [name, setName] = useState("");
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(8);
  const [vipRows, setVipRows] = useState(""); // Nhập chuỗi: "A, B" hoặc "0, 1"

  // Fetch dữ liệu ban đầu
  useEffect(() => {
    fetchRooms();
    fetchCinemasList();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await getAllRooms();
      setRooms(data);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách phòng:", err);
      alert("❌ Lỗi khi lấy danh sách phòng!");
    }
  };

  const fetchCinemasList = async () => {
    try {
      const { data } = await getAllCinemas();
      // Xử lý trường hợp data trả về có wrapper hoặc array trực tiếp
      const list = Array.isArray(data) ? data : data.cinemas || [];
      setCinemas(list);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách rạp:", err);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setCinemaId("");
    setName("");
    setRows(5);
    setCols(8);
    setVipRows("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cinemaId || !name.trim()) {
      alert("❌ Vui lòng chọn rạp và nhập tên phòng!");
      return;
    }

    // Xử lý vipRows từ chuỗi "A, B" thành mảng ["A", "B"] để gửi lên controller
    const processedVipRows = vipRows
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r !== "");

    const payload = {
      cinema: cinemaId,
      name: name.trim(),
      rows: Number(rows),
      cols: Number(cols),
      vipRows: processedVipRows, // Gửi lên để controller tính toán ghế VIP
    };

    try {
      if (editingId) {
        await updateRoom(editingId, payload);
        alert("✅ Cập nhật phòng chiếu thành công!");
      } else {
        await createRoom(payload);
        alert("✅ Thêm phòng chiếu thành công!");
      }
      resetForm();
      fetchRooms();
    } catch (err) {
      console.error("❌ Lỗi khi lưu phòng:", err.response || err);
      alert(
        "❌ Không thể lưu phòng: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleEdit = (room) => {
    setEditingId(room._id);
    setCinemaId(room.cinema?._id || room.cinema || ""); // Handle populated or raw ID
    setName(room.name);
    setRows(room.rows || 5);
    setCols(room.cols || 8);
    // Lưu ý: Backend không trả về vipRows trong model Room gốc, nên khi edit ta để trống
    // hoặc bạn phải tự logic để tính toán lại từ mảng seats nếu muốn hiển thị.
    setVipRows(""); 
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa phòng chiếu này?")) return;
    try {
      await deleteRoom(id);
      alert("🗑️ Đã xóa phòng chiếu!");
      fetchRooms();
    } catch (err) {
      console.error("❌ Lỗi khi xóa phòng:", err.response || err);
      alert("❌ Không thể xóa phòng!");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Quản lý Phòng Chiếu (Rooms)</h2>

      {/* Inline Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 space-y-4 border p-4 rounded shadow-sm bg-gray-50"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chọn Rạp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thuộc Rạp
            </label>
            <select
              value={cinemaId}
              onChange={(e) => setCinemaId(e.target.value)}
              className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Chọn rạp chiếu --</option>
              {cinemas.map((cinema) => (
                <option key={cinema._id} value={cinema._id}>
                  {cinema.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tên phòng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên Phòng
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Phòng 01, IMAX..."
              className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Số hàng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số hàng (Rows)
            </label>
            <input
              type="number"
              min="1"
              placeholder="Ví dụ: 10"
              className="border p-2 w-full rounded outline-none"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
            />
          </div>

          {/* Số cột */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số ghế/hàng (Cols)
            </label>
            <input
              type="number"
              min="1"
              placeholder="Ví dụ: 12"
              className="border p-2 w-full rounded outline-none"
              value={cols}
              onChange={(e) => setCols(e.target.value)}
            />
          </div>

          {/* VIP Rows */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hàng ghế VIP (ngăn cách phẩy)
            </label>
            <input
              type="text"
              placeholder="VD: A, B, C hoặc 0, 1, 2"
              className="border p-2 w-full rounded outline-none"
              value={vipRows}
              onChange={(e) => setVipRows(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Hàng sẽ được set loại ghế VIP khi tạo mới.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded w-full font-medium transition"
        >
          {editingId ? "Cập nhật Phòng" : "Thêm Phòng Mới"}
        </button>

        {editingId && (
          <button
            type="button"
            className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded w-full mt-2 transition"
            onClick={resetForm}
          >
            Hủy bỏ
          </button>
        )}
      </form>

      {/* Grid List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Danh sách Phòng Chiếu:</h3>
        
        {rooms.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có phòng chiếu nào.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <li
                key={room._id}
                className="border bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-xl text-blue-700">
                      {room.name}
                    </h4>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {room.seats?.length || 0} Ghế
                    </span>
                  </div>

                  {/* Thông tin Rạp */}
                  <div className="flex items-center text-gray-600 text-sm mb-3">
                    <MapPin size={16} className="mr-1" />
                    <span className="font-medium">
                      {room.cinema?.name || "Rạp không tồn tại"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4 truncate">
                     {room.cinema?.address}
                  </p>

                  {/* Thông tin cấu trúc ghế */}
                  <div className="bg-gray-50 p-3 rounded mb-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Grid3X3 size={16} className="text-gray-500" />
                      <span className="text-sm">
                        Cấu trúc: <strong>{room.rows}</strong> hàng x{" "}
                        <strong>{room.cols}</strong> cột
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Armchair size={16} className="text-gray-500" />
                      <span className="text-sm">
                        Tổng sức chứa: <strong>{room.seatCount}</strong> khách
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buttons Action */}
                <div className="flex gap-2 pt-3 border-t border-gray-100 justify-end">
                  <button
                    onClick={() => handleEdit(room)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 transition"
                  >
                    <SquarePen size={14} /> Sửa
                  </button>

                  <button
                    onClick={() => handleDelete(room._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 transition"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}