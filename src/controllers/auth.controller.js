const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const eventEmitter = require('../events/eventEmitter');

const authController = {
  // Register new user
  register: async (req, res, next) => {
    try {
      const { name, email, password, role = 'USER' } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required.'
        });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email.'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Emit registration event
      eventEmitter.emit('user:registered', {
        userId: user.id,
        email: user.email,
        name: user.name,
        method: 'email'
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: {
          user,
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Login user
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.'
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials.'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials.'
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Refresh access token
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token is required.'
        });
      }

      const decoded = verifyRefreshToken(refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token.'
      });
    }
  },

  // Google OAuth callback
  googleCallback: async (req, res) => {
    try {
      const { accessToken, refreshToken } = generateTokens(req.user.id);

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.CLIENT_URL}/auth/success?accessToken=${accessToken}&refreshToken=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL}/auth/error`);
    }
  },

  // Get current user
  getCurrentUser: async (req, res) => {
    res.json({
      success: true,
      data: req.user
    });
  }
};

module.exports = authController;