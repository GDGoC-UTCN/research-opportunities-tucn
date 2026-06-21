const express = require('express');
const { all, run, get } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { requireAuth, requireApprovedProfessor } = require('../middleware/auth');
const { validateOpportunity, asString } = require('../utils/validation');
const { deleteApplicationObjectsForOpportunity } = require('../utils/fileCleanup');

const router = express.Router();

function parseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

// Public listings only ever expose opportunities authored by an approved
// professor. author_id is stored as TEXT while users.id is an INTEGER, so both
// sides are cast to TEXT for a safe comparison. The join also lets us return
// the professor's current name/department rather than the values copied onto
// the opportunity row at creation time.
const APPROVED_AUTHOR_FROM = `
  FROM opportunities o
  JOIN users u ON CAST(o.author_id AS TEXT) = CAST(u.id AS TEXT)
  WHERE u.role = 'professor' AND u.approved = 1
`;
const APPROVED_AUTHOR_SELECT = `
  SELECT o.*,
         u.id AS approved_author_id,
         u.name AS approved_author_name,
         u.department AS approved_author_department
`;

function mapOpportunity(r) {
  // Prefer the joined approved-professor identity when present (public routes),
  // falling back to the denormalized author_* columns otherwise.
  const authorId = r.approved_author_id != null ? r.approved_author_id : r.author_id;
  const authorName = r.approved_author_name != null ? r.approved_author_name : r.author_name;
  const authorDepartment = r.approved_author_department != null ? r.approved_author_department : r.author_department;
  return {
    id: String(r.id),
    title: r.title,
    description: r.description,
    abstract: r.abstract,
    stipend: r.stipend,
    duration: r.duration,
    deadline: r.deadline || 'December 31, 2026',
    postDate: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Today',
    tags: parseJson(r.tags, []),
    applicationFields: parseJson(r.application_fields, []),
    requireCv: !!r.require_cv,
    requireTranscript: !!r.require_transcript,
    requirements: { technical: ['To be specified'], eligibility: ['To be specified'] },
    author: {
      id: String(authorId),
      name: authorName,
      department: authorDepartment,
      avatar: r.author_avatar || `https://picsum.photos/seed/${encodeURIComponent(authorName || 'professor')}/100/100`,
    },
  };
}

router.get('/opportunities', asyncHandler(async (req, res) => {
  const rows = await all(`${APPROVED_AUTHOR_SELECT} ${APPROVED_AUTHOR_FROM} ORDER BY o.created_at DESC`);
  res.json({ opportunities: rows.map(mapOpportunity) });
}));

router.get('/opportunities/:id', asyncHandler(async (req, res) => {
  // Return 404 for both missing opportunities and those whose author is not an
  // approved professor, so unapproved/orphaned posts are never exposed publicly.
  const row = await get(`${APPROVED_AUTHOR_SELECT} ${APPROVED_AUTHOR_FROM} AND o.id = ?`, [req.params.id]);
  if (!row) throw httpError(404, 'Opportunity not found');
  res.json({ opportunity: mapOpportunity(row) });
}));

router.post('/opportunities', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const validationError = validateOpportunity(req.body);
  if (validationError) throw httpError(400, validationError);

  const tags = Array.isArray(req.body.tags) ? req.body.tags.map(asString).filter(Boolean).slice(0, 20) : [];
  const fields = Array.isArray(req.body.applicationFields)
    ? req.body.applicationFields
        .map(field => ({ id: asString(field.id), question: asString(field.question) }))
        .filter(field => field.id && field.question)
        .slice(0, 20)
    : [];

  const result = await run(
    `INSERT INTO opportunities (title,description,abstract,stipend,duration,deadline,tags,application_fields,require_cv,require_transcript,author_id,author_name,author_department,author_avatar)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      asString(req.body.title),
      asString(req.body.description),
      asString(req.body.abstract),
      asString(req.body.stipend),
      asString(req.body.duration),
      asString(req.body.deadline) || 'December 31, 2026',
      JSON.stringify(tags),
      JSON.stringify(fields),
      req.body.requireCv ? 1 : 0,
      req.body.requireTranscript ? 1 : 0,
      String(req.user.id),
      req.user.name,
      req.user.department || 'General',
      `https://picsum.photos/seed/${encodeURIComponent(req.user.name)}/100/100`,
    ]
  );

  res.status(201).json({ id: String(result.lastID) });
}));

router.delete('/opportunities/:id', requireAuth, asyncHandler(async (req, res) => {
  const opportunity = await get('SELECT id,author_id FROM opportunities WHERE id = ?', [req.params.id]);
  if (!opportunity) throw httpError(404, 'Opportunity not found');
  const isOwner = req.user.role === 'professor' && String(opportunity.author_id) === String(req.user.id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw httpError(403, 'Forbidden');

  await deleteApplicationObjectsForOpportunity(req.params.id);
  await run('DELETE FROM applications WHERE opportunity_id = ?', [req.params.id]);
  await run('DELETE FROM saved_opportunities WHERE opportunity_id = ?', [req.params.id]);
  await run('DELETE FROM opportunities WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
