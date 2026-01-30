import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { Armchair, ArrowLeft, Ban } from "lucide-react";
import io from "socket.io-client";

// Kết nối Socket (Ngoài component để giữ kết nối ổn định)
const socket = io.connect("http://localhost:5000");

export default function SeatSelectionPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();

  // --- STATE ---
  const [showtime, setShowtime] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);   // Ghế ĐÃ BÁN (DB) - Màu Xám Đậm
  const [selectedSeats, setSelectedSeats] = useState([]); // Ghế TÔI đang giữ - Màu Vàng Đậm
  const [heldSeats, setHeldSeats] = useState({});         // Ghế NGƯỜI KHÁC đang giữ - Màu Vàng Nhạt
  const [loading, setLoading] = useState(true);

  // --- 1. HELPER: LẤY ID NGƯỜI DÙNG (CỐ ĐỊNH) ---
  // Hàm này giúp Server biết "Ai là ai" dù có F5 hay đổi SocketID
  const getMyUserId = () => {
     // A. Nếu đã đăng nhập -> Lấy User ID
     const rawData = JSON.parse(localStorage.getItem("user"));
     const currentUser = rawData?.user || rawData;
     if (currentUser && (currentUser._id || currentUser.id)) {
         return currentUser._id || currentUser.id;
     }
     
     // B. Nếu là khách -> Lấy Guest ID từ LocalStorage
     let guestId = localStorage.getItem("chat_session_id");
     if (!guestId) {
        guestId = "guest_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("chat_session_id", guestId);
     }
     return guestId;
  };

  const myUserId = getMyUserId(); // ID này không đổi khi F5

  // --- 2. SETUP SOCKET (REAL-TIME LOGIC) ---
  useEffect(() => {
    // A. Join phòng kèm theo UserID để nhận diện chủ nhân
    socket.emit("join_showtime", { showtimeId, userId: myUserId });

    // B. Server trả về hiện trạng phòng (Phân loại ghế TÔI giữ và NGƯỜI KHÁC giữ)
    socket.on("load_initial_seats", ({ myHolds, othersHolds }) => {
        // Khôi phục lại ghế tôi đang chọn (Fix lỗi F5 mất ghế)
        if (myHolds && myHolds.length > 0) {
            setSelectedSeats(myHolds);
        }
        // Hiển thị ghế người khác đang chọn
        setHeldSeats(othersHolds);
    });

    // C. Ai đó vừa giữ ghế (Real-time)
    socket.on("seat_held", ({ seatLabel, holderId }) => {
        if (holderId === myUserId) {
            // Nếu là chính mình (ở tab khác) -> Cập nhật vào selectedSeats
            setSelectedSeats(prev => {
                if (!prev.includes(seatLabel)) return [...prev, seatLabel];
                return prev;
            });
        } else {
            // Nếu là người khác -> Cập nhật vào heldSeats
            setHeldSeats(prev => ({ ...prev, [seatLabel]: holderId }));
        }
    });

    // D. Ai đó vừa nhả ghế
    socket.on("seat_released", (seatLabel) => {
        // Xóa khỏi danh sách người khác giữ
        setHeldSeats(prev => {
            const newState = { ...prev };
            delete newState[seatLabel];
            return newState;
        });
        // Đồng thời xóa khỏi danh sách mình chọn (nếu server force release)
        setSelectedSeats(prev => prev.filter(s => s !== seatLabel));
    });

    // E. Ai đó vừa mua xong (Quan trọng)
    socket.on("seat_sold", (seatLabel) => {
        setBookedSeats(prev => [...prev, seatLabel]); // Chuyển sang màu xám
        // Xóa khỏi các trạng thái giữ
        setHeldSeats(prev => { const n = {...prev}; delete n[seatLabel]; return n; });
        setSelectedSeats(prev => prev.filter(s => s !== seatLabel));
    });

    return () => {
        socket.off("load_initial_seats");
        socket.off("seat_held");
        socket.off("seat_released");
        socket.off("seat_sold");
    };
  }, [showtimeId, myUserId]);


  // --- 3. FETCH DỮ LIỆU TĨNH TỪ API ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Lấy thông tin phòng chiếu
        const showtimeRes = await api.get(`/showtime/${showtimeId}`);
        setShowtime(showtimeRes.data);

        // Lấy vé đã bán từ DB
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


  // --- 4. XỬ LÝ CHỌN GHẾ ---
  const handleSelectSeat = (seat) => {
    const seatNum = seat.seatNumber.trim();
    
    // 1. Chặn nếu ghế bảo trì hoặc đã bán
    if (seat.status === 'maintenance' || bookedSeats.includes(seatNum)) return;

    // 2. Chặn nếu ghế đang bị NGƯỜI KHÁC giữ
    if (heldSeats[seatNum]) {
        alert("Ghế này đang có người khác chọn!");
        return;
    }

    // 3. Logic Chọn / Bỏ chọn
    if (selectedSeats.includes(seatNum)) {
      // --- BỎ CHỌN (UNHOLD) ---
      // Cập nhật UI ngay lập tức cho mượt
      setSelectedSeats(prev => prev.filter(s => s !== seatNum));
      // Gửi Socket báo Server nhả ghế
      socket.emit("unhold_seat", { showtimeId, seatLabel: seatNum, userId: myUserId });
    } else {
      // --- CHỌN (HOLD) ---
      if (selectedSeats.length >= 8) return alert("Tối đa 8 ghế!");
      
      // Cập nhật UI ngay
      setSelectedSeats(prev => [...prev, seatNum]);
      // Gửi Socket báo Server giữ ghế kèm theo UserID
      socket.emit("hold_seat", { showtimeId, seatLabel: seatNum, userId: myUserId });
    }
  };

  // Tính tổng tiền
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

                  // --- LOGIC TRẠNG THÁI GHẾ ---
                  const isTaken = bookedSeats.includes(seatNum);      // Đã bán (Database)
                  const isMaintenance = seat.status === 'maintenance'; // Bảo trì
                  const isSelected = selectedSeats.includes(seatNum); // TÔI đang chọn (Xanh/Vàng đậm)
                  const isHeldByOthers = heldSeats[seatNum];          // NGƯỜI KHÁC đang giữ (Vàng nhạt)
                  const isVip = seat.type === 'vip';

                  // --- LOGIC MÀU SẮC (VISUAL) ---
                  let seatClasses = "border-gray-600 text-gray-400 hover:border-white hover:text-white cursor-pointer"; 
                  
                  if (isMaintenance) {
                     seatClasses = "bg-red-900/20 border-red-900 text-red-700 cursor-not-allowed"; 
                  
                  } else if (isTaken) {
                     // Ghế đã bán: Tối màu, không click được
                     seatClasses = "bg-gray-600 border-transparent text-gray-400 opacity-50 cursor-not-allowed";

                  } else if (isHeldByOthers) {
                     // Ghế người khác đang giữ: Màu vàng nhạt, không click được
                     seatClasses = "bg-yellow-600/50 border-yellow-600 text-yellow-200 cursor-not-allowed opacity-80";

                  } else if (isSelected) {
                     // Ghế TÔI chọn: Màu vàng chuẩn, nổi bật
                     seatClasses = "bg-yellow-500 text-black border-yellow-500 font-bold shadow-lg scale-110 z-10"; 
                  
                  } else if (isVip) {
                     seatClasses = "bg-gray-800 border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.15)]"; 
                  } else {
                     seatClasses += " bg-gray-800"; 
                  }

                  return (
                     <button
                        key={seatNum}
                        // Disable nếu: Đã bán OR Bảo trì OR Người khác đang giữ
                        disabled={isTaken || isMaintenance || isHeldByOthers} 
                        onClick={() => handleSelectSeat(seat)}
                        className={`
                           w-10 h-10 rounded-lg flex items-center justify-center text-xs transition-all duration-200 relative group border
                           ${seatClasses}
                        `}
                     >
                        {isMaintenance ? <Ban size={14}/> : seatNum}

                        {/* Tooltip hiển thị trạng thái */}
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