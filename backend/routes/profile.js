const express = require('express');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { all, get, run } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asString } = require('../utils/validation');
const { putObject, getObjectStream, deleteObject } = require('../services/storage');

const router = express.Router();
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024;
const PROFILE_IMAGE_MAX_BYTES = Number(process.env.PROFILE_IMAGE_MAX_MB || 2) * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Math.max(MAX_UPLOAD_BYTES, PROFILE_IMAGE_MAX_BYTES),
    files: 2,
    fields: 10,
  },
});

function sanitizeFilename(filename, fallback) {
  return path.basename(filename || fallback).replace(/[^\w.\- ()]/g, '_');
}

function contentDisposition(filename) {
  const fallback = sanitizeFilename(filename, 'document').replace(/"/g, '');
  const encoded = encodeURIComponent(fallback);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

function mapProfile(row, user) {
  const avatar = row?.avatar_file_key ? {
    name: row.avatar_file_name,
    size: row.avatar_file_size,
    type: row.avatar_file_type,
    downloadUrl: '/api/profile/avatar',
  } : undefined;

  const cvFile = row?.cv_file_key ? {
    name: row.cv_file_name,
    size: row.cv_file_size,
    type: row.cv_file_type || 'application/pdf',
    downloadUrl: '/api/profile/documents/cv',
  } : undefined;

  const transcriptFile = row?.transcript_file_key ? {
    name: row.transcript_file_name,
    size: row.transcript_file_size,
    type: row.transcript_file_type || 'application/pdf',
    downloadUrl: '/api/profile/documents/transcript',
  } : undefined;

  return {
    user: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      approved: user.approved,
    },
    linkedinUrl: row?.linkedin_url || '',
    avatar,
    cvFile,
    transcriptFile,
  };
}

function parseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function mapOpportunity(row) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    abstract: row.abstract,
    stipend: row.stipend,
    duration: row.duration,
    deadline: row.deadline || 'December 31, 2026',
    postDate: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Today',
    tags: parseJson(row.tags, []),
    applicationFields: parseJson(row.application_fields, []),
    requireCv: !!row.require_cv,
    requireTranscript: !!row.require_transcript,
    requirements: { technical: ['To be specified'], eligibility: ['To be specified'] },
    author: {
      id: String(row.author_id),
      name: row.author_name,
      department: row.author_department,
      avatar: row.author_avatar,
    },
  };
}

function mapApplicationSummary(row) {
  return {
    id: String(row.application_id),
    opportunityId: String(row.id),
    status: row.status,
    date: row.application_created_at ? new Date(row.application_created_at).toLocaleDateString() : 'Today',
    professorReply: row.professor_reply || undefined,
    replyDate: row.reply_date || undefined,
  };
}

async function getProfileRow(userId) {
  return get('SELECT * FROM user_profiles WHERE user_id = ?', [String(userId)]);
}

async function ensureProfile(userId) {
  await run(
    `INSERT INTO user_profiles (user_id, created_at, updated_at)
     VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO NOTHING`,
    [String(userId)]
  );
}

function validateLinkedInUrl(value) {
  if (!value) return null;
  if (value.length > 300) return 'LinkedIn URL must be under 300 characters';
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return 'LinkedIn URL must be a valid URL';
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return 'LinkedIn URL must use http or https';
  const host = parsed.hostname.toLowerCase();
  if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) return 'LinkedIn URL must be a LinkedIn URL';
  return null;
}

function validatePdfUpload(file, label) {
  if (!file) return null;
  const originalName = file.originalname || '';
  if (file.mimetype !== 'application/pdf') return `${label} must be a PDF`;
  if (!originalName.toLowerCase().endsWith('.pdf')) return `${label} must have a .pdf extension`;
  if (!file.buffer || file.buffer.length < 4 || file.buffer.subarray(0, 4).toString() !== '%PDF') {
    return `${label} content is not a valid PDF`;
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) return `${label} must be at most ${process.env.MAX_UPLOAD_MB || 5} MB`;
  return null;
}

function validateAvatarUpload(file) {
  if (!file) return 'Avatar image is required';
  const originalName = (file.originalname || '').toLowerCase();
  const allowed = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  };
  const extensions = allowed[file.mimetype];
  if (!extensions) return 'Avatar must be a JPEG, PNG, or WebP image';
  if (!extensions.some(ext => originalName.endsWith(ext))) return 'Avatar file extension does not match its type';
  if (file.size <= 0 || file.size > PROFILE_IMAGE_MAX_BYTES) return `Avatar must be at most ${process.env.PROFILE_IMAGE_MAX_MB || 2} MB`;
  if (file.mimetype === 'image/jpeg' && !(file.buffer[0] === 0xff && file.buffer[1] === 0xd8)) return 'Avatar content is not a valid JPEG';
  if (file.mimetype === 'image/png' && file.buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return 'Avatar content is not a valid PNG';
  if (file.mimetype === 'image/webp' && (file.buffer.subarray(0, 4).toString() !== 'RIFF' || file.buffer.subarray(8, 12).toString() !== 'WEBP')) return 'Avatar content is not a valid WebP';
  return null;
}

function profileUpload(fields) {
  return (req, res, next) => {
    upload.fields(fields)(req, res, err => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return next(httpError(400, 'Uploaded file is too large'));
        if (err.code === 'LIMIT_UNEXPECTED_FILE') return next(httpError(400, 'Unexpected upload field'));
        return next(httpError(400, 'Invalid upload'));
      }
      next(err);
    });
  };
}

function extForMime(type) {
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'bin';
}

async function objectReferencedByApplication(key) {
  if (!key) return false;
  const row = await get(
    `SELECT id FROM applications
     WHERE cv_file_key = ? OR transcript_file_key = ?
     LIMIT 1`,
    [key, key]
  );
  return !!row;
}

async function deleteIfUnreferenced(key) {
  if (!key) return;
  if (await objectReferencedByApplication(key)) return;
  await deleteObject(key).catch(() => {});
}

async function streamFile(res, key, name, type) {
  if (!key) throw httpError(404, 'File not found');
  let stream;
  try {
    stream = await getObjectStream(key);
  } catch {
    throw httpError(404, 'File not found');
  }
  res.setHeader('Content-Type', type || 'application/octet-stream');
  res.setHeader('Content-Disposition', contentDisposition(name || 'download'));
  stream.on('error', () => {
    if (!res.headersSent) res.status(404).json({ error: 'File not found' });
    else res.destroy();
  });
  stream.pipe(res);
}

router.get('/profile', requireAuth, asyncHandler(async (req, res) => {
  const row = await getProfileRow(req.user.id);
  res.json({ profile: mapProfile(row, req.user) });
}));

router.get('/profile/saved-opportunities', requireAuth, asyncHandler(async (req, res) => {
  const rows = await all(
    `SELECT saved_opportunities.id AS saved_id,
            saved_opportunities.created_at AS saved_at,
            opportunities.*
     FROM saved_opportunities
     JOIN opportunities ON opportunities.id = saved_opportunities.opportunity_id
     WHERE saved_opportunities.user_id = ?
     ORDER BY saved_opportunities.created_at DESC`,
    [String(req.user.id)]
  );

  res.json({
    savedOpportunities: rows.map(row => ({
      id: String(row.saved_id),
      savedAt: row.saved_at,
      opportunity: mapOpportunity(row),
    })),
  });
}));

router.get('/profile/my-opportunities', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  const savedRows = await all(
    `SELECT saved_opportunities.id AS saved_id,
            saved_opportunities.created_at AS saved_at,
            opportunities.*
     FROM saved_opportunities
     JOIN opportunities ON opportunities.id = saved_opportunities.opportunity_id
     WHERE saved_opportunities.user_id = ?
       AND NOT EXISTS (
         SELECT 1 FROM applications
         WHERE applications.student_id = saved_opportunities.user_id
           AND applications.opportunity_id = saved_opportunities.opportunity_id
       )
     ORDER BY saved_opportunities.created_at DESC`,
    [String(req.user.id)]
  );

  const applicationRows = await all(
    `SELECT opportunities.*,
            applications.id AS application_id,
            applications.status,
            applications.created_at AS application_created_at,
            applications.professor_reply,
            applications.reply_date
     FROM applications
     JOIN opportunities ON opportunities.id = applications.opportunity_id
     WHERE applications.student_id = ?
     ORDER BY applications.created_at DESC`,
    [String(req.user.id)]
  );

  const response = {
    saved: savedRows.map(row => ({
      id: String(row.saved_id),
      savedAt: row.saved_at,
      path: `/opportunities/${row.id}`,
      opportunity: mapOpportunity(row),
    })),
    applied: [],
    accepted: [],
    rejected: [],
  };

  for (const row of applicationRows) {
    const status = row.status === 'accepted' || row.status === 'rejected' ? row.status : 'pending';
    const item = {
      id: String(row.application_id),
      path: `/opportunities/${row.id}`,
      opportunity: mapOpportunity(row),
      application: mapApplicationSummary(row),
    };
    if (status === 'accepted') response.accepted.push(item);
    else if (status === 'rejected') response.rejected.push(item);
    else response.applied.push(item);
  }

  res.json(response);
}));

router.post('/profile/saved-opportunities/:opportunityId', requireAuth, asyncHandler(async (req, res) => {
  const opportunityId = asString(req.params.opportunityId);
  if (!opportunityId) throw httpError(400, 'Missing opportunity id');
  const opportunity = await get('SELECT id FROM opportunities WHERE id = ?', [opportunityId]);
  if (!opportunity) throw httpError(404, 'Opportunity not found');

  const application = await get(
    'SELECT status FROM applications WHERE opportunity_id = ? AND student_id = ?',
    [opportunityId, String(req.user.id)]
  );
  if (application) {
    await run(
      'DELETE FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?',
      [String(req.user.id), opportunityId]
    ).catch(() => {});
    return res.json({
      saved: false,
      alreadyApplied: true,
      status: application.status,
      opportunityId: String(opportunity.id),
    });
  }

  await run(
    `INSERT INTO saved_opportunities (user_id, opportunity_id, created_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, opportunity_id) DO NOTHING`,
    [String(req.user.id), opportunityId]
  );

  res.status(201).json({ saved: true, opportunityId: String(opportunity.id) });
}));

router.delete('/profile/saved-opportunities/:opportunityId', requireAuth, asyncHandler(async (req, res) => {
  const opportunityId = asString(req.params.opportunityId);
  if (!opportunityId) throw httpError(400, 'Missing opportunity id');
  await run(
    'DELETE FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?',
    [String(req.user.id), opportunityId]
  );
  res.json({ saved: false, opportunityId });
}));

router.patch('/profile', requireAuth, asyncHandler(async (req, res) => {
  const allowed = new Set(['name', 'department', 'linkedinUrl']);
  for (const key of Object.keys(req.body || {})) {
    if (!allowed.has(key)) throw httpError(400, `Unexpected field: ${key}`);
  }

  const name = asString(req.body.name);
  const department = asString(req.body.department);
  const linkedinUrl = asString(req.body.linkedinUrl);
  if (req.body.name !== undefined && (!name || name.length > 120)) throw httpError(400, 'Name is required and must be under 120 characters');
  if (req.body.department !== undefined && department.length > 160) throw httpError(400, 'Department must be under 160 characters');
  const linkedinError = validateLinkedInUrl(linkedinUrl);
  if (linkedinError) throw httpError(400, linkedinError);

  if (req.body.name !== undefined || req.body.department !== undefined) {
    await run(
      'UPDATE users SET name = COALESCE(?, name), department = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        req.body.name !== undefined ? name : null,
        req.body.department !== undefined ? department || null : req.user.department || null,
        req.user.id,
      ]
    );
  }

  await ensureProfile(req.user.id);
  if (req.body.linkedinUrl !== undefined) {
    await run(
      'UPDATE user_profiles SET linkedin_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [linkedinUrl || null, String(req.user.id)]
    );
  }

  const user = await get('SELECT id,name,email,role,department,approved FROM users WHERE id = ?', [req.user.id]);
  const row = await getProfileRow(req.user.id);
  res.json({ profile: mapProfile(row, { ...user, approved: !!user.approved }) });
}));

router.post('/profile/avatar', requireAuth, profileUpload([{ name: 'avatar', maxCount: 1 }]), asyncHandler(async (req, res) => {
  const file = req.files?.avatar?.[0];
  const error = validateAvatarUpload(file);
  if (error) throw httpError(400, error);

  const existing = await getProfileRow(req.user.id);
  const ext = extForMime(file.mimetype);
  const name = sanitizeFilename(file.originalname, `avatar.${ext}`);
  const key = `profiles/${req.user.id}/avatar/${crypto.randomUUID()}.${ext}`;
  await putObject({ key, body: file.buffer, contentType: file.mimetype });

  await ensureProfile(req.user.id);
  await run(
    `UPDATE user_profiles
     SET avatar_file_key = ?, avatar_file_name = ?, avatar_file_size = ?, avatar_file_type = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [key, name, file.size, file.mimetype, String(req.user.id)]
  );
  await deleteIfUnreferenced(existing?.avatar_file_key);

  const row = await getProfileRow(req.user.id);
  res.status(201).json({ profile: mapProfile(row, req.user) });
}));

router.get('/profile/avatar', requireAuth, asyncHandler(async (req, res) => {
  const row = await getProfileRow(req.user.id);
  await streamFile(res, row?.avatar_file_key, row?.avatar_file_name || 'avatar', row?.avatar_file_type || 'application/octet-stream');
}));

router.post('/profile/documents', requireAuth, profileUpload([
  { name: 'cv', maxCount: 1 },
  { name: 'transcript', maxCount: 1 },
]), asyncHandler(async (req, res) => {
  const cvFile = req.files?.cv?.[0];
  const transcriptFile = req.files?.transcript?.[0];
  if (!cvFile && !transcriptFile) throw httpError(400, 'Upload a CV or transcript');
  const fileError = validatePdfUpload(cvFile, 'CV file') || validatePdfUpload(transcriptFile, 'Transcript file');
  if (fileError) throw httpError(400, fileError);

  const existing = await getProfileRow(req.user.id);
  const uploaded = [];
  let cvMeta = null;
  let transcriptMeta = null;
  try {
    if (cvFile) {
      cvMeta = {
        key: `profiles/${req.user.id}/cv/${crypto.randomUUID()}.pdf`,
        name: sanitizeFilename(cvFile.originalname, 'cv.pdf'),
        size: cvFile.size,
        type: 'application/pdf',
      };
      await putObject({ key: cvMeta.key, body: cvFile.buffer, contentType: 'application/pdf' });
      uploaded.push(cvMeta.key);
    }
    if (transcriptFile) {
      transcriptMeta = {
        key: `profiles/${req.user.id}/transcript/${crypto.randomUUID()}.pdf`,
        name: sanitizeFilename(transcriptFile.originalname, 'transcript.pdf'),
        size: transcriptFile.size,
        type: 'application/pdf',
      };
      await putObject({ key: transcriptMeta.key, body: transcriptFile.buffer, contentType: 'application/pdf' });
      uploaded.push(transcriptMeta.key);
    }

    await ensureProfile(req.user.id);
    if (cvMeta) {
      await run(
        `UPDATE user_profiles
         SET cv_file_key = ?, cv_file_name = ?, cv_file_size = ?, cv_file_type = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [cvMeta.key, cvMeta.name, cvMeta.size, cvMeta.type, String(req.user.id)]
      );
      await deleteIfUnreferenced(existing?.cv_file_key);
    }
    if (transcriptMeta) {
      await run(
        `UPDATE user_profiles
         SET transcript_file_key = ?, transcript_file_name = ?, transcript_file_size = ?, transcript_file_type = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [transcriptMeta.key, transcriptMeta.name, transcriptMeta.size, transcriptMeta.type, String(req.user.id)]
      );
      await deleteIfUnreferenced(existing?.transcript_file_key);
    }

    const row = await getProfileRow(req.user.id);
    res.status(201).json({ profile: mapProfile(row, req.user) });
  } catch (err) {
    await Promise.all(uploaded.map(key => deleteObject(key).catch(() => {})));
    throw err;
  }
}));

router.get('/profile/documents/:kind', requireAuth, asyncHandler(async (req, res) => {
  const kind = req.params.kind;
  if (!['cv', 'transcript'].includes(kind)) throw httpError(404, 'File not found');
  const row = await getProfileRow(req.user.id);
  const prefix = kind === 'cv' ? 'cv_file' : 'transcript_file';
  await streamFile(res, row?.[`${prefix}_key`], row?.[`${prefix}_name`] || `${kind}.pdf`, 'application/pdf');
}));

router.delete('/profile/documents/:kind', requireAuth, asyncHandler(async (req, res) => {
  const kind = req.params.kind;
  if (!['cv', 'transcript'].includes(kind)) throw httpError(404, 'File not found');
  const row = await getProfileRow(req.user.id);
  const prefix = kind === 'cv' ? 'cv_file' : 'transcript_file';
  const key = row?.[`${prefix}_key`];

  await ensureProfile(req.user.id);
  await run(
    `UPDATE user_profiles
     SET ${prefix}_key = NULL, ${prefix}_name = NULL, ${prefix}_size = NULL, ${prefix}_type = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [String(req.user.id)]
  );
  await deleteIfUnreferenced(key);
  const updated = await getProfileRow(req.user.id);
  res.json({ profile: mapProfile(updated, req.user) });
}));

module.exports = router;
