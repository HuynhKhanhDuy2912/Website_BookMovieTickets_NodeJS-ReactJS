import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import api from "../../api/axiosConfig"; // Gọi API để lấy tin nhắn cũ
import { Send, MessageSquare, Bell, User } from "lucide-react";

const socket = io.connect("http://localhost:5000");

export default function AdminChat() {
  // 1. STATE QUẢN LÝ DỮ LIỆU
  const [conversations, setConversations] = useState([]); // List bên trái (Lấy từ DB)
  const [onlineUsers, setOnlineUsers] = useState([]);     // List đang Online (Lấy từ Socket)
  const [selectedUser, setSelectedUser] = useState(null); // User đang chat
  const [messages, setMessages] = useState([]);           // Tin nhắn chi tiết
  const [inputMsg, setInputMsg] = useState("");
  
  const messagesEndRef = useRef(null);

  // 2. HELPER: CHECK ONLINE
  // So sánh conversationId (ID trong DB) với socketId đang online
  const isUserOnline = (convId) => onlineUsers.some(u => u.socketId === convId);

  // 3. KHỞI TẠO (Load dữ liệu & Lắng nghe Socket)
  useEffect(() => {
    // A. Gọi API lấy danh sách chat cũ (để không bị mất khi F5)
    fetchConversations();

    // B. Đăng ký Admin với Socket Server
    socket.emit("register_admin");

    // C. Lắng nghe danh sách Online (để hiện chấm xanh)
    socket.on("update_user_list", (userList) => {
      setOnlineUsers(userList);
    });

    // D. Lắng nghe tin nhắn mới từ khách
    socket.on("receive_from_client", (data) => {
      // Nếu đang mở đúng khung chat của người này -> Đẩy tin nhắn vào luôn
      if (selectedUser?.conversationId === data.senderId) {
         setMessages(prev => [...prev, { ...data, sender: "client" }]);
         markAsRead(data.senderId); 
      }

      // Cập nhật Sidebar (Đưa lên đầu + Tăng số chưa đọc)
      setConversations(prev => {
        const others = prev.filter(c => c.conversationId !== data.senderId);
        const existing = prev.find(c => c.conversationId === data.senderId);
        
        const newUnread = (selectedUser?.conversationId === data.senderId) 
                          ? 0 
                          : (existing ? existing.unread + 1 : 1);

        const updatedUser = {
           conversationId: data.senderId,
           username: data.senderName || (existing ? existing.username : "Khách mới"),
           lastMessage: data.message,
           unread: newUnread
        };
        return [updatedUser, ...others];
      });
    });

    return () => {
      socket.off("update_user_list");
      socket.off("receive_from_client");
    };
  }, [selectedUser]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. CÁC HÀM GỌI API (BACKEND)
  const fetchConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      const formatted = res.data.map(c => ({
         conversationId: c._id,
         username: c.senderName || c._id, 
         lastMessage: c.lastMessage,
         unread: c.unreadCount
      }));
      setConversations(formatted);
    } catch (err) {
      console.error("Lỗi tải danh sách chat:", err);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await api.get(`/chat/history/${convId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Lỗi tải lịch sử chat:", err);
    }
  };

  const markAsRead = async (convId) => {
    try {
      await api.put(`/chat/read/${convId}`);
      // UI: Xóa số đỏ
      setConversations(prev => prev.map(c => 
         c.conversationId === convId ? { ...c, unread: 0 } : c
      ));
    } catch (err) {
      console.error("Lỗi mark read:", err);
    }
  };

  // 5. XỬ LÝ CHỌN USER
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchMessages(user.conversationId); // Load tin cũ từ DB
    markAsRead(user.conversationId);    // Đánh dấu đã đọc
  };

  // 6. GỬI TIN NHẮN
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedUser) return;

    const msgData = {
      message: inputMsg,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    // Gửi Socket
    socket.emit("send_to_client", {
      toSocketId: selectedUser.conversationId,
      ...msgData
    });

    // Cập nhật UI Chat
    setMessages(prev => [...prev, { text: inputMsg, sender: "admin", createdAt: new Date() }]);
    
    // Cập nhật UI Sidebar (Đưa lên đầu)
    setConversations(prev => {
        const others = prev.filter(c => c.conversationId !== selectedUser.conversationId);
        const updatedUser = { 
           ...selectedUser, 
           lastMessage: "Bạn: " + inputMsg, 
           unread: 0 
        };
        return [updatedUser, ...others];
    });

    setInputMsg("");
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-100 p-4 gap-4">
      
      {/* === CỘT TRÁI: DANH SÁCH USER === */}
      <div className="w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
           <h3 className="font-bold text-gray-700 flex items-center gap-2">
             <MessageSquare className="text-blue-600" size={20}/> Tin Nhắn ({conversations.length})
           </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
             <div className="text-center text-gray-400 mt-10">
                <Bell size={40} className="mx-auto mb-2 opacity-20"/>
                <p className="text-sm">Chưa có tin nhắn nào.</p>
             </div>
          ) : (
             conversations.map(u => {
                const isOnline = isUserOnline(u.conversationId);
                return (
                   <div 
                      key={u.conversationId}
                      onClick={() => handleSelectUser(u)}
                      className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition flex items-center gap-3 relative ${
                         selectedUser?.conversationId === u.conversationId ? "bg-blue-100 border-l-4 border-l-blue-600" : ""
                      }`}
                   >
                      {/* Avatar + Chấm xanh */}
                      <div className="relative">
                         <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 text-lg">
                            {(u.username || "K").charAt(0).toUpperCase()}
                         </div>
                         {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                         )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-1">
                            <h4 className={`font-bold text-sm truncate ${u.unread > 0 ? "text-black" : "text-gray-700"}`}>
                               {u.username.substring(0, 15)}...
                            </h4>
                         </div>
                         <p className={`text-xs truncate ${u.unread > 0 ? "font-bold text-blue-600" : "text-gray-500"}`}>
                            {u.lastMessage}
                         </p>
                      </div>

                      {/* Badge số tin chưa đọc */}
                      {u.unread > 0 && (
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
                            {u.unread}
                         </div>
                      )}
                   </div>
                )
             })
          )}
        </div>
      </div>

      {/* === CỘT PHẢI: KHUNG CHAT === */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
         {selectedUser ? (
            <>
               <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {(selectedUser.username || "K").charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-800">{selectedUser.username}</h3>
                        <span className={`text-xs flex items-center gap-1 ${isUserOnline(selectedUser.conversationId) ? "text-green-600" : "text-gray-400"}`}>
                           ● {isUserOnline(selectedUser.conversationId) ? "Đang hoạt động" : "Offline"}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {messages.map((msg, idx) => {
                     const isMe = msg.sender === "admin" || msg.from === "admin"; // Check cả 2 trường hợp data
                     return (
                        <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                           <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${
                              isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white border text-gray-800 rounded-bl-none"
                           }`}>
                              <p>{msg.text || msg.message}</p>
                              {/* <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>{msg.time || msg.createdAt}</p> */}
                           </div>
                        </div>
                     )
                  })}
                  <div ref={messagesEndRef}></div>
               </div>

               <div className="p-4 border-t bg-white">
                  <form onSubmit={handleSend} className="flex gap-2">
                     <input 
                        className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập tin nhắn..."
                        value={inputMsg}
                        onChange={e => setInputMsg(e.target.value)}
                     />
                     <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold flex items-center gap-2">
                        <Send size={18}/>
                     </button>
                  </form>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
               <MessageSquare size={64} className="mb-4 opacity-20"/>
               <p className="text-lg">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
         )}
      </div>

    </div>
  );
}