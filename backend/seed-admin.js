const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(DB_PATH);

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'AIRI@campus.utcluj.ro').trim().toLowerCase();
const ADMIN_PASS = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASS;
const ADMIN_NAME = process.env.ADMIN_NAME || 'AIRi Admin';
const RESET_ADMIN_PASSWORD = process.env.RESET_ADMIN_PASSWORD === 'true';

db.serialize(() => {
  db.get(`SELECT id FROM users WHERE lower(email) = ?`, [ADMIN_EMAIL], (err, row) => {
    if (err) { console.error(err); process.exit(1); }
    if (row) {
      if (!RESET_ADMIN_PASSWORD) {
        console.log('Admin already exists, skipping password reset');
        db.close();
        return;
      }
      if (!ADMIN_PASS) {
        console.error('RESET_ADMIN_PASSWORD=true requires ADMIN_INITIAL_PASSWORD');
        db.close();
        process.exit(1);
      }
      const hashed = bcrypt.hashSync(ADMIN_PASS, 12);
      db.run(
        `UPDATE users SET name = ?, email = ?, role = 'admin', password = ?, approved = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [ADMIN_NAME, ADMIN_EMAIL, hashed, row.id],
        updateErr => {
          if (updateErr) console.error('Update error', updateErr);
          else console.log('Admin password reset:', ADMIN_EMAIL);
          db.close();
        }
      );
      return;
    }
    if (!ADMIN_PASS) {
      console.error('ADMIN_INITIAL_PASSWORD is required to seed a missing admin account');
      db.close();
      process.exit(1);
    }
    const hashed = bcrypt.hashSync(ADMIN_PASS, 12);
    db.run(`INSERT INTO users (name,email,role,password,approved) VALUES (?,?,?,?,1)`, [ADMIN_NAME, ADMIN_EMAIL, 'admin', hashed], function(err) {
      if (err) console.error('Insert error', err);
      else console.log('Admin seeded:', ADMIN_EMAIL);
      db.close();
    });
  });
});
