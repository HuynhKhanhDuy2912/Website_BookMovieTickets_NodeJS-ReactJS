import { useEffect, useState } from "react";
import { 
  getAllTickets, 
  createTicket, 
  updateTicket, 
  deleteTicket 
} from "../../api/ticketService";
import { getAllUsers } from "../../api/userService";
import { getAllShowtimes } from "../../api/showtimeService";

import { 
  Loader2, Trash2, SquarePen, Ticket, User, 
  Calendar, MapPin, CreditCard, Armchair, 
  UserX, Users, LayoutGrid, Filter, Crown
} from "lucide-react";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // UX State
  const [isGuestMode, setIsGuestMode] = useState(true);
  const [bookedSeats, setBookedSeats] = useState([]);
  
  // Cấu hình phụ thu VIP
  const VIP_SURCHARGE = 10000; // Cộng thêm 10k

  // Form State
  const [formData, setFormData] = useState({
    user: "",       
    guestName: "",  
    showtime: "",   
    seats: [],      
    totalPrice: 0,
    paymentStatus: "paid", 
    isManual: true, 
  });

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ticketsRes, usersRes, showtimesRes] = await Promise.all([
        getAllTickets(),
        getAllUsers(),
        getAllShowtimes() // API này cần trả về populate room -> vipRows
      ]);
      setTickets(ticketsRes.data);
      setUsers(usersRes.data || []);
      setShowtimes(showtimesRes.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải dữ liệu:", err);
    }
  };

  // --- HELPER: Lấy thông tin hàng VIP của suất chiếu đang chọn ---
  const getVipRows = () => {
      if (!formData.showtime) return [];
      const selectedST = showtimes.find(s => s._id === formData.showtime);
      // Giả sử API showtime đã populate room và room có trường vipRows ["A", "B"]
      return selectedST?.room?.vipRows || []; 
  };

  // --- 2. XỬ LÝ KHI CHỌN SUẤT CHIẾU ---
  useEffect(() => {
    if (!formData.showtime) {
        setBookedSeats([]);
        return;
    }
    
    // Lấy danh sách ghế đã bán
    const taken = tickets
        .filter(t => {
            const tShowtimeId = t.showtime?._id || t.showtime;
            return tShowtimeId === formData.showtime && t.status !== 'cancelled';
        })
        .flatMap(t => {
            if (t.seatNumber) return [t.seatNumber];
            if (Array.isArray(t.seats)) return t.seats.map(s => s.name || s);
            if (t.order?.seats && Array.isArray(t.order.seats)) return t.order.seats.map(s => s.name || s);
            return [];
        });
        
    setBookedSeats([...new Set(taken)]);
    
    if (!editingId) {
        setFormData(prev => ({ ...prev, seats: [], totalPrice: 0 }));
    }
  }, [formData.showtime, tickets]);

  // --- 3. TÍNH TIỀN (CÓ CỘNG VIP) ---
  useEffect(() => {
    if (!formData.showtime) return;
    const selectedShowtime = showtimes.find(s => s._id === formData.showtime);
    
    if (selectedShowtime) {
      const basePrice = selectedShowtime.price || 50000;
      const vipRows = selectedShowtime.room?.vipRows || []; // Lấy danh sách hàng VIP

      let total = 0;
      formData.seats.forEach(seatName => {
          // Lấy ký tự hàng ghế (VD: "D5" -> "D")
          const rowChar = seatName.charAt(0);
          
          // Kiểm tra xem hàng này có phải VIP không
          const isVip = vipRows.includes(rowChar);

          // Cộng tiền
          total += basePrice + (isVip ? VIP_SURCHARGE : 0);
      });

      setFormData(prev => ({ ...prev, totalPrice: total }));
    }
  }, [formData.seats, formData.showtime]);


  // --- 4. FILTER TICKETS ---
  const filteredTickets = formData.showtime 
    ? tickets.filter(t => {
        const tShowtimeId = t.showtime?._id || t.showtime;
        return tShowtimeId === formData.showtime;
      })
    : tickets;


  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSeat = (seatName) => {
    if (bookedSeats.includes(seatName)) return;

    setFormData(prev => {
        const isSelected = prev.seats.includes(seatName);
        let newSeats;
        if (isSelected) {
            newSeats = prev.seats.filter(s => s !== seatName);
        } else {
            newSeats = [...prev.seats, seatName];
        }
        return { ...prev, seats: newSeats };
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      user: "", guestName: "", showtime: "", seats: [], totalPrice: 0, paymentStatus: "paid", isManual: true
    });
    setIsGuestMode(true);
  };

  const handleEdit = (ticket) => {
    setEditingId(ticket._id);
    const hasUser = !!ticket.user;
    setIsGuestMode(!hasUser);
    
    let currentSeats = [];
    if (Array.isArray(ticket.seats) && ticket.seats.length > 0) {
        currentSeats = ticket.seats.map(s => s.name || s);
    } else if (ticket.seatNumber) {
        currentSeats = [ticket.seatNumber];
    } else if (ticket.order?.seats) {
        currentSeats = ticket.order.seats.map(s => s.name || s);
    }

    setFormData({
      user: ticket.user?._id || ticket.user || "",
      guestName: !hasUser ? (ticket.guestName || "Khách lẻ") : "",
      showtime: ticket.showtime?._id || ticket.showtime || "",
      seats: currentSeats,
      totalPrice: ticket.totalPrice || ticket.price || 0,
      paymentStatus: ticket.paymentStatus || "unpaid",
      isManual: true
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      user: isGuestMode ? null : formData.user,
      guestName: isGuestMode ? formData.guestName : null,
      seats: formData.seats, 
      totalPrice: Number(formData.totalPrice), 
      isManual: true 
    };

    try {
      if (editingId) {
        await updateTicket(editingId, payload);
        alert("✅ Cập nhật vé thành công!");
      } else {
        await createTicket(payload);
        alert("✅ Xuất vé thành công!");
      }
      resetForm();
      fetchData(); 
    } catch (err) {
      console.error("Lỗi:", err);
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy vé này?")) return;
    try {
      await deleteTicket(id);
      fetchData();
    } catch (err) {
      alert("❌ Không thể xóa vé!");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // --- SƠ ĐỒ GHẾ (CÓ HIỂN THỊ VIP) ---
  const renderSeatMap = () => {
     if (!formData.showtime) return <div className="text-gray-400 text-sm italic p-4 text-center border rounded bg-gray-50">Vui lòng chọn suất chiếu để xem sơ đồ ghế</div>;
     
     // Cố định mẫu 5x8 (Thực tế nên lấy row/col từ selectedShowtime.room.rows/cols)
     const rows = ['A', 'B', 'C', 'D', 'E']; 
     const cols = [1, 2, 3, 4, 5, 6, 7, 8];

     // Lấy danh sách hàng VIP của phòng này
     const currentVipRows = getVipRows();

     return (
        <div className="mt-4 border p-4 rounded-lg bg-gray-50">
           <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><LayoutGrid size={16}/> Sơ đồ ghế</h4>
           
           <div className="flex flex-col gap-2 items-center">
              <div className="w-full h-1 bg-gray-400 mb-4 rounded shadow-sm relative"><span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 uppercase">Màn hình</span></div>
              
              {rows.map(row => {
                 const isRowVip = currentVipRows.includes(row);
                 return (
                    <div key={row} className="flex gap-2 items-center">
                       {/* Nhãn hàng ghế */}
                       <span className={`text-xs font-bold w-4 ${isRowVip ? 'text-amber-500' : 'text-gray-400'}`}>{row}</span>
                       
                       {cols.map(col => {
                          const seatName = `${row}${col}`;
                          const isTaken = bookedSeats.includes(seatName);
                          const isSelected = formData.seats.includes(seatName);
                          
                          return (
                             <button
                               key={seatName}
                               type="button"
                               onClick={() => toggleSeat(seatName)}
                               disabled={isTaken}
                               className={`
                                  w-8 h-8 text-xs font-bold rounded transition shadow-sm flex items-center justify-center relative group
                                  ${isTaken 
                                     ? 'bg-red-200 text-red-400 cursor-not-allowed border border-red-200' 
                                     : isSelected 
                                        ? 'bg-amber-600 text-white border border-amber-700 scale-110 z-10' 
                                        : isRowVip
                                            ? 'bg-yellow-100 border border-yellow-400 text-yellow-700 hover:bg-yellow-200' // Màu VIP
                                            : 'bg-white border border-gray-300 hover:border-blue-400 hover:text-blue-500' // Màu Thường
                                  }
                               `}
                               title={isRowVip ? `VIP (+10k)` : 'Standard'}
                             >
                                {/* Icon vương miện cho ghế VIP */}
                                {isRowVip && !isTaken && !isSelected && <Crown size={8} className="absolute -top-1 -right-1 text-yellow-600"/>}
                                {seatName}
                             </button>
                          )
                       })}
                    </div>
                 )
              })}
              
              <div className="flex gap-4 mt-4 text-xs justify-center flex-wrap text-gray-600">
                 <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 border border-red-200 rounded"></span> Đã bán</div>
                 <div className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-600 rounded"></span> Đang chọn</div>
                 <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded"></span> VIP (+10k)</div>
                 <div className="flex items-center gap-1"><span className="w-3 h-3 bg-white border border-gray-300 rounded"></span> Thường</div>
              </div>
           </div>
        </div>
     )
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
        <Ticket className="text-amber-600" /> Quản lý Vé & Đặt Chỗ (POS)
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* === CỘT TRÁI: FORM BÁN VÉ === */}
          <div className="lg:col-span-1 bg-white shadow-xl rounded-xl p-6 border-t-4 border-amber-500 sticky top-4">
             <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                <SquarePen size={20} className="text-amber-600"/> 
                {editingId ? "Cập nhật Vé" : "Bán Vé Tại Quầy"}
             </h3>

             <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* BƯỚC 1: CHỌN SUẤT CHIẾU */}
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Bước 1: Chọn Suất chiếu</label>
                   <select
                     name="showtime"
                     value={formData.showtime}
                     onChange={handleChange}
                     className="border p-2.5 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none bg-gray-50 font-medium"
                     disabled={!!editingId}
                   >
                     <option value="">-- Chọn phim & giờ --</option>
                     {showtimes.map(s => {
                         const isExpired = new Date() > new Date(s.startTime);
                         return (
                            <option key={s._id} value={s._id} disabled={isExpired} className={isExpired ? "text-gray-400" : ""}>
                              {s.movie?.title || "Phim ???"} - {s.startTime ? new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Giờ ?"} ({s.room?.name})
                            </option>
                         )
                     })}
                   </select>
                </div>

                {/* BƯỚC 2: CHỌN GHẾ (CÓ VIP) */}
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Bước 2: Chọn Ghế</label>
                   {renderSeatMap()}
                   <div className="mt-2 text-right text-sm text-gray-500">
                      Đang chọn: <span className="font-bold text-amber-600">{formData.seats.length > 0 ? formData.seats.join(", ") : "Chưa có"}</span>
                   </div>
                </div>

                {/* BƯỚC 3: KHÁCH HÀNG */}
                <div>
                   <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-bold text-gray-700">Bước 3: Khách hàng</label>
                      <button 
                        type="button" 
                        onClick={() => setIsGuestMode(!isGuestMode)}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                         {isGuestMode ? <><Users size={12}/> Chọn thành viên?</> : <><UserX size={12}/> Khách vãng lai?</>}
                      </button>
                   </div>
                   
                   {isGuestMode ? (
                      <input
                        name="guestName"
                        value={formData.guestName}
                        onChange={handleChange}
                        placeholder="Nhập tên khách (VD: Anh Tuấn)..."
                        className="border p-2.5 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none"
                        required={isGuestMode}
                      />
                   ) : (
                      <select
                        name="user"
                        value={formData.user}
                        onChange={handleChange}
                        className="border p-2.5 w-full rounded focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                        required={!isGuestMode}
                      >
                        <option value="">-- Chọn thành viên --</option>
                        {users.map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                   )}
                </div>

                {/* BƯỚC 4: THANH TOÁN */}
                <div className="bg-amber-50 p-4 rounded border border-amber-100">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Tổng tiền:</span>
                      <span className="text-xl font-bold text-amber-700">{formatCurrency(formData.totalPrice)}</span>
                   </div>
                   <select
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleChange}
                      className="w-full border p-2 rounded text-sm bg-white"
                   >
                      <option value="paid">Đã thanh toán (Tiền mặt/CK)</option>
                      <option value="unpaid">Chưa thanh toán (Giữ vé)</option>
                   </select>
                </div>

                <div className="flex gap-2">
                   <button
                     type="submit"
                     disabled={loading || !formData.showtime || formData.seats.length === 0}
                     className="flex-1 bg-amber-600 hover:bg-amber-700 text-white p-3 rounded font-bold shadow-lg shadow-amber-600/30 transition disabled:bg-gray-300 disabled:shadow-none flex justify-center items-center gap-2"
                   >
                     {loading ? <Loader2 className="animate-spin"/> : <Ticket/>} 
                     {editingId ? "Lưu Vé" : "Xuất Vé"}
                   </button>
                   {editingId && (
                     <button type="button" onClick={resetForm} className="px-4 bg-gray-200 hover:bg-gray-300 rounded font-bold text-gray-600">Hủy</button>
                   )}
                </div>

             </form>
          </div>

          {/* === CỘT PHẢI: LỊCH SỬ VÉ === */}
          <div className="lg:col-span-2">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">Lịch sử bán vé</h3>
                    {formData.showtime ? (
                        <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded font-bold border border-amber-200">
                            <Filter size={12}/> Lọc theo suất
                        </span>
                    ) : (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">Tất cả</span>
                    )}
                </div>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{filteredTickets.length} vé</span>
             </div>

             <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredTickets.length === 0 ? (
                   <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Ticket className="mx-auto text-gray-300 mb-2" size={48} />
                      <p className="text-gray-500">
                         {formData.showtime ? "Chưa có vé nào cho suất chiếu này." : "Chưa có giao dịch nào."}
                      </p>
                   </div>
                ) : (
                   filteredTickets.map((ticket) => {
                      const isClientBooking = !ticket.isManual;
                      const finalPrice = ticket.totalPrice || ticket.price || ticket.order?.totalPrice || 0;

                      let seatDisplay = "Chưa chọn";
                      if (ticket.seats && ticket.seats.length > 0) {
                          if (Array.isArray(ticket.seats)) {
                              seatDisplay = ticket.seats.map(s => s.name || s).join(", ");
                          } else {
                              seatDisplay = ticket.seats;
                          }
                      } else if (ticket.seatNumber) {
                          seatDisplay = ticket.seatNumber;
                      } else if (ticket.order?.seats) {
                          seatDisplay = ticket.order.seats.map(s => s.name || s).join(", ");
                      }

                      return (
                         <div key={ticket._id} className="bg-white border rounded-lg p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition group">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${ticket.paymentStatus === 'paid' || ticket.order?.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                               {ticket.paymentStatus === 'paid' || ticket.order?.status === 'success' ? <CreditCard size={20}/> : <Loader2 size={20}/>}
                            </div>

                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-gray-800 truncate" title={ticket.showtime?.movie?.title}>
                                    {ticket.showtime?.movie?.title || "Phim không xác định"}
                                  </h4>
                                  <span className="font-bold text-amber-600 whitespace-nowrap ml-2">
                                     {formatCurrency(finalPrice)}
                                  </span>
                               </div>
                               
                               <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                  <span className="flex items-center gap-1">
                                     {isClientBooking ? <Users size={14} className="text-blue-500"/> : <UserX size={14} className="text-gray-500"/>}
                                     {ticket.user?.name || ticket.guestName || "Khách vãng lai"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                     <Calendar size={14}/> 
                                     {ticket.showtime?.startTime ? new Date(ticket.showtime.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--"}
                                  </span>
                                  <span className="flex items-center gap-1 text-gray-800 font-medium bg-gray-100 px-2 rounded">
                                     <Armchair size={14}/> {seatDisplay}
                                  </span>
                               </div>
                            </div>

                            <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                               {!isClientBooking && (
                                  <>
                                    <button onClick={() => handleEdit(ticket)} className="p-2 text-amber-600 hover:bg-amber-50 rounded"><SquarePen size={16}/></button>
                                    <button onClick={() => handleDelete(ticket._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                  </>
                               )}
                               {isClientBooking && <span className="text-[10px] text-blue-500 font-bold uppercase border border-blue-200 px-1 rounded bg-blue-50">Online</span>}
                            </div>
                         </div>
                      )
                   })
                )}
             </div>
          </div>
      </div>
    </div>
  );
}