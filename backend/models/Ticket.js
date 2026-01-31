const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    // 1. Cho phép User là null (để bán cho khách vãng lai)
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        default: null 
    },

    // 2. Thêm tên khách vãng lai
    guestName: { type: String, default: "Khách vãng lai" },

    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
    
    // (Optional) Có thể bỏ trường movie nếu populate từ showtime, nhưng giữ lại cũng tốt
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" }, 
    
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, 

    // 👇👇👇 QUAN TRỌNG: SỬA THÀNH MẢNG ĐỂ LƯU NHIỀU GHẾ 👇👇👇
    // Thay vì seatNumber (String) -> Dùng seats (Array String)
    seats: [{ type: String, required: true }], // Ví dụ: ["A1", "A2"]

    // Giá tiền tổng cho vé này (hoặc nhóm ghế này)
    totalPrice: { type: Number, required: true }, 

    // Trạng thái thanh toán (Quan trọng cho POS)
    paymentStatus: { 
        type: String, 
        enum: ["paid", "unpaid"], 
        default: "unpaid" 
    },

    status: { 
        type: String, 
        enum: ["booked", "sold", "active", "cancelled", "success"], 
        default: "booked" 
    },

    // Đánh dấu vé này được tạo thủ công tại quầy (POS) hay mua online
    isManual: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);