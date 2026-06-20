const express = require('express');
const { all, run, get } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { requireAuth, requireRole, requireApprovedProfessor } = require('../middleware/auth');
const { validateApplication, validateStatusUpdate, asString } = require('../utils/validation');

const router = express.Router();

function parseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function mapApplication(r) {
  return {
    id: String(r.id),
    opportunityId: String(r.opportunity_id),
    studentId: String(r.student_id),
    studentName: r.student_name,
    message: r.message,
    status: r.status,
    answers: parseJson(r.answers, []),
    cvFile: r.cv_file ? parseJson(r.cv_file, undefined) : undefined,
    transcriptFile: r.transcript_file ? parseJson(r.transcript_file, undefined) : undefined,
    professorReply: r.professor_reply || undefined,
    replyDate: r.reply_date || undefined,
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Today',
  };
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

router.post('/applications', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  const validationError = validateApplication(req.body);
  if (validationError) throw httpError(400, validationError);

  const opportunityId = asString(req.body.opportunityId);
  const opportunity = await get('SELECT id,require_cv,require_transcript FROM opportunities WHERE id = ?', [opportunityId]);
  if (!opportunity) throw httpError(404, 'Opportunity not found');
  if (opportunity.require_cv && !req.body.cvFile) throw httpError(400, 'CV file is required');
  if (opportunity.require_transcript && !req.body.transcriptFile) throw httpError(400, 'Transcript file is required');

  const existing = await get(
    'SELECT id FROM applications WHERE opportunity_id = ? AND student_id = ?',
    [opportunityId, String(req.user.id)]
  );
  if (existing) throw httpError(409, 'You have already applied for this opportunity');

  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  const result = await run(
    'INSERT INTO applications (opportunity_id,student_id,student_name,message,answers,cv_file,transcript_file) VALUES (?,?,?,?,?,?,?)',
    [
      opportunityId,
      String(req.user.id),
      req.user.name,
      asString(req.body.message),
      JSON.stringify(answers),
      req.body.cvFile ? JSON.stringify(req.body.cvFile) : null,
      req.body.transcriptFile ? JSON.stringify(req.body.transcriptFile) : null,
    ]
  );

  res.status(201).json({ id: String(result.lastID) });
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
