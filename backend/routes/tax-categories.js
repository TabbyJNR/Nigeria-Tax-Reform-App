const express = require("express");
const db = require("../database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Get all tax categories (public)
router.get("/", (req, res) => {
  db.all("SELECT * FROM tax_categories ORDER BY tax_name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to fetch tax categories." });
    res.json(rows);
  });
});

// Add tax category (admin only)
router.post("/", authenticateToken, requireAdmin, (req, res) => {
  const { tax_name, description, rate } = req.body;
  if (!tax_name || !rate) return res.status(400).json({ message: "Tax name and rate are required." });

  db.run(
    "INSERT INTO tax_categories (tax_name, description, rate) VALUES (?, ?, ?)",
    [tax_name, description, rate],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to add tax category." });
      res.status(201).json({ id: this.lastID, message: "Tax category added." });
    }
  );
});

// Update tax category (admin only)
router.put("/:id", authenticateToken, requireAdmin, (req, res) => {
  const { tax_name, description, rate } = req.body;
  db.run(
    "UPDATE tax_categories SET tax_name=?, description=?, rate=? WHERE id=?",
    [tax_name, description, rate, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to update." });
      res.json({ message: "Tax category updated." });
    }
  );
});

// Delete tax category (admin only)
router.delete("/:id", authenticateToken, requireAdmin, (req, res) => {
  db.run("DELETE FROM tax_categories WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: "Failed to delete." });
    res.json({ message: "Tax category deleted." });
  });
});

module.exports = router;