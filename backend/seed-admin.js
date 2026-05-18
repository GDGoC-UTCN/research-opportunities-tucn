const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(DB_PATH);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@utcn.edu';
const ADMIN_PASS = process.env.ADMIN_PASS || 'adminpass';
const ADMIN_NAME = process.env.ADMIN_NAME || 'UTCN Admin';

db.serialize(() => {
  const hashed = bcrypt.hashSync(ADMIN_PASS, 10);
  db.get(`SELECT id FROM users WHERE email = ?`, [ADMIN_EMAIL], (err, row) => {
    if (err) { console.error(err); process.exit(1); }
    if (row) {
      console.log('Admin already exists, skipping');
      db.close();
      return;
    }
    db.run(`INSERT INTO users (name,email,role,password,approved) VALUES (?,?,?,?,1)`, [ADMIN_NAME, ADMIN_EMAIL, 'admin', hashed], function(err) {
      if (err) console.error('Insert error', err);
      else console.log('Admin seeded:', ADMIN_EMAIL);
      db.close();
    });
  });
});
