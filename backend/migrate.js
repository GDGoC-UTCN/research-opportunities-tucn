const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    role TEXT,
    department TEXT,
    password TEXT,
    approved INTEGER DEFAULT 0
  )`, err => {
    if (err) console.error('Migration error:', err);
    else console.log('Migration complete');
    db.close();
  });
});
