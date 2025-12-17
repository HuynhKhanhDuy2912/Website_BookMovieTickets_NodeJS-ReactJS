import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar'; // Import Sidebar vừa tạo

const AdminLayout = () => {
  return (
    <div className="flex bg-gray-100 min-h-screen">
      
      {/* 1. Sidebar cố định bên trái */}
      <Sidebar />

      {/* 2. Khu vực nội dung chính */}
      {/* ml-64: Margin Left 64 (để tránh bị Sidebar che mất) */}
      <div className="flex-1 ml-64 p-8">
        {/* Đây là nơi các trang Movie, User, Order... sẽ hiển thị */}
        <div className="max-w-7xl mx-auto">
           <Outlet /> 
        </div>
      </div>

    </div>
  );
};

export default AdminLayout;