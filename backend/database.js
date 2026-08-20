const sqlite3 = require("sqlite3").verbose();
const path = require("path");

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
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Taxpayers table
    db.run(`CREATE TABLE IF NOT EXISTS taxpayers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      tin TEXT UNIQUE NOT NULL,
      fullname TEXT NOT NULL,
      business_name TEXT,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      state TEXT NOT NULL,
      lga TEXT NOT NULL,
      occupation TEXT NOT NULL,
      tax_category TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Tax categories table
    db.run(`CREATE TABLE IF NOT EXISTS tax_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tax_name TEXT NOT NULL,
      description TEXT,
      rate REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Payments table
    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taxpayer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      tax_category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      transaction_reference TEXT UNIQUE NOT NULL,
      receipt_number TEXT UNIQUE NOT NULL,
      payment_status TEXT DEFAULT 'Successful',
      payment_method TEXT DEFAULT 'Online',
      FOREIGN KEY (taxpayer_id) REFERENCES taxpayers(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (tax_category_id) REFERENCES tax_categories(id)
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

    // Seed data
    seedTaxCategories();
    seedBillSections();
  });
}

function seedTaxCategories() {
  db.get("SELECT COUNT(*) as count FROM tax_categories", [], (err, row) => {
    if (err || row.count > 0) return;
    const categories = [
      { tax_name: "Personal Income Tax (PIT)", description: "Tax on individual earnings", rate: 7 },
      { tax_name: "Company Income Tax (CIT)", description: "Tax on company profits", rate: 25 },
      { tax_name: "Value Added Tax (VAT)", description: "Tax on goods and services", rate: 7.5 },
      { tax_name: "Capital Gains Tax (CGT)", description: "Tax on asset disposal gains", rate: 12.5 },
      { tax_name: "Withholding Tax (WHT)", description: "Tax deducted at source", rate: 10 },
      { tax_name: "Stamp Duty", description: "Tax on legal documents", rate: 1.5 },
    ];
    const stmt = db.prepare("INSERT INTO tax_categories (tax_name, description, rate) VALUES (?, ?, ?)");
    categories.forEach(c => stmt.run([c.tax_name, c.description, c.rate]));
    stmt.finalize();
    console.log("Tax categories seeded.");
  });
}

function seedBillSections() {
  db.get("SELECT COUNT(*) as count FROM bill_sections", [], (err, row) => {
    if (err || row.count > 0) return;
    const sections = [
      { title: "NRS Tax Administration Overview", content: "The Nigeria Revenue Service (NRS), formerly the Federal Inland Revenue Service (FIRS), is the principal revenue generation agency of the Federal Government of Nigeria. NRS is responsible for assessing, collecting, and accounting for all taxes, fees, and revenues due to the Federal Government.", category: "General Provisions", section_number: "NRS-GEN-001" },
      { title: "NRS Personal Income Tax Guidelines", content: "Tax brackets: First ₦300,000 at 7%, Next ₦300,000 at 11%, Next ₦500,000 at 15%, Next ₦500,000 at 19%, Next ₦1,600,000 at 21%, Above ₦3,200,000 at 24%. Consolidated Relief Allowance (CRA) is ₦200,000 or 1% of gross income plus 20% of gross income.", category: "Personal Income Tax", section_number: "NRS-PIT-012" },
      { title: "NRS Companies Income Tax Regulations", content: "Large companies (turnover above ₦100 million) pay 25% CIT. Medium companies (₦25M-₦100M) pay 20% CIT. Small companies (below ₦25 million) are exempt from CIT. New manufacturing companies enjoy a 5-year tax holiday.", category: "Company Income Tax", section_number: "NRS-CIT-025" },
      { title: "NRS Value Added Tax Administration", content: "VAT is administered at the standard rate of 7.5%. Essential food items, medical products, educational materials, and agricultural equipment remain VAT-exempt. Monthly VAT returns must be filed on or before the 21st day of the following month.", category: "Value Added Tax", section_number: "NRS-VAT-038" },
      { title: "NRS Tax Compliance and Enforcement", content: "Tax compliance is enforced through a unified Taxpayer Identification Number (TIN) system. Penalties for non-compliance: 10% of tax due plus interest at CBN Monetary Policy Rate. Taxpayers have the right to appeal assessments through the Tax Appeal Tribunal (TAT).", category: "Administration", section_number: "NRS-ADM-045" },
      { title: "NRS Capital Gains Tax Rules", content: "CGT is administered at 12.5% on gains from the disposal of assets. Primary residence exemption threshold is ₦50 million. First-time homebuyers receive relief on properties below ₦15 million.", category: "Property Tax", section_number: "NRS-PPT-070" },
    ];
    const stmt = db.prepare("INSERT INTO bill_sections (title, content, category, section_number) VALUES (?, ?, ?, ?)");
    sections.forEach(s => stmt.run([s.title, s.content, s.category, s.section_number]));
    stmt.finalize();
    console.log("Bill sections seeded.");
  });
}

module.exports = db;