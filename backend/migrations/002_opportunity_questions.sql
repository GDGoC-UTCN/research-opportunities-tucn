PRAGMA foreign_keys = ON;

-- Student questions about a research opportunity and the owning professor's
-- replies. Additive and idempotent; the API also creates this table at runtime
-- via db.js initDb(), so this file is for parity with the migrations service.
CREATE TABLE IF NOT EXISTS opportunity_questions (
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
);
