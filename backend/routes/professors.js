const express = require('express');
const { all, get } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { getObjectStream } = require('../services/storage');

const router = express.Router();

function parseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function avatarUrl(row) {
  return row.avatar_file_key
    ? `/api/professors/${row.id}/avatar`
    : `https://picsum.photos/seed/${encodeURIComponent(row.name || 'professor')}/200/200`;
}

function mapProfessorSummary(row) {
  return {
    id: String(row.id),
    name: row.name,
    department: row.department || null,
    avatar: avatarUrl(row),
    labName: row.lab_name || null,
    researchInterests: parseJson(row.research_interests, []),
    bio: row.bio || null,
    activeOpportunityCount: Number(row.active_count || 0),
  };
}

function mapProfessorOpportunity(row, professor) {
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
    status: row.status || 'active',
    requirements: { technical: ['To be specified'], eligibility: ['To be specified'] },
    author: {
      id: String(professor.id),
      name: professor.name,
      department: professor.department,
      avatar: avatarUrl(professor),
    },
  };
}

// Public directory of approved professors with active-opportunity counts.
router.get('/professors', asyncHandler(async (req, res) => {
  const rows = await all(
    `SELECT u.id, u.name, u.department,
            p.avatar_file_key, p.lab_name, p.research_interests, p.bio,
            (SELECT COUNT(*) FROM opportunities o
              WHERE CAST(o.author_id AS TEXT) = CAST(u.id AS TEXT)
                AND COALESCE(o.status, 'active') = 'active') AS active_count
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = CAST(u.id AS TEXT)
     WHERE u.role = 'professor' AND u.approved = 1
     ORDER BY active_count DESC, u.name ASC`
  );
  res.json({ professors: rows.map(mapProfessorSummary) });
}));

// Public detail for one approved professor + their active opportunities.
router.get('/professors/:id', asyncHandler(async (req, res) => {
  const row = await get(
    `SELECT u.id, u.name, u.department, u.approved,
            p.avatar_file_key, p.linkedin_url, p.website_url, p.bio,
            p.research_interests, p.lab_name
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = CAST(u.id AS TEXT)
     WHERE u.id = ? AND u.role = 'professor' AND u.approved = 1`,
    [req.params.id]
  );
  if (!row) throw httpError(404, 'Professor not found');

  const opportunities = await all(
    `SELECT * FROM opportunities
     WHERE CAST(author_id AS TEXT) = CAST(? AS TEXT)
       AND COALESCE(status, 'active') = 'active'
     ORDER BY created_at DESC`,
    [String(row.id)]
  );

  res.json({
    professor: {
      id: String(row.id),
      name: row.name,
      department: row.department || null,
      avatar: avatarUrl(row),
      linkedinUrl: row.linkedin_url || null,
      websiteUrl: row.website_url || null,
      bio: row.bio || null,
      researchInterests: parseJson(row.research_interests, []),
      labName: row.lab_name || null,
      activeOpportunityCount: opportunities.length,
      opportunities: opportunities.map(o => mapProfessorOpportunity(o, row)),
    },
  });
}));

// Public avatar image for an approved professor (images only — never documents).
router.get('/professors/:id/avatar', asyncHandler(async (req, res) => {
  const row = await get(
    `SELECT p.avatar_file_key, p.avatar_file_name, p.avatar_file_type
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = CAST(u.id AS TEXT)
     WHERE u.id = ? AND u.role = 'professor' AND u.approved = 1`,
    [req.params.id]
  );
  if (!row || !row.avatar_file_key) throw httpError(404, 'Avatar not found');

  let stream;
  try {
    stream = await getObjectStream(row.avatar_file_key);
  } catch {
    throw httpError(404, 'Avatar not found');
  }
  res.setHeader('Content-Type', row.avatar_file_type || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=300');
  stream.on('error', () => {
    if (!res.headersSent) res.status(404).json({ error: 'Avatar not found' });
    else res.destroy();
  });
  stream.pipe(res);
}));

module.exports = router;
