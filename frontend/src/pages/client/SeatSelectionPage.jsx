import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { Armchair, ArrowLeft, Ban } from "lucide-react";

export default function SeatSelectionPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();

  const [showtime, setShowtime] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]); // List ghế đã bán
  const [selectedSeats, setSelectedSeats] = useState([]); // List ghế đang chọn
  const [loading, setLoading] = useState(true);

  // 1. FETCH DỮ LIỆU
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // A. Lấy thông tin phòng
        const showtimeRes = await api.get(`/showtime/${showtimeId}`);
        setShowtime(showtimeRes.data);

        // B. Lấy thông tin vé đã bán (QUAN TRỌNG)
        const ticketRes = await api.get(`/ticket/showtime/${showtimeId}`);
        
        // --- DEBUG LOG (Bật F12 -> Console để xem) ---
        console.log("🔥 Dữ liệu vé thô từ API:", ticketRes.data);

        if (Array.isArray(ticketRes.data)) {
          const occupied = ticketRes.data
            .map(t => t.seatNumber ? t.seatNumber.toString().trim() : null) // Chuyển thành chuỗi và cắt khoảng trắng
            .filter(Boolean); // Loại bỏ null/undefined

          console.log("🔒 Danh sách ghế bị khóa (Final):", occupied);
          setBookedSeats(occupied);
        }

      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showtimeId]);

  // 2. XỬ LÝ CHỌN GHẾ
  const handleSelectSeat = (seat) => {
    const seatNum = seat.seatNumber.trim();
    
    // Chặn nếu ghế bảo trì hoặc đã bán
    if (seat.status === 'maintenance' || bookedSeats.includes(seatNum)) {
        console.log(`🚫 Không thể chọn ghế ${seatNum} vì đã bị khóa.`);
        return;
    }

    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
    } else {
      if (selectedSeats.length >= 8) return alert("Tối đa 8 ghế!");
      setSelectedSeats([...selectedSeats, seatNum]);
    }
  };

  // Tính tiền
  const calculateTotal = () => {
    if (!showtime) return 0;
    return selectedSeats.reduce((total, seatNum) => {
      const seatInfo = showtime.room.seats.find(s => s.seatNumber === seatNum);
      let price = showtime.price || 75000;
      if (seatInfo?.type === 'vip') price += 10000;
      return total + price;
    }, 0);
  };

  const handleCheckout = () => {
    navigate("/checkout", { 
      state: { showtime, selectedSeats, totalPrice: calculateTotal() } 
    });
  };

  if (loading || !showtime) return <div className="bg-gray-900 min-h-screen text-white flex justify-center items-center">Đang tải...</div>;

  const { room } = showtime;

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
       {/* Header */}
       <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center">
          <button onClick={() => navigate(-1)} className="text-white p-2 hover:bg-gray-700 rounded-full"><ArrowLeft/></button>
          <span className="ml-4 font-bold uppercase text-yellow-500 text-lg">{showtime.movie.title}</span>
       </div>

       {/* BODY */}
       <div className="flex-1 p-4 overflow-auto flex justify-center">
          <div className="w-full max-w-4xl flex flex-col items-center">
             <div className="w-2/3 h-2 bg-yellow-500 shadow-[0_5px_20px_orange] mb-12 rounded-full mt-4"></div>
             <p className="text-gray-500 text-sm mb-8 uppercase tracking-widest">Màn hình</p>

            {/* LƯỚI GHẾ */}
            <div 
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${room.cols}, minmax(40px, 1fr))` }}
            >
                  {room.seats.map((seat) => {
  const seatNum = seat.seatNumber.trim();

  // 1. KIỂM TRA TRẠNG THÁI
  const isTaken = bookedSeats.includes(seatNum);     // Đã bán
  const isMaintenance = seat.status === 'maintenance'; // Bảo trì
  const isSelected = selectedSeats.includes(seatNum); // Đang chọn
  const isVip = seat.type === 'vip';

  // 2. XÁC ĐỊNH MÀU SẮC GIAO DIỆN (Visual)
  let seatClasses = "border-gray-600 text-gray-400 hover:border-white hover:text-white cursor-pointer"; 
  
  if (isMaintenance) {
     seatClasses = "bg-red-900/20 border-red-900 text-red-700 cursor-not-allowed"; 
  
  } else if (isTaken) {
     // --- THAY ĐỔI Ở ĐÂY ---
     // Thay vì làm mờ nhẹ, ta làm tối hẳn và chìm đi
     // bg-gray-900: Nền rất tối
     // border-transparent: Không cần viền
     // text-gray-600: Chữ màu xám tối, khó đọc hơn
     // opacity-30: Làm mờ tổng thể xuống còn 30%
     seatClasses = "bg-gray-600 border-transparent text-gray-400 opacity-50 cursor-not-allowed";
     // ---------------------

  } else if (isSelected) {
     seatClasses = "bg-yellow-500 text-black border-yellow-500 font-bold shadow-lg scale-110 z-10"; 
  } else if (isVip) {
     seatClasses = "bg-gray-800 border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.15)]"; 
  } else {
     seatClasses += " bg-gray-800"; 
  }

  return (
     <button
        key={seatNum}
        disabled={isTaken || isMaintenance}
        onClick={() => handleSelectSeat(seat)}
        className={`
           w-10 h-10 rounded-lg flex items-center justify-center text-xs transition-all duration-200 relative group border
           ${seatClasses}
        `}
     >
        {/* --- THAY ĐỔI Ở ĐÂY --- */}
        {/* Nếu bảo trì thì hiện icon Ban, còn lại (kể cả đã bán) vẫn hiện số ghế */}
        {isMaintenance ? <Ban size={14}/> : seatNum}
        {/* --------------------- */}

        {/* Tooltip giữ nguyên */}
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap shadow-lg z-20">
           {isMaintenance 
              ? "Bảo trì" 
              : isTaken 
                 ? "Đã bán" 
                 : `${seatNum} - ${isVip ? 'VIP' : 'Thường'}`
           }
           <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></span>
        </span>
     </button>
  );
})}
            </div>

             {/* Chú thích màu sắc */}
             <div className="flex gap-4 mt-12 text-sm text-gray-400 justify-center">
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-800 border border-gray-600 rounded"></div> Thường</div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-800 border border-orange-500 rounded"></div> VIP</div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-yellow-500 rounded"></div> Đang chọn</div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-700 opacity-50 rounded"></div> Đã bán</div>
             </div>
          </div>
       </div>

       {/* Footer thanh toán */}
       <div className="bg-white p-4 text-black flex justify-between items-center sticky bottom-0 shadow-[0_-5px_10px_rgba(0,0,0,0.2)]">
          <div>Ghế: <b className="text-lg text-red-600">{selectedSeats.join(", ")}</b></div>
          <div className="flex gap-4 items-center">
             <div className="text-right">
                <p className="text-xs text-gray-500">Tạm tính</p>
                <p className="text-xl font-bold text-red-600">{calculateTotal().toLocaleString()} đ</p>
             </div>
             <button onClick={handleCheckout} disabled={selectedSeats.length===0} className="bg-red-600 hover:bg-red-700 transition text-white px-8 py-2 rounded-lg font-bold disabled:bg-gray-300 disabled:cursor-not-allowed">ĐẶT VÉ</button>
          </div>
       </div>
    </div>
  );
}