import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { Send, MessageSquare, User, UserCircle, Bell } from "lucide-react";

const socket = io.connect("http://localhost:5000");

export default function AdminChat() {
  const [onlineUsers, setOnlineUsers] = useState([]); // Danh sách user online (để check trạng thái xanh)
  const [activeConversations, setActiveConversations] = useState([]); // Danh sách user ĐÃ NHẮN TIN
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [allMessages, setAllMessages] = useState({}); 
  const [unreadCounts, setUnreadCounts] = useState({}); // { "socketID": 5 }

  const [inputMsg, setInputMsg] = useState("");
  const messagesEndRef = useRef(null);

  // --- 1. SETUP SOCKET ---
  useEffect(() => {
    socket.emit("register_admin");

    // A. Cập nhật danh sách Online (chỉ để biết ai đang sáng đèn)
    socket.on("update_user_list", (userList) => {
      setOnlineUsers(userList);
    });

    // B. NHẬN TIN NHẮN TỪ KHÁCH
    socket.on("receive_from_client", (data) => {
      const senderId = data.senderId;

      // 1. Lưu tin nhắn
      setAllMessages((prev) => ({
        ...prev,
        [senderId]: [...(prev[senderId] || []), { ...data, from: "client" }]
      }));

      // 2. Thêm vào danh sách cuộc trò chuyện (nếu chưa có)
      setActiveConversations((prev) => {
        const exists = prev.find(u => u.socketId === senderId);
        if (!exists) {
            // Tìm thông tin user trong list online để lấy tên (hoặc dùng tên gửi kèm data nếu backend có gửi)
            // Ở đây mình tạm lấy từ data hoặc tạo user tạm
            return [...prev, { socketId: senderId, username: "Khách hàng mới" }]; 
        }
        return prev;
      });

      // 3. Tăng số tin chưa đọc (NẾU KHÔNG PHẢI NGƯỜI ĐANG CHAT)
      if (selectedUser?.socketId !== senderId) {
          setUnreadCounts((prev) => ({
              ...prev,
              [senderId]: (prev[senderId] || 0) + 1
          }));
      }
    });

    return () => {
      socket.off("update_user_list");
      socket.off("receive_from_client");
    };
  }, [selectedUser]); // Dependency selectedUser để check logic unread

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, selectedUser]);

  // --- 2. HÀNH ĐỘNG CHỌN USER ---
  const handleSelectUser = (user) => {
      setSelectedUser(user);
      // Reset số tin chưa đọc về 0
      setUnreadCounts((prev) => ({ ...prev, [user.socketId]: 0 }));
  };

  // --- 3. GỬI TIN ---
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedUser) return;

    const msgData = {
      message: inputMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socket.emit("send_to_client", {
      toSocketId: selectedUser.socketId,
      ...msgData
    });

    setAllMessages((prev) => ({
      ...prev,
      [selectedUser.socketId]: [...(prev[selectedUser.socketId] || []), { ...msgData, from: "admin" }]
    }));

    setInputMsg("");
  };

  // Helper: Check user có online không
  const isUserOnline = (socketId) => onlineUsers.some(u => u.socketId === socketId);

  // Helper: Merge danh sách hiển thị
  // (Hiển thị tất cả user trong activeConversations + Cập nhật info từ onlineUsers nếu có)
  const displayList = activeConversations.map(conv => {
      const onlineInfo = onlineUsers.find(u => u.socketId === conv.socketId);
      return onlineInfo ? onlineInfo : conv; // Ưu tiên lấy info mới nhất (username) từ online list
  });

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-100 p-4 gap-4">
      
      {/* === CỘT TRÁI: DANH SÁCH CUỘC TRÒ CHUYỆN === */}
      <div className="w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
           <h3 className="font-bold text-gray-700 flex items-center gap-2">
             <MessageSquare className="text-blue-600" size={20}/> Tin Nhắn ({displayList.length})
           </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {displayList.length === 0 ? (
             <div className="text-center text-gray-400 mt-10">
                <Bell size={40} className="mx-auto mb-2 opacity-20"/>
                <p className="text-sm">Chưa có tin nhắn nào.</p>
             </div>
          ) : (
             displayList.map(u => {
                const unread = unreadCounts[u.socketId] || 0;
                const lastMsg = allMessages[u.socketId]?.slice(-1)[0]?.message || "Bắt đầu chat...";
                
                return (
                   <div 
                     key={u.socketId}
                     onClick={() => handleSelectUser(u)}
                     className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition flex items-center gap-3 relative ${
                        selectedUser?.socketId === u.socketId ? "bg-blue-100 border-l-4 border-l-blue-600" : ""
                     }`}
                   >
                      <div className="relative">
                         <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 text-lg">
                            {(u.username || "K").charAt(0).toUpperCase()}
                         </div>
                         {/* Chấm xanh Online */}
                         {isUserOnline(u.socketId) && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                         )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-1">
                            <h4 className={`font-bold text-sm truncate ${unread > 0 ? "text-black" : "text-gray-700"}`}>
                                {u.username || "Khách hàng"}
                            </h4>
                            {/* Thời gian tin cuối (Optional) */}
                            {/* <span className="text-[10px] text-gray-400">12:30</span> */}
                         </div>
                         <p className={`text-xs truncate ${unread > 0 ? "font-bold text-blue-600" : "text-gray-500"}`}>
                            {lastMsg}
                         </p>
                      </div>

                      {/* Badge số tin chưa đọc */}
                      {unread > 0 && (
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
                            {unread}
                         </div>
                      )}
                   </div>
                )
             })
          )}
        </div>
      </div>

      {/* === CỘT PHẢI: KHUNG CHAT (Giữ nguyên logic cũ) === */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
         {selectedUser ? (
            <>
               <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {(selectedUser.username || "K").charAt(0)}
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-800">{selectedUser.username || "Khách hàng"}</h3>
                        <span className={`text-xs flex items-center gap-1 ${isUserOnline(selectedUser.socketId) ? "text-green-600" : "text-gray-400"}`}>
                           ● {isUserOnline(selectedUser.socketId) ? "Đang hoạt động" : "Offline"}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {(allMessages[selectedUser.socketId] || []).map((msg, idx) => {
                     const isMe = msg.from === "admin";
                     return (
                        <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                           <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                              isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white border text-gray-800 rounded-bl-none"
                           }`}>
                              <p>{msg.message}</p>
                              <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>{msg.time}</p>
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