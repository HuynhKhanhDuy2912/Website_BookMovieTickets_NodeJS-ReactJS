import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  
  // 1. Chưa đăng nhập -> Đá về Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Có đăng nhập nhưng sai quyền -> Đá về trang chủ hoặc trang báo lỗi
  // Lưu ý: role trong DB của bạn có thể là số (1) hoặc chuỗi ("admin")
  const userRole = user.role;
  const hasPermission = allowedRoles.some(role => 
    role === userRole || 
    (role === 'admin' && (userRole === 1 || userRole === '1'))
  );

  if (!hasPermission) {
    alert("Bạn không có quyền truy cập trang này!");
    return <Navigate to="/" replace />;
  }

  // 3. Hợp lệ -> Cho hiện nội dung bên trong (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;