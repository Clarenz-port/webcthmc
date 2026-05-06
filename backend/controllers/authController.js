// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ success: false, message: "Phone and OTP required" });
  try {
    const user = await User.findOne({ where: { phoneNumber: phone } });
    if (!user) return res.status(404).json({ success: false, message: "No account with that phone number." });
    if (!user.resetCode || !user.resetCodeExpires) return res.status(400).json({ success: false, message: "No reset code found. Please request again." });
    if (user.resetCode !== otp) return res.status(400).json({ success: false, message: "Invalid OTP." });
    if (user.resetCodeExpires < Date.now()) return res.status(400).json({ success: false, message: "OTP expired. Please request again." });
    // Optionally clear code after verification
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();
    res.json({ success: true, message: "OTP verified." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
};

// RESET PASSWORD/USERNAME
exports.resetPassword = async (req, res) => {
  const { phone, otp, newPassword, newUsername } = req.body;
  if (!phone || !otp || !newPassword) return res.status(400).json({ success: false, message: "Phone, OTP, and new password required" });
  try {
    const user = await User.findOne({ where: { phoneNumber: phone } });
    if (!user) return res.status(404).json({ success: false, message: "No account with that phone number." });
    // For security, check OTP again (in case user skipped verify step)
    if (!user.resetCode || !user.resetCodeExpires) return res.status(400).json({ success: false, message: "No reset code found. Please request again." });
    if (user.resetCode !== otp) return res.status(400).json({ success: false, message: "Invalid OTP." });
    if (user.resetCodeExpires < Date.now()) return res.status(400).json({ success: false, message: "OTP expired. Please request again." });
    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    // Optionally update username
    if (newUsername && newUsername !== user.username) {
      // Check if username exists
      const exists = await User.findOne({ where: { username: newUsername } });
      if (exists) return res.status(400).json({ success: false, message: "Username already taken." });
      user.username = newUsername;
    }
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();
    res.json({ success: true, message: "Password/Username updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to reset password/username." });
  }
};
const crypto = require("crypto");
const { sendSMS } = require("../utils/sms");
// FORGOT PASSWORD (phone-based)
exports.forgotPassword = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: "Phone number is required" });

  try {
    // Find user by phone number
    const user = await User.findOne({ where: { phoneNumber: phone } });
    if (!user) return res.status(404).json({ success: false, message: "No account with that phone number." });

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Save code and expiry to user (in-memory for demo, or add to DB in production)
    user.resetCode = code;
    user.resetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 min expiry
    await user.save();

    // Send SMS
    const smsMsg = `Your CTHMC password reset code is: ${code}`;
    await sendSMS([phone], smsMsg);

    res.json({ success: true, message: "Reset code sent to your phone." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send reset code." });
  }
};
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");

// REGISTER
// REGISTER
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      address,
      phoneNumber,
      username,
      password,
      confirmPassword,
      email,          // ⭐ ADDED
      birthdate,      // ⭐ ADDED
      role,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !username || !password || !confirmPassword || !email || !birthdate) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check for existing username
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return res.status(400).json({ message: "Username already exists" });

    // ⭐ Check for existing email
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      middleName,
      lastName,
      address,
      phoneNumber,
      username,
      email,          // ⭐ ADDED
      birthdate,      // ⭐ ADDED
      password: hashedPassword,
      role: role || "member",
      status: "pending",
    });

    res.status(201).json({
      message: "User registered successfully",
        user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        email: newUser.email,         // ⭐ ADDED
        birthdate: newUser.birthdate, // ⭐ ADDED
        address: newUser.address,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};


// LOGIN
// LOGIN
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status !== 'approved') return res.status(403).json({ message: "Account not approved yet" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        username: user.username,
        email: user.email,        // ⭐ ADDED
        birthdate: user.birthdate,// ⭐ ADDED
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};


