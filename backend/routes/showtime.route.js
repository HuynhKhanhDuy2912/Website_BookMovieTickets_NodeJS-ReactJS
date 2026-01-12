const express = require("express");
const router = express.Router();
const showtimeController = require("../controllers/showtime.controller");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", showtimeController.getAllShowtimes);
router.get("/:id", showtimeController.getShowtimeById);
router.post("/", verifyToken, authorizeRoles("staff", "admin"), showtimeController.createShowtime);
router.put("/:id", verifyToken, authorizeRoles("staff", "admin"), showtimeController.updateShowtime);
router.delete("/:id", verifyToken, authorizeRoles("admin"), showtimeController.deleteShowtime);
router.get("/cinema/:cinemaId", showtimeController.getShowtimesByCinema);

module.exports = router;
