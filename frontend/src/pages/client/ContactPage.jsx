import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { Send, MapPin, Phone, Mail, MessageSquare, User, UserCheck } from "lucide-react";

// Kết nối socket
const socket = io.connect("http://localhost:5000");

export default function ContactPage() {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [username, setUsername] = useState("");

  const messagesEndRef = useRef(null);

  // 1. Đăng ký User & Lắng nghe tin nhắn
  useEffect(() => {
    // Giả lập lấy tên hoặc tạo tên ngẫu nhiên
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const name = storedUser ? storedUser.name : "Khách_" + Math.floor(Math.random() * 1000);
    setUsername(name);

    // Gửi sự kiện đăng ký lên Server
    socket.emit("register_user", name);

    // Lắng nghe tin nhắn từ Admin
    const handleReceiveMessage = (data) => {
      setMessageList((list) => [...list, { ...data, author: "ADMIN" }]);
    };

    socket.on("receive_from_admin", handleReceiveMessage);

    // Cleanup function để tránh nhận tin nhắn kép
    return () => {
      socket.off("receive_from_admin", handleReceiveMessage);
    };
  }, []);

  // 2. Tự động cuộn xuống cuối khi có tin nhắn mới (FIX QUAN TRỌNG)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  // 3. Gửi tin nhắn
  const sendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim() !== "") {
      const messageData = {
        message: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Gửi lên server (socketID tự động đi kèm)
      socket.emit("send_to_admin", messageData);

      // Hiển thị tin nhắn của mình ngay lập tức (author: "Me")
      setMessageList((list) => [...list, { ...messageData, author: "Me" }]);
      setCurrentMessage("");
    }
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
          
          {/* CỘT TRÁI: THÔNG TIN TĨNH */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
                <MapPin className="mx-auto text-yellow-500 mb-2" />
                <h3 className="font-bold mb-1">Địa chỉ</h3>
                <p className="text-sm text-gray-400">TP.HCM</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
                <Phone className="mx-auto text-yellow-500 mb-2" />
                <h3 className="font-bold mb-1">Hotline</h3>
                <p className="text-sm text-gray-400">1900 123 456</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
                <Mail className="mx-auto text-yellow-500 mb-2" />
                <h3 className="font-bold mb-1">Email</h3>
                <p className="text-sm text-gray-400">help@cinema.vn</p>
              </div>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Mail className="text-yellow-500"/> Gửi thắc mắc qua Email
              </h3>
              <form className="space-y-4">
                <input type="text" placeholder="Họ tên" className="w-full bg-gray-700 border border-gray-600 rounded p-3 focus:border-yellow-500 outline-none" />
                <input type="email" placeholder="Email" className="w-full bg-gray-700 border border-gray-600 rounded p-3 focus:border-yellow-500 outline-none" />
                <textarea rows="4" placeholder="Nội dung..." className="w-full bg-gray-700 border border-gray-600 rounded p-3 focus:border-yellow-500 outline-none"></textarea>
                <button type="button" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded transition">Gửi Yêu Cầu</button>
              </form>
            </div>
          </div>

          {/* CỘT PHẢI: KHUNG CHAT (ĐÃ GHÉP LOGIC) */}
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 flex flex-col h-[600px]">
            
            {/* Chat Header */}
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

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50 custom-scrollbar">
              {messageList.length === 0 && (
                <div className="text-center text-gray-500 mt-10 italic">
                  Hãy gửi tin nhắn để bắt đầu hỗ trợ...
                </div>
              )}
              
              {messageList.map((msg, index) => {
                // Kiểm tra xem tin nhắn là của "Me" hay "ADMIN"
                const isMe = msg.author === "Me";
                
                return (
                  <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-end gap-2 max-w-[80%]">
                      {/* Avatar Admin */}
                      {!isMe && (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md">
                          AD
                        </div>
                      )}
                      
                      <div>
                        {/* Bong bóng chat */}
                        <div className={`px-4 py-2 rounded-2xl text-sm break-words shadow-sm ${
                          isMe 
                            ? "bg-yellow-500 text-black rounded-tr-none" 
                            : "bg-gray-700 text-white rounded-tl-none"
                        }`}>
                          {msg.message}
                        </div>
                        
                        {/* Thời gian */}
                        <div className={`text-[10px] text-gray-500 mt-1 ${isMe ? "text-right" : "text-left"}`}>
                          {msg.time}
                        </div>
                      </div>

                      {/* Avatar User (Me) */}
                      {isMe && (
                         <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md">
                           <User size={14}/>
                         </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Điểm neo để cuộn xuống */}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Footer */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:border-yellow-500 transition"
                />
                <button 
                  type="submit" 
                  className="bg-yellow-500 hover:bg-yellow-400 text-black p-3 rounded-full transition flex items-center justify-center shadow-lg shadow-yellow-500/20"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}