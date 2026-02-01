const express = require("express");
const router = express.Router();
const { generateReport } = require("../controllers/reportsController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

router.post("/generate", verifyToken, allowRoles("admin", "superadmin"), generateReport);

module.exports = router;
