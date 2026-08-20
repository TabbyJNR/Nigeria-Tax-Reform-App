const express = require("express");
const db = require("../database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Generate TIN
function generateTIN() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `NRS${timestamp}${random}`;
}

// Register taxpayer profile (authenticated users)
router.post("/register", authenticateToken, (req, res) => {
  const {
    fullname, business_name, email, phone,
    address, state, lga, occupation, tax_category
  } = req.body;

  if (!fullname || !email || !phone || !address || !state || !lga || !occupation || !tax_category) {
    return res.status(400).json({ message: "All required fields must be filled." });
  }

  // Check if user already has a taxpayer profile
  db.get("SELECT * FROM taxpayers WHERE user_id = ?", [req.user.id], (err, existing) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (existing) return res.status(400).json({ message: "Taxpayer profile already exists.", taxpayer: existing });

    const tin = generateTIN();

    db.run(
      `INSERT INTO taxpayers (user_id, tin, fullname, business_name, email, phone, address, state, lga, occupation, tax_category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, tin, fullname, business_name || null, email, phone, address, state, lga, occupation, tax_category],
      function (err) {
        if (err) return res.status(500).json({ message: "Failed to register taxpayer." });
        res.status(201).json({
          message: "Taxpayer registered successfully!",
          tin,
          id: this.lastID
        });
      }
    );
  });
});

// Get current user's taxpayer profile
router.get("/me", authenticateToken, (req, res) => {
  db.get("SELECT * FROM taxpayers WHERE user_id = ?", [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (!row) return res.status(404).json({ message: "No taxpayer profile found." });
    res.json(row);
  });
});

// Get taxpayer by TIN (for payment tracking)
router.get("/tin/:tin", (req, res) => {
  db.get("SELECT * FROM taxpayers WHERE tin = ?", [req.params.tin], (err, row) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (!row) return res.status(404).json({ message: "Taxpayer not found." });
    res.json(row);
  });
});

// Get all taxpayers (admin only)
router.get("/", authenticateToken, requireAdmin, (req, res) => {
  db.all(
    `SELECT t.*, u.email as user_email FROM taxpayers t
     LEFT JOIN users u ON t.user_id = u.id
     ORDER BY t.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch taxpayers." });
      res.json(rows);
    }
  );
});

// Update taxpayer profile
router.put("/me", authenticateToken, (req, res) => {
  const { fullname, business_name, phone, address, state, lga, occupation, tax_category } = req.body;

  db.run(
    `UPDATE taxpayers SET fullname=?, business_name=?, phone=?, address=?, state=?, lga=?, occupation=?, tax_category=?
     WHERE user_id=?`,
    [fullname, business_name, phone, address, state, lga, occupation, tax_category, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to update profile." });
      if (this.changes === 0) return res.status(404).json({ message: "Profile not found." });
      res.json({ message: "Profile updated successfully." });
    }
  );
});

module.exports = router;