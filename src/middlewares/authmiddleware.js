const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  console.log('Auth Header:', authHeader);

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  // Remove 'Bearer ' from token string
  const token = authHeader.replace('Bearer ', '');

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Verified Token:', verified);
    req.user = verified;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

const isAdmin = (req, res, next) => {
  console.log('User Role:', req.user?.role);
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
};

module.exports = { authenticateToken, isAdmin };
