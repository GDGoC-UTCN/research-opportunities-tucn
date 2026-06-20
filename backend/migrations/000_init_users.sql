PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT,
  department TEXT,
  password TEXT,
  approved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
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
);

CREATE TABLE IF NOT EXISTS applications (
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
);

CREATE TABLE IF NOT EXISTS user_profiles (
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
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, opportunity_id)
);
