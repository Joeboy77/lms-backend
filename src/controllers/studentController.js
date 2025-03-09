const pool = require("../config/db");

/**
 * Fetch Student Dashboard Data
 */
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student info
    const studentInfo = await pool.query(
      "SELECT first_name as name FROM users WHERE id = $1",
      [studentId]
    );

    // Get average score
    const avgScore = await pool.query(
      "SELECT ROUND(AVG(score), 2) as average FROM quiz_results WHERE student_id = $1",
      [studentId]
    );

    // Get upcoming quizzes count
    const upcomingQuizzes = await pool.query(
      "SELECT COUNT(*) FROM quizzes WHERE due_date > NOW()",
      []
    );

    // Get completed quizzes count
    const completedQuizzes = await pool.query(
      "SELECT COUNT(*) FROM quiz_results WHERE student_id = $1",
      [studentId]
    );

    // Get recent results
    const recentResults = await pool.query(
      `SELECT qr.score, qr.submitted_at, q.title 
       FROM quiz_results qr 
       JOIN quizzes q ON qr.quiz_id = q.id 
       WHERE student_id = $1 
       ORDER BY submitted_at DESC 
       LIMIT 5`,
      [studentId]
    );

    res.json({
      student: studentInfo.rows[0],
      averageScore: avgScore.rows[0].average || 0,
      upcomingQuizzes: upcomingQuizzes.rows[0].count,
      completedQuizzes: completedQuizzes.rows[0].count,
      recentResults: recentResults.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};

/**
 * Fetch Available Quizzes
 */
const getAvailableQuizzes = async (req, res) => {
  try {
    const currentTime = new Date();

    // Fetch quizzes
    const quizzes = await pool.query(
      "SELECT id, title, due_date, duration_minutes FROM quizzes ORDER BY due_date ASC"
    );

    const available = quizzes.rows.filter(quiz => new Date(quiz.due_date) > currentTime);
    const past = quizzes.rows.filter(quiz => new Date(quiz.due_date) <= currentTime);

    res.status(200).json({ available, past });

  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ message: "Error fetching quizzes" });
  }
};

/**
 * Fetch Quiz Results
 */
const getQuizResults = async (req, res) => {
  try {
    const results = await pool.query(
      "SELECT quiz_id, score FROM quiz_results WHERE student_id = $1",
      [req.user.id]
    );
    res.status(200).json(results.rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quiz results" });
  }
};

/**
 * Fetch a Quiz by ID with Questions
 */
const getQuizById = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch quiz details
        const quizResult = await pool.query(
            "SELECT id, title, duration_minutes, due_date FROM quizzes WHERE id = $1",
            [id]
        );

        if (quizResult.rows.length === 0) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        const quiz = quizResult.rows[0];

        // Fetch questions for the quiz
        const questionsResult = await pool.query(
            "SELECT id, question_text, question_type, options, correct_answers FROM questions WHERE quiz_id = $1",
            [id]
        );

        if (questionsResult.rows.length === 0) {
            return res.status(404).json({ message: "No questions found for this quiz." });
        }

        // Properly parse options and correct_answers
        quiz.questions = questionsResult.rows.map((q) => {
            let options = [];
            let correct_answers = [];

            try {
                // Ensure options are parsed properly
                options = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
            } catch (err) {
                console.error("Invalid JSON format for options:", q.options);
                options = q.options ? q.options.split(",") : [];
            }

            try {
                // Ensure correct answers are parsed properly
                correct_answers = typeof q.correct_answers === "string" ? JSON.parse(q.correct_answers) : q.correct_answers;
            } catch (err) {
                console.error("Invalid JSON format for correct_answers:", q.correct_answers);
                correct_answers = q.correct_answers ? q.correct_answers.split(",") : [];
            }

            return {
                id: q.id,
                text: q.question_text,
                type: q.question_type,
                options,
                correct_answers,
            };
        });

        return res.status(200).json(quiz);
    } catch (error) {
        console.error("Error fetching quiz:", error);
        return res.status(500).json({ message: "Error fetching quiz", error: error.message });
    }
};


  
  

/**
 * Fetch Assignments
 */
const getAssignments = async (req, res) => {
  try {
    const assignments = await pool.query(
      "SELECT id, title, due_date, file_url FROM assignments ORDER BY due_date ASC"
    );
    res.status(200).json(assignments.rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assignments" });
  }
};

/**
 * Submit Assignment
 */
const submitAssignment = async (req, res) => {
  try {
    const { assignment_id, file_url } = req.body;

    if (!assignment_id || !file_url) {
      return res.status(400).json({ message: "Assignment ID and file are required" });
    }

    await pool.query(
      "INSERT INTO submissions (student_id, assignment_id, file_url) VALUES ($1, $2, $3)",
      [req.user.id, assignment_id, file_url]
    );

    res.status(201).json({ message: "Assignment submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error submitting assignment" });
  }
};

/**
 * Create Tables for Quizzes
 */
const createQuizTables = async () => {
  const quizzesTable = `
    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date TIMESTAMP NOT NULL,
      duration_minutes INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const questionsTable = `
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      question_type VARCHAR(20) CHECK (question_type IN ('mcq', 'fill_in')),
      options JSONB,  
      correct_answers JSONB, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(quizzesTable);
  await pool.query(questionsTable);
  console.log("Quiz tables created");
};

/**
 * Submit Quiz
 */
const submitQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body;
        const studentId = req.user.id;

        // Fetch quiz questions with correct answers
        const questionsResult = await pool.query(
            "SELECT id, question_type, correct_answers FROM questions WHERE quiz_id = $1",
            [id]
        );

        let correctAnswers = 0;
        const totalQuestions = questionsResult.rows.length;
        
        questionsResult.rows.forEach(question => {
            const studentAnswer = answers[question.id];
            let correctAnswer;
            
            try {
                correctAnswer = typeof question.correct_answers === 'string' 
                    ? JSON.parse(question.correct_answers) 
                    : question.correct_answers;
            } catch (err) {
                console.error("Error parsing correct answers:", err);
                correctAnswer = question.correct_answers;
            }

            if (Array.isArray(correctAnswer) && 
                studentAnswer && 
                correctAnswer.some(ans => ans.toLowerCase().trim() === studentAnswer.toLowerCase().trim())) {
                correctAnswers++;
            }
        });

        const score = (correctAnswers / totalQuestions) * 100;

        // Save quiz result with correct schema
        await pool.query(
            "INSERT INTO quiz_results (student_id, quiz_id, score) VALUES ($1, $2, $3)",
            [studentId, id, score]
        );

        res.status(200).json({ 
            message: "Quiz submitted successfully", 
            score,
            correctAnswers,
            totalQuestions
        });
    } catch (error) {
        console.error("Error submitting quiz:", error);
        res.status(500).json({ message: "Error submitting quiz" });
    }
};

const getQuizResult = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;

        const result = await pool.query(
            "SELECT * FROM quiz_results WHERE quiz_id = $1 AND student_id = $2",
            [id, studentId]
        );

        res.json({
            hasCompleted: result.rows.length > 0,
            result: result.rows[0] || null
        });
    } catch (error) {
        console.error("Error checking quiz result:", error);
        res.status(500).json({ message: "Error checking quiz result" });
    }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.username,
        COUNT(DISTINCT qr.quiz_id) as quizzes_taken,
        ROUND(AVG(qr.score), 2) as average_score
      FROM users u
      LEFT JOIN quiz_results qr ON u.id = qr.student_id
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY u.first_name
    `);

    res.json(students.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
};

const getStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get student info
    const studentInfo = await pool.query(`
      SELECT first_name, last_name, email, username, created_at
      FROM users 
      WHERE id = $1 AND role = 'student'
    `, [id]);

    if (studentInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get quiz results
    const quizResults = await pool.query(`
      SELECT 
        q.title,
        qr.score,
        qr.submitted_at
      FROM quiz_results qr
      JOIN quizzes q ON qr.quiz_id = q.id
      WHERE qr.student_id = $1
      ORDER BY qr.submitted_at DESC
    `, [id]);

    res.json({
      student: studentInfo.rows[0],
      quizResults: quizResults.rows
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ message: 'Error fetching student details' });
  }
};

const getSystemStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM quizzes) as total_quizzes,
        (SELECT COUNT(*) FROM quiz_results) as total_submissions,
        (SELECT ROUND(AVG(score), 2) FROM quiz_results) as average_score
    `);

    const monthlyStats = await pool.query(`
      SELECT 
        DATE_TRUNC('month', submitted_at) as month,
        COUNT(*) as submissions,
        ROUND(AVG(score), 2) as average_score
      FROM quiz_results
      GROUP BY DATE_TRUNC('month', submitted_at)
      ORDER BY month DESC
      LIMIT 6
    `);

    res.json({
      overview: stats.rows[0],
      monthlyStats: monthlyStats.rows
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ message: 'Error fetching system stats' });
  }
};

const getProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const result = await pool.query(
      'SELECT first_name, last_name, email, username, profile_picture FROM students WHERE id = $1',
      [studentId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { first_name, last_name, email } = req.body;
    
    await pool.query(
      'UPDATE students SET first_name = $1, last_name = $2, email = $3 WHERE id = $4',
      [first_name, last_name, email, studentId]
    );
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get the Cloudinary URL from the uploaded file
    const profile_picture = req.file.path;

    const result = await pool.query(
      'UPDATE students SET profile_picture = $1 WHERE id = $2 RETURNING profile_picture',
      [profile_picture, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ 
      message: 'Profile picture updated successfully',
      profile_picture: result.rows[0].profile_picture 
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createQuizTables,
  getStudentDashboard,
  getAvailableQuizzes,
  getQuizResults,
  getAssignments,
  submitAssignment,
  getQuizById,
  submitQuiz,
  getQuizResult,
  getAllStudents,
  getStudentDetails,
  getSystemStats,
  getProfile,
  updateProfile,
  updateProfilePicture
};
