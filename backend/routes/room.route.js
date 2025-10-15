const express = require("express");
const router = express.Router();
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require("../controllers/room.controller");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", getAllRooms);
router.get("/:id", getRoomById);
router.post("/", verifyToken, authorizeRoles("admin"), createRoom);
router.put("/:id", verifyToken, authorizeRoles("admin"), updateRoom);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteRoom);

module.exports = router;
