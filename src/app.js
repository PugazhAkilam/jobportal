const express = require("express");
const cors = require("cors");
const prisma = require("./config/prisma");

const app = express();

app.use(cors());
app.use(express.json());

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

module.exports = app;
