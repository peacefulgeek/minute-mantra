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

module.exports = router;
