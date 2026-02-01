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
      street,
      block,
      lot,
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
      street,
      block,
      lot,
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


