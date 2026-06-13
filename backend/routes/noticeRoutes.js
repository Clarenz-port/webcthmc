const express = require("express");
const router = express.Router();
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const {
  createNotice,
  getAllNotices,
  getMyNotices,
  deleteNotice,
  updateNotice,
} = require("../controllers/noticeController");

// Members — returns only their own + broadcast notices
router.get("/my", verifyToken, getMyNotices);

// Admin / Superadmin — returns all notices
router.get("/", verifyToken, getAllNotices);

// Admin / Superadmin
router.post("/", verifyToken, allowRoles("admin", "superadmin"), createNotice);
router.put("/:id", verifyToken, allowRoles("admin", "superadmin"), updateNotice);
router.delete("/:id", verifyToken, allowRoles("admin", "superadmin"), deleteNotice);

module.exports = router;
