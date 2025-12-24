const express = require('express');
const resumeController = require('../controllers/resume.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Get all resumes for current user
router.get('/', authMiddleware, resumeController.getAllResumes);

// Get single resume
router.get('/:id', authMiddleware, resumeController.getResumeById);

// Create resume
router.post('/', authMiddleware, resumeController.createResume);

// Update resume
router.put('/:id', authMiddleware, resumeController.updateResume);

// Delete resume
router.delete('/:id', authMiddleware, resumeController.deleteResume);

// Generate PDF
router.get('/:id/pdf', authMiddleware, resumeController.generatePDF);

module.exports = router;