const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS - allow frontend
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({ msg: "Task Manager API is running ✅", version: "1.0.0" });
});
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: `Route ${req.method} ${req.url} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong", details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Database: Railway PostgreSQL`);
  console.log(`🌐 API: http://localhost:${PORT}`);
});
