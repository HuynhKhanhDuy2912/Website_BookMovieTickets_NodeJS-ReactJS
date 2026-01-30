import React, { useEffect, useState, useRef } from "react";
import api from "../../api/axiosConfig"; 
import io from "socket.io-client";
import { Send, MapPin, Phone, Mail, MessageSquare, User, UserCheck, Loader2, Edit2 } from "lucide-react";

// Kết nối Server
const socket = io.connect("http://localhost:5000");

export default function ContactPage() {
  // --- STATE ---
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [username, setUsername] = useState("");
  const [conversationId, setConversationId] = useState("");
  
  // State cho Email Form
  const [emailForm, setEmailForm] = useState({ name: "", email: "", content: "" });
  const [loadingEmail, setLoadingEmail] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // A. Lấy dữ liệu thô từ LocalStorage
    const rawData = JSON.parse(localStorage.getItem("user"));
    
    // Xử lý trường hợp dữ liệu lồng nhau (VD: { user: {...}, token: ... })
    const currentUser = rawData?.user || rawData; 

    let myConvId = localStorage.getItem("chat_session_id");
    let myName = "";

    // B. LOGIC ƯU TIÊN NGƯỜI DÙNG ĐĂNG KÝ
    if (currentUser && (currentUser._id || currentUser.id)) {
        // 1. Nếu là User đã đăng nhập -> Lấy ID thật
        myConvId = currentUser._id || currentUser.id;
        
        // 2. Tự động dò tìm trường tên đúng (fullName, username, name...)
        myName = currentUser.fullName || currentUser.username || currentUser.name || currentUser.email || "Thành viên";
        
        // *Quan trọng:* Xóa session rác của khách để tránh bị nhầm lẫn
        localStorage.removeItem("guest_name");
        localStorage.removeItem("chat_session_id"); // Xóa ID khách ảo đi
    } 
    else {
        // 3. Nếu là Khách vãng lai (Chưa login)
        if (!myConvId || myConvId === "undefined") {
            myConvId = "guest_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("chat_session_id", myConvId);
        }
        
        // Lấy tên khách cũ hoặc tạo mới
        const savedName = localStorage.getItem("guest_name");
        myName = savedName || ("Khách_" + myConvId.substr(-4));
    }

    setConversationId(myConvId);
    setUsername(myName);

    // C. Join Room & Tải lịch sử (Giữ nguyên)
    if (socket.connected) {
        socket.emit("join_conversation", myConvId);
        socket.emit("register_user", { username: myName, conversationId: myConvId });
    } else {
        socket.on("connect", () => socket.emit("join_conversation", myConvId));
        socket.emit("register_user", { username: myName, conversationId: myConvId });
    }

    if (myConvId && myConvId !== "undefined") {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/chat/history/${myConvId}`);
                const formatted = res.data.map(msg => ({
                    message: msg.text,
                    time: new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    author: msg.sender === "client" ? "Me" : "ADMIN"
                }));
                setMessageList(formatted);
            } catch (err) {
                console.error("Lỗi tải lịch sử chat:", err);
            }
        };
        fetchHistory();
    }

    const handleReceiveMessage = (data) => {
      setMessageList((list) => [...list, { ...data, author: "ADMIN" }]);
    };
    socket.on("receive_from_admin", handleReceiveMessage);

    return () => {
      socket.off("receive_from_admin", handleReceiveMessage);
    };
  }, []);

  // --- 2. LOGIC ĐỒNG BỘ TÊN THÔNG MINH ---
  
  // A. Đồng bộ từ Form Email -> Tên Chat (Chỉ áp dụng cho Guest)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    // Nếu chưa đăng nhập và người dùng nhập tên vào form Email
    if (!storedUser && emailForm.name.trim()) {
       setUsername(emailForm.name);
    }
  }, [emailForm.name]);

  // B. Lưu tên Guest vào LocalStorage mỗi khi đổi tên (để F5 không mất)
  useEffect(() => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser && username) {
          localStorage.setItem("guest_name", username);
      }
  }, [username]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  // --- 3. GỬI TIN NHẮN ---
  const sendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim() !== "") {
      const messageData = {
        conversationId: conversationId,
        username: username, // Gửi tên mới nhất lên server
        message: currentMessage,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      socket.emit("send_to_admin", messageData);
      setMessageList((list) => [...list, { ...messageData, author: "Me" }]);
      setCurrentMessage("");
    }
  };

  // --- 4. GỬI EMAIL (Logic cũ) ---
  const handleEmailChange = (e) => setEmailForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSendEmail = async (e) => {
     e.preventDefault();
     if (!emailForm.name || !emailForm.email || !emailForm.content) return alert("Vui lòng điền đủ thông tin!");
     try {
        setLoadingEmail(true);
        const res = await api.post("/contact/send", emailForm);
        if (res.data.success) {
            alert("✅ Đã gửi email hỗ trợ thành công!");
            setEmailForm({ name: "", email: "", content: "" });
        }
     } catch(err) { alert("Lỗi gửi mail: " + (err.response?.data?.message || err.message)); } 
     finally { setLoadingEmail(false); }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-yellow-500 mb-4">Liên Hệ & Hỗ Trợ</h1>
          <p className="text-gray-400">Kết nối trực tiếp với nhân viên hỗ trợ.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* CỘT TRÁI: FORM EMAIL */}
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700 hover:border-yellow-500 transition">
                  <MapPin className="mx-auto text-yellow-500 mb-2" /><h3 className="font-bold mb-1">Địa chỉ</h3><p className="text-sm text-gray-400">TP.HCM</p>
               </div>
               <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700 hover:border-yellow-500 transition">
                  <Phone className="mx-auto text-yellow-500 mb-2" /><h3 className="font-bold mb-1">Hotline</h3><p className="text-sm text-gray-400">1900 1234</p>
               </div>
               <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700 hover:border-yellow-500 transition">
                  <Mail className="mx-auto text-yellow-500 mb-2" /><h3 className="font-bold mb-1">Email</h3><p className="text-sm text-gray-400">support@popcorn.vn</p>
               </div>
             </div>
             
             <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Mail className="text-yellow-500"/> Gửi Email</h3>
                <form onSubmit={handleSendEmail} className="space-y-4">
                    <input type="text" name="name" value={emailForm.name} onChange={handleEmailChange} placeholder="Họ tên của bạn" className="w-full bg-gray-700 border border-gray-600 rounded p-3 outline-none focus:border-yellow-500 transition" />
                    <input type="email" name="email" value={emailForm.email} onChange={handleEmailChange} placeholder="Email liên hệ" className="w-full bg-gray-700 border border-gray-600 rounded p-3 outline-none focus:border-yellow-500 transition" />
                    <textarea name="content" value={emailForm.content} onChange={handleEmailChange} rows="4" placeholder="Nội dung cần hỗ trợ..." className="w-full bg-gray-700 border border-gray-600 rounded p-3 outline-none focus:border-yellow-500 transition"></textarea>
                    <button type="submit" disabled={loadingEmail} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded flex justify-center items-center gap-2 transition transform active:scale-95">
                        {loadingEmail ? <Loader2 className="animate-spin"/> : "Gửi Yêu Cầu"}
                    </button>
                </form>
             </div>
          </div>

          {/* CỘT PHẢI: CHAT BOX PRO */}
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 flex flex-col h-[600px] overflow-hidden">
            
            {/* Header Vàng */}
            <div className="bg-yellow-500 text-black p-4 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="bg-black/10 p-2 rounded-full"><MessageSquare size={20} /></div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Hỗ Trợ Trực Tuyến</h3>
                  <div className="flex items-center gap-1 text-xs opacity-80">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    Admin đang online
                  </div>
                </div>
              </div>
              
              {/* Tên Khách Hàng (Có thể sửa) */}
              <div className="group relative">
                  <div className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 border border-black/5 hover:bg-white/30 transition cursor-pointer">
                    <UserCheck size={14} className="opacity-70"/>
                    {/* Input ẩn để sửa tên */}
                    <input 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-transparent border-none outline-none w-24 text-xs font-bold placeholder-black/50 text-black"
                        placeholder="Nhập tên..."
                        title="Nhấn để đổi tên hiển thị"
                    />
                    <Edit2 size={10} className="opacity-0 group-hover:opacity-50 transition"/>
                  </div>
              </div>
            </div>

            {/* Body Chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 relative custom-scrollbar">
              
              {/* Pattern nền mờ */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              </div>

              {/* Zero State: Khi chưa có tin nhắn */}
              {messageList.length === 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 opacity-70 pointer-events-none">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-700">
                        <MessageSquare size={32} className="text-yellow-500 animate-pulse"/>
                    </div>
                    <p className="font-bold text-lg">Xin chào, {username}!</p>
                    <p className="text-sm">Chúng tôi có thể giúp gì cho bạn?</p>
                 </div>
              )}
              
              {/* Danh sách tin nhắn */}
              {messageList.map((msg, index) => {
                const isMe = msg.author === "Me";
                return (
                  <div key={index} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                      
                      {/* Avatar Admin */}
                      {!isMe && (
                         <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shrink-0 border border-blue-400">
                           AD
                         </div>
                      )}

                      {/* Bong bóng chat */}
                      <div className={`px-4 py-2 text-sm shadow-md break-words relative
                         ${isMe 
                           ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-2xl rounded-tr-none" 
                           : "bg-gray-700 text-gray-100 rounded-2xl rounded-tl-none border border-gray-600"
                         }`}>
                         {msg.message}
                         <p className={`text-[9px] mt-1 opacity-60 font-medium ${isMe ? "text-right text-black" : "text-left text-gray-300"}`}>
                            {msg.time}
                         </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input */}
            <div className="p-4 bg-gray-800 border-t border-gray-700 z-10">
              <form onSubmit={sendMessage} className="flex gap-2 relative">
                <input 
                    type="text" 
                    value={currentMessage} 
                    onChange={(e) => setCurrentMessage(e.target.value)} 
                    placeholder="Nhập tin nhắn..." 
                    className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-full pl-5 pr-12 py-3 focus:outline-none focus:border-yellow-500 transition shadow-inner" 
                />
                <button 
                    type="submit" 
                    className="absolute right-2 top-1.5 bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-full shadow-lg transition transform active:scale-90"
                >
                    <Send size={18} />
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}