const pool = require("../config/db");
const { sendEmail } = require("../utils/emailService");

const createQuiz = async (req, res) => {
    const { title, duration, due_date, questions } = req.body;
  
    try {
      // Validate input
      if (!title || !duration || !due_date || !questions || questions.length === 0) {
        return res.status(400).json({ message: "All fields are required and at least one question is needed." });
      }

      // Insert quiz
      const quizResult = await pool.query(
        "INSERT INTO quizzes (title, duration_minutes, due_date) VALUES ($1, $2, $3) RETURNING id",
        [title, duration, due_date]
      );
  
      const quizId = quizResult.rows[0].id;
  
      // Insert questions
      for (const question of questions) {
        const { text, type, options, correct_answers } = question;
        
        await pool.query(
          "INSERT INTO questions (quiz_id, question_text, question_type, options, correct_answers) VALUES ($1, $2, $3, $4, $5)",
          [
            quizId,
            text,
            type,
            JSON.stringify(options || []),  // Ensure options are stored as JSON
            JSON.stringify(correct_answers || []) // Ensure correct answers are stored as JSON
          ]
        );
      }
  
      // Send email notification to all students
      const studentsResult = await pool.query(
        "SELECT email, first_name FROM users WHERE role = 'student'"
      );

      for (const student of studentsResult.rows) {
        await sendEmail(
          student.email,
          "New Quiz Available",
          `Dear ${student.first_name},

A new quiz "${title}" has been posted to the Learning Management System.

Quiz Details:
- Title: ${title}  
- Duration: ${duration} minutes
- Due Date: ${new Date(due_date).toLocaleString()}

Please log in to attempt the quiz before the due date.

Best regards,
LMS Team`
        );
      }

      return res.status(201).json({ message: "Quiz created successfully", quizId });
    } catch (error) {
      console.error("Error creating quiz:", error);
      return res.status(500).json({ message: "Failed to create quiz", error: error.message });
    }
};

module.exports = { createQuiz };
