import React from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle, Home, Ticket } from "lucide-react";

export default function BookingSuccessPage() {
  const { state } = useLocation();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-green-700">Đặt Vé Thành Công!</h1>
        <p className="text-gray-500 mb-6">
          Cảm ơn bạn đã đặt vé xem phim <strong className="text-black">{state?.movieName}</strong>. 
          Vui lòng kiểm tra email hoặc mục Vé của tôi để xem mã QR.
        </p>

        <div className="bg-gray-100 p-4 rounded-lg mb-8 text-sm text-left">
           <div className="flex justify-between mb-2">
              <span className="text-gray-500">Mã đơn hàng:</span>
              <span className="font-bold">ORD-{Math.floor(Math.random()*100000)}</span>
           </div>
           <div className="flex justify-between mb-2">
              <span className="text-gray-500">Ghế:</span>
              <span className="font-bold">{state?.orderData?.seats.join(", ")}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-gray-500">Tổng tiền:</span>
              <span className="font-bold text-red-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(state?.orderData?.total)}
              </span>
           </div>
        </div>

        <div className="flex flex-col gap-3">
           <Link to="/profile" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2">
              <Ticket size={20}/> Xem Vé Của Tôi
           </Link>
           <Link to="/" className="w-full border border-gray-300 hover:bg-gray-50 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
              <Home size={20}/> Về Trang Chủ
           </Link>
        </div>
      </div>
    </div>
  );
}