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
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
const bodyLimit = process.env.BODY_LIMIT || '16mb';

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === corsOrigin) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
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
