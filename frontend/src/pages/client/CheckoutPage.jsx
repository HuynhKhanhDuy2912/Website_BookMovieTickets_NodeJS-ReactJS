import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { 
  CreditCard, ArrowLeft, Utensils, Calendar, Clock, AlertTriangle 
} from "lucide-react";

// Helper tính tổng tiền VND
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function CheckoutPage() {
  const { state } = useLocation(); 
  const navigate = useNavigate();

  // --- STATE ---
  const [combos, setCombos] = useState([]); 
  const [selectedCombos, setSelectedCombos] = useState({}); 
  const [paymentMethod, setPaymentMethod] = useState("Momo");
  const [loading, setLoading] = useState(false);
  
  // 🔥 THÊM STATE ĐẾM NGƯỢC (5 Phút = 300 Giây)
  // Backend giữ 10 phút, Frontend đếm 5 phút để đảm bảo an toàn tuyệt đối
  const [timeLeft, setTimeLeft] = useState(5 * 60); 

  // --- 1. CHECK VALIDATION & FETCH COMBOS ---
  useEffect(() => {
    if (!state || !state.showtime) {
      navigate("/");
      return;
    }
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

  // --- 2. LOGIC ĐẾM NGƯỢC ---
  useEffect(() => {
    if (!state) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout(); // Hết giờ thì xử lý
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup khi component unmount (hoặc user rời trang)
    return () => clearInterval(timer);
  }, []);

  // Hàm xử lý khi hết giờ
  const handleTimeout = () => {
    alert("⏳ Đã hết thời gian giữ ghế! Vui lòng chọn lại vé.");
    // Quay lại trang chọn ghế của suất chiếu đó
    if (state && state.showtime) {
        navigate(`/booking/${state.showtime._id}`); 
    } else {
        navigate("/");
    }
  };

  // Format giây -> MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!state) return null;

  const { showtime, selectedSeats, totalPrice: ticketTotal } = state;
  const user = JSON.parse(localStorage.getItem("user")); 

  // --- TÍNH TOÁN TIỀN ---
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

  const handlePayment = async () => {
    if(!user) return alert("Vui lòng đăng nhập lại!");
    
    setLoading(true);
    try {
      const payload = {
         userId: user.id || user._id, 
         showtimeId: showtime._id,
         seats: selectedSeats,
         total: finalTotal,
         paymentMethod: paymentMethod,
         combos: Object.entries(selectedCombos).map(([id, qty]) => ({ comboId: id, quantity: qty })).filter(i => i.quantity > 0)
      };

      await api.post("/order", payload);

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

  const getImageUrl = (img) => {
      if (!img) return "https://placehold.co/100x100?text=No+Image";
      if (img.startsWith("http")) return img;
      return `http://localhost:5000/${img.replace(/\\/g, '/').replace(/^\//, '')}`;
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-20 pt-6">
      <div className="container mx-auto px-4">
        
        {/* Nút Quay Lại */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
           <ArrowLeft size={20}/> Quay lại chọn ghế
        </button>

        {/* 🔥 THANH ĐẾM NGƯỢC (STICKY TOP) */}
        <div className="sticky top-4 z-50 mb-8 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r shadow-lg flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center text-amber-800">
                <AlertTriangle className="mr-3 text-amber-600" size={24} />
                <div>
                    <p className="font-bold text-sm md:text-base">Vui lòng hoàn tất thanh toán!</p>
                    <p className="text-xs md:text-sm text-amber-700">Ghế của bạn sẽ được giữ trong thời gian đếm ngược.</p>
                </div>
            </div>
            <div className="flex items-center bg-white px-4 py-2 rounded-lg border border-amber-200 shadow-inner">
                <Clock className="text-red-500 mr-2 animate-pulse" size={20} />
                <span className={`text-2xl font-mono font-bold tracking-widest ${timeLeft < 60 ? 'text-red-600 animate-bounce' : 'text-gray-800'}`}>
                    {formatTime(timeLeft)}
                </span>
            </div>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center uppercase text-yellow-500">Thanh Toán & Xác Nhận</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* CỘT TRÁI: CHỌN COMBO & PHƯƠNG THỨC THANH TOÁN */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Chọn Combo */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-3">
                    <Utensils className="text-yellow-500"/> Chọn Combo Bắp Nước
                 </h3>
                 <div className="space-y-4">
                    {combos.map(combo => (
                       <div key={combo._id} className="flex items-center justify-between bg-gray-900 p-4 rounded-lg border border-gray-800 hover:border-gray-600 transition">
                          <div className="flex items-center gap-4">
                             <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden shrink-0 border border-gray-600">
                                <img 
                                    src={getImageUrl(combo.image)} 
                                    alt={combo.name} 
                                    className="w-full h-full object-cover hover:scale-110 transition duration-300"
                                    onError={(e) => {e.target.src = "https://placehold.co/100x100?text=No+Img"}}
                                />
                             </div>
                             <div>
                                <h4 className="font-bold text-white text-lg">{combo.name}</h4>
                                <p className="text-sm text-gray-400 line-clamp-2">{combo.description}</p>
                                <p className="text-yellow-500 font-bold mt-1">{formatCurrency(combo.price)}</p>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-2 py-1.5 border border-gray-600">
                             <button onClick={() => handleComboChange(combo._id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-gray-300 font-bold transition">-</button>
                             <span className="font-bold w-6 text-center text-white">{selectedCombos[combo._id] || 0}</span>
                             <button onClick={() => handleComboChange(combo._id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-yellow-500 font-bold transition">+</button>
                          </div>
                       </div>
                    ))}
                    {combos.length === 0 && <p className="text-gray-500 italic text-center py-4">Hiện không có combo nào.</p>}
                 </div>
              </div>

              {/* 2. Phương thức thanh toán */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-3">
                    <CreditCard className="text-yellow-500"/> Phương Thức Thanh Toán
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Momo */}
                    <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition relative overflow-hidden group ${paymentMethod === 'Momo' ? 'border-pink-500 bg-pink-900/20' : 'border-gray-600 bg-gray-900 hover:bg-gray-750'}`}>
                       <input type="radio" name="payment" value="Momo" checked={paymentMethod === 'Momo'} onChange={() => setPaymentMethod('Momo')} className="w-5 h-5 accent-pink-500"/>
                       <img src="https://avatars.githubusercontent.com/u/36770798?s=200&v=4" className="w-10 h-10 rounded-lg bg-white p-0.5 object-contain" alt="Momo"/>
                       <span className="font-bold text-gray-200 group-hover:text-white">Ví MoMo</span>
                       {paymentMethod === 'Momo' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-pink-500"></div>}
                    </label>

                    {/* VNPAY */}
                    <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition relative overflow-hidden group ${paymentMethod === 'VNPAY' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 bg-gray-900 hover:bg-gray-750'}`}>
                       <input type="radio" name="payment" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} className="w-5 h-5 accent-blue-500"/>
                       <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" className="w-10 h-10 rounded-lg bg-white p-0.5 object-contain" alt="VNPAY"/>
                       <span className="font-bold text-gray-200 group-hover:text-white">VNPAY QR</span>
                       {paymentMethod === 'VNPAY' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                    </label>

                     {/* ATM */}
                     <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition relative overflow-hidden group ${paymentMethod === 'ATM' ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-900 hover:bg-gray-750'}`}>
                       <input type="radio" name="payment" value="ATM" checked={paymentMethod === 'ATM'} onChange={() => setPaymentMethod('ATM')} className="w-5 h-5 accent-green-500"/>
                       <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md">ATM</div>
                       <span className="font-bold text-gray-200 group-hover:text-white">Thẻ Nội Địa</span>
                       {paymentMethod === 'ATM' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-500"></div>}
                    </label>
                 </div>
              </div>
           </div>

           {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (BILL) */}
           <div className="lg:col-span-1">
              <div className="bg-white text-gray-900 rounded-xl p-6 shadow-2xl sticky top-24 border-t-8 border-yellow-500">
                 <h3 className="text-2xl font-bold mb-6 text-center border-b-2 border-dashed border-gray-300 pb-4 uppercase tracking-wide text-red-600">Vé Xem Phim</h3>
                 
                 <div className="mb-4 text-center">
                    <h4 className="text-xl font-extrabold mb-1 uppercase text-gray-800">{showtime.movie.title}</h4>
                    <p className="text-sm text-gray-600 font-bold">{showtime.cinema.name}</p>
                    <p className="text-xs text-gray-500">{showtime.room.name}</p>
                 </div>

                 <div className="flex justify-between items-center mb-4 text-sm bg-gray-100 p-3 rounded-lg border border-gray-200">
                    <div className="flex flex-col">
                       <span className="text-gray-500 flex items-center gap-1 text-xs uppercase font-semibold"><Calendar size={12}/> Ngày chiếu</span>
                       <span className="font-bold text-gray-800">{new Date(showtime.startTime).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-gray-500 flex items-center justify-end gap-1 text-xs uppercase font-semibold"><Clock size={12}/> Giờ chiếu</span>
                       <span className="font-bold text-gray-800">{new Date(showtime.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                 </div>

                 <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1 items-center">
                       <span className="text-gray-600 font-medium">Ghế đã chọn:</span>
                       <span className="font-bold text-red-600 text-lg flex flex-wrap justify-end gap-1 max-w-[150px] text-right">
                          {selectedSeats.join(", ")}
                       </span>
                    </div>
                 </div>

                 <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

                 <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between items-center">
                       <span className="text-gray-600">Giá vé ({selectedSeats.length}x):</span>
                       <span className="font-bold text-gray-800">{formatCurrency(ticketTotal)}</span>
                    </div>
                    
                    {/* Liệt kê Combo */}
                    {Object.keys(selectedCombos).map(comboId => {
                       const qty = selectedCombos[comboId];
                       if (qty <= 0) return null;
                       const combo = combos.find(c => c._id === comboId);
                       if (!combo) return null;

                       return (
                           <div key={comboId} className="flex justify-between items-center text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                               <span className="flex items-center gap-1">
                                   <Utensils size={10}/> {combo.name} <b className="text-black ml-1">x{qty}</b>
                               </span>
                               <span className="font-bold">{formatCurrency(combo.price * qty)}</span>
                           </div>
                       );
                    })}
                 </div>

                 <div className="flex justify-between items-center text-xl font-extrabold text-red-600 mb-6 bg-red-50 p-3 rounded-lg border border-red-100">
                    <span>TỔNG CỘNG:</span>
                    <span>{formatCurrency(finalTotal)}</span>
                 </div>

                 <button 
                    onClick={handlePayment}
                    disabled={loading || timeLeft === 0}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-lg text-lg uppercase transition-all shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                 >
                    {loading ? (
                       <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Đang xử lý...
                       </>
                    ) : "Thanh Toán Ngay"}
                 </button>
                 <p className="text-[10px] text-center text-gray-400 mt-3 italic">
                    Bằng việc click vào thanh toán, bạn đồng ý với điều khoản dịch vụ của Popcorn Cinema.
                 </p>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}