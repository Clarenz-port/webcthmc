// controllers/memberController.js
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const User = require("../models/users");
const path = require("path");
const upload = require("../utils/upload");

// ✅ Get profile of logged-in member
exports.getMemberProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id },
      attributes: [
        "id",
        "firstName",
        "middleName",
        "lastName",
        "email",
        "birthdate",
        "address",
        "phoneNumber",
        "username",
        "avatarUrl",
        "createdAt",
      ],
    });

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

function safeUser(user) {
  if (!user) return null;
  const u = user.toJSON ? user.toJSON() : { ...user };
  if (u.password) delete u.password;
  return u;
}

/**
 * GET /api/members/:id
 * Return member object by id
 */
exports.getMember = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing member id" });

    const user = await User.findOne({ where: { id } });
    if (!user) return res.status(404).json({ message: "Member not found" });

    return res.json(safeUser(user));
  } catch (err) {
    console.error("Error in getMember:", err);
    return res.status(500).json({ message: "Failed to fetch member" });
  }
};

/**
 * PUT /api/members/:id
 * Update member fields. Accepts partial payload.
 * Expected body: { firstName, middleName, lastName, phoneNumber, email, birthdate, username, password }
 */
exports.updateMember = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing member id" });

    const {
  firstName,
  middleName,
  lastName,
  address,
  phoneNumber,
  email,
  birthdate,
  username,
  password,      // new password (optional)
  oldPassword,   // REQUIRED when changing password
} = req.body;

    const user = await User.findOne({ where: { id } });
    if (!user) return res.status(404).json({ message: "Member not found" });

    // If username changed ensure uniqueness
    if (username && username !== user.username) {
      const exists = await User.findOne({ where: { username, id: { [Op.ne]: id } } });
      if (exists) return res.status(400).json({ message: "Username already in use" });
    }

    // If email changed ensure uniqueness
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
      if (emailExists) return res.status(400).json({ message: "Email already in use" });
    }

    // sanitize / normalize birthdate if provided
    let normalizedBirthdate = user.birthdate;
    if (typeof birthdate !== "undefined" && birthdate !== null && birthdate !== "") {
      // Accept formats like 'YYYY-MM-DD' or ISO; try to create a Date
      const d = new Date(birthdate);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ message: "Invalid birthdate format" });
      }
      // store ISO date string or keep the original format your DB expects
      normalizedBirthdate = d.toISOString();
    } else if (birthdate === "") {
      // if explicitly empty string, set to null
      normalizedBirthdate = null;
    }

   const updatePayload = {
  firstName: typeof firstName !== "undefined" ? firstName : user.firstName,
  middleName: typeof middleName !== "undefined" ? middleName : user.middleName,
  lastName: typeof lastName !== "undefined" ? lastName : user.lastName,
  address: typeof address !== "undefined" ? address : user.address,
  phoneNumber: typeof phoneNumber !== "undefined" ? phoneNumber : user.phoneNumber,
  email: typeof email !== "undefined" ? email : user.email,
  birthdate: typeof birthdate !== "undefined" ? normalizedBirthdate : user.birthdate,
  username: typeof username !== "undefined" ? username : user.username,
  avatarUrl: typeof req.body.avatarUrl !== "undefined" ? req.body.avatarUrl : user.avatarUrl,  // ⭐ add here
  role: user.role,
};

// PASSWORD CHANGE: verify oldPassword before updating
if (typeof password !== "undefined" && password !== null && password !== "") {
  // require oldPassword to be present
  if (!oldPassword) {
    return res.status(400).json({ message: "To change password you must provide your current password (oldPassword)." });
  }

  // verify oldPassword
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    // 401 Unauthorized - current password does not match
    return res.status(401).json({ message: "Current password is incorrect." });
  }

  // optional: basic policy check for new password
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters long." });
  }

  // hash and include new password
  updatePayload.password = await bcrypt.hash(password, 10);
}

    await User.update(updatePayload, { where: { id } });

    const updated = await User.findOne({ where: { id } });
    return res.json({ message: "Member updated", member: safeUser(updated) });
  } catch (err) {
    console.error("Error in updateMember:", err);
    return res.status(500).json({ message: "Failed to update member" });
  }
};

exports.uploadMemberAvatar = [
  // multer middleware: single file under field 'avatar'
  upload.single("avatar"),
  async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ message: "Missing member id" });

      // ensure member exists
      const user = await User.findOne({ where: { id } });
      if (!user) return res.status(404).json({ message: "Member not found" });

      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      if (String(req.user.id) !== String(id) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Build public URL for the uploaded file
      const filename = req.file.filename;
      // host-aware URL (works in dev & production if you serve /uploads)
      const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${filename}`;

      // Save avatarUrl into the user record
      await User.update({ avatarUrl }, { where: { id } });

      const updated = await User.findOne({ where: { id } });

      return res.status(200).json({
        message: "Avatar uploaded",
        avatarUrl,
        member: safeUser(updated),
      });
    } catch (err) {
      console.error("Error in uploadMemberAvatar:", err);
      return res.status(500).json({ message: "Failed to upload avatar" });
    }
  },
];