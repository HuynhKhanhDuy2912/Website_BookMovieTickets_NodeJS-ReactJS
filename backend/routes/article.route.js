const express = require("express");
const router = express.Router();
const articleController = require("../controllers/article.controller");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/", articleController.getAllArticles);
router.get("/:id", articleController.getArticleById);
router.post("/", verifyToken, authorizeRoles("staff", "admin"), articleController.createArticle);
router.put("/:id", verifyToken, authorizeRoles("staff", "admin"), articleController.updateArticle);
router.delete("/:id", verifyToken, authorizeRoles("admin"), articleController.deleteArticle);

module.exports = router;
