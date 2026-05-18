const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

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
    professor_reply TEXT,
    reply_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Signup: name, email, password, role, department
app.post('/signup', async (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  const hashed = bcrypt.hashSync(password, 10);
  const approved = role === 'student' ? 1 : 0;
  db.run(`INSERT INTO users (name,email,role,department,password,approved) VALUES (?,?,?,?,?,?)`, [name, email, role, department || null, hashed, approved], function(err) {
    if (err) return res.status(500).json({ error: 'User exists or DB error' });
    return res.json({ id: this.lastID, name, email, role, approved });
  });
});

// Login: email, password
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  db.get(`SELECT id,name,email,role,department,password,approved FROM users WHERE email = ?`, [email], (err, row) => {
    if (err || !row) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, row.password)) return res.status(401).json({ error: 'Invalid credentials' });
    if (row.role === 'professor' && !row.approved) return res.status(403).json({ error: 'Account awaiting approval' });
    // Demo: return user object (do not return password in real apps)
    delete row.password;
    return res.json({ user: row });
  });
});

// Admin: list pending professor signups
app.get('/admin/pending', (req, res) => {
  db.all(`SELECT id,name,email,department FROM users WHERE role = 'professor' AND approved = 0`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    return res.json({ pending: rows });
  });
});

// Admin: list all users
app.get('/admin/users', (req, res) => {
  db.all(`SELECT id,name,email,role,department,approved FROM users ORDER BY role DESC, id ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    return res.json({ users: rows });
  });
});

// Admin: approve professor
app.post('/admin/approve', (req, res) => {
  const { id, email } = req.body;
  if (!id && !email) return res.status(400).json({ error: 'Missing id or email' });
  if (id) {
    db.run(`UPDATE users SET approved = 1 WHERE id = ?`, [id], function(err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ ok: true });
    });
  } else {
    db.run(`UPDATE users SET approved = 1 WHERE email = ?`, [email], function(err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ ok: true });
    });
  }
});

// Simple healthcheck
app.get('/health', (req, res) => res.json({ ok: true }));

// Opportunities: list all
app.get('/opportunities', (req, res) => {
  db.all(`SELECT * FROM opportunities ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    const mapped = rows.map(r => ({
      id: String(r.id),
      title: r.title,
      description: r.description,
      abstract: r.abstract,
      stipend: r.stipend,
      duration: r.duration,
      deadline: r.deadline || 'December 31, 2026',
      postDate: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Today',
      tags: JSON.parse(r.tags || '[]'),
      applicationFields: JSON.parse(r.application_fields || '[]'),
      requireCv: !!r.require_cv,
      requireTranscript: !!r.require_transcript,
      requirements: { technical: ['To be specified'], eligibility: ['To be specified'] },
      author: { id: r.author_id, name: r.author_name, department: r.author_department, avatar: r.author_avatar },
    }));
    return res.json({ opportunities: mapped });
  });
});

// Opportunities: create
app.post('/opportunities', (req, res) => {
  const { title, description, abstract, stipend, duration, deadline, tags, applicationFields, requireCv, requireTranscript, author } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  db.run(
    `INSERT INTO opportunities (title,description,abstract,stipend,duration,deadline,tags,application_fields,require_cv,require_transcript,author_id,author_name,author_department,author_avatar)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [title, description, abstract, stipend, duration, deadline || 'December 31, 2026',
     JSON.stringify(tags || []), JSON.stringify(applicationFields || []),
     requireCv ? 1 : 0, requireTranscript ? 1 : 0,
     author?.id, author?.name, author?.department, author?.avatar],
    function(err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      return res.json({ id: String(this.lastID) });
    }
  );
});

// Opportunities: delete
app.delete('/opportunities/:id', (req, res) => {
  db.run(`DELETE FROM opportunities WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    return res.json({ ok: true });
  });
});

// Applications: list (optionally filtered by studentId or opportunityId query params)
app.get('/applications', (req, res) => {
  const { studentId, opportunityId } = req.query;
  let sql = `SELECT * FROM applications`;
  const params = [];
  if (studentId && opportunityId) {
    sql += ` WHERE student_id = ? AND opportunity_id = ?`;
    params.push(studentId, opportunityId);
  } else if (studentId) {
    sql += ` WHERE student_id = ?`;
    params.push(studentId);
  } else if (opportunityId) {
    sql += ` WHERE opportunity_id = ?`;
    params.push(opportunityId);
  }
  sql += ` ORDER BY created_at DESC`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    const mapped = rows.map(r => ({
      id: String(r.id),
      opportunityId: r.opportunity_id,
      studentId: r.student_id,
      studentName: r.student_name,
      message: r.message,
      status: r.status,
      answers: JSON.parse(r.answers || '[]'),
      cvFile: r.cv_file ? JSON.parse(r.cv_file) : undefined,
      transcriptFile: r.transcript_file ? JSON.parse(r.transcript_file) : undefined,
      professorReply: r.professor_reply || undefined,
      replyDate: r.reply_date || undefined,
      date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Today',
    }));
    return res.json({ applications: mapped });
  });
});

// Applications: create
app.post('/applications', (req, res) => {
  const { opportunityId, studentId, studentName, message, answers, cvFile, transcriptFile } = req.body;
  if (!opportunityId || !studentId) return res.status(400).json({ error: 'Missing required fields' });
  db.run(
    `INSERT INTO applications (opportunity_id,student_id,student_name,message,answers,cv_file,transcript_file) VALUES (?,?,?,?,?,?,?)`,
    [opportunityId, studentId, studentName, message,
     JSON.stringify(answers || []),
     cvFile ? JSON.stringify(cvFile) : null,
     transcriptFile ? JSON.stringify(transcriptFile) : null],
    function(err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      return res.json({ id: String(this.lastID) });
    }
  );
});

// Applications: update status + professor reply
app.patch('/applications/:id', (req, res) => {
  const { status, professorReply, replyDate } = req.body;
  db.run(
    `UPDATE applications SET status = ?, professor_reply = ?, reply_date = ? WHERE id = ?`,
    [status, professorReply || null, replyDate || null, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      return res.json({ ok: true });
    }
  );
});

// Admin: delete user by id or email
app.delete('/admin/users/:key', (req, res) => {
  const key = req.params.key;
  if (!key) return res.status(400).json({ error: 'Missing key' });
  const asNum = Number(key);
  if (!Number.isNaN(asNum) && String(asNum) === String(key)) {
    db.run(`DELETE FROM users WHERE id = ?`, [asNum], function(err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ ok: true });
    });
  } else {
    db.run(`DELETE FROM users WHERE email = ?`, [key], function(err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ ok: true });
    });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on port ${port}`));
