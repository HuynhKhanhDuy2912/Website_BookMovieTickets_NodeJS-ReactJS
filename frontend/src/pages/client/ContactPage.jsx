import React, { useEffect, useState, useRef } from "react";
import api from "../../api/axiosConfig"; 
import io from "socket.io-client";
import { Send, MapPin, Phone, Mail, MessageSquare, User, UserCheck, Loader2 } from "lucide-react";

// Kết nối tới Server
const socket = io.connect("http://localhost:5000");

export default function ContactPage() {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [username, setUsername] = useState("");
  const [conversationId, setConversationId] = useState(""); // ID Cố định của khách
  
  const messagesEndRef = useRef(null);

// --- 1. KHỞI TẠO (CHẠY 1 LẦN KHI VÀO TRANG) ---
  useEffect(() => {
    // A. Lấy thông tin User & Session
    const storedUser = JSON.parse(localStorage.getItem("user"));
    let myConvId = localStorage.getItem("chat_session_id");
    let myName = "";

    // 👇 LOGIC FIX LỖI "UNDEFINED": Kiểm tra kỹ xem có _id thật không
    if (storedUser && storedUser._id) {
        // Nếu là User xịn (có ID đàng hoàng)
        myConvId = storedUser._id;
        myName = storedUser.username || storedUser.name || "Khách hàng";
    } else {
        // Nếu không phải User hoặc User bị lỗi -> Dùng logic Khách vãng lai
        if (!myConvId || myConvId === "undefined") {
            // Tạo ID mới nếu chưa có hoặc ID cũ bị lỗi "undefined"
            myConvId = "guest_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("chat_session_id", myConvId);
        }
        myName = "Khách_" + myConvId.substr(-4);
    }

    console.log("📌 ID Hội thoại chốt đơn:", myConvId); // <--- Bật F12 xem dòng này, nó phải là chuỗi ký tự, ko được là undefined

    setConversationId(myConvId);
    setUsername(myName);

    // B. Tham gia phòng chat (Socket)
    if (socket.connected) {
        socket.emit("join_conversation", myConvId);
    } else {
        socket.on("connect", () => socket.emit("join_conversation", myConvId));
    }

    // C. Gọi API lấy lịch sử (Chỉ gọi khi ID hợp lệ)
    if (myConvId && myConvId !== "undefined") {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/chat/history/${myConvId}`);
                console.log("✅ Đã tải được tin nhắn cũ:", res.data.length); 
                
                const formatted = res.data.map(msg => ({
                    message: msg.text,
                    time: new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    author: msg.sender === "client" ? "Me" : "ADMIN"
                }));
                setMessageList(formatted);
            } catch (err) {
                console.error("❌ Lỗi tải lịch sử:", err);
            }
        };
        fetchHistory();
    }

    // D. Lắng nghe tin mới
    const handleReceiveMessage = (data) => {
      setMessageList((list) => [...list, { ...data, author: "ADMIN" }]);
    };
    socket.on("receive_from_admin", handleReceiveMessage);

    return () => {
      socket.off("receive_from_admin", handleReceiveMessage);
    };
  }, []);

  // // Tự động cuộn xuống tin nhắn mới nhất
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messageList]);

  // --- 2. GỬI TIN NHẮN ---
  const sendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim() !== "") {
      const messageData = {
        conversationId: conversationId, // Gửi kèm ID cố định để Server lưu
        username: username,             // Gửi kèm tên để Admin biết
        message: currentMessage,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      // Gửi lên Server
      socket.emit("send_to_admin", messageData);

      // Hiển thị ở phía mình ngay lập tức
      setMessageList((list) => [...list, { ...messageData, author: "Me" }]);
      setCurrentMessage("");
    }
  };

  // --- 3. GỬI EMAIL (GIỮ NGUYÊN) ---
  const [emailForm, setEmailForm] = useState({ name: "", email: "", content: "" });
  const [loadingEmail, setLoadingEmail] = useState(false);
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-yellow-500 mb-4">Liên Hệ & Hỗ Trợ</h1>
          <p className="text-gray-400">Kết nối trực tiếp với nhân viên hỗ trợ.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* CỘT TRÁI: FORM GỬI EMAIL */}
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
                  <MapPin className="mx-auto text-yellow-500 mb-2" /><h3 className="font-bold mb-1">Địa chỉ</h3><p className="text-sm text-gray-400">TP.HCM</p>
               </div>
               <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
                  <Phone className="mx-auto text-yellow-500 mb-2" /><h3 className="font-bold mb-1">Hotline</h3><p className="text-sm text-gray-400">1900 123 456</p>
               </div>
               <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
                  <Mail className="mx-auto text-yellow-500 mb-2" /><h3 className="font-bold mb-1">Email</h3><p className="text-sm text-gray-400">help@cinema.vn</p>
               </div>
             </div>
             
             <div className="bg-gray-800 p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Mail className="text-yellow-500"/> Gửi Email</h3>
                <form onSubmit={handleSendEmail} className="space-y-4">
                    <input type="text" name="name" value={emailForm.name} onChange={handleEmailChange} placeholder="Họ tên" className="w-full bg-gray-700 border border-gray-600 rounded p-3 outline-none" />
                    <input type="email" name="email" value={emailForm.email} onChange={handleEmailChange} placeholder="Email" className="w-full bg-gray-700 border border-gray-600 rounded p-3 outline-none" />
                    <textarea name="content" value={emailForm.content} onChange={handleEmailChange} rows="4" placeholder="Nội dung..." className="w-full bg-gray-700 border border-gray-600 rounded p-3 outline-none"></textarea>
                    <button type="submit" disabled={loadingEmail} className="w-full bg-yellow-500 text-black font-bold py-3 rounded flex justify-center items-center gap-2">
                        {loadingEmail ? <Loader2 className="animate-spin"/> : "Gửi Yêu Cầu"}
                    </button>
                </form>
             </div>
          </div>

          {/* CỘT PHẢI: KHUNG CHAT */}
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 flex flex-col h-[600px]">
            <div className="bg-yellow-500 text-black p-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={24} />
                <div>
                  <h3 className="font-bold text-lg">Hỗ Trợ Trực Tuyến</h3>
                  <p className="text-xs opacity-80">Admin thường trả lời trong vài phút</p>
                </div>
              </div>
              <div className="text-xs font-bold bg-black/10 px-2 py-1 rounded flex items-center gap-1">
                <UserCheck size={12}/> {username}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50 custom-scrollbar">
              {messageList.length === 0 && <div className="text-center text-gray-500 mt-10 italic">Hãy gửi tin nhắn để bắt đầu...</div>}
              
              {messageList.map((msg, index) => {
                const isMe = msg.author === "Me";
                return (
                  <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-end gap-2 max-w-[80%]">
                      {!isMe && <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md">AD</div>}
                      <div>
                        <div className={`px-4 py-2 rounded-2xl text-sm break-words shadow-sm ${isMe ? "bg-yellow-500 text-black rounded-tr-none" : "bg-gray-700 text-white rounded-tl-none"}`}>
                          {msg.message}
                        </div>
                        <div className={`text-[10px] text-gray-500 mt-1 ${isMe ? "text-right" : "text-left"}`}>{msg.time}</div>
                      </div>
                      {isMe && <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"><User size={14}/></div>}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="Nhập tin nhắn..." className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:border-yellow-500" />
                <button type="submit" className="bg-yellow-500 hover:bg-yellow-400 text-black p-3 rounded-full"><Send size={20} /></button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}