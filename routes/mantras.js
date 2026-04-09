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
  // Use Date.UTC to avoid DST bugs — pure arithmetic, no timezone shifts
  const start = Date.UTC(year, 0, 0);
  const date = Date.UTC(year, month - 1, day);
  return Math.floor((date - start) / 86400000);
}

function buildCdnUrl(filename) {
  if (!filename) return null;
  const base = process.env.BUNNY_CDN_BASE_URL || 'https://minute-mantra.b-cdn.net';
  return `${base}/audio/${filename}?v=2`;
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
      // Always build audio_url from filename for correct CDN path
      audio_url: buildCdnUrl(mantra.audio_filename),
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
    const result = mantras.map(m => ({ ...m, audio_url: buildCdnUrl(m.audio_filename) }));
    res.json({ mantras: result });
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Category-to-intention mapping for the Library page
// Each category maps to multiple intentions from the 170+ unique intentions in the DB
const CATEGORIES = {
  'Love': ['Love', 'Unconditional Love', 'Loving-Kindness', 'Devotion', 'Compassion', 'Companionship', 'Friendship', 'Sweetness', 'Nurturing'],
  'Healing': ['Healing', 'Complete Healing', 'Relief', 'Wellbeing', 'Nourishment', 'Rescue', 'Body Reverence'],
  'Peace': ['Peace', 'Inner Peace', 'Ease', 'Contentment', 'Equanimity', 'Rest', 'Simplicity', 'Stillness', 'Imperturbability'],
  'Transitions': ['Transformation', 'Beginnings', 'New Beginnings', 'New Day', 'Becoming', 'Renewal', 'Release', 'Impermanence', 'Completion'],
  'Strength': ['Strength', 'Courage', 'Fearlessness', 'Power', 'Empowerment', 'Unstoppability', 'Victory', 'Sovereignty', 'Stability', 'Steadiness'],
  'Trauma': ['Release', 'Self-Forgiveness', 'Forgiveness', 'Healing', 'Liberation', 'Freedom', 'Purification', 'Transmutation', 'Cutting Through'],
  'Wisdom': ['Wisdom', 'Inner Wisdom', 'Knowledge', 'Clarity', 'Awareness', 'Consciousness', 'Illumination', 'Intelligence', 'Inner Guidance', 'Guidance', 'Self-Knowledge', 'Self-Realization', 'Self-realization', 'Nature of Mind'],
  'Abundance': ['Abundance', 'Prosperity', 'Success', 'Achievement', 'Accomplishment', 'Attraction', 'Generosity', 'Greatness'],
  'Protection': ['Protection', 'Obstacle Removal', 'Grounding', 'Stability', 'Support', 'Refuge', 'Constancy'],
  'Joy': ['Joy', 'Supreme Joy', 'Bliss', 'Gratitude', 'Optimism', 'Wonder', 'Beauty', 'Radiance', 'Luminosity'],
  'Focus': ['Focus', 'Meditation', 'Presence', 'Absorption', 'Practice', 'Commitment', 'Mastery', 'Breath', 'Breath Practice'],
  'Surrender': ['Surrender', 'Trust', 'Faith', 'Devotion', 'Humility', 'Acceptance', 'Self-Acceptance', 'Grace', 'Offering', 'Reverence', 'Renunciation'],
};

// GET /api/mantras/library
router.get('/library', requireAuth, async (req, res) => {
  try {
    const user = await queryOne('SELECT subscription_tier FROM users WHERE id = ?', [req.user.id]);
    if (user.subscription_tier !== 'platinum') {
      return res.status(403).json({ error: 'Platinum subscription required to browse the full library' });
    }

    const { tradition, intention, category, search: searchTerm, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM mantras WHERE 1=1';
    const params = [];

    if (tradition) { sql += ' AND tradition = ?'; params.push(tradition); }
    if (intention) { sql += ' AND intention = ?'; params.push(intention); }

    // Category filter: map category name to list of intentions
    if (category && CATEGORIES[category]) {
      const intentions = CATEGORIES[category];
      sql += ` AND intention IN (${intentions.map(() => '?').join(',')})`;
      params.push(...intentions);
    }

    // Text search across transliteration, translation, intention, context_note
    if (searchTerm) {
      sql += ' AND (transliteration LIKE ? OR english_translation LIKE ? OR intention LIKE ? OR context_note LIKE ?)';
      const term = `%${searchTerm}%`;
      params.push(term, term, term, term);
    }

    // Get total count for pagination
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await queryOne(countSql, [...params]);

    sql += ' ORDER BY day_of_year LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const mantras = await query(sql, params);
    const result = mantras.map(m => ({ ...m, audio_url: buildCdnUrl(m.audio_filename) }));
    res.json({
      mantras: result,
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult.total,
      categories: Object.keys(CATEGORIES),
    });
  } catch (err) {
    console.error('Get library error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/mantras/categories — return available categories
router.get('/categories', async (req, res) => {
  res.json({ categories: Object.keys(CATEGORIES) });
});

// GET /api/mantras/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const mantra = await queryOne('SELECT * FROM mantras WHERE id = ?', [req.params.id]);
    if (!mantra) return res.status(404).json({ error: 'Mantra not found' });

    const result = { ...mantra, audio_url: buildCdnUrl(mantra.audio_filename) };

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
    if (user.subscription_tier !== 'platinum') {
      const count = await queryOne(
        'SELECT COUNT(*) as cnt FROM favorites WHERE user_id = ?',
        [userId]
      );
      if (count.cnt >= 5) {
        return res.status(403).json({
          error: 'Free users can save up to 5 favorites. Upgrade to Platinum for unlimited favorites.',
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
