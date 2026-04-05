const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// POST /api/sessions
router.post('/', requireAuth, async (req, res) => {
  try {
    const { mantra_id, duration_seconds, mode = 'timer', mala_count = 0 } = req.body;
    const userId = req.user.id;

    if (!mantra_id || !duration_seconds) {
      return res.status(400).json({ error: 'mantra_id and duration_seconds are required' });
    }

    const today = new Date().toISOString().split('T')[0];

    const result = await query(
      'INSERT INTO sessions (user_id, mantra_id, session_date, duration_seconds, mode, mala_count) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, mantra_id, today, duration_seconds, mode, mala_count]
    );

    // Update streak
    await updateStreak(userId, today);

    const streak = await queryOne('SELECT * FROM streaks WHERE user_id = ?', [userId]);
    res.status(201).json({ session_id: result.insertId, streak });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

async function updateStreak(userId, today) {
  const streak = await queryOne('SELECT * FROM streaks WHERE user_id = ?', [userId]);
  if (!streak) {
    await query('INSERT INTO streaks (user_id, current_streak, longest_streak, last_session_date) VALUES (?, 1, 1, ?)', [userId, today]);
    return;
  }

  const last = streak.last_session_date ? new Date(streak.last_session_date).toISOString().split('T')[0] : null;
  if (last === today) return; // Already logged today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];

  let newStreak = last === yStr ? streak.current_streak + 1 : 1;
  let longest = Math.max(streak.longest_streak, newStreak);

  await query(
    'UPDATE streaks SET current_streak = ?, longest_streak = ?, last_session_date = ? WHERE user_id = ?',
    [newStreak, longest, today, userId]
  );
}

// GET /api/sessions/streak
router.get('/streak', requireAuth, async (req, res) => {
  try {
    const streak = await queryOne('SELECT * FROM streaks WHERE user_id = ?', [req.user.id]);
    res.json({ streak: streak || { current_streak: 0, longest_streak: 0, last_session_date: null } });
  } catch (err) {
    console.error('Get streak error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/sessions/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const sessions = await query(
      `SELECT s.*, m.transliteration, m.tradition, m.intention
       FROM sessions s
       JOIN mantras m ON m.id = s.mantra_id
       WHERE s.user_id = ?
       ORDER BY s.session_date DESC, s.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
    );
    res.json({ sessions, page: parseInt(page) });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/sessions/history/:year/:month
router.get('/history/:year/:month', requireAuth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const sessions = await query(
      `SELECT s.session_date, SUM(s.duration_seconds) as total_seconds, 
              GROUP_CONCAT(m.transliteration SEPARATOR ', ') as mantras_chanted
       FROM sessions s
       JOIN mantras m ON m.id = s.mantra_id
       WHERE s.user_id = ? AND YEAR(s.session_date) = ? AND MONTH(s.session_date) = ?
       GROUP BY s.session_date
       ORDER BY s.session_date`,
      [req.user.id, year, month]
    );
    res.json({ sessions });
  } catch (err) {
    console.error('Get monthly history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
