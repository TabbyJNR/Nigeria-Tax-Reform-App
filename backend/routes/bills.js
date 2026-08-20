const express = require("express");
const db = require("../database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Get all bill sections
router.get("/", (req, res) => {
  const { category, search } = req.query;
  let query = "SELECT * FROM bill_sections WHERE 1=1";
  const params = [];

  if (category && category !== "all") {
    query += " AND category = ?";
    params.push(category);
  }

  if (search) {
    query += " AND (title LIKE ? OR content LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY id ASC";

  db.all(query, params, (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to fetch bill sections." });
    }
    res.json(rows);
  });
});

// Get bill section by ID
router.get("/:id", (req, res) => {
  db.get(
    "SELECT * FROM bill_sections WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Failed to fetch bill section." });
      }
      if (!row) {
        return res.status(404).json({ message: "Bill section not found." });
      }
      res.json(row);
    },
  );
});

// Get all categories
router.get("/categories/all", (req, res) => {
  db.all(
    "SELECT DISTINCT category FROM bill_sections ORDER BY category",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Failed to fetch categories." });
      }
      res.json(rows.map((row) => row.category));
    },
  );
});

// Create bill section (admin only)
router.post("/", authenticateToken, requireAdmin, (req, res) => {
  const { title, content, category, section_number } = req.body;

  if (!title || !content || !category || !section_number) {
    return res.status(400).json({ message: "All fields are required." });
  }

  db.run(
    "INSERT INTO bill_sections (title, content, category, section_number) VALUES (?, ?, ?, ?)",
    [title, content, category, section_number],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ message: "Failed to create bill section." });
      }
      res
        .status(201)
        .json({
          id: this.lastID,
          message: "Bill section created successfully.",
        });
    },
  );
});

// Update bill section (admin only)
router.put("/:id", authenticateToken, requireAdmin, (req, res) => {
  const { title, content, category, section_number } = req.body;

  db.run(
    "UPDATE bill_sections SET title = ?, content = ?, category = ?, section_number = ? WHERE id = ?",
    [title, content, category, section_number, req.params.id],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ message: "Failed to update bill section." });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Bill section not found." });
      }
      res.json({ message: "Bill section updated successfully." });
    },
  );
});

// Delete bill section (admin only)
router.delete("/:id", authenticateToken, requireAdmin, (req, res) => {
  db.run(
    "DELETE FROM bill_sections WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ message: "Failed to delete bill section." });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Bill section not found." });
      }
      res.json({ message: "Bill section deleted successfully." });
    },
  );
});

module.exports = router;
