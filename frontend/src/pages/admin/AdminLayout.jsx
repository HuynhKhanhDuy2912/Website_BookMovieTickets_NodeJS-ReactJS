import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar'; // Navbar quản lý cũ của bạn

const AdminLayout = () => {
  return (
    <div className="admin-container">
      {/* Navbar chỉ hiện trong trang Admin */}
      <Navbar /> 
      <div className="admin-content p-4">
        <Outlet /> {/* Nơi các trang con (Movie, User...) hiển thị */}
      </div>
    </div>
  );
};

export default AdminLayout;