const path = require("path");
const Database = require("better-sqlite3");

const dbPath =
    process.env.DB_PATH ||
    path.join(process.cwd(), "store.db");

const db = new Database(dbPath);

// Better SQLite settings
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

module.exports = db;