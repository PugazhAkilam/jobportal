const prisma = require('../config/prisma');
const eventEmitter = require('../events/eventEmitter');

const jobController = {
  // Get all jobs with filters and pagination
  getAllJobs: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        location,
        company,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (company) {
        where.company = { contains: company, mode: 'insensitive' };
      }

      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          include: {
            recruiter: {
              select: { id: true, name: true, email: true }
            },
            _count: {
              select: { applications: true }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: parseInt(limit)
        }),
        prisma.job.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          jobs,
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

  // Get single job
  getJobById: async (req, res, next) => {
    try {
      const job = await prisma.job.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          recruiter: {
            select: { id: true, name: true, email: true }
          },
          applications: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found.'
        });
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      next(error);
    }
  },

  // Create job (Recruiter only)
  createJob: async (req, res, next) => {
    try {
      const { title, description, company, location, salary, skills } = req.body;

      if (!title || !description || !company) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, and company are required.'
        });
      }

      const job = await prisma.job.create({
        data: {
          title,
          description,
          company,
          location,
          salary,
          skills,
          recruiterId: req.user.id
        },
        include: {
          recruiter: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Job posted successfully.',
        data: job
      });
    } catch (error) {
      next(error);
    }
  },

  // Update job (Recruiter only - own jobs)
  updateJob: async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);
      const { title, description, company, location, salary, skills, status } = req.body;

      // Check if job exists and belongs to recruiter (unless admin)
      const existingJob = await prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!existingJob) {
        return res.status(404).json({
          success: false,
          message: 'Job not found.'
        });
      }

      if (req.user.role !== 'ADMIN' && existingJob.recruiterId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own jobs.'
        });
      }

      const job = await prisma.job.update({
        where: { id: jobId },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(company && { company }),
          ...(location && { location }),
          ...(salary && { salary }),
          ...(skills && { skills }),
          ...(status && { status })
        },
        include: {
          recruiter: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      res.json({
        success: true,
        message: 'Job updated successfully.',
        data: job
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete job (Recruiter only - own jobs)
  deleteJob: async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);

      const existingJob = await prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!existingJob) {
        return res.status(404).json({
          success: false,
          message: 'Job not found.'
        });
      }

      if (req.user.role !== 'ADMIN' && existingJob.recruiterId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own jobs.'
        });
      }

      await prisma.job.delete({
        where: { id: jobId }
      });

      res.json({
        success: true,
        message: 'Job deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  // Apply for job
  applyForJob: async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);

      // Check if job exists
      const job = await prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found.'
        });
      }

      // Check if user already applied
      const existingApplication = await prisma.application.findFirst({
        where: {
          userId: req.user.id,
          jobId: jobId
        }
      });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: 'You have already applied for this job.'
        });
      }

      // Create application
      const application = await prisma.application.create({
        data: {
          userId: req.user.id,
          jobId: jobId,
          status: 'APPLIED',
          resumeFile: req.file ? req.file.filename : null
        },
        include: {
          job: {
            select: { title: true, company: true }
          },
          user: {
            select: { name: true, email: true }
          }
        }
      });

      // Emit application event
      eventEmitter.emit('job:applied', {
        applicationId: application.id,
        userId: req.user.id,
        jobId: jobId,
        recruiterId: job.recruiterId
      });

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully.',
        data: application
      });
    } catch (error) {
      next(error);
    }
  },

  // Get applications for a job (Recruiter only)
  getJobApplications: async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);

      const job = await prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found.'
        });
      }

      if (req.user.role !== 'ADMIN' && job.recruiterId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only view applications for your own jobs.'
        });
      }

      const applications = await prisma.application.findMany({
        where: { jobId: jobId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
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

  // Update application status (Recruiter only)
  updateApplicationStatus: async (req, res, next) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const { status } = req.body;

      const validStatuses = ['APPLIED', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'SELECTED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status.'
        });
      }

      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true }
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found.'
        });
      }

      if (req.user.role !== 'ADMIN' && application.job.recruiterId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update applications for your own jobs.'
        });
      }

      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { status },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          job: {
            select: { title: true, company: true }
          }
        }
      });

      // Emit status change event
      eventEmitter.emit('application:statusChanged', {
        applicationId: applicationId,
        userId: application.userId,
        status: status,
        jobTitle: application.job.title
      });

      res.json({
        success: true,
        message: 'Application status updated successfully.',
        data: updatedApplication
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = jobController;