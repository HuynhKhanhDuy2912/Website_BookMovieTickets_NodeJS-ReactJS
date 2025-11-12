import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex gap-4">
      <Link to="/order" className="hover:underline">
        Order
      </Link>
      <Link to="/movie" className="hover:underline">
        Phim
      </Link>
      <Link to="/combo" className="hover:underline">
        Combo
      </Link>
      <Link to="/cinema" className="hover:underline">
        Rạp
      </Link>
      <Link to="/articles" className="hover:underline">
        Bài viết
      </Link>
      <Link to="/login" className="hover:underline ml-auto">
        Đăng nhập
      </Link>
      <Link to="/register" className="hover:underline">
        Đăng ký
      </Link>
    </nav>
  );
}
