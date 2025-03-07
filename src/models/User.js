const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      profile_picture TEXT,
      username VARCHAR(8) UNIQUE NOT NULL,
      pin VARCHAR(255) NOT NULL,
      role VARCHAR(10) DEFAULT 'student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
  console.log("User table created");

  await createAdminAccount();
};

const createAdminAccount = async () => {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPin = process.env.ADMIN_PIN;

  const hashedPin = await bcrypt.hash(adminPin, 10);

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [adminUsername]);

    if (result.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (email, phone, first_name, last_name, pin, profile_picture, username, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          "joseph.ecktech@gmail.com",
          "0000000000",
          "Admin",
          "User",
          hashedPin,
          null,
          adminUsername,
          "admin"
        ]
      );
      console.log("Admin account created successfully.");
    }
  } catch (error) {
    console.error("Error creating admin account:", error.message);
  }
};

module.exports = { createUserTable };
