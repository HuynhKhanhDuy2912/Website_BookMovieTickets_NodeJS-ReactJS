import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import api from "../../api/axiosConfig";
import { Send, MessageSquare, Bell, User, Search } from "lucide-react";

// Kết nối Server
const socket = io.connect("http://localhost:5000");

export default function AdminChat() {
  const [conversations, setConversations] = useState([]); 
  const [onlineUsers, setOnlineUsers] = useState([]);     
  const [selectedUser, setSelectedUser] = useState(null); 
  const [messages, setMessages] = useState([]);           
  const [inputMsg, setInputMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");       

  const messagesEndRef = useRef(null);

  // Helper: Check user có đang online không (So sánh ID Cố định)
  const isUserOnline = (convId) => {
      return onlineUsers.some(u => u.conversationId === convId);
  };

  // --- 1. KHỞI TẠO ---
  useEffect(() => {
    fetchConversations();
    socket.emit("register_admin");

    socket.on("update_user_list", (userList) => setOnlineUsers(userList));

    socket.on("receive_from_client", (data) => {
      // 1. Nhận tin nhắn mới
      if (selectedUser?.conversationId === data.senderId) {
         setMessages(prev => [...prev, { ...data, sender: "client" }]);
         markAsRead(data.senderId); 
      }

      // 2. Cập nhật Sidebar (Đưa lên đầu & Update tên mới nhất)
      setConversations(prev => {
        const others = prev.filter(c => c.conversationId !== data.senderId);
        const existing = prev.find(c => c.conversationId === data.senderId);
        
        const newUnread = (selectedUser?.conversationId === data.senderId) 
                          ? 0 
                          : (existing ? existing.unread + 1 : 1);

        const updatedUser = {
           conversationId: data.senderId,
           // 👇 LOGIC FIX TÊN: Ưu tiên tên mới nhất khách gửi lên
           username: data.senderName || (existing ? existing.username : "Khách mới"), 
           lastMessage: data.message,
           unread: newUnread,
           updatedAt: new Date()
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

  // --- 2. CÁC HÀM GỌI API ---
  const fetchConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      const formatted = res.data.map(c => ({
         conversationId: c._id, 
         // 👇 Lấy tên từ senderName trong DB (đã được lưu đúng từ Client)
         username: c.senderName || "Người dùng ẩn danh", 
         lastMessage: c.lastMessage,
         unread: c.unreadCount,
         updatedAt: c.lastTime
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
      setConversations(prev => prev.map(c => 
         c.conversationId === convId ? { ...c, unread: 0 } : c
      ));
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  };

  // --- 3. XỬ LÝ SỰ KIỆN ---
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchMessages(user.conversationId);
    markAsRead(user.conversationId);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedUser) return;

    const msgData = {
      message: inputMsg,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    socket.emit("send_to_client", {
      toSocketId: selectedUser.conversationId,
      ...msgData
    });

    setMessages(prev => [...prev, { text: inputMsg, sender: "admin", createdAt: new Date() }]);
    
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

  // Filter & Sort danh sách (Mới nhất lên đầu)
  const filteredConversations = conversations
    .filter(c => c.username.toLowerCase().includes(searchTerm.toLowerCase()))
    // .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Optional: Sort nếu API chưa sort

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-100 p-4 gap-4 font-sans">
      
      {/* === CỘT TRÁI: DANH SÁCH USER === */}
      <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
           <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-3">
             <MessageSquare className="text-blue-600" size={20}/> Tin Nhắn ({conversations.length})
           </h3>
           <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input 
                type="text" 
                placeholder="Tìm khách hàng..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
             <div className="text-center text-gray-400 mt-10">
                <Bell size={40} className="mx-auto mb-2 opacity-20"/>
                <p className="text-sm">Chưa có tin nhắn nào.</p>
             </div>
          ) : (
             filteredConversations.map(u => {
                const isOnline = isUserOnline(u.conversationId);
                return (
                   <div 
                      key={u.conversationId}
                      onClick={() => handleSelectUser(u)}
                      className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition flex items-center gap-3 relative group ${
                         selectedUser?.conversationId === u.conversationId ? "bg-blue-100 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                      }`}
                   >
                      <div className="relative shrink-0">
                         <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center font-bold text-gray-600 text-lg shadow-inner">
                            {u.username.charAt(0).toUpperCase()}
                         </div>
                         {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full ring-2 ring-white"></span>
                         )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-0.5">
                            <h4 className={`font-bold text-sm truncate ${u.unread > 0 ? "text-gray-900" : "text-gray-700"}`}>
                               {u.username}
                            </h4>
                         </div>
                         <p className={`text-xs truncate ${u.unread > 0 ? "font-semibold text-blue-600" : "text-gray-500"}`}>
                            {u.lastMessage}
                         </p>
                      </div>

                      {u.unread > 0 && (
                         <div className="ml-2 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full shadow-sm">
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
                     <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {selectedUser.username.charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-800 text-base">{selectedUser.username}</h3>
                        <span className={`text-xs flex items-center gap-1 font-medium ${isUserOnline(selectedUser.conversationId) ? "text-green-600" : "text-gray-400"}`}>
                           ● {isUserOnline(selectedUser.conversationId) ? "Đang hoạt động" : "Offline"}
                        </span>
                     </div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                      ID: {selectedUser.conversationId.slice(0, 8)}...
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {messages.map((msg, idx) => {
                     const isMe = msg.sender === "admin" || msg.from === "admin";
                     return (
                        <div key={idx} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                           <div className={`flex max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${isMe ? "bg-blue-600" : "bg-gray-400"}`}>
                                 {isMe ? "AD" : selectedUser.username.charAt(0).toUpperCase()}
                              </div>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words relative
                                 ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"}`}>
                                 <p>{msg.text || msg.message}</p>
                              </div>
                           </div>
                        </div>
                     )
                  })}
                  <div ref={messagesEndRef}></div>
               </div>

               <div className="p-4 border-t bg-white">
                  <form onSubmit={handleSend} className="flex gap-2">
                     <input 
                        className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-blue-500 focus:border-blue-500 block w-full p-3 px-5 outline-none transition"
                        placeholder="Nhập tin nhắn..."
                        value={inputMsg}
                        onChange={e => setInputMsg(e.target.value)}
                     />
                     <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition transform active:scale-95 flex items-center justify-center">
                        <Send size={18}/>
                     </button>
                  </form>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare size={40} className="text-gray-300"/>
               </div>
               <p className="text-lg font-medium text-gray-500">Chọn một cuộc trò chuyện để bắt đầu</p>
               <p className="text-sm text-gray-400">Danh sách tin nhắn sẽ hiển thị ở cột bên trái</p>
            </div>
         )}
      </div>

    </div>
  );
}