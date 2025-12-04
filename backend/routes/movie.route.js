const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movie.controller");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Xem phim (ai cũng được)
router.get("/", movieController.getAllMovies);
router.get("/:id", movieController.getMovieById);

// Quản lý phim (admin)
router.post("/", verifyToken, authorizeRoles("admin"), movieController.createMovie);
router.put("/:id", verifyToken, authorizeRoles("admin"), movieController.updateMovie);
router.delete("/:id", verifyToken, authorizeRoles("admin"), movieController.deleteMovie);

module.exports = router;
