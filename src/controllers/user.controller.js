const prisma = require('../config/prisma');

const userController = {
  // Get user profile
  getProfile: async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              resumes: true,
              applications: true,
              jobs: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  updateProfile: async (req, res, next) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Name is required.'
        });
      }

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully.',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user's applications
  getUserApplications: async (req, res, next) => {
    try {
      const applications = await prisma.application.findMany({
        where: { userId: req.user.id },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              recruiter: {
                select: { name: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: applications
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user's jobs (for recruiters)
  getUserJobs: async (req, res, next) => {
    try {
      const jobs = await prisma.job.findMany({
        where: req.user.role === 'ADMIN' ? {} : { recruiterId: req.user.id },
        include: {
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: jobs
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all users (Admin only)
  getAllUsers: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, role } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = role ? { role } : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                resumes: true,
                applications: true,
                jobs: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.user.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user role (Admin only)
  updateUserRole: async (req, res, next) => {
    try {
      const { role } = req.body;
      const userId = parseInt(req.params.id);

      const validRoles = ['USER', 'RECRUITER', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role.'
        });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      res.json({
        success: true,
        message: 'User role updated successfully.',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;