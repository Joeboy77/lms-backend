const express = require("express");
const { createQuiz } = require("../controllers/quizController");
const { uploadAssignment } = require("../controllers/assignmentController");
const { assignmentUpload } = require("../middlewares/uploadMiddleware");
const { authenticateToken, isAdmin } = require("../middlewares/authmiddleware");
const { getAllStudents, getStudentDetails, getSystemStats } = require("../controllers/studentController");

const router = express.Router();

// Protected Admin Routes
router.post("/create-quiz", authenticateToken, isAdmin, createQuiz);
router.post("/upload-assignment", authenticateToken, isAdmin, assignmentUpload.single("file"), uploadAssignment);
router.get("/students", authenticateToken, isAdmin, getAllStudents);
router.get("/students/:id", authenticateToken, isAdmin, getStudentDetails);
router.get("/system-stats", authenticateToken, isAdmin, getSystemStats);

module.exports = router;
