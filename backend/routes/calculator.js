const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Calculate Personal Income Tax
function calculatePIT(income) {
  let tax = 0;
  const remaining = income;

  // Consolidated Relief Allowance
  const cra = Math.max(200000, income * 0.01) + income * 0.2;
  const taxableIncome = Math.max(0, income - cra);

  if (taxableIncome <= 0) return { tax: 0, cra, taxableIncome: 0 };

  let temp = taxableIncome;

  // Tax brackets
  if (temp > 3200000) {
    tax += (temp - 3200000) * 0.24;
    temp = 3200000;
  }
  if (temp > 1600000) {
    tax += (temp - 1600000) * 0.21;
    temp = 1600000;
  }
  if (temp > 1100000) {
    tax += (temp - 1100000) * 0.19;
    temp = 1100000;
  }
  if (temp > 600000) {
    tax += (temp - 600000) * 0.15;
    temp = 600000;
  }
  if (temp > 300000) {
    tax += (temp - 300000) * 0.11;
    temp = 300000;
  }
  tax += temp * 0.07;

  return { tax, cra, taxableIncome };
}

// Calculate Company Income Tax
function calculateCIT(income) {
  let rate;
  if (income < 25000000) {
    rate = 0; // Small company
  } else if (income < 100000000) {
    rate = 0.2; // Medium company
  } else {
    rate = 0.25; // Large company
  }

  return { tax: income * rate, rate };
}

// Calculate VAT
function calculateVAT(amount) {
  const vatRate = 0.075;
  return {
    vat: amount * vatRate,
    total: amount + amount * vatRate,
    rate: vatRate,
  };
}

// Tax calculation endpoint
router.post("/", authenticateToken, (req, res) => {
  const { income, taxType } = req.body;
  const userId = req.user.id;

  if (!income || !taxType) {
    return res
      .status(400)
      .json({ message: "Income and tax type are required." });
  }

  const incomeNum = parseFloat(income);
  if (isNaN(incomeNum) || incomeNum < 0) {
    return res.status(400).json({ message: "Invalid income amount." });
  }

  let result;
  let taxAmount;

  switch (taxType) {
    case "PIT":
      result = calculatePIT(incomeNum);
      taxAmount = result.tax;
      break;
    case "CIT":
      result = calculateCIT(incomeNum);
      taxAmount = result.tax;
      break;
    case "VAT":
      result = calculateVAT(incomeNum);
      taxAmount = result.vat;
      break;
    default:
      return res
        .status(400)
        .json({ message: "Invalid tax type. Use PIT, CIT, or VAT." });
  }

  // Save calculation
  db.run(
    "INSERT INTO tax_calculations (user_id, income, tax_type, tax_amount, net_income) VALUES (?, ?, ?, ?, ?)",
    [userId, incomeNum, taxType, taxAmount, incomeNum - taxAmount],
    function (err) {
      if (err) {
        console.error("Error saving calculation:", err);
      }
    },
  );

  res.json({
    income: incomeNum,
    taxType,
    ...result,
    taxAmount,
    netIncome: incomeNum - taxAmount,
  });
});

// Get calculation history
router.get("/history", authenticateToken, (req, res) => {
  db.all(
    "SELECT * FROM tax_calculations WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Failed to fetch calculation history." });
      }
      res.json(rows);
    },
  );
});

module.exports = router;
