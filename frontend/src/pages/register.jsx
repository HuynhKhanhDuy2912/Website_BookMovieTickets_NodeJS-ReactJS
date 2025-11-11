import { useState } from "react";
import { registerUser } from "../api/authService";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await registerUser(name, email, password);
      alert("✅ " + data.message);
      navigate("/login");
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Đăng ký thất bại"));
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Đăng ký</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Tên của bạn"
          className="border p-2 w-full mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          className="border p-2 w-full mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-green-500 text-white p-2 w-full rounded">
          Đăng ký
        </button>
      </form>
    </div>
  );
}
