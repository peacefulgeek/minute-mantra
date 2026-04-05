const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// PUT /api/settings/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const {
      display_name,
      timezone,
      notification_time,
      email_notifications_enabled,
      push_notifications_enabled,
      newsletter_opted_in,
    } = req.body;

    await query(
      `UPDATE users SET
        display_name = COALESCE(?, display_name),
        timezone = COALESCE(?, timezone),
        notification_time = COALESCE(?, notification_time),
        email_notifications_enabled = COALESCE(?, email_notifications_enabled),
        push_notifications_enabled = COALESCE(?, push_notifications_enabled),
        newsletter_opted_in = COALESCE(?, newsletter_opted_in)
       WHERE id = ?`,
      [
        display_name ?? null,
        timezone ?? null,
        notification_time ?? null,
        email_notifications_enabled ?? null,
        push_notifications_enabled ?? null,
        newsletter_opted_in ?? null,
        req.user.id,
      ]
    );

    const user = await queryOne(
      'SELECT id, email, display_name, timezone, notification_time, email_notifications_enabled, push_notifications_enabled, newsletter_opted_in, subscription_tier FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/settings/push
router.put('/push', requireAuth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: 'Subscription object required' });

    await query(
      'UPDATE users SET push_subscription = ?, push_notifications_enabled = TRUE WHERE id = ?',
      [JSON.stringify(subscription), req.user.id]
    );
    res.json({ message: 'Push subscription saved' });
  } catch (err) {
    console.error('Save push subscription error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/settings/push
router.delete('/push', requireAuth, async (req, res) => {
  try {
    await query(
      'UPDATE users SET push_subscription = NULL, push_notifications_enabled = FALSE WHERE id = ?',
      [req.user.id]
    );
    res.json({ message: 'Push subscription removed' });
  } catch (err) {
    console.error('Remove push subscription error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
