const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const passport = require('../utils/googleOAuth');

const router = express.Router();

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  authController.googleCallback
);

// Get current user
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;