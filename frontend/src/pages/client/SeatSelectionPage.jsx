import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { Armchair, ArrowLeft, Ban, Clock, Crown } from "lucide-react"; 
import io from "socket.io-client";

// URL Backend
const SOCKET_URL = "http://localhost:5000";

export default function SeatSelectionPage() {
   const { showtimeId } = useParams();
   const navigate = useNavigate();
   const socketRef = useRef(null);

   // --- STATE ---
   const [showtime, setShowtime] = useState(null);
   const [bookedSeats, setBookedSeats] = useState([]);   // Ghế ĐÃ BÁN
   const [selectedSeats, setSelectedSeats] = useState([]); // Ghế TÔI đang chọn
   const [heldSeats, setHeldSeats] = useState({});         // Ghế NGƯỜI KHÁC đang chọn (bao gồm Admin)

   const [seatTimers, setSeatTimers] = useState({}); 
   const [timeLeft, setTimeLeft] = useState(null);   
   const [loading, setLoading] = useState(true);

   // Helper: Lấy ID người dùng (Session Storage cho Guest để tránh trùng)
   const getMyUserId = () => {
      let currentUser = null;
      try {
          const rawData = localStorage.getItem("user");
          if (rawData) {
             const parsed = JSON.parse(rawData);
             currentUser = parsed?.user || parsed;
          }
      } catch (e) {} 

      if (currentUser && (currentUser._id || currentUser.id)) {
         return currentUser._id || currentUser.id;
      }

      let guestId = sessionStorage.getItem("guest_session_id");
      if (!guestId) {
         guestId = "guest_" + Math.random().toString(36).substr(2, 9);
         sessionStorage.setItem("guest_session_id", guestId);
      }
      return guestId;
   };

   const myUserId = getMyUserId();

   // --- 1. FETCH DATA (Gọi lại khi refresh_seats) ---
   const fetchData = useCallback(async () => {
      try {
         const showtimeRes = await api.get(`/showtime/${showtimeId}`);
         setShowtime(showtimeRes.data);

         const ticketRes = await api.get(`/ticket/showtime/${showtimeId}`);
         if (Array.isArray(ticketRes.data)) {
            const occupied = ticketRes.data.flatMap(t => {
                if (t.seats && t.seats.length > 0) return t.seats;
                if (t.seatNumber) return [t.seatNumber];
                if (t.order?.seats && Array.isArray(t.order.seats)) return t.order.seats.map(s => s.name || s);
                return [];
            });
            setBookedSeats([...new Set(occupied)]); 
         }
      } catch (err) {
         console.error("Lỗi tải data:", err);
      } finally {
         setLoading(false);
      }
   }, [showtimeId]);

   // --- 2. INIT FETCH ---
   useEffect(() => {
      setLoading(true); 
      fetchData();
   }, [fetchData]);

   // --- 3. SOCKET ---
   useEffect(() => {
      socketRef.current = io(SOCKET_URL);
      const socket = socketRef.current;

      console.log("🆔 My User ID:", myUserId);
      socket.emit("join_showtime", { showtimeId, userId: myUserId });
      socket.emit("reset_checkout_status", { showtimeId, userId: myUserId });
      socket.on("load_initial_seats", ({ myHolds, othersHolds }) => {
         if (myHolds && myHolds.length > 0) {
            const seats = myHolds.map(h => h.seat);
            const timers = {};
            myHolds.forEach(h => { timers[h.seat] = h.expiresAt; });
            setSelectedSeats(seats);
            setSeatTimers(timers);
         }
         // othersHolds có thể là object { "A1": userId } hoặc { "A1": {userId, status} }
         // Ta cần chuẩn hóa nếu server gửi object phức tạp, nhưng ở đây giả sử server gửi simple map
         // Nếu server gửi object {userId, status} thì ta chỉ cần userId để hiển thị màu xanh
         const simpleHolds = {};
         for (const [seat, info] of Object.entries(othersHolds || {})) {
             simpleHolds[seat] = typeof info === 'object' ? info.userId : info;
         }
         setHeldSeats(simpleHolds);
      });

      socket.on("seat_sold", (newlySoldSeats) => {
         const seatsArray = Array.isArray(newlySoldSeats) ? newlySoldSeats : [newlySoldSeats];
         setBookedSeats(prev => [...prev, ...seatsArray]);
         setHeldSeats(prev => {
             const newState = { ...prev };
             seatsArray.forEach(s => delete newState[s]);
             return newState;
         });
         setSelectedSeats(prev => prev.filter(s => !seatsArray.includes(s)));
      });

      socket.on("seat_held", ({ seatLabel, holderId }) => {
         if (holderId === myUserId) {
            setSelectedSeats(prev => [...new Set([...prev, seatLabel])]);
            setSeatTimers(prev => ({ ...prev, [seatLabel]: Date.now() + 5 * 60 * 1000 }));
         } else {
            setHeldSeats(prev => ({ ...prev, [seatLabel]: holderId }));
         }
      });
      // Nghe tin dữ từ Server (Bị Admin cướp)
      socket.on("seat_stolen_by_admin", (seatLabel) => {
          alert(`⚠️ Rất xin lỗi, ghế ${seatLabel} vừa được ưu tiên bán trực tiếp tại quầy.\n\nMong quý khách thông cảm và vui lòng chọn ghế khác! 🙏`);      
      });
      socket.on("seat_released", (seatLabel) => {
         setHeldSeats(prev => { const n = { ...prev }; delete n[seatLabel]; return n; });
         setSelectedSeats(prev => prev.filter(s => s !== seatLabel));
      });

      // Admin chọn ghế -> Client thấy màu xanh (như người thường)
      socket.on("seat_selected", ({ seat, userId }) => {
          if (userId !== myUserId) setHeldSeats(prev => ({ ...prev, [seat]: userId }));
      });
      
      socket.on("seat_unselected", ({ seat }) => {
          setHeldSeats(prev => { const n = { ...prev }; delete n[seat]; return n; });
      });

      socket.on("refresh_seats", () => {
          console.log("🔄 Socket: Refreshing data...");
          fetchData(); 
      });

      return () => {
         socket.disconnect();
      };
   }, [showtimeId, myUserId, fetchData]);

   // --- TIMER ---
   useEffect(() => {
      if (selectedSeats.length === 0) { setTimeLeft(null); return; }
      const interval = setInterval(() => {
         const now = Date.now();
         let minExpire = Infinity;
         selectedSeats.forEach(seat => {
            if (seatTimers[seat] && seatTimers[seat] < minExpire) minExpire = seatTimers[seat];
         });
         if (minExpire === Infinity) return;
         setTimeLeft(Math.max(0, Math.floor((minExpire - now) / 1000)));
      }, 1000);
      return () => clearInterval(interval);
   }, [selectedSeats, seatTimers]);

   const formatTime = (seconds) => {
      if (seconds === null) return "";
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
   };

   // --- HANDLERS ---
   const handleSelectSeat = (seat) => {
      const seatNum = seat.seatNumber.trim();
      if (seat.status === 'maintenance' || bookedSeats.includes(seatNum)) return;
      if (heldSeats[seatNum]) { alert("Ghế này đang được người khác chọn!"); return; }

      const socket = socketRef.current;
      if (selectedSeats.includes(seatNum)) {
         setSelectedSeats(prev => prev.filter(s => s !== seatNum));
         if (socket) socket.emit("unhold_seat", { showtimeId, seatLabel: seatNum, userId: myUserId });
      } else {
         if (selectedSeats.length >= 8) return alert("Bạn chỉ được chọn tối đa 8 ghế!");
         setSelectedSeats(prev => [...prev, seatNum]);
         if (socket) socket.emit("hold_seat", { showtimeId, seatLabel: seatNum, userId: myUserId });
      }
   };

   const calculateTotal = () => {
      if (!showtime) return 0;
      const basePrice = Number(showtime.price) || 50000;
      const vipSurcharge = 20000; 
      return selectedSeats.reduce((total, seatNum) => {
         const seatInfo = showtime.room.seats.find(s => s.seatNumber === seatNum);
         let price = basePrice;
         if (seatInfo?.type === 'vip') price += vipSurcharge;
         return total + price;
      }, 0);
   };

   const handleCheckout = () => {
      // 🔥 Báo Server: Khóa ghế (chuyển sang trạng thái CHECKOUT)
      // Để Admin thấy màu Tím và không cướp được
      if (socketRef.current && selectedSeats.length > 0) {
          socketRef.current.emit("client_enter_checkout", { 
              showtimeId, 
              seats: selectedSeats 
          });
      }

      navigate("/checkout", { state: { showtime, selectedSeats, totalPrice: calculateTotal() } });
   };

   if (loading || !showtime) return <div className="bg-gray-900 min-h-screen text-white flex justify-center items-center">Đang tải...</div>;
   const { room } = showtime;

   return (
      <div className="bg-gray-900 min-h-screen text-white flex flex-col">
         {/* HEADER */}
         <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
               <button onClick={() => navigate(-1)} className="text-white p-2 hover:bg-gray-700 rounded-full"><ArrowLeft /></button>
               <span className="ml-4 font-bold uppercase text-yellow-500 text-lg">{showtime.movie.title}</span>
            </div>
            {timeLeft !== null && (
               <div className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-600 rounded-lg animate-pulse">
                  <Clock size={20} className="text-red-500" />
                  <span className="font-mono font-bold text-red-500 text-xl">{formatTime(timeLeft)}</span>
               </div>
            )}
         </div>

         {/* SEAT MAP */}
         <div className="flex-1 p-4 overflow-auto flex justify-center">
            <div className="w-full max-w-4xl flex flex-col items-center">
               <div className="w-2/3 h-2 bg-yellow-500 shadow-[0_5px_20px_orange] mb-12 rounded-full mt-4"></div>
               <p className="text-gray-500 text-sm mb-8 uppercase tracking-widest">Màn hình</p>
               
               <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${room.cols}, minmax(40px, 1fr))` }}>
                  {room.seats.map((seat) => {
                     const seatNum = seat.seatNumber.trim();
                     const isTaken = bookedSeats.includes(seatNum);
                     const isMaintenance = seat.status === 'maintenance';
                     const isSelected = selectedSeats.includes(seatNum);
                     const isHeldByOthers = heldSeats[seatNum];
                     const isVip = seat.type === 'vip';

                     let seatClasses = "border-gray-600 text-gray-400 hover:border-white hover:text-white cursor-pointer";
                     if (isMaintenance) seatClasses = "bg-red-900/20 border-red-900 text-red-700 cursor-not-allowed";
                     else if (isTaken) seatClasses = "bg-gray-600 opacity-50 cursor-not-allowed";
                     else if (isHeldByOthers) {
                         // Tất cả người khác (kể cả Admin) đều hiện màu Xanh
                         seatClasses = "bg-blue-600 border-blue-500";
                     }
                     else if (isSelected) seatClasses = "bg-yellow-500 text-black font-bold scale-110 z-10";
                     else if (isVip) seatClasses = "bg-gray-800 border-orange-500 text-orange-500";
                     else seatClasses += " bg-gray-800";

                     return (
                        <button
                           key={seatNum}
                           disabled={isTaken || isMaintenance || isHeldByOthers}
                           onClick={() => handleSelectSeat(seat)}
                           className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs transition-all duration-200 relative group border ${seatClasses}`}
                        >
                           {isMaintenance ? <Ban size={14} /> : seatNum}
                           {!isMaintenance && !isTaken && isVip && !isSelected && !isHeldByOthers && (
                               <Crown size={10} className="absolute -top-1.5 -right-1.5 text-yellow-600 bg-white rounded-full p-[1px]"/>
                           )}
                        </button>
                     );
                  })}
               </div>

               <div className="flex gap-4 mt-12 text-sm text-gray-400 justify-center flex-wrap">
                  <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-800 border border-gray-600 rounded"></div> Thường</div>
                  <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-800 border border-orange-500 rounded"></div> VIP</div>
                  <div className="flex items-center gap-2"><div className="w-5 h-5 bg-yellow-500 rounded"></div> Bạn chọn</div>
                  <div className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-600 border border-blue-500 rounded"></div> Người khác đang chọn</div>
                  <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-600 opacity-50 rounded"></div> Đã bán</div>
               </div>
            </div>
         </div>

         {/* FOOTER */}
         <div className="bg-white p-4 text-black flex justify-between items-center sticky bottom-0 shadow-lg">
            <div>Ghế: <b className="text-lg text-red-600">{selectedSeats.join(", ")}</b></div>
            <div className="flex gap-4 items-center">
               <div className="text-right">
                  <p className="text-xs text-gray-500">Tạm tính</p>
                  <p className="text-xl font-bold text-red-600">{calculateTotal().toLocaleString()} đ</p>
               </div>
               <button onClick={handleCheckout} disabled={selectedSeats.length === 0} className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-lg font-bold disabled:bg-gray-300">ĐẶT VÉ</button>
            </div>
         </div>
      </div>
   );
}