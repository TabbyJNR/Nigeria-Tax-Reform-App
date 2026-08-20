const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "database.sqlite");
const db = new sqlite3.Database(dbPath);

const query = process.argv[2] || "SELECT name FROM sqlite_master WHERE type='table'";
console.log("📊 Running query:", query, "\n");

db.all(query, [], (err, rows) => {
  if (err) {
    console.error("❌ Error:", err.message);
  } else {
    console.table(rows);
    console.log(`✅ ${rows.length} row(s) returned`);
  }
  db.close();
});
