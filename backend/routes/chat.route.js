const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// 1. Lấy danh sách những người đã nhắn tin (Inbox List)
router.get("/conversations", async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      // A. Sắp xếp tin mới nhất lên đầu
      { $sort: { createdAt: -1 } }, 
      
      // B. Gom nhóm theo conversationId (Mỗi người là 1 nhóm)
      {
        $group: {
          _id: "$conversationId", 
          lastMessage: { $first: "$text" }, // Lấy nội dung tin mới nhất
          lastTime: { $first: "$createdAt" }, // Lấy thời gian mới nhất
          senderName: { $first: "$senderName" },
          // Đếm số tin nhắn client gửi mà chưa đọc (isRead: false)
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$sender", "client"] }, { $eq: ["$isRead", false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      
      // C. Sắp xếp danh sách theo thời gian tin nhắn cuối cùng
      { $sort: { lastTime: -1 } }
    ]);

    res.json(conversations);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. Lấy chi tiết tin nhắn của 1 người
router.get("/history/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
                                  .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. Đánh dấu đã đọc (Khi Admin bấm vào xem)
router.put("/read/:conversationId", async (req, res) => {
  try {
    await Message.updateMany(
      { conversationId: req.params.conversationId, sender: "client" },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;