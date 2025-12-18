const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticket.controller");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/", verifyToken, authorizeRoles("user"), ticketController.createTicket);
router.get("/my-tickets", verifyToken, authorizeRoles("user", "staff", "admin"), ticketController.getMyTickets);
router.get("/", verifyToken, authorizeRoles("staff", "admin"), ticketController.getAllTickets);
router.delete("/:id", verifyToken, authorizeRoles("admin"), ticketController.deleteTicket);
router.put("/:id", verifyToken, authorizeRoles("staff", "admin"), ticketController.updateTicket);
router.get("/showtime/:showtimeId", ticketController.getTicketsByShowtime);
module.exports = router;
