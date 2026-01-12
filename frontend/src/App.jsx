import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts & Guards
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import ClientLayout from "./pages/client/ClientLayout"; // Bạn cần tạo file này như hướng dẫn trên

// Client Pages
import Login from "./pages/login";
import Register from "./pages/register";
import HomePage from "./pages/client/Home";
import MoviePage from "./pages/client/MoviePage";
import CinemaPage from "./pages/client/CinemaPage";
import ArticlePage from "./pages/client/ArticlePage";
import ArticleDetailPage from "./pages/client/ArticleDetailPage";
import MovieDetailPage from "./pages/client/MovieDetailPage";
import SeatSelectionPage from "./pages/client/SeatSelectionPage";
import CheckoutPage from "./pages/client/CheckoutPage";
import BookingSuccessPage from "./pages/client/BookingSuccessPage";
import ProfilePage from "./pages/client/ProfilePage";
import CinemaDetailPage from "./pages/client/CinemaDetailPage";
// Admin Pages
import Articles from "./pages/admin/articles";
import Cinema from "./pages/admin/cinema";
import Combo from "./pages/admin/combo";
import Movie from "./pages/admin/movie";
import Order from "./pages/admin/order";
import Room from "./pages/admin/room";
import Showtime from "./pages/admin/showtime";
import Ticket from "./pages/admin/Tickets";
import User from "./pages/admin/user";

// Client Pages (Ví dụ - bạn sẽ tạo sau)
// import HomePage from "./pages/client/HomePage";
// import MovieDetail from "./pages/client/MovieDetail";

function App() {
  return (
    <BrowserRouter>
      {/* Thông báo toàn cục */}
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        {/* =========================================
            1. PUBLIC ROUTES (Ai cũng vào được)
           ========================================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Mặc định vào trang chủ client */}
        {/* <Route path="/" element={<Navigate to="/home" replace />} /> */}


        {/* =========================================
            2. CLIENT AREA (Giao diện người dùng)
           ========================================= */}
        {/* Nếu web phim cho khách xem không cần đăng nhập thì để Public. 
            Nếu cần đăng nhập mới được đặt vé thì bọc ProtectedRoute quanh trang đặt vé */}

        <Route element={<ClientLayout />}>
          {/* Trang chủ khách hàng */}
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<MoviePage />} />
          <Route path="/cinema/:id" element={<CinemaDetailPage />} />
          <Route path="/cinemas" element={<CinemaPage />} />
          <Route path="/articles" element={<ArticlePage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/booking/:showtimeId" element={<SeatSelectionPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/booking/success" element={<BookingSuccessPage />} />
          <Route element={<ProtectedRoute allowedRoles={['user', 'staff', 'admin']} />}>
            {/* <Route path="/booking/:id" element={<div className="p-10">Trang Đặt Vé</div>} /> */}
            <Route path="/profile" element={<ProfilePage/>} />
          </Route>
        </Route>


        {/* =========================================
            3. ADMIN AREA (Chỉ Admin mới vào được)
           ========================================= */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>

          {/* AdminLayout sẽ chứa Navbar Admin */}
          <Route path="/admin" element={<AdminLayout />}>

            {/* Redirect mặc định khi vào /admin -> /admin/dashboard hoặc /admin/movie */}
            <Route index element={<Navigate to="/admin/movie" replace />} />

            {/* Các route con: URL sẽ là /admin/movie, /admin/user... */}
            <Route path="movie" element={<Movie />} />
            <Route path="user" element={<User />} />
            <Route path="order" element={<Order />} />
            <Route path="combo" element={<Combo />} />
            <Route path="cinema" element={<Cinema />} />
            <Route path="articles" element={<Articles />} />
            <Route path="room" element={<Room />} />
            <Route path="showtime" element={<Showtime />} />
            <Route path="ticket" element={<Ticket />} />

          </Route>
        </Route>

        {/* =========================================
            4. NOT FOUND
           ========================================= */}
        <Route path="*" element={<div className="text-center mt-20 text-xl text-gray-500">404 - Trang không tồn tại</div>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;