const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(DB_PATH);

function initDb() {
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      role TEXT,
      department TEXT,
      password TEXT,
      approved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      abstract TEXT,
      stipend TEXT,
      duration TEXT,
      deadline TEXT,
      tags TEXT DEFAULT '[]',
      application_fields TEXT DEFAULT '[]',
      require_cv INTEGER DEFAULT 0,
      require_transcript INTEGER DEFAULT 0,
      author_id TEXT,
      author_name TEXT,
      author_department TEXT,
      author_avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      answers TEXT DEFAULT '[]',
      cv_file TEXT,
      transcript_file TEXT,
      cv_file_key TEXT,
      cv_file_name TEXT,
      cv_file_size INTEGER,
      cv_file_type TEXT,
      transcript_file_key TEXT,
      transcript_file_name TEXT,
      transcript_file_size INTEGER,
      transcript_file_type TEXT,
      professor_reply TEXT,
      reply_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    ensureApplicationFileColumns();
  });
}

function ensureApplicationFileColumns() {
  const columns = [
    ['cv_file_key', 'TEXT'],
    ['cv_file_name', 'TEXT'],
    ['cv_file_size', 'INTEGER'],
    ['cv_file_type', 'TEXT'],
    ['transcript_file_key', 'TEXT'],
    ['transcript_file_name', 'TEXT'],
    ['transcript_file_size', 'INTEGER'],
    ['transcript_file_type', 'TEXT'],
  ];

  db.all('PRAGMA table_info(applications)', [], (err, rows) => {
    if (err) {
      console.error('Failed to inspect applications table', err);
      return;
    }
    const existing = new Set(rows.map(row => row.name));
    for (const [name, type] of columns) {
      if (!existing.has(name)) {
        db.run(`ALTER TABLE applications ADD COLUMN ${name} ${type}`, alterErr => {
          if (alterErr) console.error(`Failed to add applications.${name}`, alterErr);
        });
      }
    }
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { db, initDb, run, get, all };
