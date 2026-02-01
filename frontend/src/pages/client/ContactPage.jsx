import React, { useEffect, useState, useRef } from "react";
import api from "../../api/axiosConfig";
import io from "socket.io-client";
import { Send, MapPin, Phone, Mail, MessageSquare, UserCheck, Loader2, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Khởi tạo socket bên ngoài để tránh tạo lại liên tục khi re-render
const socket = io.connect("http://localhost:5000");

export default function ContactPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [conversationId, setConversationId] = useState("");
  
  const [emailForm, setEmailForm] = useState({ name: "", email: "", content: "" });
  const [loadingEmail, setLoadingEmail] = useState(false);

  const messagesEndRef = useRef(null);

  // --- 1. SETUP DỮ LIỆU & SOCKET ---
  useEffect(() => {
    // A. Lấy thông tin User
    const rawData = JSON.parse(localStorage.getItem("user"));
    const currentUser = rawData?.user || rawData;

    if (currentUser && (currentUser._id || currentUser.id)) {
        setUser(currentUser);
        
        // Điền form email tự động
        setEmailForm(prev => ({
            ...prev,
            name: currentUser.name || currentUser.fullName || "",
            email: currentUser.email || ""
        }));

        // ID hội thoại chính là ID User
        const myConvId = currentUser._id || currentUser.id;
        setConversationId(myConvId);

        // --- B. LOGIC SOCKET QUAN TRỌNG (FIX LỖI KHÔNG NHẬN TIN) ---
        
        // Hàm này đảm bảo luôn Join lại phòng khi cần thiết
        const handleJoinRoom = () => {
            console.log("🔗 Connecting to Chat Room:", myConvId);
            socket.emit("join_conversation", myConvId);
            socket.emit("register_user", { username: currentUser.name, conversationId: myConvId });
        };

        // 1. Join ngay lập tức nếu socket đang kết nối
        if (socket.connected) {
            handleJoinRoom();
        }

        // 2. Lắng nghe sự kiện connect (để tự Join lại nếu rớt mạng/F5)
        socket.on("connect", handleJoinRoom);

        // 3. Lắng nghe tin nhắn từ Admin
        const handleReceiveMessage = (data) => {
            console.log("📩 Nhận tin từ Admin:", data);
            setMessageList((prev) => [...prev, { ...data, author: "ADMIN" }]);
        };
        socket.on("receive_from_admin", handleReceiveMessage);

        // 4. Tải lịch sử chat cũ
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

        // Cleanup: Gỡ sự kiện khi thoát trang để tránh nhận tin nhắn trùng lặp
        return () => {
            socket.off("connect", handleJoinRoom);
            socket.off("receive_from_admin", handleReceiveMessage);
        };

    } else {
        setUser(null);
    }
  }, []);

  // Auto Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  // --- 2. HÀM CHUYỂN HƯỚNG LOGIN ---
  const handleLoginRedirect = () => {
      navigate("/login", { state: { from: location.pathname } });
  };

  // --- 3. GỬI TIN NHẮN ---
  const sendMessage = (e) => {
    e.preventDefault();
    if (!user) return handleLoginRedirect();

    if (currentMessage.trim() !== "") {
      const messageData = {
        conversationId: conversationId,
        username: user.name || user.email, 
        message: currentMessage,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      // Gửi lên Server
      socket.emit("send_to_admin", messageData);
      
      // Hiển thị ngay ở phía mình
      setMessageList((list) => [...list, { ...messageData, author: "Me" }]);
      setCurrentMessage("");
    }
  };

  // --- 4. GỬI EMAIL ---
  const handleEmailChange = (e) => setEmailForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handleSendEmail = async (e) => {
     e.preventDefault();
     if (!user) {
         if(window.confirm("Bạn cần đăng nhập để gửi yêu cầu hỗ trợ. Đăng nhập ngay?")) {
             handleLoginRedirect();
         }
         return;
     }

     if (!emailForm.name || !emailForm.email || !emailForm.content) return alert("Vui lòng điền đủ thông tin!");
     
     try {
        setLoadingEmail(true);
        const res = await api.post("/contact/send", emailForm);
        if (res.data.success) {
            alert("✅ Đã gửi email hỗ trợ thành công!");
            setEmailForm(prev => ({ ...prev, content: "" })); 
        }
     } catch(err) { 
         alert("Lỗi gửi mail: " + (err.response?.data?.message || err.message)); 
     } finally { 
         setLoadingEmail(false); 
     }
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
              
              <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 relative overflow-hidden">
                 {!user && (
                     <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center px-4">
                         <Lock className="w-12 h-12 text-yellow-500 mb-3" />
                         <h3 className="text-xl font-bold text-white mb-2">Đăng nhập để gửi yêu cầu</h3>
                         <button onClick={handleLoginRedirect} className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-full hover:bg-yellow-400 transition">
                             Đăng nhập ngay
                         </button>
                     </div>
                 )}

                 <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Mail className="text-yellow-500"/> Gửi Email</h3>
                 <form onSubmit={handleSendEmail} className="space-y-4">
                     <input type="text" name="name" value={emailForm.name} onChange={handleEmailChange} placeholder="Họ tên của bạn" className="w-full bg-gray-700 border border-gray-600 rounded p-3 outline-none focus:border-yellow-500 transition" disabled={!user} />
                     <input type="email" name="email" value={emailForm.email} onChange={handleEmailChange} placeholder="Email liên hệ" className="w-full bg-gray-700 border border-gray-600 rounded p-3 outline-none focus:border-yellow-500 transition" disabled={!user} />
                     <textarea name="content" value={emailForm.content} onChange={handleEmailChange} rows="4" placeholder="Nội dung cần hỗ trợ..." className="w-full bg-gray-700 border border-gray-600 rounded p-3 outline-none focus:border-yellow-500 transition" disabled={!user}></textarea>
                     <button type="submit" disabled={loadingEmail || !user} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded flex justify-center items-center gap-2 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                         {loadingEmail ? <Loader2 className="animate-spin"/> : "Gửi Yêu Cầu"}
                     </button>
                 </form>
              </div>
          </div>

          {/* CỘT PHẢI: CHAT BOX PRO */}
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 flex flex-col h-[600px] overflow-hidden relative">
            
            {!user && (
                <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-700">
                        <MessageSquare size={32} className="text-gray-500"/>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Bạn cần hỗ trợ?</h2>
                    <p className="text-gray-400 mb-6 max-w-xs">Vui lòng đăng nhập tài khoản thành viên để chat trực tiếp với nhân viên hỗ trợ.</p>
                    <button 
                        onClick={handleLoginRedirect}
                        className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-full shadow-lg hover:shadow-yellow-500/20 hover:scale-105 transition transform"
                    >
                        Đăng nhập để Chat
                    </button>
                </div>
            )}

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
              
              {user && (
                  <div className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 border border-black/5">
                    <UserCheck size={14} className="opacity-70"/>
                    {user.name}
                  </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 relative custom-scrollbar">
              <div className="absolute inset-0 opacity-5 pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              </div>

              {messageList.length === 0 && user && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 opacity-70 pointer-events-none">
                     <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-700">
                         <MessageSquare size={32} className="text-yellow-500 animate-pulse"/>
                     </div>
                     <p className="font-bold text-lg">Xin chào, {user.name}!</p>
                     <p className="text-sm">Chúng tôi có thể giúp gì cho bạn?</p>
                  </div>
              )}
              
              {messageList.map((msg, index) => {
                const isMe = msg.author === "Me";
                return (
                  <div key={index} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                      {!isMe && (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shrink-0 border border-blue-400">
                            AD
                          </div>
                      )}
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

            <div className="p-4 bg-gray-800 border-t border-gray-700 z-10">
              <form onSubmit={sendMessage} className="flex gap-2 relative">
                <input 
                    type="text" 
                    value={currentMessage} 
                    onChange={(e) => setCurrentMessage(e.target.value)} 
                    placeholder="Nhập tin nhắn..." 
                    className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-full pl-5 pr-12 py-3 focus:outline-none focus:border-yellow-500 transition shadow-inner disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={!user}
                />
                <button 
                    type="submit" 
                    disabled={!user}
                    className="absolute right-2 top-1.5 bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-full shadow-lg transition transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
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