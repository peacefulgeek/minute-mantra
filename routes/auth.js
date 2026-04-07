const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { sendMagicLinkEmail } = require('../services/email');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' },
});

const MAGIC_LINK_EXPIRY_MINUTES = 15;

function setAuthCookie(res, token) {
  res.cookie('mm_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function issueJwt(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.email === 'paul@creativelab.tv' ? 'admin' : 'user',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
}

// ─── MAGIC LINK ───────────────────────────────────────────────────────────────

// POST /api/auth/magic-link
router.post('/magic-link', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

    let user = await queryOne('SELECT id, email, display_name FROM users WHERE email = ?', [normalizedEmail]);
    let isNew = false;

    if (!user) {
      isNew = true;
      const result = await query(
        `INSERT INTO users (email, magic_link_token, magic_link_expires_at, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [normalizedEmail, token, expiresAt]
      );
      await query('INSERT INTO streaks (user_id) VALUES (?)', [result.insertId]);
      user = { id: result.insertId, email: normalizedEmail };
    } else {
      await query(
        'UPDATE users SET magic_link_token = ?, magic_link_expires_at = ?, updated_at = NOW() WHERE id = ?',
        [token, expiresAt, user.id]
      );
    }

    const appUrl = process.env.APP_URL || 'https://minutemantra.com';
    const magicUrl = `${appUrl}/auth/verify?token=${token}`;
    await sendMagicLinkEmail(normalizedEmail, magicUrl, isNew);

    res.json({ ok: true, message: 'Magic link sent' });
  } catch (err) {
    console.error('Magic link error:', err.message, err.stack);
    console.error('Magic link error details:', JSON.stringify({ code: err.code, command: err.command, responseCode: err.responseCode }));
    res.status(500).json({ error: 'Failed to send magic link', detail: err.message });
  }
});

// GET /api/auth/magic-link/verify
router.get('/magic-link/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const user = await queryOne(
      `SELECT id, email, display_name, subscription_tier, subscription_status, subscription_plan,
              email_notifications_enabled, push_notifications_enabled, newsletter_opted_in,
              timezone, notification_time, magic_link_expires_at
       FROM users WHERE magic_link_token = ?`,
      [token]
    );

    if (!user) return res.status(401).json({ error: 'Invalid or already-used link' });

    if (new Date() > new Date(user.magic_link_expires_at)) {
      return res.status(401).json({ error: 'This magic link has expired. Please request a new one.' });
    }

    const isNew = !user.display_name;

    await query(
      'UPDATE users SET magic_link_token = NULL, magic_link_expires_at = NULL, updated_at = NOW() WHERE id = ?',
      [user.id]
    );

    const jwtToken = issueJwt(user);
    setAuthCookie(res, jwtToken);

    res.json({
      ok: true,
      isNew,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        subscription_tier: user.subscription_tier,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        email_notifications_enabled: user.email_notifications_enabled,
        push_notifications_enabled: user.push_notifications_enabled,
        newsletter_opted_in: user.newsletter_opted_in,
        timezone: user.timezone,
        notification_time: user.notification_time,
        role: user.email === 'paul@creativelab.tv' ? 'admin' : 'user',
      },
    });
  } catch (err) {
    console.error('Magic link verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('mm_token');
  res.json({ message: 'Logged out successfully' });
});

// ─── ME ──────────────────────────────────────────────────────────────────────

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await queryOne(
      `SELECT id, email, display_name, timezone, subscription_tier, subscription_status,
              subscription_plan, email_notifications_enabled, push_notifications_enabled,
              newsletter_opted_in, notification_time, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: {
        ...user,
        role: user.email === 'paul@creativelab.tv' ? 'admin' : 'user',
      },
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
