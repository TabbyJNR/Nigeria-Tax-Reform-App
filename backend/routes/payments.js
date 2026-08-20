const express = require("express");
const db = require("../database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Generate unique transaction reference
function generateTransactionRef() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `NRS-TXN-${timestamp}-${random}`;
}

// Generate receipt number
function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `NRS-RCP-${year}${month}-${random}`;
}

// Make a payment
router.post("/", authenticateToken, (req, res) => {
  const { tax_category_id, amount, payment_method } = req.body;

  if (!tax_category_id || !amount) {
    return res.status(400).json({ message: "Tax category and amount are required." });
  }

  // Get taxpayer profile
  db.get("SELECT * FROM taxpayers WHERE user_id = ?", [req.user.id], (err, taxpayer) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (!taxpayer) {
      return res.status(400).json({
        message: "You must complete your taxpayer profile before making a payment.",
        redirect: "taxpayer-profile.html"
      });
    }

    const transaction_reference = generateTransactionRef();
    const receipt_number = generateReceiptNumber();

    db.run(
      `INSERT INTO payments (taxpayer_id, user_id, tax_category_id, amount, transaction_reference, receipt_number, payment_status, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, 'Successful', ?)`,
      [taxpayer.id, req.user.id, tax_category_id, amount, transaction_reference, receipt_number, payment_method || "Online"],
      function (err) {
        if (err) return res.status(500).json({ message: "Payment failed. Please try again." });
        res.status(201).json({
          message: "Payment successful!",
          receipt_number,
          transaction_reference,
          payment_id: this.lastID,
          amount,
          taxpayer_name: taxpayer.fullname,
          tin: taxpayer.tin
        });
      }
    );
  });
});

// Get current user's payment history
router.get("/my-payments", authenticateToken, (req, res) => {
  db.all(
    `SELECT p.*, tc.tax_name, t.tin, t.fullname as taxpayer_name
     FROM payments p
     LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
     LEFT JOIN taxpayers t ON p.taxpayer_id = t.id
     WHERE p.user_id = ?
     ORDER BY p.payment_date DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch payments." });
      res.json(rows);
    }
  );
});

// Track payment by receipt number or transaction reference
router.get("/track/:query", (req, res) => {
  const query = req.params.query;
  db.get(
    `SELECT p.*, tc.tax_name, t.tin, t.fullname as taxpayer_name, t.email as taxpayer_email
     FROM payments p
     LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
     LEFT JOIN taxpayers t ON p.taxpayer_id = t.id
     WHERE p.receipt_number = ? OR p.transaction_reference = ?`,
    [query, query],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Database error." });
      if (!row) return res.status(404).json({ message: "Payment not found. Check your receipt number or transaction reference." });
      res.json(row);
    }
  );
});

// Search payments by TIN (for taxpayers and officers)
router.get("/by-tin/:tin", authenticateToken, (req, res) => {
  db.all(
    `SELECT p.*, tc.tax_name, t.tin, t.fullname as taxpayer_name
     FROM payments p
     LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
     LEFT JOIN taxpayers t ON p.taxpayer_id = t.id
     WHERE t.tin = ?
     ORDER BY p.payment_date DESC`,
    [req.params.tin],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Database error." });
      res.json(rows);
    }
  );
});

// Get all payments (admin only)
router.get("/", authenticateToken, requireAdmin, (req, res) => {
  const { status, from, to } = req.query;
  let query = `SELECT p.*, tc.tax_name, t.tin, t.fullname as taxpayer_name
               FROM payments p
               LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
               LEFT JOIN taxpayers t ON p.taxpayer_id = t.id
               WHERE 1=1`;
  const params = [];

  if (status) { query += " AND p.payment_status = ?"; params.push(status); }
  if (from) { query += " AND p.payment_date >= ?"; params.push(from); }
  if (to) { query += " AND p.payment_date <= ?"; params.push(to); }
  query += " ORDER BY p.payment_date DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to fetch payments." });
    res.json(rows);
  });
});

// Update payment status (admin/officer only)
router.put("/:id/status", authenticateToken, requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Pending", "Successful", "Failed", "Cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  db.run(
    "UPDATE payments SET payment_status = ? WHERE id = ?",
    [status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to update payment status." });
      if (this.changes === 0) return res.status(404).json({ message: "Payment not found." });
      res.json({ message: "Payment status updated successfully." });
    }
  );
});

// Get revenue report (admin only)
router.get("/reports/summary", authenticateToken, requireAdmin, (req, res) => {
  const { period } = req.query; // daily, weekly, monthly, annual

  let dateFilter = "";
  if (period === "daily") dateFilter = "AND DATE(p.payment_date) = DATE('now')";
  else if (period === "weekly") dateFilter = "AND p.payment_date >= DATE('now', '-7 days')";
  else if (period === "monthly") dateFilter = "AND p.payment_date >= DATE('now', '-30 days')";
  else if (period === "annual") dateFilter = "AND p.payment_date >= DATE('now', '-365 days')";

  db.get(
    `SELECT
       COUNT(*) as total_transactions,
       SUM(CASE WHEN payment_status='Successful' THEN amount ELSE 0 END) as total_revenue,
       COUNT(CASE WHEN payment_status='Successful' THEN 1 END) as successful,
       COUNT(CASE WHEN payment_status='Pending' THEN 1 END) as pending,
       COUNT(CASE WHEN payment_status='Failed' THEN 1 END) as failed,
       COUNT(CASE WHEN payment_status='Cancelled' THEN 1 END) as cancelled
     FROM payments p WHERE 1=1 ${dateFilter}`,
    [],
    (err, summary) => {
      if (err) return res.status(500).json({ message: "Failed to generate report." });

      // Revenue by tax category
      db.all(
        `SELECT tc.tax_name, SUM(p.amount) as revenue, COUNT(*) as count
         FROM payments p
         LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
         WHERE p.payment_status = 'Successful' ${dateFilter}
         GROUP BY tc.tax_name ORDER BY revenue DESC`,
        [],
        (err, byCategory) => {
          if (err) return res.status(500).json({ message: "Failed to generate report." });
          res.json({ summary, byCategory, period: period || "all" });
        }
      );
    }
  );
});

module.exports = router;