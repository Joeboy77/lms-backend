const pool = require("../config/db");

const createAssignmentTables = async () => {
  const assignmentsTable = `
    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_url TEXT NOT NULL,
      due_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const submissionsTable = `
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      student_id INT REFERENCES users(id) ON DELETE CASCADE,
      assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
      file_url TEXT NOT NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(assignmentsTable);
  await pool.query(submissionsTable);
  console.log("Assignment tables created");
};

module.exports = { createAssignmentTables };
