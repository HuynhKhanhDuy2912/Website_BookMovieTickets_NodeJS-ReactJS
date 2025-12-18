import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import { 
  CreditCard, MapPin, Calendar, Clock, Armchair, 
  Trash2, ArrowLeft, CheckCircle, Utensils 
} from "lucide-react";

// Helper tính tổng tiền VND
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function CheckoutPage() {
  const { state } = useLocation(); // Nhận dữ liệu từ trang Chọn Ghế
  const navigate = useNavigate();

  // --- STATE ---
  const [combos, setCombos] = useState([]); // List combo từ API
  const [selectedCombos, setSelectedCombos] = useState({}); // { comboId: quantity }
  const [paymentMethod, setPaymentMethod] = useState("Momo");
  const [loading, setLoading] = useState(false);

  // Nếu người dùng vào thẳng link này mà ko qua chọn ghế -> Đá về trang chủ
  useEffect(() => {
    if (!state || !state.showtime) {
      navigate("/");
    }
    // Fetch Combo
    const fetchCombos = async () => {
        try {
            const res = await api.get("/combo");
            setCombos(res.data);
        } catch(err) {
            console.log("Lỗi tải combo", err);
        }
    }
    fetchCombos();
  }, [state, navigate]);

  if (!state) return null;

  const { showtime, selectedSeats, totalPrice: ticketTotal } = state;
  const user = JSON.parse(localStorage.getItem("user")); // Lấy user đang đăng nhập

  // --- TÍNH TOÁN TIỀN ---
  // Tính tổng tiền Combo
  const comboTotal = Object.keys(selectedCombos).reduce((acc, comboId) => {
    const combo = combos.find(c => c._id === comboId);
    return acc + (combo?.price || 0) * selectedCombos[comboId];
  }, 0);

  const finalTotal = ticketTotal + comboTotal;

  // --- XỬ LÝ COMBO ---
  const handleComboChange = (comboId, delta) => {
    setSelectedCombos(prev => {
      const currentQty = prev[comboId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      return { ...prev, [comboId]: newQty };
    });
  };

  // --- XỬ LÝ THANH TOÁN (GỌI API) ---
  const handlePayment = async () => {
    if(!user) return alert("Vui lòng đăng nhập lại!");
    
    setLoading(true);
    try {
      // Chuẩn bị dữ liệu gửi về Backend
      const payload = {
         userId: user.id || user._id, // Tuỳ cách bạn lưu trong localStorage
         showtimeId: showtime._id,
         seats: selectedSeats,
         total: finalTotal,
         paymentMethod: paymentMethod,
         combos: Object.entries(selectedCombos).map(([id, qty]) => ({ comboId: id, quantity: qty })).filter(i => i.quantity > 0)
      };

      // Gọi API tạo đơn
      await api.post("/order", payload);

      // Thành công -> Chuyển sang trang thông báo thành công
      navigate("/booking/success", { 
         state: { 
            orderData: payload, 
            movieName: showtime.movie.title 
         } 
      });

    } catch (err) {
      alert("Lỗi thanh toán: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-20 pt-6">
      <div className="container mx-auto px-4">
        
        {/* Nút Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
           <ArrowLeft size={20}/> Quay lại chọn ghế
        </button>

        <h1 className="text-3xl font-bold mb-8 text-center uppercase text-yellow-500">Thanh Toán & Xác Nhận</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* CỘT TRÁI: CHỌN COMBO & PHƯƠNG THỨC THANH TOÁN */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Chọn Combo */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Utensils className="text-yellow-500"/> Chọn Combo Bắp Nước
                 </h3>
                 <div className="space-y-4">
                    {combos.map(combo => (
                       <div key={combo._id} className="flex items-center justify-between bg-gray-900 p-4 rounded-lg">
                          <div className="flex items-center gap-4">
                             <div className="w-16 h-16 bg-gray-700 rounded overflow-hidden">
                                {/* Nếu có ảnh combo thì hiện, ko thì placeholder */}
                                <img src={combo.image || "https://placehold.co/100"} alt={combo.name} className="w-full h-full object-cover"/>
                             </div>
                             <div>
                                <h4 className="font-bold text-white">{combo.name}</h4>
                                <p className="text-sm text-gray-400">{combo.description}</p>
                                <p className="text-yellow-500 font-bold">{formatCurrency(combo.price)}</p>
                             </div>
                          </div>
                          
                          {/* Tăng giảm số lượng */}
                          <div className="flex items-center gap-3 bg-gray-800 rounded px-2 py-1 border border-gray-600">
                             <button onClick={() => handleComboChange(combo._id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded">-</button>
                             <span className="font-bold w-4 text-center">{selectedCombos[combo._id] || 0}</span>
                             <button onClick={() => handleComboChange(combo._id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded text-yellow-500">+</button>
                          </div>
                       </div>
                    ))}
                    {combos.length === 0 && <p className="text-gray-500 italic">Hiện không có combo nào.</p>}
                 </div>
              </div>

              {/* 2. Phương thức thanh toán */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CreditCard className="text-yellow-500"/> Phương Thức Thanh Toán
                 </h3>
                 <div className="space-y-3">
                    {/* Momo */}
                    <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition ${paymentMethod === 'Momo' ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-600 bg-gray-900'}`}>
                       <input type="radio" name="payment" value="Momo" checked={paymentMethod === 'Momo'} onChange={() => setPaymentMethod('Momo')} className="w-5 h-5 accent-yellow-500"/>
                       <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" className="w-8 h-8 rounded" alt="Momo"/>
                       <span className="font-bold">Ví điện tử Momo</span>
                    </label>

                    {/* VNPAY */}
                    <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition ${paymentMethod === 'VNPAY' ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-600 bg-gray-900'}`}>
                       <input type="radio" name="payment" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} className="w-5 h-5 accent-yellow-500"/>
                       <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" className="w-8 h-8 rounded bg-white p-0.5" alt="VNPAY"/>
                       <span className="font-bold">VNPAY QR</span>
                    </label>

                     {/* Bank */}
                     <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition ${paymentMethod === 'ATM' ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-600 bg-gray-900'}`}>
                       <input type="radio" name="payment" value="ATM" checked={paymentMethod === 'ATM'} onChange={() => setPaymentMethod('ATM')} className="w-5 h-5 accent-yellow-500"/>
                       <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-xs font-bold">ATM</div>
                       <span className="font-bold">Thẻ ATM Nội Địa / Internet Banking</span>
                    </label>
                 </div>
              </div>
           </div>

           {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (BILL) */}
           <div className="lg:col-span-1">
              <div className="bg-white text-gray-900 rounded-xl p-6 shadow-xl sticky top-24">
                 <h3 className="text-2xl font-bold mb-6 text-center border-b-2 border-dashed border-gray-300 pb-4">VÉ XEM PHIM</h3>
                 
                 {/* Thông tin phim */}
                 <div className="mb-4">
                    <h4 className="text-xl font-bold mb-1">{showtime.movie.title}</h4>
                    <p className="text-sm text-gray-600 font-medium">{showtime.cinema.name}</p>
                    <p className="text-sm text-gray-500">{showtime.room.name}</p>
                 </div>

                 {/* Thời gian */}
                 <div className="flex justify-between items-center mb-4 text-sm bg-gray-100 p-3 rounded">
                    <div className="flex flex-col">
                       <span className="text-gray-500 flex items-center gap-1"><Calendar size={12}/> Ngày chiếu</span>
                       <span className="font-bold">{new Date(showtime.startTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-gray-500 flex items-center justify-end gap-1"><Clock size={12}/> Giờ chiếu</span>
                       <span className="font-bold">{new Date(showtime.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                 </div>

                 {/* Ghế ngồi */}
                 <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                       <span className="text-gray-600">Ghế đã chọn:</span>
                       <span className="font-bold text-gray-900 flex flex-wrap justify-end gap-1 max-w-[150px]">
                          {selectedSeats.join(", ")}
                       </span>
                    </div>
                 </div>

                 <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

                 {/* Chi tiết giá */}
                 <div className="space-y-2 text-sm mb-6">
                    <div className="flex justify-between">
                       <span>Giá vé ({selectedSeats.length}x):</span>
                       <span className="font-bold">{formatCurrency(ticketTotal)}</span>
                    </div>
                    {comboTotal > 0 && (
                       <div className="flex justify-between text-orange-600">
                          <span>Combo:</span>
                          <span className="font-bold">{formatCurrency(comboTotal)}</span>
                       </div>
                    )}
                 </div>

                 {/* Tổng tiền */}
                 <div className="flex justify-between items-center text-xl font-bold text-red-600 mb-6">
                    <span>TỔNG CỘNG:</span>
                    <span>{formatCurrency(finalTotal)}</span>
                 </div>

                 {/* Nút thanh toán */}
                 <button 
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg text-lg uppercase transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                 >
                    {loading ? "Đang xử lý..." : "Thanh Toán Ngay"}
                 </button>
                 <p className="text-xs text-center text-gray-500 mt-3">
                    Bằng việc click vào thanh toán, bạn đồng ý với điều khoản của chúng tôi.
                 </p>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}