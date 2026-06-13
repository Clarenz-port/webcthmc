const express = require("express");
const router = express.Router();
const { generateReport, generatePreview } = require("../controllers/reportsController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

router.post("/generate", verifyToken, allowRoles("admin", "superadmin"), generateReport);
router.post("/preview", verifyToken, allowRoles("admin", "superadmin"), generatePreview);

module.exports = router;
