import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { Armchair, ArrowLeft, Ban, Clock } from "lucide-react"; // Import thêm Clock
import io from "socket.io-client";

// Kết nối Socket
const socket = io.connect("http://localhost:5000");

export default function SeatSelectionPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();

  // --- STATE ---
  const [showtime, setShowtime] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);   // Ghế ĐÃ BÁN
  const [selectedSeats, setSelectedSeats] = useState([]); // Ghế TÔI đang giữ
  const [heldSeats, setHeldSeats] = useState({});         // Ghế NGƯỜI KHÁC đang giữ
  
  // State mới cho Timer
  const [seatTimers, setSeatTimers] = useState({}); // Lưu thời gian hết hạn: { "A1": 1719... }
  const [timeLeft, setTimeLeft] = useState(null);   // Thời gian hiển thị (giây)
  
  const [loading, setLoading] = useState(true);

  // --- 1. HELPER: LẤY ID NGƯỜI DÙNG ---
  const getMyUserId = () => {
     const rawData = JSON.parse(localStorage.getItem("user"));
     const currentUser = rawData?.user || rawData;
     if (currentUser && (currentUser._id || currentUser.id)) {
         return currentUser._id || currentUser.id;
     }
     let guestId = localStorage.getItem("chat_session_id");
     if (!guestId) {
        guestId = "guest_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("chat_session_id", guestId);
     }
     return guestId;
  };

  const myUserId = getMyUserId();

  // --- 2. SETUP SOCKET ---
  useEffect(() => {
    socket.emit("join_showtime", { showtimeId, userId: myUserId });

    // A. Load danh sách ghế + Thời gian hết hạn
    socket.on("load_initial_seats", ({ myHolds, othersHolds }) => {
        if (myHolds && myHolds.length > 0) {
            // Tách mảng ghế và mảng thời gian
            const seats = myHolds.map(h => h.seat);
            const timers = {};
            myHolds.forEach(h => { timers[h.seat] = h.expiresAt; });

            setSelectedSeats(seats);
            setSeatTimers(timers);
        }
        setHeldSeats(othersHolds);
    });

    // B. Khi ghế được giữ
    socket.on("seat_held", ({ seatLabel, holderId }) => {
        if (holderId === myUserId) {
            setSelectedSeats(prev => {
                if (!prev.includes(seatLabel)) return [...prev, seatLabel];
                return prev;
            });
            // Tự đặt timer 5 phút cho ghế vừa chọn (Server cũng set 5p tương tự)
            setSeatTimers(prev => ({ ...prev, [seatLabel]: Date.now() + 5 * 60 * 1000 }));
        } else {
            setHeldSeats(prev => ({ ...prev, [seatLabel]: holderId }));
        }
    });

    // C. Khi ghế được nhả (Do bỏ chọn hoặc Hết giờ)
    socket.on("seat_released", (seatLabel) => {
        // Xóa khỏi danh sách người khác giữ
        setHeldSeats(prev => { const n = {...prev}; delete n[seatLabel]; return n; });
        
        // Xóa khỏi danh sách mình chọn + Xóa Timer
        setSelectedSeats(prev => prev.filter(s => s !== seatLabel));
        setSeatTimers(prev => { const n = {...prev}; delete n[seatLabel]; return n; });
    });

    // D. Khi ghế đã bán
    socket.on("seat_sold", (seatLabel) => {
        setBookedSeats(prev => [...prev, seatLabel]); 
        setHeldSeats(prev => { const n = {...prev}; delete n[seatLabel]; return n; });
        setSelectedSeats(prev => prev.filter(s => s !== seatLabel));
        setSeatTimers(prev => { const n = {...prev}; delete n[seatLabel]; return n; });
    });

    return () => {
        socket.off("load_initial_seats");
        socket.off("seat_held");
        socket.off("seat_released");
        socket.off("seat_sold");
    };
  }, [showtimeId, myUserId]);


  // --- 3. LOGIC TÍNH TOÁN ĐỒNG HỒ (CLIENT SIDE) ---
  useEffect(() => {
    if (selectedSeats.length === 0) {
        setTimeLeft(null);
        return;
    }

    const interval = setInterval(() => {
        const now = Date.now();
        let minExpire = Infinity;
        
        // Tìm thời gian hết hạn SỚM NHẤT trong các ghế đang chọn
        selectedSeats.forEach(seat => {
            if (seatTimers[seat] && seatTimers[seat] < minExpire) {
                minExpire = seatTimers[seat];
            }
        });

        if (minExpire === Infinity) return;

        // Tính giây còn lại
        const remaining = Math.max(0, Math.floor((minExpire - now) / 1000));
        setTimeLeft(remaining);

        // UI Feedback khi hết giờ (thực tế server sẽ tự bắn seat_released để xóa ghế)
        if (remaining === 0) {
             // Có thể thêm alert("Hết thời gian giữ vé!") nếu muốn
        }

    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSeats, seatTimers]);

  // Helper format giây -> MM:SS
  const formatTime = (seconds) => {
      if (seconds === null) return "";
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };


  // --- 4. FETCH API ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const showtimeRes = await api.get(`/showtime/${showtimeId}`);
        setShowtime(showtimeRes.data);

        const ticketRes = await api.get(`/ticket/showtime/${showtimeId}`);
        if (Array.isArray(ticketRes.data)) {
          const occupied = ticketRes.data
            .map(t => t.seatNumber ? t.seatNumber.toString().trim() : null)
            .filter(Boolean);
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


  // --- 5. XỬ LÝ CLICK GHẾ ---
  const handleSelectSeat = (seat) => {
    const seatNum = seat.seatNumber.trim();
    
    if (seat.status === 'maintenance' || bookedSeats.includes(seatNum)) return;

    if (heldSeats[seatNum]) {
        alert("Ghế này đang có người khác chọn!");
        return;
    }

    if (selectedSeats.includes(seatNum)) {
      // Unhold
      setSelectedSeats(prev => prev.filter(s => s !== seatNum));
      socket.emit("unhold_seat", { showtimeId, seatLabel: seatNum, userId: myUserId });
    } else {
      // Hold
      if (selectedSeats.length >= 8) return alert("Tối đa 8 ghế!");
      
      setSelectedSeats(prev => [...prev, seatNum]);
      socket.emit("hold_seat", { showtimeId, seatLabel: seatNum, userId: myUserId });
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
       <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
             <button onClick={() => navigate(-1)} className="text-white p-2 hover:bg-gray-700 rounded-full"><ArrowLeft/></button>
             <span className="ml-4 font-bold uppercase text-yellow-500 text-lg">{showtime.movie.title}</span>
          </div>

          {/* 🔥 ĐỒNG HỒ ĐẾM NGƯỢC */}
          {timeLeft !== null && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-600 rounded-lg animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                  <Clock size={20} className="text-red-500"/>
                  <span className="font-mono font-bold text-red-500 text-xl tracking-widest">
                      {formatTime(timeLeft)}
                  </span>
              </div>
          )}
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

                  // State
                  const isTaken = bookedSeats.includes(seatNum);
                  const isMaintenance = seat.status === 'maintenance'; 
                  const isSelected = selectedSeats.includes(seatNum); 
                  const isHeldByOthers = heldSeats[seatNum];
                  const isVip = seat.type === 'vip';

                  // Visual
                  let seatClasses = "border-gray-600 text-gray-400 hover:border-white hover:text-white cursor-pointer"; 
                  
                  if (isMaintenance) {
                     seatClasses = "bg-red-900/20 border-red-900 text-red-700 cursor-not-allowed"; 
                  
                  } else if (isTaken) {
                     seatClasses = "bg-gray-600 border-transparent text-gray-400 opacity-50 cursor-not-allowed";

                  } else if (isHeldByOthers) {
                     seatClasses = "bg-yellow-600/50 border-yellow-600 text-yellow-200 cursor-not-allowed opacity-80";

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
                        disabled={isTaken || isMaintenance || isHeldByOthers} 
                        onClick={() => handleSelectSeat(seat)}
                        className={`
                           w-10 h-10 rounded-lg flex items-center justify-center text-xs transition-all duration-200 relative group border
                           ${seatClasses}
                        `}
                     >
                        {isMaintenance ? <Ban size={14}/> : seatNum}

                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap shadow-lg z-20">
                           {isMaintenance ? "Bảo trì" : 
                            isTaken ? "Đã bán" : 
                            isHeldByOthers ? "Đang có người chọn" :
                            `${seatNum} - ${isVip ? 'VIP' : 'Thường'}`
                           }
                           <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></span>
                        </span>
                     </button>
                  );
                })}
            </div>

             {/* Chú thích màu sắc */}
             <div className="flex gap-4 mt-12 text-sm text-gray-400 justify-center flex-wrap">
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-800 border border-gray-600 rounded"></div> Thường</div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-800 border border-orange-500 rounded"></div> VIP</div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-yellow-500 rounded"></div> Đang chọn</div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-yellow-600/50 border border-yellow-600 rounded"></div> Người khác giữ</div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-600 opacity-50 rounded"></div> Đã bán</div>
             </div>
          </div>
       </div>

       {/* Footer */}
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