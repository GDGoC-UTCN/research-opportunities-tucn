require('dotenv').config({ quiet: true });
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const opportunityRoutes = require('./routes/opportunities');
const applicationRoutes = require('./routes/applications');
const { issueCsrfToken, requireCsrf } = require('./middleware/csrf');
const { notFound, errorHandler } = require('./utils/errors');

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters');
  }
}

requireJwtSecret();
initDb();

const app = express();
const defaultCorsOrigins = [
  'https://ro.utcluj.ro',
  'http://ro.utcluj.ro',
  'http://10.20.7.149:8080',
  'http://10.20.7.149',
  'http://localhost:8080',
  'http://localhost:3000',
].join(',');
const corsOrigins = (process.env.CORS_ORIGIN || defaultCorsOrigins)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const bodyLimit = process.env.BODY_LIMIT || '16mb';
const allowedCorsMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const allowedCorsHeaders = ['Content-Type', 'X-CSRF-Token', 'Authorization'];

function hostValues(req) {
  const values = [];
  const forwardedHost = req.get('x-forwarded-host');
  const host = req.get('host');
  if (forwardedHost) values.push(...forwardedHost.split(',').map(value => value.trim()));
  if (host) values.push(host.trim());
  return values.filter(Boolean);
}

function matchesProxiedHost(origin, req) {
  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return hostValues(req).some(host => parsed.host === host);
  } catch {
    return false;
  }
}

function corsOrigin(req, origin, callback) {
  if (!origin) return callback(null, true);
  if (corsOrigins.includes(origin)) return callback(null, true);
  if (matchesProxiedHost(origin, req)) return callback(null, true);

  const err = new Error('Origin not allowed by CORS');
  err.status = 403;
  return callback(err);
}

const baseCorsOptions = {
  credentials: true,
  methods: allowedCorsMethods,
  allowedHeaders: allowedCorsHeaders,
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204,
};

function corsOptionsDelegate(req, callback) {
  callback(null, {
    ...baseCorsOptions,
    origin(origin, originCallback) {
      return corsOrigin(req, origin, originCallback);
    },
  });
}

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(corsOptionsDelegate));
app.options('*', cors(corsOptionsDelegate));
app.use(cookieParser());
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ limit: bodyLimit, extended: true }));

app.get(['/health', '/api/health'], (req, res) => res.json({ ok: true }));
app.get(['/csrf-token', '/api/csrf-token'], issueCsrfToken);
app.use(requireCsrf);

const router = express.Router();
router.use(authRoutes);
router.use(adminRoutes);
router.use(opportunityRoutes);
router.use(applicationRoutes);

app.use(router);
app.use('/api', router);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on port ${port}`));
