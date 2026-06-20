const express = require('express');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { all, run, get } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { requireAuth, requireRole, requireApprovedProfessor } = require('../middleware/auth');
const { validateApplication, validateStatusUpdate, asString } = require('../utils/validation');
const { putObject, getObjectStream, deleteObject } = require('../services/storage');

const router = express.Router();
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 2,
    fields: 10,
  },
});

function parseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function mapApplication(r) {
  const cvFile = mapStoredFile(r, 'cv') || mapLegacyFile(r.cv_file);
  const transcriptFile = mapStoredFile(r, 'transcript') || mapLegacyFile(r.transcript_file);
  return {
    id: String(r.id),
    opportunityId: String(r.opportunity_id),
    studentId: String(r.student_id),
    studentName: r.student_name,
    message: r.message,
    status: r.status,
    answers: parseJson(r.answers, []),
    cvFile,
    transcriptFile,
    professorReply: r.professor_reply || undefined,
    replyDate: r.reply_date || undefined,
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Today',
  };
}

function mapStoredFile(row, kind) {
  const prefix = kind === 'cv' ? 'cv_file' : 'transcript_file';
  if (!row[`${prefix}_key`]) return undefined;
  return {
    name: row[`${prefix}_name`],
    size: row[`${prefix}_size`],
    type: row[`${prefix}_type`] || 'application/pdf',
    downloadUrl: `/api/applications/${row.id}/files/${kind}`,
    legacy: false,
  };
}

function mapLegacyFile(value) {
  if (!value) return undefined;
  const parsed = parseJson(value, undefined);
  if (!parsed) return undefined;
  return {
    name: parsed.name,
    size: parsed.size,
    type: parsed.type || 'application/pdf',
    dataUrl: parsed.dataUrl,
    legacy: true,
  };
}

function parseAnswers(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') throw httpError(400, 'Answers must be JSON');
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not array');
    return parsed;
  } catch {
    throw httpError(400, 'Answers must be a JSON array');
  }
}

function rejectUnexpectedFields(body) {
  const allowed = new Set([
    'opportunityId',
    'message',
    'answers',
    'useProfileCv',
    'useProfileTranscript',
    'saveUploadedCvToProfile',
    'saveUploadedTranscriptToProfile',
  ]);
  for (const key of Object.keys(body || {})) {
    if (!allowed.has(key)) throw httpError(400, `Unexpected field: ${key}`);
  }
}

function sanitizeFilename(filename) {
  const base = path.basename(filename || 'document.pdf').replace(/[^\w.\- ()]/g, '_');
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
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

function applicationUpload(req, res, next) {
  upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'transcript', maxCount: 1 },
  ])(req, res, err => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(httpError(400, `Files must be at most ${process.env.MAX_UPLOAD_MB || 5} MB`));
      if (err.code === 'LIMIT_UNEXPECTED_FILE') return next(httpError(400, 'Unexpected upload field'));
      return next(httpError(400, 'Invalid upload'));
    }
    next(err);
  });
}

async function uploadApplicationFile(applicationId, file, kind) {
  if (!file) return null;
  const filename = sanitizeFilename(file.originalname);
  const key = `applications/${applicationId}/${crypto.randomUUID()}-${kind}.pdf`;
  await putObject({
    key,
    body: file.buffer,
    contentType: 'application/pdf',
  });
  return {
    key,
    name: filename,
    size: file.size,
    type: 'application/pdf',
  };
}

async function uploadProfileFile(userId, file, kind) {
  if (!file) return null;
  const filename = sanitizeFilename(file.originalname);
  const key = `profiles/${userId}/${kind}/${crypto.randomUUID()}.pdf`;
  await putObject({
    key,
    body: file.buffer,
    contentType: 'application/pdf',
  });
  return {
    key,
    name: filename,
    size: file.size,
    type: 'application/pdf',
  };
}

function fieldIsTrue(value) {
  return value === true || value === 'true' || value === '1';
}

async function ensureProfile(userId) {
  await run(
    `INSERT INTO user_profiles (user_id, created_at, updated_at)
     VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO NOTHING`,
    [String(userId)]
  );
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

function profileFileMeta(profile, kind) {
  const prefix = kind === 'cv' ? 'cv_file' : 'transcript_file';
  if (!profile?.[`${prefix}_key`]) return null;
  return {
    key: profile[`${prefix}_key`],
    name: profile[`${prefix}_name`],
    size: profile[`${prefix}_size`],
    type: profile[`${prefix}_type`] || 'application/pdf',
  };
}

async function saveProfileDocument(userId, kind, meta, previousKey) {
  await ensureProfile(userId);
  const prefix = kind === 'cv' ? 'cv_file' : 'transcript_file';
  await run(
    `UPDATE user_profiles
     SET ${prefix}_key = ?, ${prefix}_name = ?, ${prefix}_size = ?, ${prefix}_type = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [meta.key, meta.name, meta.size, meta.type, String(userId)]
  );
  await deleteIfUnreferenced(previousKey);
}

function contentDisposition(filename) {
  const fallback = sanitizeFilename(filename).replace(/"/g, '');
  const encoded = encodeURIComponent(fallback);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

async function getAuthorizedApplication(req) {
  const row = await get(
    `SELECT a.*, o.author_id
     FROM applications a
     LEFT JOIN opportunities o ON o.id = a.opportunity_id
     WHERE a.id = ?`,
    [req.params.id]
  );
  if (!row) throw httpError(404, 'Application not found');

  const isStudentOwner = req.user.role === 'student' && String(row.student_id) === String(req.user.id);
  const isProfessorOwner = req.user.role === 'professor' && String(row.author_id) === String(req.user.id);
  const isAdmin = req.user.role === 'admin';
  if (!isStudentOwner && !isProfessorOwner && !isAdmin) throw httpError(403, 'Forbidden');
  return row;
}

router.get('/applications', requireAuth, asyncHandler(async (req, res) => {
  const params = [];
  let sql = 'SELECT a.* FROM applications a';

  if (req.user.role === 'student') {
    sql += ' WHERE a.student_id = ?';
    params.push(String(req.user.id));
  } else if (req.user.role === 'professor') {
    sql += ' INNER JOIN opportunities o ON o.id = a.opportunity_id WHERE o.author_id = ?';
    params.push(String(req.user.id));
  } else if (req.user.role !== 'admin') {
    throw httpError(403, 'Forbidden');
  }

  const opportunityId = asString(req.query.opportunityId);
  if (opportunityId) {
    sql += params.length ? ' AND a.opportunity_id = ?' : ' WHERE a.opportunity_id = ?';
    params.push(opportunityId);
  }

  sql += ' ORDER BY a.created_at DESC';
  const rows = await all(sql, params);
  res.json({ applications: rows.map(mapApplication) });
}));

router.post('/applications', requireAuth, requireRole('student'), applicationUpload, asyncHandler(async (req, res) => {
  rejectUnexpectedFields(req.body);
  const answers = parseAnswers(req.body.answers);
  const validationError = validateApplication({ ...req.body, answers });
  if (validationError) throw httpError(400, validationError);

  const opportunityId = asString(req.body.opportunityId);
  const opportunity = await get('SELECT id,require_cv,require_transcript FROM opportunities WHERE id = ?', [opportunityId]);
  if (!opportunity) throw httpError(404, 'Opportunity not found');
  const cvFile = req.files?.cv?.[0];
  const transcriptFile = req.files?.transcript?.[0];
  const useProfileCv = fieldIsTrue(req.body.useProfileCv);
  const useProfileTranscript = fieldIsTrue(req.body.useProfileTranscript);
  const saveUploadedCvToProfile = fieldIsTrue(req.body.saveUploadedCvToProfile);
  const saveUploadedTranscriptToProfile = fieldIsTrue(req.body.saveUploadedTranscriptToProfile);
  if (useProfileCv && cvFile) throw httpError(400, 'Choose either saved profile CV or uploaded CV, not both');
  if (useProfileTranscript && transcriptFile) throw httpError(400, 'Choose either saved profile transcript or uploaded transcript, not both');
  if (saveUploadedCvToProfile && !cvFile) throw httpError(400, 'Upload a CV before saving it to profile');
  if (saveUploadedTranscriptToProfile && !transcriptFile) throw httpError(400, 'Upload a transcript before saving it to profile');
  const fileError = validatePdfUpload(cvFile, 'CV file') || validatePdfUpload(transcriptFile, 'Transcript file');
  if (fileError) throw httpError(400, fileError);

  const profile = await get('SELECT * FROM user_profiles WHERE user_id = ?', [String(req.user.id)]);
  const profileCvMeta = useProfileCv ? profileFileMeta(profile, 'cv') : null;
  const profileTranscriptMeta = useProfileTranscript ? profileFileMeta(profile, 'transcript') : null;
  if (useProfileCv && !profileCvMeta) throw httpError(400, 'No saved profile CV is available');
  if (useProfileTranscript && !profileTranscriptMeta) throw httpError(400, 'No saved profile transcript is available');
  if (opportunity.require_cv && !cvFile && !profileCvMeta) throw httpError(400, 'CV file is required');
  if (opportunity.require_transcript && !transcriptFile && !profileTranscriptMeta) throw httpError(400, 'Transcript file is required');

  const existing = await get(
    'SELECT id FROM applications WHERE opportunity_id = ? AND student_id = ?',
    [opportunityId, String(req.user.id)]
  );
  if (existing) throw httpError(409, 'You have already applied for this opportunity');

  const result = await run(
    'INSERT INTO applications (opportunity_id,student_id,student_name,message,answers) VALUES (?,?,?,?,?)',
    [
      opportunityId,
      String(req.user.id),
      req.user.name,
      asString(req.body.message),
      JSON.stringify(answers),
    ]
  );
  const applicationId = String(result.lastID);
  const uploaded = [];
  const profileUploaded = [];

  try {
    const cvMeta = profileCvMeta || await uploadApplicationFile(applicationId, cvFile, 'cv');
    if (cvMeta) uploaded.push(cvMeta.key);
    const transcriptMeta = profileTranscriptMeta || await uploadApplicationFile(applicationId, transcriptFile, 'transcript');
    if (transcriptMeta) uploaded.push(transcriptMeta.key);

    let profileCvCopy = null;
    let profileTranscriptCopy = null;
    if (saveUploadedCvToProfile && cvFile) {
      profileCvCopy = await uploadProfileFile(req.user.id, cvFile, 'cv');
      profileUploaded.push(profileCvCopy.key);
    }
    if (saveUploadedTranscriptToProfile && transcriptFile) {
      profileTranscriptCopy = await uploadProfileFile(req.user.id, transcriptFile, 'transcript');
      profileUploaded.push(profileTranscriptCopy.key);
    }

    await run(
      `UPDATE applications
       SET cv_file_key = ?, cv_file_name = ?, cv_file_size = ?, cv_file_type = ?,
           transcript_file_key = ?, transcript_file_name = ?, transcript_file_size = ?, transcript_file_type = ?
       WHERE id = ?`,
      [
        cvMeta?.key || null,
        cvMeta?.name || null,
        cvMeta?.size || null,
        cvMeta?.type || null,
        transcriptMeta?.key || null,
        transcriptMeta?.name || null,
        transcriptMeta?.size || null,
        transcriptMeta?.type || null,
        applicationId,
      ]
    );

    if (profileCvCopy) {
      await saveProfileDocument(req.user.id, 'cv', profileCvCopy, profile?.cv_file_key);
    }
    if (profileTranscriptCopy) {
      await saveProfileDocument(req.user.id, 'transcript', profileTranscriptCopy, profile?.transcript_file_key);
    }

    await run(
      'DELETE FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?',
      [String(req.user.id), opportunityId]
    ).catch(err => {
      console.error('Failed to remove saved opportunity after application submission', err);
    });

    return res.status(201).json({ id: applicationId });
  } catch (err) {
    const ownApplicationUploads = uploaded.filter(key => key.startsWith(`applications/${applicationId}/`));
    await Promise.all([...ownApplicationUploads, ...profileUploaded].map(key => deleteObject(key).catch(() => {})));
    await run('DELETE FROM applications WHERE id = ?', [applicationId]).catch(() => {});
    throw err;
  }
}));

router.get('/applications/:id/files/:kind', requireAuth, asyncHandler(async (req, res) => {
  const kind = req.params.kind;
  if (!['cv', 'transcript'].includes(kind)) throw httpError(404, 'File not found');
  const application = await getAuthorizedApplication(req);
  const prefix = kind === 'cv' ? 'cv_file' : 'transcript_file';
  const key = application[`${prefix}_key`];
  const name = application[`${prefix}_name`];
  const legacy = kind === 'cv' ? mapLegacyFile(application.cv_file) : mapLegacyFile(application.transcript_file);

  if (!key && legacy?.dataUrl) {
    const [meta, base64] = legacy.dataUrl.split(',');
    if (!base64 || !meta.startsWith('data:application/pdf;base64')) throw httpError(404, 'File not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition(legacy.name || `${kind}.pdf`));
    return res.send(Buffer.from(base64, 'base64'));
  }

  if (!key) throw httpError(404, 'File not found');
  let stream;
  try {
    stream = await getObjectStream(key);
  } catch {
    throw httpError(404, 'File not found');
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', contentDisposition(name || `${kind}.pdf`));
  stream.on('error', () => {
    if (!res.headersSent) res.status(404).json({ error: 'File not found' });
    else res.destroy();
  });
  stream.pipe(res);
}));

router.patch('/applications/:id', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const validationError = validateStatusUpdate(req.body);
  if (validationError) throw httpError(400, validationError);

  const application = await get(
    `SELECT a.id, o.author_id
     FROM applications a
     INNER JOIN opportunities o ON o.id = a.opportunity_id
     WHERE a.id = ?`,
    [req.params.id]
  );
  if (!application) throw httpError(404, 'Application not found');
  if (String(application.author_id) !== String(req.user.id)) {
    throw httpError(403, 'Cannot update applications for another professor');
  }

  await run(
    'UPDATE applications SET status = ?, professor_reply = ?, reply_date = ? WHERE id = ?',
    [
      asString(req.body.status),
      asString(req.body.professorReply) || null,
      asString(req.body.replyDate) || new Date().toLocaleDateString(),
      req.params.id,
    ]
  );

  res.json({ ok: true });
}));

module.exports = router;
