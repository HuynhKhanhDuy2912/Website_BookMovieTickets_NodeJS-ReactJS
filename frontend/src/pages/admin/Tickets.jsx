import React, { useEffect, useState, useRef, useMemo } from "react";
// 1. Import socket client
import { io } from "socket.io-client";

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
  UserX, Users, LayoutGrid, Filter, Crown, Globe, Lock, History
} from "lucide-react";

// Cấu hình URL Socket
const SOCKET_URL = "http://localhost:5000";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // UX State
  const [isGuestMode, setIsGuestMode] = useState(true);
  const [bookedSeats, setBookedSeats] = useState([]);

  // State Socket
  const [holdingSeats, setHoldingSeats] = useState({});
  const socketRef = useRef(null);

  const VIP_SURCHARGE = 20000;

  const [formData, setFormData] = useState({
    user: "",
    guestName: "",
    showtime: "",
    seats: [],
    totalPrice: 0,
    paymentStatus: "paid",
    isManual: true,
  });

  // --- HELPER: XÁC ĐỊNH TRẠNG THÁI SUẤT CHIẾU (MỚI) ---
  const selectedShowtimeInfo = useMemo(() => {
      if (!formData.showtime) return null;
      return showtimes.find(s => s._id === formData.showtime);
  }, [formData.showtime, showtimes]);

  // Kiểm tra xem suất chiếu đã qua chưa
  const isShowtimeFinished = useMemo(() => {
      if (!selectedShowtimeInfo) return false;
      // So sánh thời gian bắt đầu với hiện tại
      return new Date(selectedShowtimeInfo.startTime) < new Date();
  }, [selectedShowtimeInfo]);

  // Phân nhóm suất chiếu cho Dropdown
  const { upcomingShowtimes, pastShowtimes } = useMemo(() => {
      const now = new Date();
      const upcoming = [];
      const past = [];
      
      showtimes.forEach(s => {
          if (new Date(s.startTime) >= now) upcoming.push(s);
          else past.push(s);
      });
      
      // Sắp xếp: Sắp chiếu tăng dần, Đã qua giảm dần
      upcoming.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      past.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

      return { upcomingShowtimes: upcoming, pastShowtimes: past };
  }, [showtimes]);


  // --- 1. KHỞI TẠO SOCKET ---
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // --- 2. FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ticketsRes, usersRes, showtimesRes] = await Promise.all([
        getAllTickets(),
        getAllUsers(),
        getAllShowtimes()
      ]);
      setTickets(ticketsRes.data);
      setUsers(usersRes.data || []);
      // Lưu ý: showtimes sẽ được sort lại trong useMemo ở trên
      setShowtimes(showtimesRes.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải dữ liệu:", err);
    }
  };

  // --- 3. XỬ LÝ KHI CHỌN SUẤT CHIẾU (SOCKET GIỮ NGUYÊN) ---
  useEffect(() => {
    if (!formData.showtime) {
      setBookedSeats([]);
      setHoldingSeats({});
      return;
    }

    // A. Lọc ghế đã bán
    const taken = tickets
      .filter(t => {
        if (!t.showtime) return false;
        const tShowtimeId = (t.showtime._id || t.showtime).toString();
        const currentShowtimeId = formData.showtime.toString();
        return tShowtimeId === currentShowtimeId && t.status !== 'cancelled';
      })
      .flatMap(t => {
        if (t.seats && Array.isArray(t.seats) && t.seats.length > 0) return t.seats;
        if (t.seatNumber) return [t.seatNumber];
        if (t.order?.seats && Array.isArray(t.order.seats)) return t.order.seats.map(s => s.name || s);
        return [];
      });

    setBookedSeats([...new Set(taken)]);

    // B. SOCKET LOGIC (GIỮ NGUYÊN)
    const socket = socketRef.current;
    if (socket) {
      socket.emit("join_room", formData.showtime);

      socket.on("current_holds", (seatsArray) => {
         const map = {};
         if(Array.isArray(seatsArray)) {
             seatsArray.forEach(item => {
                 if (typeof item === 'object') {
                     map[item.seat] = item.status || 'SELECTING';
                 } else {
                     map[item] = 'SELECTING';
                 }
             });
         }
         setHoldingSeats(map);
      });

      const handleSeatSold = (newlySoldSeats) => {
        const seatsToAdd = Array.isArray(newlySoldSeats) ? newlySoldSeats : [newlySoldSeats];
        setBookedSeats(prev => [...prev, ...seatsToAdd]);
        setHoldingSeats(prev => {
            const newState = { ...prev };
            seatsToAdd.forEach(s => delete newState[s]);
            return newState;
        });
      };

      const handleSeatSelected = ({ seat }) => {};

      const handleSeatUnselected = ({ seat }) => {
        setHoldingSeats(prev => {
            const newState = { ...prev };
            delete newState[seat];
            return newState;
        });
      };

      const handleStatusUpdate = ({ seats, status }) => {
          setHoldingSeats(prev => {
              const newState = { ...prev };
              seats.forEach(s => newState[s] = status);
              return newState;
          });
      };

      const handleSeatHeld = ({ seatLabel, holderId, status }) => {
         if (holderId !== "ADMIN_POS") {
             setHoldingSeats(prev => ({ 
                 ...prev, 
                 [seatLabel]: status || 'SELECTING' 
             }));
         } else {
             setHoldingSeats(prev => {
                 const newState = { ...prev };
                 delete newState[seatLabel];
                 return newState;
             });
         }
      };

      const handleRefresh = () => fetchData();

      socket.on("seat_sold", handleSeatSold);
      socket.on("seat_selected", handleSeatSelected);
      socket.on("seat_held", handleSeatHeld);
      socket.on("seat_unselected", handleSeatUnselected);
      socket.on("seats_update_status", handleStatusUpdate);
      socket.on("refresh_seats", handleRefresh);

      return () => {
        socket.off("current_holds");
        socket.off("seat_sold", handleSeatSold);
        socket.off("seat_selected", handleSeatSelected);
        socket.off("seat_held", handleSeatHeld);
        socket.off("seat_unselected", handleSeatUnselected);
        socket.off("seats_update_status", handleStatusUpdate);
        socket.off("refresh_seats", handleRefresh);
        socket.emit("leave_room", formData.showtime);
      };
    }

    if (!editingId) {
      setFormData(prev => ({ ...prev, seats: [], totalPrice: 0 }));
    }
  }, [formData.showtime, tickets]);

  // --- TÍNH TIỀN (SỬ DỤNG selectedShowtimeInfo ĐÃ TỐI ƯU) ---
  useEffect(() => {
    if (!formData.showtime || !selectedShowtimeInfo) return;
    
    const basePrice = Number(selectedShowtimeInfo.price) || 50000;
    const vipRows = selectedShowtimeInfo.room?.vipRows || [];

    let total = 0;
    formData.seats.forEach(seatName => {
      const rowChar = seatName.charAt(0);
      const isVip = vipRows.includes(rowChar);
      total += basePrice + (isVip ? VIP_SURCHARGE : 0);
    });

    setFormData(prev => ({ ...prev, totalPrice: total }));
  }, [formData.seats, formData.showtime, selectedShowtimeInfo]);

  // --- FILTER TICKETS LIST (CHỈ HIỆN VÉ CỦA SUẤT ĐANG CHỌN) ---
  const filteredTickets = useMemo(() => {
      if (!formData.showtime) return []; // Chưa chọn suất -> List rỗng
      return tickets.filter(t => {
          if (!t.showtime) return false;
          const tShowtimeId = (t.showtime._id || t.showtime).toString();
          return tShowtimeId === formData.showtime.toString();
      });
  }, [formData.showtime, tickets]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSeat = (seatName) => {
    // 🔥 CHẶN: Nếu suất chiếu đã qua thì không cho chọn ghế (Chế độ xem lịch sử)
    if (isShowtimeFinished) {
        alert("Suất chiếu này đã kết thúc. Bạn đang ở chế độ xem lịch sử!");
        return;
    }

    if (bookedSeats.includes(seatName)) return;

    const socket = socketRef.current;
    const showtimeId = formData.showtime;

    setFormData(prev => {
      const isSelected = prev.seats.includes(seatName);
      let newSeats;

      if (isSelected) {
        newSeats = prev.seats.filter(s => s !== seatName);
        if (socket) socket.emit("unselect_seat", { showtimeId, seat: seatName });
      } else {
        newSeats = [...prev.seats, seatName];
        if (socket) socket.emit("select_seat", { showtimeId, seat: seatName });
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
      currentSeats = ticket.seats;
    } else if (ticket.seatNumber) {
      currentSeats = [ticket.seatNumber];
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
    
    // 🔥 CHẶN SUBMIT NẾU SUẤT ĐÃ QUA
    if (isShowtimeFinished) {
        return alert("Không thể bán vé cho suất chiếu đã kết thúc!");
    }

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

  const renderSeatMap = () => {
    if (!formData.showtime) return <div className="text-gray-400 text-sm italic p-4 text-center border rounded bg-gray-50 h-64 flex items-center justify-center">Vui lòng chọn suất chiếu để xem sơ đồ ghế</div>;

    const selectedShowtime = showtimes.find(s => s._id === formData.showtime);
    if (!selectedShowtime || !selectedShowtime.room) {
      return <div className="text-red-400 text-sm p-4 text-center">Không tải được dữ liệu phòng chiếu</div>;
    }

    const numRows = selectedShowtime.room.rows || 5;
    const numCols = selectedShowtime.room.cols || 8;
    const vipRows = selectedShowtime.room.vipRows || [];

    const rows = Array.from({ length: numRows }, (_, i) => String.fromCharCode(65 + i));
    const cols = Array.from({ length: numCols }, (_, i) => i + 1);

    return (
      <div className="mt-4 border p-6 rounded-lg bg-gray-50 overflow-x-auto shadow-inner relative">
        <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <LayoutGrid size={16} /> Sơ đồ ghế ({selectedShowtime.room.name})
          {isShowtimeFinished ? (
              <span className="flex items-center gap-1 text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full border border-gray-300">
                <History size={10} /> Đã kết thúc
              </span>
          ) : (
              <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                <Globe size={10} className="animate-pulse" /> Live
              </span>
          )}
        </h4>

        <div className="flex flex-col gap-3 items-center min-w-max mx-auto">
          <div className="w-3/4 h-2 bg-gray-400 mb-6 rounded shadow-sm relative">
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Màn hình</span>
          </div>

          {rows.map(row => {
            const isRowVip = vipRows.includes(row);
            return (
              <div key={row} className="flex gap-3 items-center">
                <span className={`text-sm font-bold w-6 text-center ${isRowVip ? 'text-amber-600' : 'text-gray-400'}`}>{row}</span>

                {cols.map(col => {
                  const seatName = `${row}${col}`;
                  const isTaken = bookedSeats.includes(seatName);
                  const isSelected = formData.seats.includes(seatName);
                  const seatStatus = holdingSeats[seatName];
                  const isHolding = !!seatStatus && !isTaken && !isSelected;
                  const isCheckout = seatStatus === 'CHECKOUT';
                  
                  // Disable nếu đã bán HOẶC suất chiếu đã qua
                  const isDisabled = isTaken || isCheckout || isShowtimeFinished; 

                  return (
                    <button
                      key={seatName}
                      type="button"
                      disabled={isDisabled} 
                      onClick={() => {
                          if (isHolding && !isCheckout) {
                              const confirmSteal = window.confirm(`⚠️ Ghế ${seatName} đang được khách giữ online.\nBạn có muốn CƯỚP GHẾ này để bán tại quầy không?`);
                              if (confirmSteal) {
                                  socketRef.current.emit("admin_force_select", { 
                                      showtimeId: formData.showtime, 
                                      seatLabel: seatName 
                                  });
                                  toggleSeat(seatName);
                              }
                          } else {
                              toggleSeat(seatName);
                          }
                      }}
                      className={`
                                  w-10 h-10 text-sm font-bold rounded-lg transition shadow-sm flex items-center justify-center relative group
                                  ${isTaken
                          ? 'bg-red-200 text-red-400 cursor-not-allowed border border-red-200'
                          : isSelected
                            ? 'bg-amber-600 text-white border border-amber-700 scale-110 z-10 shadow-md'
                            : isHolding
                              ? isCheckout
                                  ? 'bg-purple-600 border-purple-500 text-white opacity-70 cursor-not-allowed animate-pulse'
                                  : 'bg-blue-100 border-blue-400 text-blue-600 animate-pulse hover:bg-red-50 hover:text-red-600 hover:border-red-400 cursor-pointer'
                              : isRowVip
                                ? 'bg-yellow-100 border border-yellow-400 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-white border border-gray-300 hover:border-blue-400 hover:text-blue-500 hover:shadow-md'
                        }
                        ${isShowtimeFinished && !isTaken ? 'opacity-50 cursor-default' : ''}
                               `}
                      title={isCheckout ? `Ghế đang thanh toán` : seatName}
                    >
                      {isCheckout && <Lock size={14} className="absolute" />}
                      {isRowVip && !isTaken && !isSelected && !isHolding && <Crown size={12} className="absolute -top-2 -right-2 text-yellow-600 drop-shadow-sm bg-white rounded-full p-[2px] border border-yellow-100" />}
                      {!isCheckout && seatName}
                    </button>
                  )
                })}
              </div>
            )
          })}

          <div className="flex gap-4 mt-8 text-xs justify-center flex-wrap text-gray-600 border-t pt-4 w-full">
            <div className="flex items-center gap-1"><span className="w-4 h-4 bg-red-200 border border-red-200 rounded"></span> Đã bán</div>
            <div className="flex items-center gap-1"><span className="w-4 h-4 bg-amber-600 rounded"></span> Bạn chọn</div>
            <div className="flex items-center gap-1"><span className="w-4 h-4 bg-blue-100 border border-blue-400 rounded"></span> Khách giữ</div>
            <div className="flex items-center gap-1"><span className="w-4 h-4 bg-purple-600 rounded"></span> Đang thanh toán</div>
            <div className="flex items-center gap-1"><span className="w-4 h-4 bg-yellow-100 border border-yellow-400 rounded"></span> VIP</div>
            <div className="flex items-center gap-1"><span className="w-4 h-4 bg-white border border-gray-300 rounded"></span> Thường</div>
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
        
        {/* 🔥 CỘT TRÁI: FORM BÁN VÉ */}
        <div className="lg:col-span-2 bg-white shadow-xl rounded-xl p-6 border-t-4 border-amber-500 sticky top-4">
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
            <SquarePen size={20} className="text-amber-600" />
            {editingId ? "Cập nhật Vé" : "Bán Vé Tại Quầy"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Chọn Suất (DROPDOWN CẢI TIẾN) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bước 1: Chọn Suất chiếu</label>
                  <select
                    name="showtime"
                    value={formData.showtime}
                    onChange={handleChange}
                    className="border p-3 w-full rounded-lg focus:ring-2 focus:ring-amber-400 outline-none bg-gray-50 font-medium text-sm"
                    disabled={!!editingId}
                  >
                    <option value="">-- Chọn phim & giờ --</option>
                    
                    {/* Nhóm Đang/Sắp chiếu */}
                    {upcomingShowtimes.length > 0 && (
                        <optgroup label="🔥 Đang & Sắp chiếu">
                            {upcomingShowtimes.map(s => (
                                <option key={s._id} value={s._id} className="text-black font-medium">
                                    {/* 🔥 THÊM TÊN RẠP VÀO ĐÂY */}
                                    {s.movie?.title} - {new Date(s.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} ({s.cinema?.name || "Rạp ?"} - {s.room?.name})
                                </option>
                            ))}
                        </optgroup>
                    )}

                    {/* Nhóm Đã qua (Xem lịch sử) */}
                    {pastShowtimes.length > 0 && (
                        <optgroup label="⏳ Đã kết thúc (Chỉ xem lịch sử)">
                            {pastShowtimes.map(s => (
                                <option key={s._id} value={s._id} className="text-gray-400 italic">
                                    {s.movie?.title} - {new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} ({s.cinema?.name} - {s.room?.name})
                                </option>
                            ))}
                        </optgroup>
                    )}
                  </select>
                </div>

                {/* 3. Khách Hàng */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">Bước 3: Khách hàng</label>
                    <button
                      type="button"
                      onClick={() => setIsGuestMode(!isGuestMode)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      {isGuestMode ? <><Users size={12} /> Chọn thành viên?</> : <><UserX size={12} /> Khách vãng lai?</>}
                    </button>
                  </div>

                  {isGuestMode ? (
                    <input
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleChange}
                      placeholder="Nhập tên khách..."
                      className="border p-3 w-full rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                      // 🔥 Disabled nếu suất đã qua
                      disabled={isShowtimeFinished}
                      required={isGuestMode && !isShowtimeFinished}
                    />
                  ) : (
                    <select
                      name="user"
                      value={formData.user}
                      onChange={handleChange}
                      className="border p-3 w-full rounded-lg focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                      // 🔥 Disabled nếu suất đã qua
                      disabled={isShowtimeFinished}
                      required={!isGuestMode}
                    >
                      <option value="">-- Chọn thành viên --</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  )}
                </div>
            </div>

            {/* 2. Chọn Ghế */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Bước 2: Chọn Ghế</label>
              {renderSeatMap()}
              <div className="mt-3 flex justify-between items-center bg-gray-50 p-3 rounded border">
                 <span className="text-gray-500 text-sm">Đang chọn:</span>
                 <span className="font-bold text-amber-600 text-lg">{formData.seats.length > 0 ? formData.seats.join(", ") : "Chưa có"}</span>
              </div>
            </div>

            {/* 4. Thanh Toán */}
            <div className="bg-amber-50 p-5 rounded-lg border border-amber-100 flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="w-full md:w-auto">
                  <span className="text-sm text-gray-600 block mb-1">Trạng thái thanh toán:</span>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    className="border p-2 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    disabled={isShowtimeFinished} // Disabled nếu đã qua
                  >
                    <option value="paid">Đã thanh toán (Tiền mặt/CK)</option>
                    <option value="unpaid">Chưa thanh toán (Giữ vé)</option>
                  </select>
              </div>
              
              <div className="text-right">
                <span className="text-sm text-gray-600 block">Tổng tiền:</span>
                <span className="text-2xl font-bold text-amber-700">{formatCurrency(formData.totalPrice)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                // 🔥 Disable nút nếu suất chiếu đã kết thúc
                disabled={loading || !formData.showtime || formData.seats.length === 0 || isShowtimeFinished}
                className={`flex-1 p-3 rounded-lg font-bold shadow-lg transition flex justify-center items-center gap-2 text-lg 
                    ${isShowtimeFinished 
                        ? "bg-gray-400 text-white cursor-not-allowed" 
                        : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/30 transform active:scale-[0.98]"}
                `}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Ticket />}
                {isShowtimeFinished ? "ĐÃ KẾT THÚC (READ ONLY)" : (editingId ? "LƯU CẬP NHẬT" : "XUẤT VÉ NGAY")}
              </button>
              
              {editingId && (
                <button type="button" onClick={resetForm} className="px-6 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-600 transition">Hủy</button>
              )}
            </div>
          </form>
        </div>

        {/* 🔥 CỘT PHẢI: LỊCH SỬ VÉ */}
        <div className="lg:col-span-1 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-800">Lịch sử bán</h3>
              
              {/* Hiển thị Tag Filter nếu đã chọn suất */}
              {formData.showtime ? (
                  <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold border border-blue-200">
                    <Filter size={10} /> Theo suất chiếu
                  </span>
              ) : (
                  <span className="text-xs text-gray-400 italic">(Chọn suất chiếu để xem)</span>
              )}
            </div>
            
            {/* Chỉ hiện số lượng khi đã filter */}
            {formData.showtime && (
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">{filteredTickets.length} vé</span>
            )}
          </div>

          <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            
            {/* 🔥 CHỈ HIỆN LIST VÉ KHI ĐÃ CHỌN SUẤT CHIẾU */}
            {!formData.showtime ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <Calendar className="mx-auto text-gray-300 mb-2" size={32} />
                    <p className="text-gray-400 text-sm">Vui lòng chọn suất chiếu<br/>để xem danh sách vé.</p>
                </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <Ticket className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-400 text-sm">Chưa có vé nào bán ra cho suất này.</p>
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
                }

                return (
                  <div key={ticket._id} className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ticket.paymentStatus === 'paid' || ticket.order?.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                {ticket.paymentStatus === 'paid' || ticket.order?.status === 'success' ? <CreditCard size={14} /> : <Loader2 size={14} />}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-gray-800 truncate text-sm" title={ticket.showtime?.movie?.title}>
                                {ticket.showtime?.movie?.title || "Phim ???"}
                                </h4>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    {ticket.showtime?.startTime ? new Date(ticket.showtime.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                                </span>
                            </div>
                        </div>
                        <span className="font-bold text-amber-600 text-sm whitespace-nowrap">
                            {formatCurrency(finalPrice)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-gray-100">
                        <span className="flex items-center gap-1 text-xs text-gray-600 max-w-[60%] truncate">
                            {isClientBooking ? <Users size={12} className="text-blue-500" /> : <UserX size={12} className="text-gray-400" />}
                            {ticket.user?.name || ticket.guestName || "Khách lẻ"}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                            <Armchair size={12} /> {seatDisplay}
                        </span>
                    </div>

                    {/* Action Buttons Overlay */}
                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                      {!isClientBooking ? (
                        <>
                          <button onClick={() => handleEdit(ticket)} className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 rounded border border-amber-200 hover:bg-amber-100 text-xs font-bold shadow-sm"><SquarePen size={14} /> Sửa</button>
                          <button onClick={() => handleDelete(ticket._id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 text-xs font-bold shadow-sm"><Trash2 size={14} /> Hủy</button>
                        </>
                      ) : (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded border border-blue-200">Đơn Online (Không thể sửa)</span>
                      )}
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