import { useEffect, useState } from "react";
import {
  getAllCombos,
  createCombo,
  updateCombo,
  deleteCombo,
} from "../../api/comboService";

export default function Combo() {
  const [combos, setCombos] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("combo");
  const [items, setItems] = useState(""); // Nhập bằng chuỗi, sẽ split thành array
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState("available");

  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    try {
      const { data } = await getAllCombos();
      setCombos(data);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách combo:", err);
      alert("❌ Lỗi khi lấy danh sách combo! Xem console để biết chi tiết.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setCategory("combo");
    setItems("");
    setPrice("");
    setImage("");
    setStatus("available");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || price === "") {
      alert("❌ Tên và giá combo là bắt buộc!");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      items: items
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i),
      price: Number(price),
      image: image.trim() || undefined,
      status,
    };

    try {
      if (editingId) {
        await updateCombo(editingId, payload);
        alert("✅ Cập nhật combo thành công!");
      } else {
        await createCombo(payload);
        alert("✅ Thêm combo thành công!");
      }
      resetForm();
      fetchCombos();
    } catch (err) {
      console.error("❌ Lỗi khi tạo/cập nhật combo:", err.response || err);
      alert(
        "❌ Không thể tạo/cập nhật combo: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleEdit = (combo) => {
    setEditingId(combo._id);
    setName(combo.name);
    setDescription(combo.description || "");
    setCategory(combo.category);
    setItems(combo.items?.join(", ") || "");
    setPrice(combo.price);
    setImage(combo.image || "");
    setStatus(combo.status);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa combo này?")) return;
    try {
      await deleteCombo(id);
      alert("🗑️ Đã xóa combo!");
      fetchCombos();
    } catch (err) {
      console.error("❌ Lỗi khi xóa combo:", err.response || err);
      alert("❌ Không thể xóa combo!");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Quản lý Combo</h2>

      <form onSubmit={handleSubmit} className="mb-6 space-y-2 border p-4 rounded">
        <input
          type="text"
          placeholder="Tên combo"
          className="border p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Mô tả"
          className="border p-2 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="combo">Combo</option>
          <option value="food">Food</option>
          <option value="drink">Drink</option>
        </select>
        <input
          type="text"
          placeholder="Các món (phân cách bằng dấu ,)"
          className="border p-2 w-full"
          value={items}
          onChange={(e) => setItems(e.target.value)}
        />
        <input
          type="number"
          placeholder="Giá"
          className="border p-2 w-full"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          type="text"
          placeholder="Link ảnh"
          className="border p-2 w-full"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          {editingId ? "Cập nhật combo" : "Thêm combo"}
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
        {combos.map((combo) => (
          <li
            key={combo._id}
            className="border p-3 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{combo.name}</p>
              <p>{combo.description}</p>
              <p>Category: {combo.category}</p>
              <p>Items: {combo.items?.join(", ")}</p>
              <p>Price: {combo.price}₫</p>
              <p>Status: {combo.status}</p>
              {combo.image && (
                <img
                  src={combo.image}
                  alt={combo.name}
                  className="mt-2 w-32 h-20 object-cover rounded"
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleEdit(combo)}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(combo._id)}
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
