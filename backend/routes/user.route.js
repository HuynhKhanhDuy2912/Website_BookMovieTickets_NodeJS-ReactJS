const express = require("express");
const router = express.Router();
// Import Controller quản lý User
const userController = require("../controllers/user.controller");
// Import Middleware bảo vệ
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
router.put("/change-password", verifyToken, userController.changePassword);
router.put("/update-profile", verifyToken, userController.updateProfile);
// --- CÁNH CỔNG BẢO VỆ ---
// Dòng này có nghĩa là: "Từ dòng này trở xuống, tất cả các route đều phải có Token và phải là Admin"
router.use(verifyToken, authorizeRoles("admin")); 

// --- CÁC ROUTE ĐÃ ĐƯỢC BẢO VỆ ---
router.get("/", userController.getAllUsers);      // GET /api/users
router.post("/", userController.createUser);      // POST /api/users (Tạo user mới bởi admin)
router.put("/:id", userController.updateUser);    // PUT /api/users/:id
router.delete("/:id", userController.deleteUser); // DELETE /api/users/:id
router.put("/block/:id", verifyToken, authorizeRoles("admin"), userController.toggleBlockUser);

module.exports = router;