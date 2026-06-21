const express = require('express');
const { all, run, get } = require('../db');
const { asyncHandler, httpError } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/notifications', requireAuth, asyncHandler(async (req, res) => {
  const unreadOnly = String(req.query.unread) === 'true';
  const rows = await all(
    `SELECT * FROM notifications WHERE user_id = ?${unreadOnly ? ' AND read = 0' : ''} ORDER BY created_at DESC LIMIT 50`,
    [String(req.user.id)]
  );
  const unreadCount = await get(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read = 0',
    [String(req.user.id)]
  );
  res.json({ notifications: rows, unreadCount: unreadCount?.count || 0 });
}));

router.patch('/notifications/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const notification = await get('SELECT id, user_id FROM notifications WHERE id = ?', [req.params.id]);
  if (!notification) throw httpError(404, 'Notification not found');
  if (String(notification.user_id) !== String(req.user.id)) throw httpError(403, 'Forbidden');

  await run('UPDATE notifications SET read = 1 WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

router.patch('/notifications/read-all', requireAuth, asyncHandler(async (req, res) => {
  await run('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0', [String(req.user.id)]);
  res.json({ ok: true });
}));

router.delete('/notifications/:id', requireAuth, asyncHandler(async (req, res) => {
  const notification = await get('SELECT id, user_id FROM notifications WHERE id = ?', [req.params.id]);
  if (!notification) throw httpError(404, 'Notification not found');
  if (String(notification.user_id) !== String(req.user.id)) throw httpError(403, 'Forbidden');
  await run('DELETE FROM notifications WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
