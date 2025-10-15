const express = require("express");
const router = express.Router();
const cinemaController = require("../controllers/cinema.controller");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// Ai cũng xem được danh sách rạp
router.get("/", cinemaController.getAllCinemas);
router.get("/:id", cinemaController.getCinemaById);
// Quản lý rạp (admin)
router.post("/", verifyToken, authorizeRoles("admin"), cinemaController.createCinema);
router.put("/:id", verifyToken, authorizeRoles("admin"), cinemaController.updateCinema);
router.delete("/:id", verifyToken, authorizeRoles("admin"), cinemaController.deleteCinema);

module.exports = router;
