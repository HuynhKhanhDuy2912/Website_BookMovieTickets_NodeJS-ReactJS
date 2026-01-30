const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // conversationId: Dùng để gom nhóm tin nhắn của 1 người dùng
    // (Với user chưa login thì dùng socketId hoặc mã ngẫu nhiên, với user login rồi thì dùng UserID)
    conversationId: { 
        type: String, 
        required: true 
    }, 
    
    // sender: Ai là người gửi tin này?
    sender: { 
        type: String, 
        enum: ["client", "admin"], 
        required: true 
    }, 
    senderName: { type: String, default: "Khách hàng" },
    // text: Nội dung tin nhắn
    text: { 
        type: String, 
        required: true 
    },
    
    // isRead: Đánh dấu Admin đã xem tin này chưa
    isRead: { 
        type: Boolean, 
        default: false 
    },
  },
  { timestamps: true } // Tự động tạo createdAt, updatedAt
);

module.exports = mongoose.model("Message", messageSchema);