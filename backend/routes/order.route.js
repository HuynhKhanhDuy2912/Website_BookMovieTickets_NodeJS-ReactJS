const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/", verifyToken, authorizeRoles("user", "admin"), orderController.createOrder);
router.get("/my-orders", verifyToken, authorizeRoles("user", "staff", "admin"), orderController.getMyOrders);
router.get("/", verifyToken, authorizeRoles("staff", "admin"), orderController.getAllOrders);
router.put("/:id", verifyToken, authorizeRoles("staff", "admin"), orderController.updateOrder);
router.delete("/:id", verifyToken, authorizeRoles("admin"), orderController.deleteOrder);

module.exports = router;
