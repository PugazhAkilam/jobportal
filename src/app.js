const express = require("express");
const cors = require("cors");
const path = require("path");
const prisma = require("./config/prisma");

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const jobRoutes = require("./routes/job.routes");
const resumeRoutes = require("./routes/resume.routes");
const chatRoutes = require("./routes/chat.routes");

// Import middlewares
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/chat", chatRoutes);

// Test route
app.get("/test-db", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({
      success: true,
      message: "Database connected successfully ✅",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed ❌",
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Job Portal API running 🚀");
});

// Error handling middleware (should be last)
app.use(errorMiddleware);

module.exports = app;
