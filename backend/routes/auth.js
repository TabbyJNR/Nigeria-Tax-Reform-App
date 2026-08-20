const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// Register
router.post("/register", (req, res) => {
  const { fullname, email, password } = req.body;

  if (!fullname || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters." });
  }

  // Check if email exists
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Database error." });
    }
    if (user) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user
    db.run(
      "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)",
      [fullname, email, hashedPassword],
      function (err) {
        if (err) {
          return res.status(500).json({ message: "Failed to register user." });
        }

        const token = jwt.sign(
          { id: this.lastID, email, fullname, role: "user" },
          JWT_SECRET,
          { expiresIn: "24h" },
        );

        res.status(201).json({
          message: "User registered successfully.",
          token,
          user: { id: this.lastID, fullname, email, role: "user" },
        });
      },
    );
  });
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Database error." });
    }
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  });
});

// Get current user
router.get("/me", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.json({ user: null });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.json({ user: null });
    }
    res.json({ user });
  });
});

// One-time admin setup route — creates admin if none exists
router.post("/setup-admin", (req, res) => {
  const { secretKey } = req.body;

  // Protect this route with a secret
  if (secretKey !== "NRS_ADMIN_SETUP_2026") {
    return res.status(403).json({ message: "Invalid secret key." });
  }

  db.get("SELECT id FROM users WHERE role = 'admin'", [], (err, row) => {
    if (err) return res.status(500).json({ message: "Database error." });

    if (row) {
      return res.json({ message: "Admin already exists." });
    }

    const hashedPassword = bcrypt.hashSync("admin123", 10);
    db.run(
      "INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)",
      ["Administrator", "admin@nrs.gov.ng", hashedPassword, "admin"],
      function (err) {
        if (err)
          return res.status(500).json({ message: "Failed to create admin." });
        res.json({
          message: "Admin created successfully!",
          email: "admin@nrs.gov.ng",
          password: "admin123",
        });
      },
    );
  });
});

module.exports = router;