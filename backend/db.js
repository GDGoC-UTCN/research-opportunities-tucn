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
      status TEXT DEFAULT 'active',
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
    db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      linkedin_url TEXT,
      avatar_file_key TEXT,
      avatar_file_name TEXT,
      avatar_file_size INTEGER,
      avatar_file_type TEXT,
      cv_file_key TEXT,
      cv_file_name TEXT,
      cv_file_size INTEGER,
      cv_file_type TEXT,
      transcript_file_key TEXT,
      transcript_file_name TEXT,
      transcript_file_size INTEGER,
      transcript_file_type TEXT,
      bio TEXT,
      website_url TEXT,
      research_interests TEXT,
      lab_name TEXT,
      skills TEXT,
      preferred_tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS saved_opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      opportunity_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, opportunity_id)
    )`);
    // In-app notifications (also referenced by applications/questions flows).
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT,
      title TEXT NOT NULL,
      message TEXT,
      link_url TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Student questions about an opportunity and the owning professor's replies.
    db.run(`CREATE TABLE IF NOT EXISTS opportunity_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT,
      question_text TEXT NOT NULL,
      answer_text TEXT,
      status TEXT DEFAULT 'open',
      is_public INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      answered_at TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    ensureApplicationFileColumns();
    ensureUserProfileColumns();
    ensureOpportunityColumns();
    ensureOpportunityQuestionColumns();
    ensureNotificationColumns();
  });
}

function ensureNotificationColumns() {
  // Add type/link_url to older notification tables so the UI can categorize and
  // deep-link notifications. Additive and idempotent.
  const columns = [
    ['type', 'TEXT'],
    ['link_url', 'TEXT'],
  ];
  db.all('PRAGMA table_info(notifications)', [], (err, rows) => {
    if (err) {
      console.error('Failed to inspect notifications table', err);
      return;
    }
    const existing = new Set(rows.map(row => row.name));
    for (const [name, type] of columns) {
      if (!existing.has(name)) {
        db.run(`ALTER TABLE notifications ADD COLUMN ${name} ${type}`, alterErr => {
          if (alterErr) console.error(`Failed to add notifications.${name}`, alterErr);
        });
      }
    }
  });
}

function ensureOpportunityQuestionColumns() {
  // Runtime schema repair for the Q&A table: add any column missing from an
  // older partial table. Additive and idempotent; never drops or resets data.
  const columns = [
    ['student_name', 'TEXT'],
    ['answer_text', 'TEXT'],
    ['status', "TEXT DEFAULT 'open'"],
    ['is_public', 'INTEGER DEFAULT 0'],
    ['answered_at', 'TEXT'],
    ['updated_at', 'TEXT'],
  ];
  db.all('PRAGMA table_info(opportunity_questions)', [], (err, rows) => {
    if (err) {
      console.error('Failed to inspect opportunity_questions table', err);
      return;
    }
    const existing = new Set(rows.map(row => row.name));
    for (const [name, type] of columns) {
      if (!existing.has(name)) {
        db.run(`ALTER TABLE opportunity_questions ADD COLUMN ${name} ${type}`, alterErr => {
          if (alterErr) console.error(`Failed to add opportunity_questions.${name}`, alterErr);
        });
      }
    }
  });
}

function ensureOpportunityColumns() {
  // Older databases predate the archive feature; add the status column if it is
  // missing and default existing rows to 'active'. Non-destructive.
  db.all('PRAGMA table_info(opportunities)', [], (err, rows) => {
    if (err) {
      console.error('Failed to inspect opportunities table', err);
      return;
    }
    const existing = new Set(rows.map(row => row.name));
    if (!existing.has('status')) {
      db.run(`ALTER TABLE opportunities ADD COLUMN status TEXT DEFAULT 'active'`, alterErr => {
        if (alterErr) {
          console.error('Failed to add opportunities.status', alterErr);
          return;
        }
        db.run(`UPDATE opportunities SET status = 'active' WHERE status IS NULL`, updateErr => {
          if (updateErr) console.error('Failed to backfill opportunities.status', updateErr);
        });
      });
    }
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

function ensureUserProfileColumns() {
  const columns = [
    ['linkedin_url', 'TEXT'],
    ['avatar_file_key', 'TEXT'],
    ['avatar_file_name', 'TEXT'],
    ['avatar_file_size', 'INTEGER'],
    ['avatar_file_type', 'TEXT'],
    ['cv_file_key', 'TEXT'],
    ['cv_file_name', 'TEXT'],
    ['cv_file_size', 'INTEGER'],
    ['cv_file_type', 'TEXT'],
    ['transcript_file_key', 'TEXT'],
    ['transcript_file_name', 'TEXT'],
    ['transcript_file_size', 'INTEGER'],
    ['transcript_file_type', 'TEXT'],
    // Professor public profile + student recommendation fields (additive).
    ['bio', 'TEXT'],
    ['website_url', 'TEXT'],
    ['research_interests', 'TEXT'],
    ['lab_name', 'TEXT'],
    ['skills', 'TEXT'],
    ['preferred_tags', 'TEXT'],
    ['created_at', 'TEXT'],
    ['updated_at', 'TEXT'],
  ];

  db.all('PRAGMA table_info(user_profiles)', [], (err, rows) => {
    if (err) {
      console.error('Failed to inspect user_profiles table', err);
      return;
    }
    const existing = new Set(rows.map(row => row.name));

    const missing = columns.filter(([name]) => !existing.has(name));
    const addNextColumn = (index = 0) => {
      if (index >= missing.length) {
        db.run(
          `UPDATE user_profiles
           SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
               updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)`,
          updateErr => {
            if (updateErr) console.error('Failed to backfill user_profiles timestamps', updateErr);
          }
        );
        return;
      }

      const [name, type] = missing[index];
      db.run(`ALTER TABLE user_profiles ADD COLUMN ${name} ${type}`, alterErr => {
        if (alterErr) {
          console.error(`Failed to add user_profiles.${name}`, alterErr);
          return;
        }
        addNextColumn(index + 1);
      });
    };

    if (missing.length > 0) {
      addNextColumn();
    } else {
      db.run(
        `UPDATE user_profiles
         SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
             updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)`,
        updateErr => {
          if (updateErr) console.error('Failed to backfill user_profiles timestamps', updateErr);
        }
      );
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
