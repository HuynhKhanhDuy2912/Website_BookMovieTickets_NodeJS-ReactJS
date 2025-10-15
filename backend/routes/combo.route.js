const express = require("express");
const router = express.Router();
const comboController = require("../controllers/combo.controller");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", comboController.getAllCombos);
router.get("/:id", comboController.getComboById);
router.post("/", verifyToken, authorizeRoles("staff", "admin"), comboController.createCombo);
router.put("/:id", verifyToken, authorizeRoles("staff", "admin"), comboController.updateCombo);
router.delete("/:id", verifyToken, authorizeRoles("admin"), comboController.deleteCombo);

module.exports = router;
