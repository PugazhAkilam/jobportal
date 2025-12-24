const express = require('express');
const jobController = require('../controllers/job.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

// Get all jobs with filters and pagination
router.get('/', jobController.getAllJobs);

// Get single job
router.get('/:id', jobController.getJobById);

// Create job (Recruiter only)
router.post('/', authMiddleware, roleMiddleware('RECRUITER', 'ADMIN'), jobController.createJob);

// Update job (Recruiter only - own jobs)
router.put('/:id', authMiddleware, roleMiddleware('RECRUITER', 'ADMIN'), jobController.updateJob);

// Delete job (Recruiter only - own jobs)
router.delete('/:id', authMiddleware, roleMiddleware('RECRUITER', 'ADMIN'), jobController.deleteJob);

// Apply for job
router.post('/:id/apply', authMiddleware, roleMiddleware('USER'), upload.single('resume'), jobController.applyForJob);

// Get applications for a job (Recruiter only)
router.get('/:id/applications', authMiddleware, roleMiddleware('RECRUITER', 'ADMIN'), jobController.getJobApplications);

// Update application status (Recruiter only)
router.patch('/applications/:applicationId/status', authMiddleware, roleMiddleware('RECRUITER', 'ADMIN'), jobController.updateApplicationStatus);

module.exports = router;