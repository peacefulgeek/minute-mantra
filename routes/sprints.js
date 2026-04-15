const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/sprints/active — get the user's active sprint
router.get('/active', requireAuth, async (req, res) => {
  try {
    const sprint = await queryOne(
      `SELECT * FROM sprints WHERE user_id = ? AND status = 'active' LIMIT 1`,
      [req.user.id]
    );
    if (!sprint) {
      return res.json({ sprint: null });
    }

    // Calculate which day of the sprint we're on
    const startDate = new Date(sprint.start_date);
    const now = new Date();
    // Use user's timezone for accurate day calc
    const user = await queryOne('SELECT timezone FROM users WHERE id = ?', [req.user.id]);
    const tz = user?.timezone || 'America/New_York';
    const todayStr = getTodayInTimezone(tz);
    const startStr = sprint.start_date.toISOString ? sprint.start_date.toISOString().split('T')[0] : String(sprint.start_date).split('T')[0];

    const diffMs = new Date(todayStr) - new Date(startStr);
    const sprintDay = Math.floor(diffMs / 86400000) + 1; // 1-indexed

    const mantraOrder = JSON.parse(sprint.mantra_order);

    // If sprint is over, mark it complete
    if (sprintDay > sprint.duration) {
      await query("UPDATE sprints SET status = 'completed' WHERE id = ?", [sprint.id]);
      return res.json({ sprint: null, just_completed: true });
    }

    // Get today's mantra from the sprint schedule
    const todayMantraId = mantraOrder[(sprintDay - 1) % mantraOrder.length];
    const mantra = await queryOne('SELECT * FROM mantras WHERE id = ?', [todayMantraId]);

    res.json({
      sprint: {
        id: sprint.id,
        duration: sprint.duration,
        sprint_day: sprintDay,
        start_date: startStr,
        mantra_count: [...new Set(mantraOrder)].length,
        status: sprint.status,
      },
      mantra: mantra ? {
        ...mantra,
        audio_url: buildCdnUrl(mantra.audio_filename),
      } : null,
    });
  } catch (err) {
    console.error('Get active sprint error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/sprints — create a new sprint
router.post('/', requireAuth, async (req, res) => {
  try {
    const { duration } = req.body;
    const userId = req.user.id;

    if (![7, 30, 60, 90].includes(duration)) {
      return res.status(400).json({ error: 'Duration must be 7, 30, 60, or 90 days' });
    }

    // Check for existing active sprint
    const existing = await queryOne(
      "SELECT id FROM sprints WHERE user_id = ? AND status = 'active'",
      [userId]
    );
    if (existing) {
      return res.status(409).json({ error: 'You already have an active sprint. Cancel it first to start a new one.' });
    }

    // Get user's favorites
    const favorites = await query(
      `SELECT m.id FROM mantras m
       JOIN favorites f ON f.mantra_id = m.id
       WHERE f.user_id = ?
       ORDER BY f.created_at`,
      [userId]
    );

    if (favorites.length === 0) {
      return res.status(400).json({ error: 'You need at least one favorite mantra to start a sprint.' });
    }

    // Build the mantra order: round-robin favorites across all sprint days
    const favoriteIds = favorites.map(f => f.id);
    const mantraOrder = [];
    for (let i = 0; i < duration; i++) {
      mantraOrder.push(favoriteIds[i % favoriteIds.length]);
    }

    // Get today's date in user's timezone
    const user = await queryOne('SELECT timezone FROM users WHERE id = ?', [userId]);
    const tz = user?.timezone || 'America/New_York';
    const today = getTodayInTimezone(tz);

    await query(
      `INSERT INTO sprints (user_id, duration, start_date, mantra_order, status) VALUES (?, ?, ?, ?, 'active')`,
      [userId, duration, today, JSON.stringify(mantraOrder)]
    );

    res.status(201).json({
      message: `Sprint started! ${duration} days with ${favoriteIds.length} favorite mantra${favoriteIds.length > 1 ? 's' : ''}.`,
      duration,
      mantra_count: favoriteIds.length,
    });
  } catch (err) {
    console.error('Create sprint error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/sprints/active — cancel the active sprint
router.delete('/active', requireAuth, async (req, res) => {
  try {
    const result = await query(
      "UPDATE sprints SET status = 'cancelled' WHERE user_id = ? AND status = 'active'",
      [req.user.id]
    );
    res.json({ message: 'Sprint cancelled.' });
  } catch (err) {
    console.error('Cancel sprint error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper: get today in timezone
function getTodayInTimezone(timezone) {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    return `${y}-${m}-${d}`;
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

function buildCdnUrl(filename) {
  if (!filename) return null;
  const base = process.env.BUNNY_CDN_BASE_URL || 'https://minute-mantra.b-cdn.net';
  return `${base}/audio/${filename}?v=2`;
}

module.exports = router;
