import { useState } from "react";
import { loginUser } from "../api/cinemaApi";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.token);
      setMessage("Đăng nhập thành công!");
    } catch (err) {
      setMessage("Sai tài khoản hoặc mật khẩu!");
    }
  }

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h2>Đăng nhập quản trị viên</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br /><br />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit">Đăng nhập</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default LoginPage;
