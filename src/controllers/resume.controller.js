const prisma = require('../config/prisma');
const { generateResumePDF } = require('../utils/pdfGenerator');

const resumeController = {
  // Get all resumes for current user
  getAllResumes: async (req, res, next) => {
    try {
      const resumes = await prisma.resume.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: resumes
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single resume
  getResumeById: async (req, res, next) => {
    try {
      const resume = await prisma.resume.findFirst({
        where: {
          id: parseInt(req.params.id),
          userId: req.user.id
        }
      });

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found.'
        });
      }

      res.json({
        success: true,
        data: resume
      });
    } catch (error) {
      next(error);
    }
  },

  // Create resume
  createResume: async (req, res, next) => {
    try {
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required.'
        });
      }

      const resume = await prisma.resume.create({
        data: {
          title,
          content,
          userId: req.user.id
        }
      });

      res.status(201).json({
        success: true,
        message: 'Resume created successfully.',
        data: resume
      });
    } catch (error) {
      next(error);
    }
  },

  // Update resume
  updateResume: async (req, res, next) => {
    try {
      const { title, content } = req.body;
      const resumeId = parseInt(req.params.id);

      // Check if resume exists and belongs to user
      const existingResume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: req.user.id
        }
      });

      if (!existingResume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found.'
        });
      }

      const resume = await prisma.resume.update({
        where: { id: resumeId },
        data: {
          ...(title && { title }),
          ...(content && { content })
        }
      });

      res.json({
        success: true,
        message: 'Resume updated successfully.',
        data: resume
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete resume
  deleteResume: async (req, res, next) => {
    try {
      const resumeId = parseInt(req.params.id);

      // Check if resume exists and belongs to user
      const existingResume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: req.user.id
        }
      });

      if (!existingResume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found.'
        });
      }

      await prisma.resume.delete({
        where: { id: resumeId }
      });

      res.json({
        success: true,
        message: 'Resume deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  // Generate PDF
  generatePDF: async (req, res, next) => {
    try {
      const resumeId = parseInt(req.params.id);

      const resume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: req.user.id
        }
      });

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found.'
        });
      }

      // Generate PDF using streams
      const pdfBuffer = await generateResumePDF(resume);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${resume.title}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Stream the PDF
      res.end(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = resumeController;