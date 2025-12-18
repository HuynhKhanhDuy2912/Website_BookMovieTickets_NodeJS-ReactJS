import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { Armchair, ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";

// Cấu hình ghế giả lập (Nếu Database Room của bạn chưa có row/col)
// Sau này bạn có thể lấy từ info Room: room.totalRows, room.totalCols
const ROWS = 10; // 10 hàng (A -> J)
const COLS = 12; // 12 cột (1 -> 12)
const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

export default function SeatSelectionPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();

  // State dữ liệu
  const [showtime, setShowtime] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]); // Danh sách ghế đã bán ["A1", "B5"...]
  const [loading, setLoading] = useState(true);

  // State chọn vé
  const [selectedSeats, setSelectedSeats] = useState([]); // Ghế đang chọn ["C5", "C6"]
  const ticketPrice = showtime?.price || 75000; // Giá vé (mặc định nếu ko có)

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Lấy thông tin suất chiếu (để biết phim gì, rạp nào)
        // Lưu ý: Backend cần hỗ trợ get showtime by ID
        const showtimeRes = await api.get(`/showtime`); 
        // Vì bạn chưa có API getById cho showtime, mình lọc tạm ở client:
        const foundShowtime = showtimeRes.data.find(s => s._id === showtimeId);
        
        if (foundShowtime) {
           setShowtime(foundShowtime);
           // Gọi API lấy vé đã bán của suất này
           const ticketRes = await api.get(`/ticket/showtime/${showtimeId}`);
           // Giả sử Ticket model lưu ghế dạng "A1", "B2" trong trường seatNumber
           // Hoặc nếu lưu row/col riêng thì bạn cần map lại thành chuỗi
           const occupied = ticketRes.data.map(t => t.seatNumber); // ["A1", "A2"]
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

  // --- 2. XỬ LÝ CHỌN GHẾ ---
  const handleSelectSeat = (seatId) => {
    if (bookedSeats.includes(seatId)) return; // Ghế đã bán thì ko làm gì

    if (selectedSeats.includes(seatId)) {
      // Nếu đã chọn -> Bỏ chọn
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      // Nếu chưa chọn -> Thêm vào (Giới hạn tối đa 8 ghế)
      if (selectedSeats.length >= 8) return alert("Bạn chỉ được chọn tối đa 8 ghế!");
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // --- 3. TIẾP TỤC (SANG TRANG THANH TOÁN) ---
  const handleCheckout = () => {
    if (selectedSeats.length === 0) return alert("Vui lòng chọn ít nhất 1 ghế!");
    
    // Chuyển sang trang thanh toán/combo, mang theo dữ liệu vé
    // Bạn có thể dùng Context hoặc state của navigate
    navigate("/checkout", { 
      state: { 
        showtime, 
        selectedSeats, 
        totalPrice: selectedSeats.length * ticketPrice 
      } 
    });
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div></div>;
  if (!showtime) return <div className="min-h-screen bg-gray-900 text-white flex justify-center pt-20">Không tìm thấy suất chiếu</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      
      {/* HEADER: INFO PHIM */}
      <div className="bg-gray-800 p-4 shadow-md sticky top-0 z-10 border-b border-gray-700">
         <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-700 rounded-full transition">
                  <ArrowLeft />
               </button>
               <div>
                  <h2 className="text-xl font-bold text-yellow-500 uppercase">{showtime.movie?.title}</h2>
                  <div className="flex gap-4 text-sm text-gray-400 mt-1">
                     <span className="flex items-center gap-1"><MapPin size={14}/> {showtime.cinema?.name} - {showtime.room?.name}</span>
                     <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(showtime.startTime).toLocaleDateString()}</span>
                     <span className="flex items-center gap-1"><Clock size={14}/> {new Date(showtime.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* BODY: SƠ ĐỒ GHẾ */}
      <div className="flex-1 overflow-auto p-4">
         <div className="min-w-[800px] mx-auto flex flex-col items-center">
            
            {/* MÀN HÌNH (SCREEN) */}
            <div className="w-2/3 h-2 bg-yellow-500/50 mb-1 rounded-full shadow-[0_10px_30px_rgba(234,179,8,0.3)]"></div>
            <p className="text-gray-500 text-sm mb-12 uppercase tracking-[0.2em]">Màn hình</p>

            {/* LƯỚI GHẾ */}
            <div className="flex flex-col gap-3">
               {Array.from({ length: ROWS }).map((_, rowIndex) => {
                  const rowLabel = ROW_LABELS[rowIndex];
                  return (
                     <div key={rowLabel} className="flex items-center gap-3">
                        {/* Tên hàng (A, B, C...) */}
                        <span className="w-6 text-center text-gray-500 font-bold">{rowLabel}</span>
                        
                        {/* Các ghế trong hàng */}
                        <div className="flex gap-2">
                           {Array.from({ length: COLS }).map((_, colIndex) => {
                              const seatNumber = `${rowLabel}${colIndex + 1}`;
                              const isBooked = bookedSeats.includes(seatNumber);
                              const isSelected = selectedSeats.includes(seatNumber);

                              return (
                                 <button
                                    key={seatNumber}
                                    disabled={isBooked}
                                    onClick={() => handleSelectSeat(seatNumber)}
                                    className={`
                                       w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 relative group
                                       ${isBooked 
                                          ? "bg-gray-700 cursor-not-allowed opacity-50" 
                                          : isSelected 
                                             ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/40 scale-110" 
                                             : "bg-gray-800 border border-gray-600 hover:border-yellow-500 hover:text-yellow-500"
                                       }
                                    `}
                                 >
                                    <Armchair size={20} fill={isSelected ? "currentColor" : "none"} strokeWidth={2}/>
                                    {/* Tooltip số ghế */}
                                    <span className="absolute -top-8 bg-white text-black text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                                       {seatNumber}
                                    </span>
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  );
               })}
            </div>

            {/* CHÚ THÍCH */}
            <div className="flex gap-8 mt-12">
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-800 border border-gray-600 rounded"></div>
                  <span className="text-sm text-gray-400">Ghế trống</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-400">Đang chọn</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-700 opacity-50 rounded"></div>
                  <span className="text-sm text-gray-400">Đã bán</span>
               </div>
            </div>

         </div>
      </div>

      {/* FOOTER: THANH TOÁN */}
      <div className="bg-white text-black p-4 shadow-lg sticky bottom-0 z-20">
         <div className="container mx-auto flex justify-between items-center">
            <div>
               <p className="text-sm text-gray-500">Ghế đã chọn:</p>
               <p className="font-bold text-lg">
                  {selectedSeats.length > 0 ? selectedSeats.join(", ") : "Chưa chọn ghế"}
               </p>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="text-sm text-gray-500">Tổng cộng:</p>
                  <p className="text-2xl font-bold text-red-600">
                     {(selectedSeats.length * ticketPrice).toLocaleString()} đ
                  </p>
               </div>
               <button 
                  onClick={handleCheckout}
                  disabled={selectedSeats.length === 0}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-lg uppercase transition disabled:bg-gray-400 disabled:cursor-not-allowed"
               >
                  Tiếp Tục
               </button>
            </div>
         </div>
      </div>

    </div>
  );
}