const express = require('express');
const { all, get } = require('../db');
const { asyncHandler } = require('../utils/errors');
const { requireAuth, requireRole } = require('../middleware/auth');
const { scoreOpportunities } = require('../services/recommendations');

const router = express.Router();

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
    created_at: row.created_at,
    tags: parseJson(row.tags, []),
    applicationFields: parseJson(row.application_fields, []),
    requireCv: !!row.require_cv,
    requireTranscript: !!row.require_transcript,
    status: row.status || 'active',
    requirements: { technical: ['To be specified'], eligibility: ['To be specified'] },
    author: {
      id: String(row.approved_author_id != null ? row.approved_author_id : row.author_id),
      name: row.approved_author_name != null ? row.approved_author_name : row.author_name,
      department: row.approved_author_department != null ? row.approved_author_department : row.author_department,
      avatar: row.author_avatar || `https://picsum.photos/seed/${encodeURIComponent(row.approved_author_name || 'professor')}/100/100`,
    },
  };
}

const MAX_RECOMMENDATIONS = 12;

router.get('/recommendations/opportunities', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  const profile = await get('SELECT research_interests, skills, preferred_tags FROM user_profiles WHERE user_id = ?', [String(req.user.id)]);
  const interests = parseJson(profile?.research_interests, []);
  const skills = parseJson(profile?.skills, []);
  const preferredTags = parseJson(profile?.preferred_tags, []);
  const needsProfile = interests.length === 0 && skills.length === 0 && preferredTags.length === 0;

  // Candidate opportunities: active and from approved professors.
  const candidates = await all(
    `SELECT o.*,
            u.id AS approved_author_id,
            u.name AS approved_author_name,
            u.department AS approved_author_department
     FROM opportunities o
     JOIN users u ON CAST(o.author_id AS TEXT) = CAST(u.id AS TEXT)
     WHERE u.role = 'professor' AND u.approved = 1
       AND COALESCE(o.status, 'active') = 'active'
     ORDER BY o.created_at DESC`
  );

  // Student behavior: saved + applied opportunities (for tag signals + exclusion).
  const savedRows = await all(
    `SELECT o.tags FROM saved_opportunities s
     JOIN opportunities o ON o.id = s.opportunity_id
     WHERE s.user_id = ?`,
    [String(req.user.id)]
  );
  const appliedRows = await all(
    `SELECT a.opportunity_id, a.status, o.tags
     FROM applications a
     JOIN opportunities o ON o.id = a.opportunity_id
     WHERE a.student_id = ?`,
    [String(req.user.id)]
  );
  const savedIds = new Set(
    (await all('SELECT opportunity_id FROM saved_opportunities WHERE user_id = ?', [String(req.user.id)]))
      .map(r => String(r.opportunity_id))
  );

  const tagSet = rows => {
    const set = new Set();
    for (const r of rows) for (const t of parseJson(r.tags, [])) set.add(String(t).toLowerCase());
    return set;
  };
  const savedTags = tagSet(savedRows);
  const appliedTags = tagSet(appliedRows);
  const appliedOppIds = new Set(appliedRows.map(r => String(r.opportunity_id)));
  const rejectedOpportunityIds = new Set(appliedRows.filter(r => r.status === 'rejected').map(r => String(r.opportunity_id)));

  // Never recommend opportunities already applied to.
  const pool = candidates.filter(o => !appliedOppIds.has(String(o.id))).map(mapOpportunity);

  let scored = scoreOpportunities({
    interests,
    skills,
    preferredTags,
    savedTags,
    appliedTags,
    rejectedOpportunityIds,
    opportunities: pool,
  }).slice(0, MAX_RECOMMENDATIONS);

  // Cold start / no matches: fall back to the latest opportunities so the
  // section is never empty, and flag that the profile needs interests.
  if (scored.length === 0) {
    scored = pool.slice(0, 6).map(opportunity => ({ opportunity, score: 0, reasons: ['Recently posted'] }));
  }

  const recommendations = scored.map(({ opportunity, score, reasons }) => ({
    opportunity,
    score,
    reasons,
    saved: savedIds.has(String(opportunity.id)),
  }));

  res.json({ recommendations, needsProfile });
}));

module.exports = router;
