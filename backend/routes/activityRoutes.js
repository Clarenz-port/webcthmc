// backend/routes/activityRoutes.js
const router = require("express").Router();
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const { getLogs } = require("../controllers/activityController");

router.get("/", verifyToken, allowRoles("admin", "superadmin"), getLogs);

module.exports = router;