const webpush = require('web-push');

function initWebPush() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:noreply@minutemantra.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
}

initWebPush();

async function sendPushNotification(subscription, mantra) {
  if (!subscription) return;

  const payload = JSON.stringify({
    title: 'Minute Mantra',
    body: `${mantra.transliteration} — ${(mantra.intention || 'practice').toLowerCase()}`,
    icon: `${process.env.BUNNY_CDN_BASE_URL || 'https://minute-mantra.b-cdn.net'}/icons/icon-192.png`,
    badge: `${process.env.BUNNY_CDN_BASE_URL || 'https://minute-mantra.b-cdn.net'}/icons/badge-72.png`,
    url: process.env.APP_URL || 'https://minutemantra.com',
    tag: 'morning-mantra',
    renotify: true,
  });

  try {
    await webpush.sendNotification(
      typeof subscription === 'string' ? JSON.parse(subscription) : subscription,
      payload
    );
    return true;
  } catch (err) {
    if (err.statusCode === 410) {
      return 'expired';
    }
    console.error('Push notification error:', err.message);
    return false;
  }
}

module.exports = { sendPushNotification };
