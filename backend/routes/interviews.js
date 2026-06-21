const express = require('express');
const { all, get, run } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { requireAuth, requireApprovedProfessor, requireRole } = require('../middleware/auth');
const { asString } = require('../utils/validation');
const { createNotification } = require('../utils/notify');

const router = express.Router();

const MAX_FIELD = 500;
const MAX_FEEDBACK = 5000;

function isIso(value) {
  const t = new Date(value).getTime();
  return !Number.isNaN(t);
}

function validateSlot(body) {
  const start = asString(body.startTime);
  const end = asString(body.endTime);
  if (!start || !isIso(start)) return 'A valid start time is required';
  if (!end || !isIso(end)) return 'A valid end time is required';
  if (new Date(start).getTime() >= new Date(end).getTime()) return 'Start time must be before end time';
  if (new Date(start).getTime() < Date.now()) return 'Slot start time must be in the future';
  if (body.capacity !== undefined && body.capacity !== null && body.capacity !== '') {
    const cap = Number(body.capacity);
    if (!Number.isInteger(cap) || cap < 1) return 'Capacity must be a positive integer';
  }
  if (asString(body.location).length > MAX_FIELD) return 'Location is too long';
  if (asString(body.meetingLink).length > MAX_FIELD) return 'Meeting link is too long';
  return null;
}

async function ownedOpportunity(professorId, opportunityId) {
  return get(
    "SELECT id, title FROM opportunities WHERE CAST(id AS TEXT) = CAST(? AS TEXT) AND CAST(author_id AS TEXT) = CAST(? AS TEXT)",
    [String(opportunityId), String(professorId)]
  );
}

async function scheduledCount(slotId, excludeInterviewId) {
  const row = await get(
    `SELECT COUNT(*) AS count FROM interviews WHERE CAST(slot_id AS TEXT) = CAST(? AS TEXT) AND status = 'scheduled'${excludeInterviewId ? ' AND id != ?' : ''}`,
    excludeInterviewId ? [String(slotId), excludeInterviewId] : [String(slotId)]
  );
  return row?.count || 0;
}

function mapSlot(row, bookedCount) {
  const capacity = row.capacity != null ? Number(row.capacity) : 1;
  return {
    id: String(row.id),
    opportunityId: String(row.opportunity_id),
    startTime: row.start_time,
    endTime: row.end_time,
    timezone: row.timezone || 'Europe/Bucharest',
    location: row.location || null,
    meetingLink: row.meeting_link || null,
    capacity,
    bookedCount: bookedCount || 0,
    available: (bookedCount || 0) < capacity && new Date(row.start_time).getTime() > Date.now(),
  };
}

// Professor view (includes private feedback). studentView strips it.
function mapInterview(row, { studentView = false } = {}) {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    opportunityId: String(row.opportunity_id),
    opportunityTitle: row.opportunity_title || undefined,
    status: row.status || 'invited',
    slotId: row.slot_id != null ? String(row.slot_id) : null,
    scheduledAt: row.scheduled_at || null,
    startTime: row.start_time || null,
    endTime: row.end_time || null,
    location: row.slot_location || null,
    meetingLink: row.slot_meeting_link || null,
    studentName: studentView ? undefined : (row.student_name || row.student_user_name),
    studentEmail: studentView ? undefined : row.student_email,
    professorFeedback: studentView ? undefined : (row.professor_feedback || ''),
    createdAt: row.created_at || null,
  };
}

// ── Professor: availability slots ────────────────────────────────────────
router.post('/professor/opportunities/:opportunityId/interview-slots', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const opportunity = await ownedOpportunity(req.user.id, req.params.opportunityId);
  if (!opportunity) throw httpError(404, 'Opportunity not found');
  const error = validateSlot(req.body);
  if (error) throw httpError(400, error);

  const result = await run(
    `INSERT INTO interview_slots (opportunity_id, professor_id, start_time, end_time, timezone, location, meeting_link, capacity, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(req.params.opportunityId),
      String(req.user.id),
      asString(req.body.startTime),
      asString(req.body.endTime),
      asString(req.body.timezone) || 'Europe/Bucharest',
      asString(req.body.location) || null,
      asString(req.body.meetingLink) || null,
      req.body.capacity ? Number(req.body.capacity) : 1,
      new Date().toISOString(),
    ]
  );
  const row = await get('SELECT * FROM interview_slots WHERE id = ?', [result.lastID]);
  res.status(201).json({ slot: mapSlot(row, 0) });
}));

router.get('/professor/opportunities/:opportunityId/interview-slots', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const opportunity = await ownedOpportunity(req.user.id, req.params.opportunityId);
  if (!opportunity) throw httpError(404, 'Opportunity not found');
  const rows = await all('SELECT * FROM interview_slots WHERE CAST(opportunity_id AS TEXT) = CAST(? AS TEXT) ORDER BY start_time ASC', [String(req.params.opportunityId)]);
  const slots = [];
  for (const row of rows) slots.push(mapSlot(row, await scheduledCount(row.id)));
  res.json({ slots });
}));

router.patch('/professor/interview-slots/:slotId', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const slot = await get('SELECT * FROM interview_slots WHERE id = ?', [req.params.slotId]);
  if (!slot) throw httpError(404, 'Slot not found');
  if (String(slot.professor_id) !== String(req.user.id)) throw httpError(403, 'Cannot edit another professor slot');
  const merged = {
    startTime: req.body.startTime !== undefined ? req.body.startTime : slot.start_time,
    endTime: req.body.endTime !== undefined ? req.body.endTime : slot.end_time,
    capacity: req.body.capacity !== undefined ? req.body.capacity : slot.capacity,
    location: req.body.location !== undefined ? req.body.location : slot.location,
    meetingLink: req.body.meetingLink !== undefined ? req.body.meetingLink : slot.meeting_link,
  };
  const error = validateSlot(merged);
  if (error) throw httpError(400, error);

  await run(
    `UPDATE interview_slots SET start_time = ?, end_time = ?, capacity = ?, location = ?, meeting_link = ?, updated_at = ? WHERE id = ?`,
    [asString(merged.startTime), asString(merged.endTime), Number(merged.capacity) || 1, asString(merged.location) || null, asString(merged.meetingLink) || null, new Date().toISOString(), req.params.slotId]
  );
  const row = await get('SELECT * FROM interview_slots WHERE id = ?', [req.params.slotId]);
  res.json({ slot: mapSlot(row, await scheduledCount(row.id)) });
}));

router.delete('/professor/interview-slots/:slotId', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const slot = await get('SELECT * FROM interview_slots WHERE id = ?', [req.params.slotId]);
  if (!slot) throw httpError(404, 'Slot not found');
  if (String(slot.professor_id) !== String(req.user.id)) throw httpError(403, 'Cannot delete another professor slot');
  const booked = await scheduledCount(slot.id);
  if (booked > 0) throw httpError(409, 'Cannot delete a slot that has a scheduled interview');
  await run('DELETE FROM interview_slots WHERE id = ?', [req.params.slotId]);
  res.json({ ok: true });
}));

// ── Professor: invite an applicant to interview ──────────────────────────
router.post('/professor/applications/:applicationId/interview-invite', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const application = await get(
    `SELECT a.id, a.student_id, a.status, o.id AS opportunity_id, o.author_id, o.title
     FROM applications a JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(a.opportunity_id AS TEXT)
     WHERE a.id = ?`,
    [req.params.applicationId]
  );
  if (!application) throw httpError(404, 'Application not found');
  if (String(application.author_id) !== String(req.user.id)) throw httpError(403, 'Cannot invite for another professor opportunity');
  if (!['shortlisted', 'under_review'].includes(application.status)) {
    throw httpError(400, 'Only shortlisted or under-review applicants can be invited to interview');
  }

  const existing = await get('SELECT * FROM interviews WHERE CAST(application_id AS TEXT) = CAST(? AS TEXT)', [String(application.id)]);
  if (existing && existing.status !== 'cancelled') {
    return res.json({ interview: mapInterview({ ...existing, opportunity_title: application.title }) });
  }

  const now = new Date().toISOString();
  let interviewId;
  if (existing) {
    await run("UPDATE interviews SET status = 'invited', slot_id = NULL, scheduled_at = NULL, cancelled_at = NULL, updated_at = ? WHERE id = ?", [now, existing.id]);
    interviewId = existing.id;
  } else {
    const result = await run(
      `INSERT INTO interviews (application_id, opportunity_id, student_id, professor_id, status, updated_at)
       VALUES (?, ?, ?, ?, 'invited', ?)`,
      [String(application.id), String(application.opportunity_id), String(application.student_id), String(req.user.id), now]
    );
    interviewId = result.lastID;
  }

  await createNotification({
    userId: application.student_id,
    type: 'interview_invited',
    title: 'Interview Invitation',
    message: `You were invited to schedule an interview for "${application.title}".`,
    linkUrl: '/applications',
  });

  const row = await get('SELECT * FROM interviews WHERE id = ?', [interviewId]);
  res.status(201).json({ interview: mapInterview({ ...row, opportunity_title: application.title }) });
}));

// ── Professor: complete/cancel + feedback ────────────────────────────────
router.patch('/professor/interviews/:interviewId', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const interview = await get(
    `SELECT iv.*, o.title AS opportunity_title FROM interviews iv
     JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(iv.opportunity_id AS TEXT)
     WHERE iv.id = ?`,
    [req.params.interviewId]
  );
  if (!interview) throw httpError(404, 'Interview not found');
  if (String(interview.professor_id) !== String(req.user.id)) throw httpError(403, 'Cannot update another professor interview');

  const status = asString(req.body.status);
  if (status && !['completed', 'cancelled', 'scheduled', 'invited'].includes(status)) throw httpError(400, 'Invalid interview status');
  const feedback = asString(req.body.professorFeedback);
  if (feedback.length > MAX_FEEDBACK) throw httpError(400, 'Feedback is too long');
  if (req.body.status === undefined && req.body.professorFeedback === undefined) throw httpError(400, 'Provide a status or feedback');

  const now = new Date().toISOString();
  const sets = ['updated_at = ?'];
  const params = [now];
  if (req.body.status !== undefined) {
    sets.push('status = ?');
    params.push(status);
    if (status === 'completed') { sets.push('completed_at = ?'); params.push(now); }
    if (status === 'cancelled') { sets.push('cancelled_at = ?'); params.push(now); }
  }
  if (req.body.professorFeedback !== undefined) {
    sets.push('professor_feedback = ?');
    params.push(feedback || null);
  }
  params.push(req.params.interviewId);
  await run(`UPDATE interviews SET ${sets.join(', ')} WHERE id = ?`, params);

  if (req.body.status === 'cancelled') {
    await createNotification({
      userId: interview.student_id,
      type: 'interview_cancelled',
      title: 'Interview Cancelled',
      message: `Your interview for "${interview.opportunity_title}" was cancelled.`,
      linkUrl: '/applications',
    });
  }

  const row = await get(
    `SELECT iv.*, o.title AS opportunity_title, s.start_time, s.end_time, s.location AS slot_location, s.meeting_link AS slot_meeting_link
     FROM interviews iv
     JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(iv.opportunity_id AS TEXT)
     LEFT JOIN interview_slots s ON CAST(s.id AS TEXT) = CAST(iv.slot_id AS TEXT)
     WHERE iv.id = ?`,
    [req.params.interviewId]
  );
  res.json({ interview: mapInterview(row) });
}));

// ── Student: my interviews ───────────────────────────────────────────────
router.get('/student/interviews', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  const rows = await all(
    `SELECT iv.*, o.title AS opportunity_title, s.start_time, s.end_time, s.location AS slot_location, s.meeting_link AS slot_meeting_link
     FROM interviews iv
     JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(iv.opportunity_id AS TEXT)
     LEFT JOIN interview_slots s ON CAST(s.id AS TEXT) = CAST(iv.slot_id AS TEXT)
     WHERE CAST(iv.student_id AS TEXT) = CAST(? AS TEXT) AND iv.status != 'cancelled'
     ORDER BY iv.created_at DESC`,
    [String(req.user.id)]
  );
  res.json({ interviews: rows.map(row => mapInterview(row, { studentView: true })) });
}));

// ── Student: available slots (only when invited for that opportunity) ─────
router.get('/opportunities/:opportunityId/interview-slots', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  const interview = await get(
    "SELECT id, status FROM interviews WHERE CAST(opportunity_id AS TEXT) = CAST(? AS TEXT) AND CAST(student_id AS TEXT) = CAST(? AS TEXT) AND status IN ('invited','scheduled')",
    [String(req.params.opportunityId), String(req.user.id)]
  );
  if (!interview) throw httpError(403, 'No interview invitation for this opportunity');

  const rows = await all('SELECT * FROM interview_slots WHERE CAST(opportunity_id AS TEXT) = CAST(? AS TEXT) ORDER BY start_time ASC', [String(req.params.opportunityId)]);
  const slots = [];
  for (const row of rows) {
    const mapped = mapSlot(row, await scheduledCount(row.id));
    if (mapped.available || String(row.id) === String(interview.slot_id)) slots.push(mapped);
  }
  res.json({ slots, interviewId: String(interview.id) });
}));

// ── Student: schedule (choose a slot) ────────────────────────────────────
router.post('/student/interviews/:interviewId/schedule', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  const interview = await get(
    `SELECT iv.*, o.title AS opportunity_title FROM interviews iv
     JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(iv.opportunity_id AS TEXT)
     WHERE iv.id = ?`,
    [req.params.interviewId]
  );
  if (!interview) throw httpError(404, 'Interview not found');
  if (String(interview.student_id) !== String(req.user.id)) throw httpError(403, 'This is not your interview');
  if (!['invited', 'scheduled'].includes(interview.status)) throw httpError(400, 'This interview cannot be scheduled');

  const slotId = asString(req.body.slotId);
  if (!slotId) throw httpError(400, 'A slot is required');
  const slot = await get('SELECT * FROM interview_slots WHERE id = ?', [slotId]);
  if (!slot || String(slot.opportunity_id) !== String(interview.opportunity_id)) throw httpError(404, 'Slot not found');
  if (new Date(slot.start_time).getTime() < Date.now()) throw httpError(400, 'That slot is in the past');

  const capacity = slot.capacity != null ? Number(slot.capacity) : 1;
  const booked = await scheduledCount(slot.id, interview.id);
  if (booked >= capacity) throw httpError(409, 'That slot is fully booked');

  const now = new Date().toISOString();
  await run(
    "UPDATE interviews SET slot_id = ?, status = 'scheduled', scheduled_at = ?, cancelled_at = NULL, updated_at = ? WHERE id = ?",
    [slotId, now, now, req.params.interviewId]
  );

  await createNotification({
    userId: interview.professor_id,
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: `${req.user.name} scheduled an interview for "${interview.opportunity_title}".`,
    linkUrl: '/professor/applications',
  });
  await createNotification({
    userId: interview.student_id,
    type: 'interview_scheduled_confirm',
    title: 'Interview Confirmed',
    message: `Your interview for "${interview.opportunity_title}" is confirmed.`,
    linkUrl: '/applications',
  });

  const row = await get(
    `SELECT iv.*, o.title AS opportunity_title, s.start_time, s.end_time, s.location AS slot_location, s.meeting_link AS slot_meeting_link
     FROM interviews iv
     JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(iv.opportunity_id AS TEXT)
     LEFT JOIN interview_slots s ON CAST(s.id AS TEXT) = CAST(iv.slot_id AS TEXT)
     WHERE iv.id = ?`,
    [req.params.interviewId]
  );
  res.json({ interview: mapInterview(row, { studentView: true }) });
}));

// ── Calendar (.ics) for the involved student / professor / admin ─────────
function icsDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}
function icsEscape(value) {
  return String(value || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
}

router.get('/interviews/:interviewId/calendar.ics', requireAuth, asyncHandler(async (req, res) => {
  const row = await get(
    `SELECT iv.*, o.title AS opportunity_title, s.start_time, s.end_time, s.location AS slot_location, s.meeting_link AS slot_meeting_link
     FROM interviews iv
     JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(iv.opportunity_id AS TEXT)
     LEFT JOIN interview_slots s ON CAST(s.id AS TEXT) = CAST(iv.slot_id AS TEXT)
     WHERE iv.id = ?`,
    [req.params.interviewId]
  );
  if (!row) throw httpError(404, 'Interview not found');
  const isInvolved = String(row.student_id) === String(req.user.id)
    || String(row.professor_id) === String(req.user.id)
    || req.user.role === 'admin';
  if (!isInvolved) throw httpError(403, 'Forbidden');
  if (row.status !== 'scheduled' || !row.start_time) throw httpError(400, 'Interview is not scheduled');

  const where = row.slot_meeting_link || row.slot_location || '';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AIRi@UTCN//Research Opportunities//EN',
    'BEGIN:VEVENT',
    `UID:interview-${row.id}@airi.utcluj.ro`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(row.start_time)}`,
    `DTEND:${icsDate(row.end_time || row.start_time)}`,
    `SUMMARY:${icsEscape(`Interview — ${row.opportunity_title}`)}`,
    where ? `LOCATION:${icsEscape(where)}` : '',
    row.slot_meeting_link ? `DESCRIPTION:${icsEscape(`Meeting link: ${row.slot_meeting_link}`)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="interview.ics"');
  res.send(lines.join('\r\n'));
}));

module.exports = router;
