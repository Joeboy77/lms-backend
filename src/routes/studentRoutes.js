const express = require("express");
const {
  getStudentDashboard,
  getAvailableQuizzes,
  getQuizResults,
  getAssignments,
  submitAssignment,
  getQuizById,
  submitQuiz,
  getQuizResult,
  getProfile,
  updateProfile,
} = require("../controllers/studentController");

const { authenticateToken } = require('../middlewares/authmiddleware');

const router = express.Router();

// Routes for student dashboard
router.get("/dashboard", authenticateToken, getStudentDashboard);
router.get("/quizzes", authenticateToken, getAvailableQuizzes);
router.get("/quiz-results", authenticateToken, getQuizResults);
router.get("/assignments", authenticateToken, getAssignments);
router.post("/submit-assignment", authenticateToken, submitAssignment);
router.get("/quiz/:id", authenticateToken, getQuizById);
router.post("/submit-quiz/:id", authenticateToken, submitQuiz);
router.get("/quiz-result/:id", authenticateToken, getQuizResult);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
module.exports = router;
