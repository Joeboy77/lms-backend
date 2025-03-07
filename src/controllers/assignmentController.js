const pool = require("../config/db");
const { sendEmail } = require("../utils/emailService");

/**
 * Admin uploads an assignment
 */
const uploadAssignment = async (req, res) => {
  try {
    console.log("Received request:", req.body);
    console.log("Uploaded file:", req.file);  // Log file details

    const { title, description, due_date } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded. Please select a file." });
    }

    const file_url = req.file.path;

    // Validate required fields
    if (!title || !description || !due_date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Insert into database
    const result = await pool.query(
      "INSERT INTO assignments (title, description, file_url, due_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description, file_url, due_date]
    );

    console.log("Assignment inserted into DB:", result.rows[0]);

    // Send email notifications
    try {
      const students = await pool.query("SELECT email, first_name FROM users WHERE role = 'student'");

      for (const student of students.rows) {
        await sendEmail(
          student.email,
          `New Assignment: ${title}`,
          `Dear ${student.first_name},

A new assignment has been posted:

Title: ${title}
Due Date: ${new Date(due_date).toLocaleString()}
Description: ${description}

Please log in to the system to view and submit your assignment.

Best regards,
LMS Team`
        );
      }
    } catch (emailError) {
      console.error("Error sending emails:", emailError);
    }

    res.status(201).json({ 
      message: "Assignment uploaded successfully",
      assignment: result.rows[0]
    });

  } catch (error) {
    console.error("Error in uploadAssignment:", error);
    res.status(500).json({ 
      message: "Failed to upload assignment", 
      error: error.message 
    });
  }
};

module.exports = { uploadAssignment };



