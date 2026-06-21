const express = require('express');
const { all, get, run } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { requireAuth, requireApprovedProfessor } = require('../middleware/auth');
const { asString, validateReview, normalizeApplicationStatus, REVIEW_STATUSES } = require('../utils/validation');
const { createNotification } = require('../utils/notify');

const router = express.Router();

function parseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function fileMeta(id, kind, key, legacy, name) {
  if (!key && !legacy) return undefined;
  return { name: name || `${kind}.pdf`, downloadUrl: `/api/applications/${id}/files/${kind}` };
}

function mapReviewApplication(row) {
  return {
    id: String(row.id),
    opportunityId: String(row.opportunity_id),
    opportunityTitle: row.opportunity_title,
    studentName: row.student_name || row.student_user_name,
    studentEmail: row.student_email,
    studentLinkedin: row.student_linkedin || null,
    studentInterests: parseJson(row.student_interests, []),
    studentSkills: parseJson(row.student_skills, []),
    status: normalizeApplicationStatus(row.status),
    score: row.score != null ? Number(row.score) : null,
    professorNotes: row.professor_notes || '',
    message: row.message || '',
    answers: parseJson(row.answers, []),
    submittedAt: row.created_at || null,
    cvFile: fileMeta(row.id, 'cv', row.cv_file_key, row.cv_file, row.cv_file_name),
    transcriptFile: fileMeta(row.id, 'transcript', row.transcript_file_key, row.transcript_file, row.transcript_file_name),
    interview: row.interview_id ? {
      id: String(row.interview_id),
      status: row.interview_status || 'invited',
      slotId: row.interview_slot_id != null ? String(row.interview_slot_id) : null,
      scheduledAt: row.interview_scheduled_at || null,
      startTime: row.interview_start || null,
      endTime: row.interview_end || null,
      location: row.interview_location || null,
      meetingLink: row.interview_meeting_link || null,
      feedback: row.interview_feedback || '',
    } : { status: 'none' },
  };
}

// Build the filtered query for the current professor's applications.
function buildQuery(professorId, query) {
  const clauses = ['CAST(o.author_id AS TEXT) = CAST(? AS TEXT)'];
  const params = [String(professorId)];

  const opportunityId = asString(query.opportunityId);
  if (opportunityId) {
    clauses.push('CAST(a.opportunity_id AS TEXT) = CAST(? AS TEXT)');
    params.push(opportunityId);
  }
  const status = asString(query.status);
  if (status && REVIEW_STATUSES.has(status)) {
    clauses.push('a.status = ?');
    params.push(status);
  }
  const search = asString(query.search).toLowerCase();
  if (search) {
    clauses.push('(lower(u.name) LIKE ? OR lower(u.email) LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const sql = `
    SELECT a.*, o.title AS opportunity_title, o.author_id,
           u.name AS student_user_name, u.email AS student_email,
           p.linkedin_url AS student_linkedin,
           p.research_interests AS student_interests,
           p.skills AS student_skills,
           iv.id AS interview_id, iv.status AS interview_status, iv.slot_id AS interview_slot_id,
           iv.scheduled_at AS interview_scheduled_at, iv.professor_feedback AS interview_feedback,
           s.start_time AS interview_start, s.end_time AS interview_end,
           s.location AS interview_location, s.meeting_link AS interview_meeting_link
    FROM applications a
    JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(a.opportunity_id AS TEXT)
    JOIN users u ON CAST(u.id AS TEXT) = CAST(a.student_id AS TEXT)
    LEFT JOIN user_profiles p ON p.user_id = CAST(a.student_id AS TEXT)
    LEFT JOIN interviews iv ON CAST(iv.application_id AS TEXT) = CAST(a.id AS TEXT)
    LEFT JOIN interview_slots s ON CAST(s.id AS TEXT) = CAST(iv.slot_id AS TEXT)
    WHERE ${clauses.join(' AND ')}
    ORDER BY a.created_at DESC`;
  return { sql, params };
}

// GET applications grouped by opportunity, each with stats.
router.get('/professor/applications/grouped', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const owned = await all(
    "SELECT id, title FROM opportunities WHERE CAST(author_id AS TEXT) = CAST(? AS TEXT) ORDER BY created_at DESC",
    [String(req.user.id)]
  );
  const { sql, params } = buildQuery(req.user.id, {});
  const rows = await all(sql, params);

  const groups = new Map();
  for (const opp of owned) {
    groups.set(String(opp.id), {
      id: String(opp.id),
      title: opp.title,
      applications: [],
      stats: { total: 0, new: 0, under_review: 0, shortlisted: 0, accepted: 0, rejected: 0, interviews_scheduled: 0 },
    });
  }
  for (const row of rows) {
    const app = mapReviewApplication(row);
    const group = groups.get(String(app.opportunityId));
    if (!group) continue;
    group.applications.push(app);
    group.stats.total += 1;
    if (group.stats[app.status] !== undefined) group.stats[app.status] += 1;
    if (app.interview && app.interview.status === 'scheduled') group.stats.interviews_scheduled += 1;
  }

  res.json({ opportunities: Array.from(groups.values()) });
}));

// GET applications for the current professor's opportunities (with filters).
router.get('/professor/applications', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const { sql, params } = buildQuery(req.user.id, req.query);
  const rows = await all(sql, params);
  res.json({ applications: rows.map(mapReviewApplication) });
}));

// PATCH a review: status, score, and/or private notes.
router.patch('/professor/applications/:applicationId/review', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const validationError = validateReview(req.body);
  if (validationError) throw httpError(400, validationError);

  const application = await get(
    `SELECT a.id, a.status, a.student_id, o.author_id, o.title
     FROM applications a
     JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(a.opportunity_id AS TEXT)
     WHERE a.id = ?`,
    [req.params.applicationId]
  );
  if (!application) throw httpError(404, 'Application not found');
  if (String(application.author_id) !== String(req.user.id)) {
    throw httpError(403, 'Cannot review applications for another professor');
  }

  const sets = [];
  const sqlParams = [];
  let statusChanged = false;
  let newStatus = normalizeApplicationStatus(application.status);

  if (req.body.status !== undefined) {
    newStatus = asString(req.body.status);
    statusChanged = newStatus !== normalizeApplicationStatus(application.status);
    sets.push('status = ?');
    sqlParams.push(newStatus);
  }
  if (req.body.score !== undefined) {
    const hasScore = req.body.score !== null && req.body.score !== '';
    sets.push('score = ?');
    sqlParams.push(hasScore ? Number(req.body.score) : null);
  }
  if (req.body.professorNotes !== undefined) {
    sets.push('professor_notes = ?');
    sqlParams.push(asString(req.body.professorNotes) || null);
  }

  sets.push('updated_at = ?');
  sqlParams.push(new Date().toISOString());
  sqlParams.push(req.params.applicationId);

  await run(`UPDATE applications SET ${sets.join(', ')} WHERE id = ?`, sqlParams);

  // Notify only on a real status change (never for notes/score-only updates).
  if (statusChanged) {
    const messages = {
      under_review: { type: 'application_under_review', title: 'Application Under Review', message: `Your application for "${application.title}" is now under review.` },
      shortlisted: { type: 'application_shortlisted', title: 'Application Shortlisted', message: `Your application for "${application.title}" was shortlisted.` },
      accepted: { type: 'application_accepted', title: 'Application Accepted', message: `Your application for "${application.title}" was accepted.` },
      rejected: { type: 'application_rejected', title: 'Application Update', message: `Your application for "${application.title}" was not selected.` },
    };
    const payload = messages[newStatus];
    if (payload) {
      await createNotification({ userId: application.student_id, ...payload, linkUrl: '/applications' });
    }
  }

  const updated = await get(
    `SELECT a.*, o.title AS opportunity_title,
            u.name AS student_user_name, u.email AS student_email,
            p.linkedin_url AS student_linkedin, p.research_interests AS student_interests, p.skills AS student_skills
     FROM applications a
     JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(a.opportunity_id AS TEXT)
     JOIN users u ON CAST(u.id AS TEXT) = CAST(a.student_id AS TEXT)
     LEFT JOIN user_profiles p ON p.user_id = CAST(a.student_id AS TEXT)
     WHERE a.id = ?`,
    [req.params.applicationId]
  );
  res.json({ application: mapReviewApplication(updated) });
}));

function csvCell(value) {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// CSV export of the professor's applications (never includes file contents/URLs).
router.get('/professor/applications/export', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const { sql, params } = buildQuery(req.user.id, req.query);
  const rows = await all(sql, params);

  const header = ['Opportunity', 'Student Name', 'Student Email', 'Status', 'Score', 'Submitted', 'LinkedIn', 'Answers', 'Notes'];
  const lines = [header.map(csvCell).join(',')];
  for (const row of rows) {
    const app = mapReviewApplication(row);
    const answersSummary = (app.answers || [])
      .map(a => `${a.question || ''}: ${a.answer || ''}`)
      .join(' | ');
    lines.push([
      app.opportunityTitle,
      app.studentName,
      app.studentEmail,
      app.status,
      app.score ?? '',
      app.submittedAt ? new Date(app.submittedAt).toISOString().slice(0, 10) : '',
      app.studentLinkedin || '',
      answersSummary,
      app.professorNotes || '',
    ].map(csvCell).join(','));
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="applications-export.csv"');
  res.send(lines.join('\r\n'));
}));

module.exports = router;
