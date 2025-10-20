import { useEffect, useState } from "react";
import {
  getCinemas,
  createCinema,
  updateCinema,
  deleteCinema,
} from "../api/cinemaApi";

function CinemaPage() {
  const [cinemas, setCinemas] = useState([]);
  const [newCinema, setNewCinema] = useState("");
  const [editingCinema, setEditingCinema] = useState(null);
  const [editName, setEditName] = useState("");
  const token = localStorage.getItem("token");

  // 📦 Lấy danh sách rạp khi trang load
  useEffect(() => {
    getCinemas().then(setCinemas).catch(console.error);
  }, []);

  // ➕ Thêm rạp
  async function handleAddCinema() {
    try {
      const added = await createCinema({ name: newCinema }, token);
      setCinemas([...cinemas, added.cinema]);
      setNewCinema("");
    } catch (err) {
      alert("❌ Bạn không có quyền thêm rạp!");
    }
  }

  // ❌ Xóa rạp
  async function handleDelete(id) {
    try {
      await deleteCinema(id, token);
      setCinemas(cinemas.filter((c) => c._id !== id));
    } catch {
      alert("❌ Không thể xóa rạp (chưa đăng nhập hoặc không có quyền)");
    }
  }

  // ✏️ Mở popup sửa
  function handleEditOpen(cinema) {
    setEditingCinema(cinema);
    setEditName(cinema.name);
  }

  // 💾 Lưu sửa
  async function handleEditSave() {
    try {
      const updated = await updateCinema(editingCinema._id, { name: editName }, token);
      setCinemas(
        cinemas.map((c) => (c._id === updated.cinema._id ? updated.cinema : c))
      );
      setEditingCinema(null);
    } catch (err) {
      alert("❌ Lỗi khi cập nhật rạp");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🎬 Danh sách rạp chiếu phim</h2>

      <ul>
        {cinemas.map((cinema) => (
          <li key={cinema._id}>
            {cinema.name}
            {token && (
              <>
                <button
                  onClick={() => handleEditOpen(cinema)}
                  style={{ marginLeft: 10 }}
                >
                  ✏️ Sửa
                </button>
                <button
                  onClick={() => handleDelete(cinema._id)}
                  style={{ marginLeft: 10 }}
                >
                  🗑 Xóa
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {token && (
        <div style={{ marginTop: 20 }}>
          <input
            placeholder="Tên rạp mới"
            value={newCinema}
            onChange={(e) => setNewCinema(e.target.value)}
          />
          <button onClick={handleAddCinema}>➕ Thêm rạp</button>
        </div>
      )}

      {/* 🪟 Popup sửa rạp */}
      {editingCinema && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              minWidth: 300,
            }}
          >
            <h3>✏️ Sửa rạp</h3>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />
            <div style={{ textAlign: "right" }}>
              <button onClick={() => setEditingCinema(null)}>Hủy</button>
              <button onClick={handleEditSave} style={{ marginLeft: 10 }}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CinemaPage;
