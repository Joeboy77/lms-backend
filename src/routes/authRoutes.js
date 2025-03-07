const express = require("express");
const { registerStudent, loginUser } = require("../controllers/authController");
const { profilePicUpload } = require("../middlewares/uploadMiddleware");
const router = express.Router();

router.post("/register", profilePicUpload.single("profile_picture"), registerStudent);
router.post("/login", loginUser);

module.exports = router;
