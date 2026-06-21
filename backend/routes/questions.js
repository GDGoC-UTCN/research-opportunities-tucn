const express = require('express');
const { all, run, get } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { requireAuth, requireApprovedProfessor, optionalAuth } = require('../middleware/auth');
const { asString, validateQuestion, validateQuestionAnswer } = require('../utils/validation');
const { createNotification } = require('../utils/notify');

const router = express.Router();

// Map a DB row to the API shape. `reveal` controls whether the asking
// student's identity is exposed — it must be false for anonymized public Q&A.
function mapQuestion(row, { reveal, isOwn = false } = {}) {
  return {
    id: String(row.id),
    opportunityId: String(row.opportunity_id),
    opportunityTitle: row.opportunity_title || undefined,
    questionText: row.question_text,
    answerText: row.answer_text || null,
    status: row.status || 'open',
    isPublic: !!row.is_public,
    isOwnQuestion: !!isOwn,
    studentName: reveal ? (row.student_name || null) : null,
    createdAt: row.created_at || null,
    answeredAt: row.answered_at || null,
  };
}

// GET questions for an opportunity, filtered by who is asking.
// - public/other students/other professors: only answered public questions (anonymized)
// - the asking student: their own questions + public answered ones
// - the owning professor and admins: every question for that opportunity (with names)
router.get('/opportunities/:id/questions', optionalAuth, asyncHandler(async (req, res) => {
  const opportunity = await get('SELECT id, author_id FROM opportunities WHERE id = ?', [req.params.id]);
  if (!opportunity) throw httpError(404, 'Opportunity not found');

  const user = req.user || null;
  const isAdmin = user?.role === 'admin';
  const isOwningProfessor = user?.role === 'professor' && String(opportunity.author_id) === String(user.id);

  const rows = await all(
    'SELECT * FROM opportunity_questions WHERE opportunity_id = ? ORDER BY created_at DESC',
    [String(req.params.id)]
  );

  const questions = [];
  for (const row of rows) {
    const isOwn = !!user && String(row.student_id) === String(user.id);
    const isAnsweredPublic = row.status === 'answered' && !!row.is_public;

    if (isAdmin || isOwningProfessor) {
      questions.push(mapQuestion(row, { reveal: true, isOwn }));
    } else if (isOwn) {
      // The asking student always sees their own question (and reply) in full.
      questions.push(mapQuestion(row, { reveal: true, isOwn: true }));
    } else if (isAnsweredPublic) {
      // Everyone else only ever sees anonymized, answered, public Q&A.
      questions.push(mapQuestion(row, { reveal: false }));
    }
    // Otherwise the question stays private and is omitted.
  }

  res.json({ questions });
}));

// POST a new question. Students only; identity comes from the session.
router.post('/opportunities/:id/questions', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') throw httpError(403, 'Only students can ask questions');

  const validationError = validateQuestion(req.body);
  if (validationError) throw httpError(400, validationError);

  const opportunity = await get('SELECT id, author_id, title FROM opportunities WHERE id = ?', [req.params.id]);
  if (!opportunity) throw httpError(404, 'Opportunity not found');

  const isPublic = req.body.isPublic === true || req.body.isPublic === 'true' ? 1 : 0;

  const result = await run(
    `INSERT INTO opportunity_questions (opportunity_id, student_id, student_name, question_text, is_public, status)
     VALUES (?, ?, ?, ?, ?, 'open')`,
    [String(req.params.id), String(req.user.id), req.user.name, asString(req.body.questionText), isPublic]
  );

  // Best-effort notification to the owning professor (never blocks the request).
  await createNotification({
    userId: opportunity.author_id,
    type: 'question',
    title: 'New Question',
    message: `${req.user.name} asked a question about "${opportunity.title}".`,
    linkUrl: `/opportunities/${req.params.id}`,
  });

  const row = await get('SELECT * FROM opportunity_questions WHERE id = ?', [result.lastID]);
  res.status(201).json({ question: mapQuestion(row, { reveal: true, isOwn: true }) });
}));

// GET all questions for the current approved professor's own opportunities.
router.get('/professor/questions', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const statusFilter = asString(req.query.status);
  const params = [String(req.user.id)];
  let statusClause = '';
  if (statusFilter === 'open' || statusFilter === 'answered') {
    statusClause = ' AND q.status = ?';
    params.push(statusFilter);
  }

  const rows = await all(
    `SELECT q.*, o.title AS opportunity_title
     FROM opportunity_questions q
     INNER JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(q.opportunity_id AS TEXT)
     WHERE CAST(o.author_id AS TEXT) = CAST(? AS TEXT)${statusClause}
     ORDER BY (q.status = 'open') DESC, q.created_at DESC`,
    params
  );

  res.json({ questions: rows.map(row => mapQuestion(row, { reveal: true })) });
}));

// PATCH a question's answer. Only the professor who owns the linked opportunity.
router.patch('/opportunity-questions/:questionId/answer', requireAuth, requireApprovedProfessor, asyncHandler(async (req, res) => {
  const validationError = validateQuestionAnswer(req.body);
  if (validationError) throw httpError(400, validationError);

  const question = await get(
    `SELECT q.*, o.author_id, o.title AS opportunity_title
     FROM opportunity_questions q
     INNER JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(q.opportunity_id AS TEXT)
     WHERE q.id = ?`,
    [req.params.questionId]
  );
  if (!question) throw httpError(404, 'Question not found');
  if (String(question.author_id) !== String(req.user.id)) {
    throw httpError(403, 'Cannot answer questions for another professor');
  }

  const now = new Date().toISOString();
  await run(
    `UPDATE opportunity_questions
     SET answer_text = ?, status = 'answered', answered_at = COALESCE(answered_at, ?), updated_at = ?
     WHERE id = ?`,
    [asString(req.body.answerText), now, now, req.params.questionId]
  );

  await createNotification({
    userId: question.student_id,
    type: 'answer',
    title: 'Question Answered',
    message: `A professor replied to your question about "${question.opportunity_title}".`,
    linkUrl: `/opportunities/${question.opportunity_id}`,
  });

  const row = await get(
    `SELECT q.*, o.title AS opportunity_title
     FROM opportunity_questions q
     INNER JOIN opportunities o ON CAST(o.id AS TEXT) = CAST(q.opportunity_id AS TEXT)
     WHERE q.id = ?`,
    [req.params.questionId]
  );
  res.json({ question: mapQuestion(row, { reveal: true }) });
}));

module.exports = router;
