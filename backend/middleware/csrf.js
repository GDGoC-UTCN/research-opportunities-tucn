const crypto = require('crypto');
const { httpError } = require('../utils/errors');

const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'tucn_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getSecret() {
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('CSRF_SECRET or JWT_SECRET must be set to at least 32 characters');
  }
  return secret;
}

function csrfCookieOptions() {
  const sameSite = process.env.COOKIE_SAME_SITE === 'strict' ? 'strict' : 'lax';
  return {
    httpOnly: false,
    sameSite,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Number(process.env.CSRF_COOKIE_MAX_AGE_MS || 2 * 60 * 60 * 1000),
  };
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function createCsrfToken() {
  const nonce = crypto.randomBytes(32).toString('base64url');
  return `${nonce}.${sign(nonce)}`;
}

function isValidToken(token) {
  if (typeof token !== 'string') return false;
  const [nonce, signature] = token.split('.');
  if (!nonce || !signature) return false;
  const expected = sign(nonce);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function issueCsrfToken(req, res) {
  const existing = req.cookies?.[CSRF_COOKIE_NAME];
  const token = isValidToken(existing) ? existing : createCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions());
  res.json({ csrfToken: token });
}

function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);
  if (!cookieToken || !headerToken || cookieToken !== headerToken || !isValidToken(cookieToken)) {
    return next(httpError(403, 'Invalid CSRF token'));
  }
  next();
}

module.exports = {
  CSRF_COOKIE_NAME,
  csrfCookieOptions,
  createCsrfToken,
  issueCsrfToken,
  requireCsrf,
};
