const express = require("express");
const router = express.Router();
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const { getAllMembers, getMemberProfile, getMember, updateMember, uploadMemberAvatar } = require("../controllers/memberController");
const { deleteMemberAvatar } = require("../controllers/memberController");

// get profile
router.get("/profile", verifyToken, getMemberProfile);

router.get("/:id", verifyToken, getMember);

// upload avatar (authenticated)
router.post("/:id/avatar", verifyToken, uploadMemberAvatar);

// delete avatar (authenticated)
router.delete("/:id/avatar", verifyToken, deleteMemberAvatar);

// update member
router.put("/:id", verifyToken, updateMember);

module.exports = router;
