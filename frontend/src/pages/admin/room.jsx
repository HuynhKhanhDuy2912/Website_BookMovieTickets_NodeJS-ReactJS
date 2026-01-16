import { useEffect, useState } from "react";
import {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../api/roomService";
import { getAllCinemas } from "../../api/cinemaService";
import { 
  Loader2, 
  Trash2, 
  SquarePen, 
  Armchair, 
  Grid3X3, 
  MapPin, 
  MonitorPlay 
} from "lucide-react";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Gom nhóm state form
  const [formData, setFormData] = useState({
    cinemaId: "",
    name: "",
    rows: "",
    cols: "",
    vipRows: "", // Nhập chuỗi "A, B"
  });

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
    }
  };

  const fetchCinemasList = async () => {
    try {
      const { data } = await getAllCinemas();
      const list = Array.isArray(data) ? data : data.cinemas || [];
      setCinemas(list);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách rạp:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      cinemaId: "",
      name: "",
      rows: "",
      cols: "",
      vipRows: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cinemaId || !formData.name.trim() || !formData.cols || !formData.rows) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setLoading(true);

    // Xử lý vipRows từ chuỗi "A, B" thành mảng
    const processedVipRows = formData.vipRows
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r !== "");

    const payload = {
      cinema: formData.cinemaId,
      name: formData.name.trim(),
      rows: Number(formData.rows),
      cols: Number(formData.cols),
      vipRows: processedVipRows,
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
      console.error("Lỗi:", err);
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (room) => {
    setEditingId(room._id);
    setFormData({
      cinemaId: room.cinema?._id || room.cinema || "",
      name: room.name,
      rows: room.rows || "",
      cols: room.cols || "",
      vipRows: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa phòng chiếu này?")) return;
    try {
      await deleteRoom(id);
      alert("✅ Xóa phòng chiếu thành công!");
      fetchRooms();
    } catch (err) {
      alert("❌ Không thể xóa phòng!, " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
        <MonitorPlay className="text-cyan-600" /> Quản lý Phòng Chiếu
      </h2>

      {/* Form Room - Cyan Theme */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-cyan-100">
        <h3 className="text-lg font-semibold mb-4 text-cyan-600">
          {editingId ? "Cập nhật Phòng" : "Thêm Phòng Mới"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Thuộc Rạp *</label>
               <select
                 name="cinemaId"
                 value={formData.cinemaId}
                 onChange={handleChange}
                 className="border p-2 w-full rounded focus:ring-2 focus:ring-cyan-400 outline-none"
               >
                 <option value="">-- Chọn rạp chiếu --</option>
                 {cinemas.map((cinema) => (
                   <option key={cinema._id} value={cinema._id}>
                     {cinema.name}
                   </option>
                 ))}
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tên Phòng *</label>
               <input
                 type="text"
                 name="name"
                 placeholder="Ví dụ: Phòng 01, IMAX..."
                 className="border p-2 w-full rounded focus:ring-2 focus:ring-cyan-400 outline-none"
                 value={formData.name}
                 onChange={handleChange}
               />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Số hàng (Rows)</label>
               <div className="relative">
                 <Grid3X3 className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                 <input
                   type="number"
                   name="rows"
                   min="1"
                   placeholder="10"
                   className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-cyan-400 outline-none"
                   value={formData.rows}
                   onChange={handleChange}
                 />
               </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Số ghế/hàng (Cols)</label>
               <div className="relative">
                 <Armchair className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                 <input
                   type="number"
                   name="cols"
                   min="1"
                   placeholder="12"
                   className="border p-2 pl-10 w-full rounded focus:ring-2 focus:ring-cyan-400 outline-none"
                   value={formData.cols}
                   onChange={handleChange}
                 />
               </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Hàng ghế VIP</label>
               <input
                 type="text"
                 name="vipRows"
                 placeholder="VD: A, B hoặc 0, 1"
                 className="border p-2 w-full rounded focus:ring-2 focus:ring-cyan-400 outline-none"
                 value={formData.vipRows}
                 onChange={handleChange}
               />
               <p className="text-[10px] text-gray-500 mt-1">Ngăn cách bằng dấu phẩy</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded font-medium flex justify-center items-center gap-2 transition disabled:bg-cyan-300"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {editingId ? "Cập nhật Phòng" : "Thêm Phòng"}
            </button>
            {editingId && (
              <button
                type="button"
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium transition"
                onClick={resetForm}
                disabled={loading}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Danh sách Phòng */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Danh sách Phòng ({rooms.length})</h3>
        
        {rooms.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có phòng chiếu nào.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="bg-white border p-5 rounded-lg shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden"
              >
                {/* Decorative bar */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500"></div>

                <div>
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <h4 className="font-bold text-xl text-gray-800">
                      {room.name}
                    </h4>
                    <span className="bg-cyan-100 text-cyan-800 text-xs font-bold px-2.5 py-1 rounded">
                      {room.seats?.length || (room.rows * room.cols)} Ghế
                    </span>
                  </div>

                  {/* Thông tin Rạp */}
                  <div className="pl-2 mb-3">
                    <div className="flex items-center text-gray-700 font-medium text-sm mb-1">
                      <MapPin size={16} className="mr-1.5 text-red-500" />
                      {room.cinema?.name || "Rạp không xác định"}
                    </div>
                    <p className="text-xs text-gray-500 truncate ml-5">
                       {room.cinema?.address}
                    </p>
                  </div>

                  {/* Thông tin cấu trúc ghế */}
                  <div className="bg-gray-50 p-3 rounded mb-4 border border-gray-100 mx-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Grid3X3 size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">
                        Cấu trúc: <strong>{room.rows}</strong> hàng x{" "}
                        <strong>{room.cols}</strong> cột
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Armchair size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">
                        Sức chứa: <strong>{room.seats?.length || (room.rows * room.cols)}</strong> khách
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buttons Action */}
                <div className="flex gap-2 pt-3 border-t border-gray-100 justify-end pl-2">
                  <button
                    onClick={() => handleEdit(room)}
                    className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition"
                  >
                    <SquarePen size={14} /> Sửa
                  </button>

                  <button
                    onClick={() => handleDelete(room._id)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}