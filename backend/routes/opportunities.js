const express = require('express');
const { all, run, get } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { requireAuth, requireApprovedProfessor } = require('../middleware/auth');
const { validateOpportunity, asString } = require('../utils/validation');

const router = express.Router();

function parseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function mapOpportunity(r) {
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
      id: String(r.author_id),
      name: r.author_name,
      department: r.author_department,
      avatar: r.author_avatar,
    },
  };
}

router.get('/opportunities', asyncHandler(async (req, res) => {
  const rows = await all('SELECT * FROM opportunities ORDER BY created_at DESC');
  res.json({ opportunities: rows.map(mapOpportunity) });
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
      JSON.stringify(tags.length ? tags : ['NEW', 'RESEARCH']),
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

  await run('DELETE FROM applications WHERE opportunity_id = ?', [req.params.id]);
  await run('DELETE FROM opportunities WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
