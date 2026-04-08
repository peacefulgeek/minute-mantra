const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

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
      platinumUsers,
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
      queryOne("SELECT COUNT(*) as count FROM users WHERE subscription_tier = 'platinum' AND subscription_status = 'active'"),
      queryOne('SELECT COUNT(*) as count FROM streaks WHERE current_streak > 0'),
      queryOne('SELECT COUNT(*) as count FROM sessions WHERE DATE(completed_at) = CURDATE()'),
      queryOne('SELECT COUNT(*) as count FROM users WHERE email_notifications_enabled = 1'),
      queryOne('SELECT COUNT(*) as count FROM users WHERE push_subscription IS NOT NULL AND push_notifications_enabled = TRUE'),
      queryOne("SELECT COUNT(*) as count FROM users WHERE subscription_plan = 'monthly' AND subscription_status = 'active'"),
      queryOne("SELECT COUNT(*) as count FROM users WHERE subscription_plan = 'annual' AND subscription_status = 'active'"),
      queryOne("SELECT COUNT(*) as count FROM email_logs WHERE sent_at > DATE_SUB(NOW(), INTERVAL 30 DAY)"),
      queryOne("SELECT COUNT(*) as count FROM users WHERE unsubscribed_at > DATE_SUB(NOW(), INTERVAL 30 DAY)"),
      query("SELECT email, subscription_tier, subscription_plan, subscription_status, created_at FROM users ORDER BY created_at DESC LIMIT 10"),
      queryOne("SELECT COUNT(*) as count FROM users WHERE subscription_status = 'canceled' AND updated_at > DATE_SUB(NOW(), INTERVAL 30 DAY)"),
    ]);

    const monthlyRevenue = (monthlySubs.count * 1.08) + (annualSubs.count * 9.88 / 12);

    res.json({
      total_users: totalUsers.count,
      platinum_users: platinumUsers.count,
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
              u.subscription_plan, u.square_subscription_id,
              u.email_notifications_enabled, u.push_notifications_enabled,
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
      `SELECT m.id, m.day_of_year, m.transliteration, m.tradition, m.audio_filename,
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

// POST /api/admin/run-cron — manually trigger morning notifications
router.post('/run-cron', async (req, res) => {
  try {
    const { sendMorningEmail } = require('../services/email');
    const users = await query(
      `SELECT id, email, display_name, timezone, notification_time,
              email_notifications_enabled, unsubscribe_token
       FROM users
       WHERE email_notifications_enabled = TRUE`
    );

    let sent = 0;
    for (const user of users) {
      try {
        const dayOfYear = getDayOfYearForTimezone(user.timezone || 'America/New_York');
        const mantra = await queryOne('SELECT * FROM mantras WHERE day_of_year = ?', [dayOfYear]);
        if (!mantra) continue;
        await sendMorningEmail(user, mantra);
        sent++;
      } catch (e) {
        console.error(`Failed to send to ${user.email}:`, e.message);
      }
    }

    res.json({ ok: true, sent });
  } catch (err) {
    console.error('Admin run-cron error:', err);
    res.status(500).json({ error: 'Failed to run cron' });
  }
});

function getDayOfYearForTimezone(timezone) {
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
  return Math.floor((date - start) / (1000 * 60 * 60 * 24));
}

// POST /api/admin/test-notification
router.post('/test-notification', async (req, res) => {
  try {
    const { sendPushNotification } = require('../services/push');
    const user = await queryOne('SELECT push_subscription FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.push_subscription) {
      return res.status(400).json({ error: 'No push subscription found for your account' });
    }
    const mantra = { transliteration: 'Test Notification', intention: 'testing' };
    await sendPushNotification(user.push_subscription, mantra);
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

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const status = tier === 'free' ? 'none' : 'active';
    const effectivePlan = tier === 'free' ? 'none' : 'admin_granted';

    await query(
      `INSERT INTO users (email, subscription_tier, subscription_plan, subscription_status) VALUES (?, ?, ?, ?)`,
      [email, tier, effectivePlan, status]
    );

    const newUser = await queryOne('SELECT id, email, subscription_tier, subscription_plan, subscription_status, created_at FROM users WHERE email = ?', [email]);
    res.json({ ok: true, user: newUser });
  } catch (err) {
    console.error('Admin add-user error:', err);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// POST /api/admin/set-tier — Set user to free or platinum
// If downgrading a Square-paying user, cancels their Square subscription first
router.post('/set-tier', async (req, res) => {
  try {
    const { userId, tier } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const validTiers = ['free', 'platinum'];
    if (!validTiers.includes(tier)) return res.status(400).json({ error: 'tier must be free or platinum' });

    // Get current user info
    const currentUser = await queryOne(
      'SELECT id, email, subscription_tier, subscription_plan, square_subscription_id FROM users WHERE id = ?',
      [userId]
    );
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    // If downgrading to free AND user has a Square subscription, cancel it
    let squareCanceled = false;
    if (tier === 'free' && currentUser.square_subscription_id) {
      try {
        const squareService = require('../services/square');
        await squareService.cancelSubscription(currentUser.square_subscription_id);
        squareCanceled = true;
      } catch (squareErr) {
        console.error('Square cancellation error:', squareErr.message);
        // Continue with downgrade even if Square cancel fails — admin override
      }
    }

    // Always set all 3 subscription fields atomically to avoid inconsistent state
    if (tier === 'free') {
      await query(
        `UPDATE users SET subscription_tier = 'free', subscription_plan = 'none',
         subscription_status = 'none', square_subscription_id = NULL, updated_at = NOW() WHERE id = ?`,
        [userId]
      );
    } else {
      // When admin grants platinum, preserve existing plan if it's a real Square plan,
      // otherwise mark as admin_granted
      const plan = (currentUser.subscription_plan === 'monthly' || currentUser.subscription_plan === 'annual')
        ? currentUser.subscription_plan : 'admin_granted';
      await query(
        `UPDATE users SET subscription_tier = 'platinum', subscription_plan = ?,
         subscription_status = 'active', updated_at = NOW() WHERE id = ?`,
        [plan, userId]
      );
    }

    const user = await queryOne('SELECT id, email, subscription_tier, subscription_plan, subscription_status FROM users WHERE id = ?', [userId]);
    res.json({ ok: true, user, square_canceled: squareCanceled });
  } catch (err) {
    console.error('Admin set-tier error:', err);
    res.status(500).json({ error: 'Failed to set user tier' });
  }
});

// DELETE /api/admin/delete-user
router.delete('/delete-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await queryOne('SELECT id, email, square_subscription_id FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email === 'paul@creativelab.tv') return res.status(403).json({ error: 'Cannot delete admin user' });

    // Cancel Square subscription if exists before deleting
    if (user.square_subscription_id) {
      try {
        const squareService = require('../services/square');
        await squareService.cancelSubscription(user.square_subscription_id);
      } catch (squareErr) {
        console.error('Square cancellation on delete error:', squareErr.message);
      }
    }

    // Delete related data first
    await query('DELETE FROM sessions WHERE user_id = ?', [userId]);
    await query('DELETE FROM favorites WHERE user_id = ?', [userId]);
    await query('DELETE FROM streaks WHERE user_id = ?', [userId]);
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
    const path = require('path');
    for (let i = 1; i <= 4; i++) {
      const mod = path.resolve(__dirname, `../seeds/mantras-part${i}.js`);
      delete require.cache[mod];
    }
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
            m.audio_filename != null ? m.audio_filename : null,
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
            m.audio_filename != null ? m.audio_filename : null,
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

// POST /api/admin/update-square-pricing — Create NEW Square catalog plan variations with updated pricing
// Square does not allow updating pricing on existing variations, so we create new ones
router.post('/update-square-pricing', async (req, res) => {
  try {
    const { Client, Environment } = require('square');
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
    });

    const safe = (obj) => JSON.parse(JSON.stringify(obj, (k, v) => typeof v === 'bigint' ? v.toString() : v));

    // Create NEW Monthly variation -> $1.08/mo
    const { result: monthlyResult } = await client.catalogApi.upsertCatalogObject({
      idempotencyKey: `create-monthly-108-${Date.now()}`,
      object: {
        type: 'SUBSCRIPTION_PLAN_VARIATION',
        id: '#monthly-108',
        subscriptionPlanVariationData: {
          name: 'Platinum Monthly - $1.08/mo',
          phases: [{
            cadence: 'MONTHLY',
            ordinal: BigInt(0),
            pricing: {
              type: 'STATIC',
              priceMoney: { amount: BigInt(108), currency: 'USD' },
            },
          }],
          subscriptionPlanId: 'JS4HR7SNYWOU6PX3ZMZFQKUL',
        },
      },
    });

    const newMonthlyId = monthlyResult.catalogObject.id;

    // Create NEW Annual variation -> $9.88/yr
    const { result: annualResult } = await client.catalogApi.upsertCatalogObject({
      idempotencyKey: `create-annual-988-${Date.now()}`,
      object: {
        type: 'SUBSCRIPTION_PLAN_VARIATION',
        id: '#annual-988',
        subscriptionPlanVariationData: {
          name: 'Platinum Annual - $9.88/yr',
          phases: [{
            cadence: 'ANNUAL',
            ordinal: BigInt(0),
            pricing: {
              type: 'STATIC',
              priceMoney: { amount: BigInt(988), currency: 'USD' },
            },
          }],
          subscriptionPlanId: 'V6D5B3RVX7UAN4V5BRAOMUIC',
        },
      },
    });

    const newAnnualId = annualResult.catalogObject.id;

    res.json({
      ok: true,
      message: 'New plan variations created. Update Railway env vars with these IDs.',
      newMonthlyVariationId: newMonthlyId,
      newAnnualVariationId: newAnnualId,
      monthly: safe(monthlyResult),
      annual: safe(annualResult),
    });
  } catch (err) {
    console.error('Update Square pricing error:', err);
    const detail = err.errors ? err.errors : (err.body ? err.body : err.message);
    res.status(500).json({ error: 'Failed to update Square pricing', detail, statusCode: err.statusCode });
  }
});

module.exports = router;
