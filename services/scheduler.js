const cron = require('node-cron');
const { query, queryOne } = require('../config/db');
const { sendMorningEmail } = require('./email');
const { sendPushNotification } = require('./push');

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

function getCurrentTimeInTimezone(timezone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date()); // e.g. "07:00"
}

async function sendNotifications() {
  try {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    // Get all users with notifications enabled
    const users = await query(
      `SELECT id, email, display_name, timezone, notification_time, 
              email_notifications_enabled, push_notifications_enabled, 
              push_subscription, unsubscribe_token
       FROM users 
       WHERE (email_notifications_enabled = TRUE OR push_notifications_enabled = TRUE)
         AND notification_time IS NOT NULL`
    );

    const emailBatch = [];
    const pushBatch = [];

    for (const user of users) {
      try {
        const userTime = getCurrentTimeInTimezone(user.timezone || 'America/New_York');
        const notifTime = user.notification_time
          ? user.notification_time.substring(0, 5)
          : '07:00';

        if (userTime !== notifTime) continue;

        const dayOfYear = getDayOfYearForTimezone(user.timezone || 'America/New_York');
        const mantra = await queryOne('SELECT * FROM mantras WHERE day_of_year = ?', [dayOfYear]);
        if (!mantra) continue;

        if (user.email_notifications_enabled) {
          emailBatch.push({ user, mantra });
        }
        if (user.push_notifications_enabled && user.push_subscription) {
          pushBatch.push({ user, mantra });
        }
      } catch (userErr) {
        console.error(`Notification error for user ${user.id}:`, userErr.message);
      }
    }

    // Send emails in batches of 50 with 1s delay
    for (let i = 0; i < emailBatch.length; i += 50) {
      const batch = emailBatch.slice(i, i + 50);
      await Promise.allSettled(batch.map(({ user, mantra }) => sendMorningEmail(user, mantra)));
      if (i + 50 < emailBatch.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Send push notifications
    for (const { user, mantra } of pushBatch) {
      const result = await sendPushNotification(user.push_subscription, mantra);
      if (result === 'expired') {
        await query(
          'UPDATE users SET push_subscription = NULL, push_notifications_enabled = FALSE WHERE id = ?',
          [user.id]
        );
      }
    }

    if (emailBatch.length > 0 || pushBatch.length > 0) {
      console.log(`Notifications sent: ${emailBatch.length} emails, ${pushBatch.length} push`);
    }
  } catch (err) {
    console.error('Scheduler error:', err);
  }
}

function startScheduler() {
  // Run every minute
  cron.schedule('* * * * *', sendNotifications);
  console.log('Notification scheduler started');
}

module.exports = { startScheduler };
