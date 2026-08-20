const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const frontendPath = path.join(__dirname, "../frontend");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath, { extensions: ["html"] }));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/bills", require("./routes/bills"));
app.use("/api/calculator", require("./routes/calculator"));
app.use("/api/feedback", require("./routes/feedback"));
app.use("/api/taxpayers", require("./routes/taxpayers"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/tax-categories", require("./routes/tax-categories"));

// Catch-all: serve frontend
app.get("*", (req, res, next) => {
  const ext = path.extname(req.path);
  if (ext && ext !== ".html") return next();
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Database: SQLite (database.sqlite)`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📂 Serving frontend from: ${frontendPath}`);
});

module.exports = app;