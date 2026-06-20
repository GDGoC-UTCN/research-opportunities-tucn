const jwt = require('jsonwebtoken');
const { get } = require('../db');
const { httpError, asyncHandler } = require('../utils/errors');
const { cleanUser } = require('../utils/validation');

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'tucn_auth';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_MAX_AGE_MS = Number(process.env.COOKIE_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000);

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters');
  }
  return secret;
}

function cookieOptions() {
  const sameSite = process.env.COOKIE_SAME_SITE === 'strict' ? 'strict' : 'lax';
  return {
    httpOnly: true,
    sameSite,
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

function clearCookieOptions() {
  const { maxAge, ...options } = cookieOptions();
  return options;
}

function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function readToken(req) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const auth = req.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

const requireAuth = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (!token) throw httpError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch {
    throw httpError(401, 'Invalid or expired token');
  }

  const row = await get('SELECT id,name,email,role,department,approved FROM users WHERE id = ?', [payload.sub]);
  if (!row) throw httpError(401, 'User no longer exists');

  req.user = cleanUser(row);
  next();
});

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(httpError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) return next(httpError(403, 'Forbidden'));
    next();
  };
}

function requireApprovedProfessor(req, res, next) {
  if (!req.user) return next(httpError(401, 'Authentication required'));
  if (req.user.role !== 'professor') return next(httpError(403, 'Professor account required'));
  if (!req.user.approved) return next(httpError(403, 'Professor account awaiting approval'));
  next();
}

module.exports = {
  COOKIE_NAME,
  cookieOptions,
  clearCookieOptions,
  signToken,
  requireAuth,
  requireRole,
  requireApprovedProfessor,
};
