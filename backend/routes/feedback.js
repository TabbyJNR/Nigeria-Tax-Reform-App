const express = require("express");
const db = require("../database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Submit feedback (public or authenticated)
router.post("/", (req, res) => {
  const { subject, message, userId, userName } = req.body;

  if (!subject || !message) {
    return res
      .status(400)
      .json({ message: "Subject and message are required." });
  }

  db.run(
    "INSERT INTO feedbacks (user_id, user_name, subject, message) VALUES (?, ?, ?, ?)",
    [userId || null, userName || "Anonymous", subject, message],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to submit feedback." });
      }
      res
        .status(201)
        .json({ id: this.lastID, message: "Feedback submitted successfully." });
    },
  );
});

// Get all feedback (admin only)
router.get("/", authenticateToken, requireAdmin, (req, res) => {
  db.all(
    "SELECT f.*, u.fullname, u.email FROM feedbacks f LEFT JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Failed to fetch feedback." });
      }
      res.json(rows);
    },
  );
});

// Get user's own feedback
router.get("/my", authenticateToken, (req, res) => {
  db.all(
    "SELECT * FROM feedbacks WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Failed to fetch your feedback." });
      }
      res.json(rows);
    },
  );
});

// Delete feedback (admin only)
router.delete("/:id", authenticateToken, requireAdmin, (req, res) => {
  db.run("DELETE FROM feedbacks WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ message: "Failed to delete feedback." });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Feedback not found." });
    }
    res.json({ message: "Feedback deleted successfully." });
  });
});

module.exports = router;
