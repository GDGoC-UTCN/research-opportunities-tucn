const { run } = require('../db');

// Best-effort notification creation. A failure here must never block the
// underlying action (applying, answering, approving, etc.), so errors are
// logged and swallowed — mirroring the existing notification behavior.
async function createNotification({ userId, type, title, message, linkUrl }) {
  if (!userId || !title) return;
  await run(
    'INSERT INTO notifications (user_id, type, title, message, link_url) VALUES (?, ?, ?, ?, ?)',
    [String(userId), type || null, title, message || null, linkUrl || null]
  ).catch(err => console.error('Failed to create notification', err));
}

module.exports = { createNotification };
