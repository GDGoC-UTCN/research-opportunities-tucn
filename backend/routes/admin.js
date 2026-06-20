const express = require('express');
const { all, run, get } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asString, isEmail } = require('../utils/validation');

const router = express.Router();

router.use('/admin', requireAuth, requireRole('admin'));

router.get('/admin/pending', asyncHandler(async (req, res) => {
  const rows = await all(
    "SELECT id,name,email,department FROM users WHERE role = 'professor' AND approved = 0 ORDER BY id ASC"
  );
  res.json({ pending: rows.map(row => ({ ...row, id: String(row.id) })) });
}));

router.get('/admin/users', asyncHandler(async (req, res) => {
  const rows = await all('SELECT id,name,email,role,department,approved FROM users ORDER BY role DESC, id ASC');
  res.json({
    users: rows.map(row => ({
      id: String(row.id),
      name: row.name,
      email: row.email,
      role: row.role,
      department: row.department || undefined,
      approved: !!row.approved,
    })),
  });
}));

router.post('/admin/approve', asyncHandler(async (req, res) => {
  const id = asString(req.body.id);
  const email = asString(req.body.email).toLowerCase();
  if (!id && !email) throw httpError(400, 'Missing id or email');
  if (id && !Number.isInteger(Number(id))) throw httpError(400, 'Invalid professor id');
  if (email && !isEmail(email)) throw httpError(400, 'Invalid professor email');

  const result = id
    ? await run("UPDATE users SET approved = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = 'professor'", [id])
    : await run("UPDATE users SET approved = 1, updated_at = CURRENT_TIMESTAMP WHERE email = ? AND role = 'professor'", [email]);

  if (result.changes === 0) throw httpError(404, 'Professor not found');
  res.json({ ok: true });
}));

router.delete('/admin/users/:key', asyncHandler(async (req, res) => {
  const key = asString(req.params.key);
  if (!key) throw httpError(400, 'Missing key');
  if (key === String(req.user.id) || key.toLowerCase() === req.user.email.toLowerCase()) {
    throw httpError(400, 'Admins cannot delete their own account from this screen');
  }

  const asNum = Number(key);
  const target = Number.isInteger(asNum) && String(asNum) === key
    ? await get('SELECT id,email,role FROM users WHERE id = ?', [asNum])
    : await get('SELECT id,email,role FROM users WHERE email = ?', [key.toLowerCase()]);

  if (!target) throw httpError(404, 'User not found');

  try {
    await run('BEGIN');
    if (target.role === 'professor') {
      await run(
        `DELETE FROM applications
         WHERE opportunity_id IN (SELECT id FROM opportunities WHERE author_id = ?)`,
        [String(target.id)]
      );
      await run('DELETE FROM opportunities WHERE author_id = ?', [String(target.id)]);
    } else if (target.role === 'student') {
      await run('DELETE FROM applications WHERE student_id = ?', [String(target.id)]);
    }
    await run('DELETE FROM users WHERE id = ?', [target.id]);
    await run('COMMIT');
  } catch (err) {
    await run('ROLLBACK').catch(() => {});
    throw err;
  }

  res.json({ ok: true });
}));

module.exports = router;
