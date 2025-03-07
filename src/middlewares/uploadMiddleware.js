const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const createStorage = (folder) =>
    new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: folder,
        format: async (req, file) => file.mimetype.split("/")[1], // Ensure proper format
        resource_type: "auto", // Allows all file types
      },
    });

// Middleware for profile picture uploads
const profilePicUpload = multer({ storage: createStorage("lms/profile_pictures") });

// Middleware for assignment uploads
const assignmentUpload = multer({ storage: createStorage("lms/assignments") });

// Middleware for quiz uploads (if quizzes contain images)
const quizUpload = multer({ storage: createStorage("lms/quizzes") });

// Middleware for course material uploads
const courseMaterialUpload = multer({ storage: createStorage("lms/course_materials") });

module.exports = { profilePicUpload, assignmentUpload, quizUpload, courseMaterialUpload };
