const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../config/db');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// GET /api/unsubscribe/:token
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await queryOne('SELECT id, email FROM users WHERE unsubscribe_token = ?', [token]);

    if (!user) {
      return res.status(404).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:40px;">
          <h2>Invalid unsubscribe link</h2>
          <p>This link may have already been used or is invalid.</p>
        </body></html>
      `);
    }

    await query(
      'UPDATE users SET email_notifications_enabled = FALSE WHERE id = ?',
      [user.id]
    );

    const safeEmail = escapeHtml(user.email);
    const appUrl = escapeHtml(process.env.APP_URL || 'https://minutemantra.com');

    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#1a1a2e;color:#faf3e0;">
        <h2 style="color:#b8860b;">You've been unsubscribed</h2>
        <p>${safeEmail} will no longer receive morning mantra emails.</p>
        <p style="margin-top:20px;font-size:14px;">
          <a href="${appUrl}" style="color:#b8860b;">Return to Minute Mantra</a>
        </p>
      </body></html>
    `);
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
