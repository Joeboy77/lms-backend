const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/emailService");

require("dotenv").config();

const generateUsername = () => {
  return Math.floor(10000000 + Math.random() * 80000000).toString();
};

const registerStudent = async (req, res) => {
  try {
    const { email, phone, first_name, last_name, pin } = req.body;
    const profile_picture = req.file ? req.file.path : null;

    if (!email || !phone || !first_name || !last_name || !pin) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if the email already exists
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email is already registered. Please use a different email." });
    }

    // Hash PIN before storing
    const hashedPin = await bcrypt.hash(pin, 10);
    const username = generateUsername();

    // Insert into DB
    const result = await pool.query(
      "INSERT INTO users (email, phone, first_name, last_name, pin, profile_picture, username) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [email, phone, first_name, last_name, hashedPin, profile_picture, username]
    );

    if (result.rowCount === 0) {
      return res.status(500).json({ message: "Failed to register student." });
    }

    // Send email notification
    await sendEmail(
      email,
      "Welcome to LMS - Your Login Credentials",
      `Dear ${first_name},\n\nWelcome to the Learning Management System!\n\nYour username is: ${username}\n\nUse this username and your PIN to log in.\n\nBest regards,\nLMS Team`
    );

    res.status(201).json({ message: "Student registered successfully", username });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Internal Server Error. Please try again." });
  }
};



const loginUser = async (req, res) => {
  const { username, pin } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const validPin = await bcrypt.compare(pin, user.pin);

    if (!validPin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        username: user.username 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );

    res.json({ 
      message: `Login successful as ${user.role}`, 
      token, 
      role: user.role 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerStudent, loginUser };
