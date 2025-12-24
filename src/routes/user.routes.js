const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, userController.getProfile);

// Update user profile
router.put('/profile', authMiddleware, userController.updateProfile);

// Get user's applications
router.get('/applications', authMiddleware, roleMiddleware('USER'), userController.getUserApplications);

// Get user's jobs (for recruiters)
router.get('/jobs', authMiddleware, roleMiddleware('RECRUITER', 'ADMIN'), userController.getUserJobs);

// Get all users (Admin only)
router.get('/', authMiddleware, roleMiddleware('ADMIN'), userController.getAllUsers);

// Update user role (Admin only)
router.patch('/:id/role', authMiddleware, roleMiddleware('ADMIN'), userController.updateUserRole);

module.exports = router;