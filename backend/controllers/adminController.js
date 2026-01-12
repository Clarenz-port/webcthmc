// controllers/adminController.js
const bcrypt = require("bcryptjs");
const User = require("../models/users");
const { logActivity } = require("../utils/activityLogger");

// ✅ Add new admin (superadmin only)
exports.addAdmin = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      username,
      phoneNumber,
      password,
    } = req.body;

    // ✅ Check required fields (email removed)
    if (
      !firstName ||
      !middleName ||
      !lastName ||
      !username ||
      !phoneNumber ||
      !password
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check for existing username only
    const existingUser = await User.findOne({
      where: { username },
    });
    if (existingUser)
      return res.status(400).json({ message: "Username already exists" });

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Always set role to admin
    const newAdmin = await User.create({
      firstName,
      middleName,
      lastName,
      username,
      phoneNumber,
      password: hashedPassword,
      role: "admin",
    });
  await logActivity({
  userId: req.user?.id,
  role: req.user?.role,
  action: "Created Admin",
  details: { adminId: newAdmin.id, username: newAdmin.username },
  ip: req.ip,
});
    res
      .status(201)
      .json({ message: "Admin created successfully", admin: newAdmin });
  } catch (error) {
    console.error("❌ Error adding admin:", error);
    res.status(500).json({ message: "Error adding admin" });
  }
};

// ✅ Get all admins
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({ where: { role: "admin" } });
    res.json(admins);
  } catch (error) {
    console.error("❌ Error fetching admins:", error);
    res.status(500).json({ message: "Error fetching admins" });
  }
};

// ✅ Get all members
exports.getMembers = async (req, res) => {
  try {
    const members = await User.findAll({ where: { role: "member" } });
    res.json(members);
  } catch (error) {
    console.error("❌ Error fetching members:", error);
    res.status(500).json({ message: "Error fetching members" });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const id = req.params.id; // expects PUT /api/admin/:id
    const { firstName, middleName, lastName, username, phoneNumber, password } = req.body;

    // find existing user
    const admin = await User.findOne({ where: { id } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // optional: disallow changing role here (or enforce role='admin')
    // optional: check username uniqueness if changed
    if (username && username !== admin.username) {
      const conflict = await User.findOne({ where: { username } });
      if (conflict) return res.status(400).json({ message: "Username already exists" });
    }

    // prepare update payload
    const updatePayload = {
      firstName: firstName ?? admin.firstName,
      middleName: middleName ?? admin.middleName,
      lastName: lastName ?? admin.lastName,
      username: username ?? admin.username,
      phoneNumber: phoneNumber ?? admin.phoneNumber,
      // keep role as admin
      role: admin.role ?? "admin",
    };

    // hash password only if provided (do not overwrite with empty string)
    if (password && password.trim() !== "") {
      updatePayload.password = await bcrypt.hash(password, 10);
    }

    // perform update
    await User.update(updatePayload, { where: { id } });

    // fetch updated admin (omit password before returning)
    const updated = await User.findOne({ where: { id } });
    const updatedSafe = updated.toJSON ? updated.toJSON() : { ...updated };
    delete updatedSafe.password;

    await logActivity({
  userId: req.user?.id,
  role: req.user?.role,
  action: "Updated Admin",
  details: { adminId: updatedSafe.id, changes: updatePayload },
  ip: req.ip,
});

    res.json({ message: "Admin updated successfully", admin: updatedSafe });
  } catch (error) {
    console.error("❌ Error updating admin:", error);
    res.status(500).json({ message: "Error updating admin" });
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const id = req.params.id; // expects DELETE /api/admin/:id

    const admin = await User.findOne({ where: { id } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // optional: prevent deleting the last super-admin or the currently logged-in user
    // if (req.user && req.user.id === admin.id) return res.status(400).json({ message: "Cannot delete yourself" });

    await User.destroy({ where: { id } });

    await logActivity({
  userId: req.user?.id,
  role: req.user?.role,
  action: "Deleted Admin",
  details: { adminId: id, username: admin.username },
  ip: req.ip,
});

    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting admin:", error);
    res.status(500).json({ message: "Error deleting admin" });
  }
};
