import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CinemaPage from "./pages/CinemaPage";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <Router>
      <nav style={{ padding: 20 }}>
        <Link to="/" style={{ marginRight: 10 }}>Trang chủ</Link>
        <Link to="/cinemas" style={{ marginRight: 10 }}>Rạp</Link>
        <Link to="/login">Đăng nhập</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cinemas" element={<CinemaPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
