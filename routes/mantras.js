const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../config/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

function getDayOfYear(timezone = 'America/New_York') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
  const parts = formatter.formatToParts(now);
  const month = parseInt(parts.find(p => p.type === 'month').value);
  const day = parseInt(parts.find(p => p.type === 'day').value);
  const year = parseInt(parts.find(p => p.type === 'year').value);
  const start = new Date(year, 0, 0);
  const date = new Date(year, month - 1, day);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function buildCdnUrl(filename) {
  if (!filename) return null;
  const base = process.env.BUNNY_CDN_BASE_URL || 'https://minute-mantra.b-cdn.net';
  return `${base}/audio/${filename}`;
}

// GET /api/mantras/today
router.get('/today', optionalAuth, async (req, res) => {
  try {
    const timezone = req.user
      ? (await queryOne('SELECT timezone FROM users WHERE id = ?', [req.user.id]))?.timezone || 'America/New_York'
      : (req.query.timezone || 'America/New_York');

    const dayOfYear = getDayOfYear(timezone);
    const mantra = await queryOne('SELECT * FROM mantras WHERE day_of_year = ?', [dayOfYear]);

    if (!mantra) {
      return res.status(404).json({ error: 'No mantra found for today' });
    }

    const result = {
      ...mantra,
      // Use stored audio_url if available, otherwise build from filename
      audio_url: mantra.audio_url || buildCdnUrl(mantra.audio_filename),
    };

    // Check if favorited by user
    if (req.user) {
      const fav = await queryOne(
        'SELECT id FROM favorites WHERE user_id = ? AND mantra_id = ?',
        [req.user.id, mantra.id]
      );
      result.is_favorited = !!fav;
    }

    res.json({ mantra: result, day_of_year: dayOfYear });
  } catch (err) {
    console.error('Get today mantra error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/mantras/favorites
router.get('/favorites', requireAuth, async (req, res) => {
  try {
    const mantras = await query(
      `SELECT m.*, f.created_at as favorited_at
       FROM mantras m
       JOIN favorites f ON f.mantra_id = m.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    const result = mantras.map(m => ({ ...m, audio_url: m.audio_url || buildCdnUrl(m.audio_filename) }));
    res.json({ mantras: result });
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/mantras/library
router.get('/library', requireAuth, async (req, res) => {
  try {
    const user = await queryOne('SELECT subscription_tier FROM users WHERE id = ?', [req.user.id]);
    if (user.subscription_tier !== 'premium') {
      return res.status(403).json({ error: 'Premium subscription required to browse the full library' });
    }

    const { tradition, intention, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM mantras WHERE 1=1';
    const params = [];

    if (tradition) { sql += ' AND tradition = ?'; params.push(tradition); }
    if (intention) { sql += ' AND intention = ?'; params.push(intention); }

    sql += ' ORDER BY day_of_year LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const mantras = await query(sql, params);
    const result = mantras.map(m => ({ ...m, audio_url: m.audio_url || buildCdnUrl(m.audio_filename) }));
    res.json({ mantras: result, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Get library error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/mantras/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const mantra = await queryOne('SELECT * FROM mantras WHERE id = ?', [req.params.id]);
    if (!mantra) return res.status(404).json({ error: 'Mantra not found' });

    const result = { ...mantra, audio_url: mantra.audio_url || buildCdnUrl(mantra.audio_filename) };

    if (req.user) {
      const fav = await queryOne(
        'SELECT id FROM favorites WHERE user_id = ? AND mantra_id = ?',
        [req.user.id, mantra.id]
      );
      result.is_favorited = !!fav;
    }

    res.json({ mantra: result });
  } catch (err) {
    console.error('Get mantra error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/mantras/:id/favorite
router.post('/:id/favorite', requireAuth, async (req, res) => {
  try {
    const mantraId = req.params.id;
    const userId = req.user.id;

    const user = await queryOne('SELECT subscription_tier FROM users WHERE id = ?', [userId]);
    const existing = await queryOne(
      'SELECT id FROM favorites WHERE user_id = ? AND mantra_id = ?',
      [userId, mantraId]
    );

    if (existing) {
      // Unfavorite
      await query('DELETE FROM favorites WHERE user_id = ? AND mantra_id = ?', [userId, mantraId]);
      return res.json({ favorited: false });
    }

    // Check free tier limit
    if (user.subscription_tier !== 'premium') {
      const count = await queryOne(
        'SELECT COUNT(*) as cnt FROM favorites WHERE user_id = ?',
        [userId]
      );
      if (count.cnt >= 5) {
        return res.status(403).json({
          error: 'Free users can save up to 5 favorites. Upgrade to Premium for unlimited favorites.',
          upgrade_required: true,
        });
      }
    }

    await query('INSERT INTO favorites (user_id, mantra_id) VALUES (?, ?)', [userId, mantraId]);
    res.json({ favorited: true });
  } catch (err) {
    console.error('Toggle favorite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
