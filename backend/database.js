const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create database connection
const db = new sqlite3.Database(
  path.join(__dirname, "../database.sqlite"),
  (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
    } else {
      console.log("Connected to SQLite database.");
      initializeDatabase();
    }
  },
);

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullname TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Bill sections table
    db.run(`CREATE TABLE IF NOT EXISTS bill_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      section_number TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Feedback table
    db.run(`CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Tax calculations table
    db.run(`CREATE TABLE IF NOT EXISTS tax_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      income REAL NOT NULL,
      tax_type TEXT NOT NULL,
      tax_amount REAL NOT NULL,
      net_income REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Seed bill sections with Nigeria Revenue Service (NRS) data
    seedBillSections();
  });
}

function seedBillSections() {
  const sections = [
    {
      title: "NRS Tax Administration Overview",
      content:
        "The Nigeria Revenue Service (NRS), formerly the Federal Inland Revenue Service (FIRS), is the principal revenue generation agency of the Federal Government of Nigeria. NRS is responsible for assessing, collecting, and accounting for all taxes, fees, and revenues due to the Federal Government. This includes administering the Personal Income Tax Act (PITA), Companies Income Tax Act (CITA), Value Added Tax Act (VATA), and other relevant tax legislation. The NRS operates under the Federal Ministry of Finance with a mandate to maximize revenue generation while ensuring taxpayer compliance and education.",
      category: "General Provisions",
      section_number: "NRS-GEN-001",
    },
    {
      title: "NRS Personal Income Tax Guidelines",
      content:
        "The Nigeria Revenue Service administers Personal Income Tax (PIT) under the Personal Income Tax Act (PITA). Current tax brackets: First ₦300,000 at 7%, Next ₦300,000 at 11%, Next ₦500,000 at 15%, Next ₦500,000 at 19%, Next ₦1,600,000 at 21%, Above ₦3,200,000 at 24%. Consolidated Relief Allowance (CRA) is ₦200,000 or 1% of gross income (whichever is higher) plus 20% of gross income. Minimum tax is 0.5% for low-income earners. All employers must deduct PAYE from employee salaries and remit to NRS monthly. Self-employed individuals must file annual returns on or before March 31st each year.",
      category: "Personal Income Tax",
      section_number: "NRS-PIT-012",
    },
    {
      title: "NRS Companies Income Tax Regulations",
      content:
        "The Nigeria Revenue Service regulates Company Income Tax (CIT) under CITA. Large companies (turnover above ₦100 million) pay 25% CIT. Medium companies (turnover ₦25 million - ₦100 million) pay 20% CIT. Small companies (turnover below ₦25 million) are exempt from CIT. New manufacturing companies enjoy a 5-year tax holiday. Pioneer status industries receive 3-5 year tax exemptions. Minimum tax provisions apply to companies that make no profit or declare losses. All companies must file annual CIT returns with NRS within 6 months of their accounting year-end.",
      category: "Company Income Tax",
      section_number: "NRS-CIT-025",
    },
    {
      title: "NRS Value Added Tax Administration",
      content:
        "The Nigeria Revenue Service administers Value Added Tax (VAT) at the standard rate of 7.5%. VAT-registered businesses must charge and collect VAT on taxable goods and services. Essential food items, medical products, educational materials, and agricultural equipment remain VAT-exempt. Non-resident digital service providers must register for VAT with NRS. Businesses with annual turnover above ₦25 million must register for VAT. Monthly VAT returns must be filed on or before the 21st day of the following month. Input VAT can be reclaimed by registered businesses on qualifying purchases.",
      category: "Value Added Tax",
      section_number: "NRS-VAT-038",
    },
    {
      title: "NRS Tax Compliance and Enforcement",
      content:
        "The Nigeria Revenue Service enforces tax compliance through a unified Taxpayer Identification Number (TIN) system for all taxpayers. Mandatory electronic filing (e-filing) is required for all medium and large taxpayers. Small taxpayers may opt for quarterly filing. Penalties for non-compliance: 10% of tax due plus interest at the Central Bank of Nigeria (CBN) Monetary Policy Rate. NRS conducts tax audits and investigations to ensure compliance. Taxpayers have the right to appeal assessments through the Tax Appeal Tribunal (TAT). Voluntary disclosure programs offer reduced penalties for compliant taxpayers.",
      category: "Administration",
      section_number: "NRS-ADM-045",
    },
    {
      title: "NRS Tax Incentives and Relief Programs",
      content:
        "The Nigeria Revenue Service administers various tax incentive programs to promote economic development: Tax credits for companies investing in social infrastructure (roads, education, healthcare). Deductions for donations to registered educational and health institutions up to 15% of taxable income. Tax holiday for companies employing over 100 Nigerian youths (3-year exemption). Additional relief for companies providing apprenticeship programs and skills development initiatives. Rural investment allowance for businesses operating in less developed areas. Research and development (R&D) tax credits for innovative companies.",
      category: "Incentives",
      section_number: "NRS-INC-052",
    },
    {
      title: "NRS Digital Economy Tax Framework",
      content:
        "The Nigeria Revenue Service has implemented tax provisions for the digital economy under the Finance Act. Non-resident digital service providers (Google, Meta, Netflix, etc.) with significant economic presence in Nigeria must register for NRS VAT and CIT. A 5% digital services tax applies to cross-border digital services including streaming, advertising, and platform services. Electronic payment platforms have tax collection and remittance obligations. Cryptocurrency gains and digital asset transactions are subject to capital gains tax. NRS has the authority to request transaction data from digital platforms for tax compliance purposes.",
      category: "Digital Economy",
      section_number: "NRS-DGT-061",
    },
    {
      title: "NRS Property and Capital Gains Tax Rules",
      content:
        "The Nigeria Revenue Service administers Capital Gains Tax (CGT) at 12.5% on gains from the disposal of assets. Primary residence exemption threshold is ₦50 million. Annual property tax applies to properties valued above ₦25 million. First-time homebuyers receive relief on properties below ₦15 million. Anti-avoidance measures apply to property transactions between related parties. Stamp duties on property transactions are collected by NRS. Withholding tax on rent and property income must be remitted to NRS. Non-residents disposing of Nigerian assets are subject to CGT.",
      category: "Property Tax",
      section_number: "NRS-PPT-070",
    },
  ];

  // Check if data already exists
  db.get("SELECT COUNT(*) as count FROM bill_sections", [], (err, row) => {
    if (err) {
      console.error("Error checking bill sections:", err.message);
      return;
    }

    if (row.count === 0) {
      const stmt = db.prepare(
        "INSERT INTO bill_sections (title, content, category, section_number) VALUES (?, ?, ?, ?)",
      );
      sections.forEach((section) => {
        stmt.run([
          section.title,
          section.content,
          section.category,
          section.section_number,
        ]);
      });
      stmt.finalize();
      console.log("Bill sections seeded successfully.");
    }
  });
}

module.exports = db;
