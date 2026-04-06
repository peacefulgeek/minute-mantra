const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../config/db');
const { sendMagicLinkEmail } = require('../services/email');

const MAGIC_LINK_EXPIRY_MINUTES = 15;

// POST /api/auth/magic-link — request a magic link
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

    // Upsert user — create if new, update token if existing
    let user = await queryOne('SELECT id, email, display_name FROM users WHERE email = ?', [normalizedEmail]);
    let isNew = false;

    if (!user) {
      // New user — create account
      isNew = true;
      const result = await query(
        `INSERT INTO users (email, magic_link_token, magic_link_expires_at, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [normalizedEmail, token, expiresAt]
      );
      // Initialize streak row
      await query('INSERT INTO streaks (user_id) VALUES (?)', [result.insertId]);
      user = { id: result.insertId, email: normalizedEmail };
    } else {
      // Existing user — update token
      await query(
        'UPDATE users SET magic_link_token = ?, magic_link_expires_at = ?, updated_at = NOW() WHERE id = ?',
        [token, expiresAt, user.id]
      );
    }

    // Send the magic link email
    const appUrl = process.env.APP_URL || 'https://minutemantra.com';
    const magicUrl = `${appUrl}/auth/verify?token=${token}`;
    await sendMagicLinkEmail(normalizedEmail, magicUrl, isNew);

    res.json({ ok: true, message: 'Magic link sent' });
  } catch (err) {
    console.error('Magic link error:', err);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
});

// GET /api/auth/magic-link/verify — verify token and issue JWT cookie
router.get('/verify', async (req, res) => {
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

    // Determine if this is a new user (no display_name yet = first login)
    const isNew = !user.display_name;

    // Invalidate the token immediately (one-time use)
    await query(
      'UPDATE users SET magic_link_token = NULL, magic_link_expires_at = NULL, updated_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Issue JWT
    const jwtPayload = {
      id: user.id,
      email: user.email,
      role: user.email === 'paul@creativelab.tv' ? 'admin' : 'user',
    };
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '7d' });

    res.cookie('mm_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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
        role: jwtPayload.role,
      },
    });
  } catch (err) {
    console.error('Magic link verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
