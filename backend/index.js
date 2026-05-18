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
