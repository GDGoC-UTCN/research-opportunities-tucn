const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = new Set(['student', 'professor', 'admin']);
const STATUSES = new Set(['accepted', 'rejected']);
const MAX_TEXT = 5000;

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isEmail(value) {
  return EMAIL_RE.test(asString(value));
}

function cleanUser(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department || undefined,
    approved: !!row.approved,
  };
}

function validateSignup(body) {
  const name = asString(body.name);
  const email = asString(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const role = asString(body.role);
  const department = asString(body.department) || null;

  if (!name || name.length > 120) return 'Name is required and must be under 120 characters';
  if (!isEmail(email) || email.length > 254) return 'A valid email is required';
  if (password.length < 8 || password.length > 128) return 'Password must be 8-128 characters';
  if (!ROLES.has(role) || role === 'admin') return 'Public signup is only available for students and professors';
  if (department && department.length > 160) return 'Department must be under 160 characters';
  return null;
}

function validateLogin(body) {
  const email = asString(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const role = asString(body.role);
  if (!isEmail(email)) return 'A valid email is required';
  if (!password) return 'Password is required';
  if (role && !ROLES.has(role)) return 'Invalid role';
  return null;
}

function validateOpportunity(body) {
  const required = ['title', 'description', 'abstract', 'duration', 'stipend'];
  for (const field of required) {
    const value = asString(body[field]);
    if (!value || value.length > MAX_TEXT) return `${field} is required and must be under ${MAX_TEXT} characters`;
  }
  if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.length > 20)) return 'Tags must be an array with at most 20 items';
  if (body.applicationFields !== undefined && (!Array.isArray(body.applicationFields) || body.applicationFields.length > 20)) return 'Application fields must be an array with at most 20 items';
  return null;
}

function validateApplication(body) {
  if (!asString(body.opportunityId)) return 'Opportunity is required';
  const message = asString(body.message);
  if (!message || message.length > MAX_TEXT) return `Message is required and must be under ${MAX_TEXT} characters`;
  if (body.answers !== undefined && !Array.isArray(body.answers)) return 'Answers must be a JSON array';
  if (Array.isArray(body.answers) && body.answers.length > 50) return 'Answers must contain at most 50 items';
  return null;
}

function validateStatusUpdate(body) {
  const status = asString(body.status);
  const professorReply = asString(body.professorReply);
  if (!STATUSES.has(status)) return 'Status must be accepted or rejected';
  if (professorReply.length > MAX_TEXT) return `Professor reply must be under ${MAX_TEXT} characters`;
  return null;
}

const MAX_QUESTION = 1000;
const MAX_ANSWER = 2000;

const REVIEW_STATUSES = new Set(['new', 'under_review', 'shortlisted', 'accepted', 'rejected']);

function normalizeApplicationStatus(value) {
  const status = asString(value);
  if (status === 'pending' || status === '') return 'new';
  return REVIEW_STATUSES.has(status) ? status : 'new';
}

function validateReview(body) {
  if (body.status !== undefined && !REVIEW_STATUSES.has(asString(body.status))) {
    return 'Status must be one of new, under_review, shortlisted, accepted, rejected';
  }
  if (body.score !== undefined && body.score !== null && body.score !== '') {
    const score = Number(body.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) return 'Score must be an integer from 1 to 5';
  }
  if (body.professorNotes !== undefined && asString(body.professorNotes).length > MAX_TEXT) {
    return `Notes must be under ${MAX_TEXT} characters`;
  }
  if (body.status === undefined && body.score === undefined && body.professorNotes === undefined) {
    return 'Provide a status, score, or notes to update';
  }
  return null;
}

function validateQuestion(body) {
  const text = asString(body.questionText);
  if (!text) return 'Question is required';
  if (text.length > MAX_QUESTION) return `Question must be under ${MAX_QUESTION} characters`;
  return null;
}

function validateQuestionAnswer(body) {
  const text = asString(body.answerText);
  if (!text) return 'Answer is required';
  if (text.length > MAX_ANSWER) return `Answer must be under ${MAX_ANSWER} characters`;
  return null;
}

module.exports = {
  asString,
  isEmail,
  cleanUser,
  validateSignup,
  validateLogin,
  validateOpportunity,
  validateApplication,
  validateStatusUpdate,
  validateQuestion,
  validateQuestionAnswer,
  validateReview,
  normalizeApplicationStatus,
  REVIEW_STATUSES,
};
