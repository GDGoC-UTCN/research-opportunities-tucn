const express = require('express');
const { all, run, get } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { requireAuth, requireApprovedProfessor } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
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
    status: r.status || 'active',
    requirements: { technical: ['To be specified'], eligibility: ['To be specified'] },
    author: {
      id: String(r.author_id),
      name: r.author_name,
      department: r.author_department,
      avatar: r.author_avatar,
    },
  };
}

function softAuthUser(req) {
  const token = req.cookies?.tucn_auth || (req.get('authorization') || '').replace(/^bearer\s/i, '');
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

router.get('/opportunities', asyncHandler(async (req, res) => {
  const user = softAuthUser(req);
  let rows = await all('SELECT * FROM opportunities ORDER BY created_at DESC');
  if (!user || user.role !== 'admin') {
    rows = rows.filter(r => r.status === 'active' || (user?.role === 'professor' && String(r.author_id) === String(user.sub)));
  }
  res.json({ opportunities: rows.map(mapOpportunity) });
}));

router.get('/opportunities/:id', asyncHandler(async (req, res) => {
  const row = await get('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
  if (!row) throw httpError(404, 'Opportunity not found');
  const user = softAuthUser(req);
  if (row.status !== 'active') {
    if (!user) throw httpError(404, 'Opportunity not found');
    if (user.role !== 'admin' && String(row.author_id) !== String(user.sub)) {
      throw httpError(404, 'Opportunity not found');
    }
  }
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

router.patch('/opportunities/:id', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const opportunity = await get('SELECT id,author_id FROM opportunities WHERE id = ?', [req.params.id]);
  if (!opportunity) throw httpError(404, 'Opportunity not found');
  if (String(opportunity.author_id) !== String(req.user.id) && req.user.role !== 'admin') {
    throw httpError(403, 'Forbidden');
  }

  const updates = [];
  const params = [];
  
  if (req.body.title !== undefined) {
    updates.push('title = ?');
    params.push(asString(req.body.title));
  }
  if (req.body.description !== undefined) {
    updates.push('description = ?');
    params.push(asString(req.body.description));
  }
  if (req.body.abstract !== undefined) {
    updates.push('abstract = ?');
    params.push(asString(req.body.abstract));
  }
  if (req.body.stipend !== undefined) {
    updates.push('stipend = ?');
    params.push(asString(req.body.stipend));
  }
  if (req.body.duration !== undefined) {
    updates.push('duration = ?');
    params.push(asString(req.body.duration));
  }
  if (req.body.deadline !== undefined) {
    updates.push('deadline = ?');
    params.push(asString(req.body.deadline));
  }
  if (req.body.status !== undefined) {
    updates.push('status = ?');
    params.push(req.body.status === 'archived' ? 'archived' : 'active');
  }
  if (req.body.tags !== undefined) {
    updates.push('tags = ?');
    const tags = Array.isArray(req.body.tags) ? req.body.tags.map(asString).filter(Boolean).slice(0, 20) : [];
    params.push(JSON.stringify(tags));
  }

  if (updates.length > 0) {
    params.push(req.params.id);
    await run(`UPDATE opportunities SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  res.json({ ok: true });
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
