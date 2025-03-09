const pool = require("../config/db");

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

  const quizResultsTable = `
    CREATE TABLE IF NOT EXISTS quiz_results (
      id SERIAL PRIMARY KEY,
      student_id INT REFERENCES users(id) ON DELETE CASCADE,
      quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
      score DECIMAL,
      correct_answers INTEGER,
      total_questions INTEGER,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      forced_submission BOOLEAN DEFAULT false
    );
  `;

  await pool.query(quizzesTable);
  await pool.query(questionsTable);
  await pool.query(quizResultsTable);
  console.log("Quiz tables created");
};

module.exports = { createQuizTables };
