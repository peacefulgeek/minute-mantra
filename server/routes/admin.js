const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { sendMorningNotifications } = require('../services/scheduler');

// Admin guard middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.email !== 'paul@creativelab.tv') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

router.use(requireAuth, requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      premiumUsers,
      activeStreaks,
      sessionsToday,
      emailSubscribers,
      pushSubscribers,
      monthlySubs,
      annualSubs,
      emailsSent30d,
      unsubscribes30d,
      recentSignups,
      churn30d,
    ] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM users'),
      queryOne("SELECT COUNT(*) as count FROM users WHERE subscription_tier = 'premium' AND subscription_status = 'active'"),
      queryOne('SELECT COUNT(*) as count FROM streaks WHERE current_streak > 0'),
      queryOne('SELECT COUNT(*) as count FROM sessions WHERE DATE(completed_at) = CURDATE()'),
      queryOne('SELECT COUNT(*) as count FROM users WHERE email_notifications_enabled = 1'),
      queryOne('SELECT COUNT(*) as count FROM push_subscriptions'),
      queryOne("SELECT COUNT(*) as count FROM users WHERE subscription_plan = 'monthly' AND subscription_status = 'active'"),
      queryOne("SELECT COUNT(*) as count FROM users WHERE subscription_plan = 'annual' AND subscription_status = 'active'"),
      queryOne("SELECT COUNT(*) as count FROM email_logs WHERE sent_at > DATE_SUB(NOW(), INTERVAL 30 DAY)"),
      queryOne("SELECT COUNT(*) as count FROM users WHERE unsubscribed_at > DATE_SUB(NOW(), INTERVAL 30 DAY)"),
      query("SELECT email, subscription_tier, created_at FROM users ORDER BY created_at DESC LIMIT 10"),
      queryOne("SELECT COUNT(*) as count FROM users WHERE subscription_status = 'cancelled' AND updated_at > DATE_SUB(NOW(), INTERVAL 30 DAY)"),
    ]);

    const monthlyRevenue = (monthlySubs.count * 1.97) + (annualSubs.count * 16.95 / 12);

    res.json({
      total_users: totalUsers.count,
      premium_users: premiumUsers.count,
      active_streaks: activeStreaks.count,
      sessions_today: sessionsToday.count,
      email_subscribers: emailSubscribers.count,
      push_subscribers: pushSubscribers.count,
      monthly_subs: monthlySubs.count,
      annual_subs: annualSubs.count,
      emails_sent_30d: emailsSent30d.count,
      unsubscribes_30d: unsubscribes30d.count,
      churned_30d: churn30d.count,
      mrr: monthlyRevenue,
      recent_signups: recentSignups,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', tier = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ' AND u.email LIKE ?';
      params.push(`%${search}%`);
    }
    if (tier) {
      whereClause += ' AND u.subscription_tier = ?';
      params.push(tier);
    }

    params.push(parseInt(limit), offset);

    const users = await query(
      `SELECT u.id, u.email, u.display_name, u.subscription_tier, u.subscription_status,
              u.subscription_plan, u.email_notifications_enabled, u.push_notifications_enabled,
              u.created_at, u.timezone,
              COALESCE(s.current_streak, 0) as current_streak,
              COALESCE(s.longest_streak, 0) as longest_streak
       FROM users u
       LEFT JOIN streaks s ON s.user_id = u.id
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    res.json({ users });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/mantras
router.get('/mantras', async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (m.transliteration LIKE ? OR m.english_translation LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    params.push(parseInt(limit), offset);

    const mantras = await query(
      `SELECT m.id, m.day_of_year, m.transliteration, m.tradition, m.audio_url, m.hero_image_url,
              COUNT(f.id) as favorite_count
       FROM mantras m
       LEFT JOIN favorites f ON f.mantra_id = m.id
       WHERE ${whereClause}
       GROUP BY m.id
       ORDER BY m.day_of_year ASC
       LIMIT ? OFFSET ?`,
      params
    );

    res.json({ mantras });
  } catch (err) {
    console.error('Admin mantras error:', err);
    res.status(500).json({ error: 'Failed to fetch mantras' });
  }
});

// POST /api/admin/run-cron
router.post('/run-cron', async (req, res) => {
  try {
    const result = await sendMorningNotifications();
    res.json({ ok: true, sent: result?.sent || 0 });
  } catch (err) {
    console.error('Admin run-cron error:', err);
    res.status(500).json({ error: 'Failed to run cron' });
  }
});

// POST /api/admin/test-notification
router.post('/test-notification', async (req, res) => {
  try {
    const { sendPushToUser } = require('../services/push');
    await sendPushToUser(req.user.id, {
      title: 'Minute Mantra Test',
      body: 'Your push notifications are working!',
      url: '/',
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin test-notification error:', err);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// POST /api/admin/add-user
router.post('/add-user', async (req, res) => {
  try {
    const { email, tier = 'free', plan = 'none' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Check if user already exists
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'User already exists' });

    await query(
      `INSERT INTO users (email, subscription_tier, subscription_plan, subscription_status) VALUES (?, ?, ?, ?)`,
      [email, tier, plan, tier === 'premium' ? 'active' : 'none']
    );

    const newUser = await queryOne('SELECT id, email, subscription_tier, subscription_plan, subscription_status, created_at FROM users WHERE email = ?', [email]);
    res.json({ ok: true, user: newUser });
  } catch (err) {
    console.error('Admin add-user error:', err);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// POST /api/admin/upgrade-user
router.post('/upgrade-user', async (req, res) => {
  try {
    const { userId, plan = 'monthly' } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    await query(
      `UPDATE users SET subscription_tier = 'premium', subscription_plan = ?, subscription_status = 'active', updated_at = NOW() WHERE id = ?`,
      [plan, userId]
    );

    const user = await queryOne('SELECT id, email, subscription_tier, subscription_plan, subscription_status FROM users WHERE id = ?', [userId]);
    res.json({ ok: true, user });
  } catch (err) {
    console.error('Admin upgrade-user error:', err);
    res.status(500).json({ error: 'Failed to upgrade user' });
  }
});

// POST /api/admin/downgrade-user
router.post('/downgrade-user', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    await query(
      `UPDATE users SET subscription_tier = 'free', subscription_plan = 'none', subscription_status = 'none', square_subscription_id = NULL, updated_at = NOW() WHERE id = ?`,
      [userId]
    );

    const user = await queryOne('SELECT id, email, subscription_tier, subscription_plan, subscription_status FROM users WHERE id = ?', [userId]);
    res.json({ ok: true, user });
  } catch (err) {
    console.error('Admin downgrade-user error:', err);
    res.status(500).json({ error: 'Failed to downgrade user' });
  }
});

// DELETE /api/admin/delete-user
router.delete('/delete-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await queryOne('SELECT id, email FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email === 'paul@creativelab.tv') return res.status(403).json({ error: 'Cannot delete admin user' });

    await query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete-user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST /api/admin/reseed-mantras — Update all mantras in DB from seed data
router.post('/reseed-mantras', async (req, res) => {
  try {
    const part1 = require('../seeds/mantras-part1');
    const part2 = require('../seeds/mantras-part2');
    const part3 = require('../seeds/mantras-part3');
    const part4 = require('../seeds/mantras-part4');
    const ALL = [...part1, ...part2, ...part3, ...part4];

    let updated = 0, inserted = 0;
    for (const m of ALL) {
      const existing = await queryOne('SELECT id FROM mantras WHERE day_of_year = ?', [m.day_of_year]);
      if (existing) {
        await query(
          `UPDATE mantras SET
            original_script = ?, transliteration = ?, english_translation = ?,
            tradition = ?, intention = ?, phonetic_guide = ?,
            context_note = ?, go_deeper_teaser = ?, audio_filename = ?
          WHERE day_of_year = ?`,
          [
            m.original_script, m.transliteration, m.english_translation,
            m.tradition, m.intention || null, m.phonetic_guide || null,
            m.context_note || null, m.go_deeper_teaser || null,
            m.audio_filename || `mantra-${String(m.day_of_year).padStart(3,'0')}.mp3`,
            m.day_of_year,
          ]
        );
        updated++;
      } else {
        await query(
          `INSERT INTO mantras (day_of_year, original_script, transliteration, english_translation,
            tradition, intention, phonetic_guide, context_note, go_deeper_teaser, audio_filename)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            m.day_of_year, m.original_script, m.transliteration, m.english_translation,
            m.tradition, m.intention || null, m.phonetic_guide || null,
            m.context_note || null, m.go_deeper_teaser || null,
            m.audio_filename || `mantra-${String(m.day_of_year).padStart(3,'0')}.mp3`,
          ]
        );
        inserted++;
      }
    }
    res.json({ ok: true, updated, inserted, total: ALL.length });
  } catch (err) {
    console.error('Reseed mantras error:', err);
    res.status(500).json({ error: 'Failed to reseed mantras', detail: err.message });
  }
});

module.exports = router;
