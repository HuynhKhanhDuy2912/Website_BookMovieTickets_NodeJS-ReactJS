import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/client/Header'; // Import Header mới
import Footer from '../../components/client/Footer'; // Import Footer mới

const ClientLayout = () => {
  return (
    <div className="client-layout min-h-screen flex flex-col bg-gray-50">
      
      {/* 1. Header (Navbar) */}
      <Header />
      
      {/* 2. Nội dung chính (Thay đổi theo trang) */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 3. Footer */}
      <Footer />
      
    </div>
  );
};

export default ClientLayout;