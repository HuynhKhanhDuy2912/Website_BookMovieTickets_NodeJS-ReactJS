import React from "react";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-10 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Cột 1: Thông tin chung */}
          <div>
            <Link to="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 mb-4 block">
              POPCORN<span className="text-white">CINEMA</span>
            </Link>
            <p className="text-sm mb-4">
              Trải nghiệm điện ảnh đỉnh cao với hệ thống rạp chiếu phim hiện đại, âm thanh sống động và màn hình sắc nét nhất.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-yellow-500 transition"><Facebook size={20} /></a>
              <a href="#" className="hover:text-pink-500 transition"><Instagram size={20} /></a>
              <a href="#" className="hover:text-red-600 transition"><Youtube size={20} /></a>
            </div>
          </div>

          {/* Cột 2: Điều khoản */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-yellow-500 pl-2">Điều khoản</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="hover:text-yellow-400 transition">Điều khoản chung</Link></li>
              <li><Link to="/privacy" className="hover:text-yellow-400 transition">Chính sách bảo mật</Link></li>
              <li><Link to="/rules" className="hover:text-yellow-400 transition">Quy định thành viên</Link></li>
              <li><Link to="/faq" className="hover:text-yellow-400 transition">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          {/* Cột 3: Phim */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-yellow-500 pl-2">Phim</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/movies?status=now" className="hover:text-yellow-400 transition">Phim đang chiếu</Link></li>
              <li><Link to="/movies?status=coming" className="hover:text-yellow-400 transition">Phim sắp chiếu</Link></li>
              <li><Link to="/cinemas" className="hover:text-yellow-400 transition">Danh sách rạp</Link></li>
              <li><Link to="/promotions" className="hover:text-yellow-400 transition">Khuyến mãi</Link></li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-yellow-500 pl-2">Liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={18} className="text-yellow-500 shrink-0" />
                <span>Tầng 5, Tòa nhà Vincom, 123 Nguyễn Huệ, Quận 1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={18} className="text-yellow-500 shrink-0" />
                <span>support@popcorn.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={18} className="text-yellow-500 shrink-0" />
                <span>1900 1234 (8:00 - 22:00)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
          <p>© 2024 Popcorn Cinema. All rights reserved.</p>
          <p className="mt-1">Designed by Khanh Duy</p>
        </div>
      </div>
    </footer>
  );
}