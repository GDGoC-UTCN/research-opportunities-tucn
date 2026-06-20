const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { run, get } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { cleanUser, validateSignup, validateLogin, asString } = require('../utils/validation');
const { COOKIE_NAME, cookieOptions, clearCookieOptions, signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
});

router.post('/signup', authLimiter, asyncHandler(async (req, res) => {
  const validationError = validateSignup(req.body);
  if (validationError) throw httpError(400, validationError);

  const name = asString(req.body.name);
  const email = asString(req.body.email).toLowerCase();
  const password = req.body.password;
  const role = asString(req.body.role);
  const department = asString(req.body.department) || null;
  const hashed = bcrypt.hashSync(password, 12);
  const approved = role === 'student' ? 1 : 0;

  try {
    const result = await run(
      'INSERT INTO users (name,email,role,department,password,approved) VALUES (?,?,?,?,?,?)',
      [name, email, role, department, hashed, approved]
    );
    const user = { id: String(result.lastID), name, email, role, department: department || undefined, approved: !!approved };

    if (role === 'student') {
      res.cookie(COOKIE_NAME, signToken(user), cookieOptions());
      return res.status(201).json({ user });
    }

    return res.status(201).json({ user, pendingApproval: true });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') throw httpError(409, 'An account with this email already exists');
    throw err;
  }
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const validationError = validateLogin(req.body);
  if (validationError) throw httpError(400, validationError);

  const email = asString(req.body.email).toLowerCase();
  const expectedRole = asString(req.body.role);
  const row = await get('SELECT id,name,email,role,department,password,approved FROM users WHERE email = ?', [email]);
  if (!row || !bcrypt.compareSync(req.body.password, row.password)) {
    throw httpError(401, 'Invalid credentials');
  }
  if (expectedRole && row.role !== expectedRole) {
    throw httpError(403, 'Account does not match selected role');
  }
  if (row.role === 'professor' && !row.approved) {
    throw httpError(403, 'Account awaiting approval');
  }

  const user = cleanUser(row);
  res.cookie(COOKIE_NAME, signToken(user), cookieOptions());
  res.json({ user });
}));

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, clearCookieOptions());
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
