const pool = require("../config/db");

const createQuizTables = async () => {
  try {
    // First drop the existing quiz_results table if it exists
    await pool.query(`
      DROP TABLE IF EXISTS quiz_results CASCADE;
    `);

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
    console.log("Quiz tables created successfully");
  } catch (error) {
    console.error("Error creating quiz tables:", error);
    throw error;
  }
};

const addForcedSubmissionColumn = async () => {
  try {
    await pool.query(`
      ALTER TABLE quiz_results 
      ADD COLUMN IF NOT EXISTS forced_submission BOOLEAN DEFAULT false;
    `);
    console.log("Added forced_submission column to quiz_results table");
  } catch (error) {
    console.error("Error adding forced_submission column:", error);
    throw error;
  }
};

module.exports = {
  createQuizTables,
  addForcedSubmissionColumn
};
