import React, { useEffect, useRef } from "react"; 
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"; 
import Navbar from "./components/Navbar";
import Login from "./pages/login";
import Register from "./pages/register";
import Articles from "./pages/admin/articles";
import Cinema from "./pages/admin/cinema";
import Combo from "./pages/admin/combo";
import Movie from "./pages/admin/movie";
import Order from "./pages/admin/order";
import Room from "./pages/admin/room";
import Showtime from "./pages/admin/showtime";
import Ticket from "./pages/admin/tickets";

// --- COMPONENT BẢO VỆ (ADMIN GUARD) ---
const AdminGuard = ({ children }) => {
  const navigate = useNavigate();
  
  // Lấy user từ localStorage
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const role = user?.role;
  
  // Tạo cái chốt chặn (cờ hiệu)
  const alertShown = useRef(false);

  // Sử dụng useEffect để xử lý logic "đá" người dùng
  useEffect(() => {
    // Kiểm tra xem có phải admin không
    const isNotAdmin = role !== "admin" && role !== 1 && role !== "1";

    // Logic chặn: Nếu không phải Admin VÀ chưa hiện thông báo bao giờ
    if (isNotAdmin && !alertShown.current) {
      
      alertShown.current = true; // Đóng chốt ngay: "Đã báo rồi nhé!"
      
      alert("Bạn không có quyền truy cập vào trang này!"); 
      navigate("/login", { replace: true });
    }
    
    // Reset lại chốt khi role thay đổi (đề phòng trường hợp login user khác ngay lập tức)
    if (!isNotAdmin) {
        alertShown.current = false;
    }

  }, [role, navigate]);

  // Nếu ĐÚNG là admin thì hiện nội dung
  if (role === "admin" || role === 1 || role === "1") {
    return children;
  }

  return null; 
};

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- ADMIN ROUTES --- */}
        <Route path="/order" element={<AdminGuard><Order /></AdminGuard>} />
        <Route path="/movie" element={<AdminGuard><Movie /></AdminGuard>} />
        <Route path="/combo" element={<AdminGuard><Combo /></AdminGuard>} />
        <Route path="/cinema" element={<AdminGuard><Cinema /></AdminGuard>} />
        <Route path="/articles" element={<AdminGuard><Articles /></AdminGuard>} />
        <Route path="/room" element={<AdminGuard><Room /></AdminGuard>} />
        <Route path="/showtime" element={<AdminGuard><Showtime /></AdminGuard>} />
        <Route path="/ticket" element={<AdminGuard><Ticket /></AdminGuard>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;