// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const { addAdmin, getAdmins, getMembers, updateAdmin, deleteAdmin, approveMember, rejectMember, getPendingMembers } = require("../controllers/adminController");

// ✅ Only superadmin can add admin
router.post("/add", verifyToken, allowRoles("superadmin"), addAdmin);

// ✅ Both admin and superadmin can view admins
router.get("/list", verifyToken, allowRoles("admin", "superadmin"), getAdmins);

// ✅ Both admin and superadmin can view members
router.get("/members", verifyToken, allowRoles("admin", "superadmin"), getMembers);

// ✅ Pending members
router.get("/pending-members", verifyToken, allowRoles("admin", "superadmin"), getPendingMembers);

// ✅ Approve/reject members
router.put("/approve/:id", verifyToken, allowRoles("admin", "superadmin"), approveMember);
router.delete("/reject/:id", verifyToken, allowRoles("admin", "superadmin"), rejectMember);

router.put("/:id", verifyToken, allowRoles("superadmin"), updateAdmin);

// delete
router.delete("/:id", verifyToken, allowRoles("superadmin"), deleteAdmin);

module.exports = router;
