import React, { useEffect, useState, useRef, useMemo } from "react";
import io from "socket.io-client";
import api from "../../api/axiosConfig";
import { Send, MessageSquare, Bell, User, Search, Loader2 } from "lucide-react";

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

  // --- 1. KHỞI TẠO SOCKET ---
  useEffect(() => {
    fetchConversations();

    socket.emit("join_conversation", "ADMIN_ROOM"); 

    socket.on("update_user_list", (userList) => {
        const clientsOnly = userList.filter(u => u.role === "client");
        setOnlineUsers(clientsOnly);
    });

    socket.on("receive_from_client", (data) => {
      if (selectedUser?.conversationId === data.conversationId) {
         setMessages(prev => [...prev, { ...data, sender: "client", text: data.message }]);
         markAsRead(data.conversationId); 
      }

      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.conversationId === data.conversationId);
        let newUserObj;
        const realName = data.username || "Khách hàng";

        if (existingIndex > -1) {
            newUserObj = {
                ...prev[existingIndex],
                username: realName, 
                lastMessage: data.message,
                updatedAt: new Date(),
                unread: (selectedUser?.conversationId === data.conversationId) ? 0 : (prev[existingIndex].unread + 1)
            };
            const newArr = [...prev];
            newArr.splice(existingIndex, 1);
            return [newUserObj, ...newArr];
        } else {
            newUserObj = {
                conversationId: data.conversationId,
                username: realName,
                lastMessage: data.message,
                unread: 1,
                updatedAt: new Date()
            };
            return [newUserObj, ...prev];
        }
      });
    });

    return () => {
      socket.off("update_user_list");
      socket.off("receive_from_client");
    };
  }, [selectedUser]); 

  // --- 2. LOGIC HIỂN THỊ THÔNG MINH ---
  const processedConversations = useMemo(() => {
      return conversations.map(conv => {
          const onlineInfo = onlineUsers.find(u => u.conversationId === conv.conversationId);
          const displayName = onlineInfo?.username || conv.username;
          return {
              ...conv,
              username: displayName,
              isOnline: !!onlineInfo
          };
      });
  }, [conversations, onlineUsers]);

  // 🔥 Helper lấy User đang active với dữ liệu mới nhất
  const activeUser = useMemo(() => {
      if (!selectedUser) return null;
      return processedConversations.find(c => c.conversationId === selectedUser.conversationId) || selectedUser;
  }, [selectedUser, processedConversations]);


  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 3. API CALLS ---
  const fetchConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      const formatted = res.data.map(c => ({
          conversationId: c._id, 
          username: c.senderName || "Khách hàng", 
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
      console.error("Lỗi mark read:", err);
    }
  };

  // --- 4. HANDLERS ---
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    socket.emit("join_conversation", user.conversationId);
    fetchMessages(user.conversationId);
    markAsRead(user.conversationId);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedUser) return;

    const msgData = {
      conversationId: selectedUser.conversationId,
      message: inputMsg,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    socket.emit("send_to_client", msgData);
    setMessages(prev => [...prev, { text: inputMsg, sender: "admin", createdAt: new Date() }]);
    
    setConversations(prev => {
        const others = prev.filter(c => c.conversationId !== selectedUser.conversationId);
        const updatedUser = { 
            ...selectedUser, 
            lastMessage: "Bạn: " + inputMsg, 
            updatedAt: new Date(),
            unread: 0 
        };
        return [updatedUser, ...others];
    });
    setInputMsg("");
  };

  const filteredConversations = processedConversations.filter(c => 
      c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-100 p-4 gap-4 font-sans text-gray-800">
      
      {/* CỘT TRÁI */}
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
                          {u.isOnline && (
                             <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full ring-2 ring-white"></span>
                          )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                             <h4 className={`font-bold text-sm truncate ${u.unread > 0 ? "text-gray-900" : "text-gray-700"}`}>
                                {u.username}
                             </h4>
                             {u.updatedAt && (
                                 <span className="text-[10px] text-gray-400">
                                     {new Date(u.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                 </span>
                             )}
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

      {/* CỘT PHẢI */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
         {/* 🔥 SỬ DỤNG activeUser THAY VÌ selectedUser ĐỂ HIỂN THỊ */}
         {activeUser ? (
            <>
               <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {activeUser.username.charAt(0).toUpperCase()}
                     </div>
                     <div>
                        {/* 👇 Tên ở đây sẽ tự cập nhật khi sidebar cập nhật */}
                        <h3 className="font-bold text-gray-800 text-base">{activeUser.username}</h3>
                        <span className={`text-xs flex items-center gap-1 font-medium ${activeUser.isOnline ? "text-green-600" : "text-gray-400"}`}>
                           ● {activeUser.isOnline ? "Đang hoạt động" : "Offline"}
                        </span>
                     </div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                      ID: {activeUser.conversationId.slice(0, 8)}...
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {messages.map((msg, idx) => {
                     const isMe = msg.sender === "admin";
                     return (
                        <div key={idx} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                           <div className={`flex max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${isMe ? "bg-blue-600" : "bg-gray-400"}`}>
                                 {isMe ? "AD" : activeUser.username.charAt(0).toUpperCase()}
                              </div>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words relative
                                 ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"}`}>
                                 <p>{msg.text || msg.message}</p>
                                 <p className={`text-[9px] mt-1 opacity-60 text-right ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                                     {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : msg.time}
                                 </p>
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