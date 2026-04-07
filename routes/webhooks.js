const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, queryOne } = require('../config/db');

// POST /api/webhooks/square
router.post('/square', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify Square webhook signature
    const signature = req.headers['x-square-hmacsha256-signature'];
    const body = req.body.toString('utf8');
    const webhookUrl = `${process.env.APP_URL}/api/webhooks/square`;
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

    if (signatureKey && signature) {
      const hmac = crypto.createHmac('sha256', signatureKey);
      hmac.update(webhookUrl + body);
      const expected = hmac.digest('base64');
      if (expected !== signature) {
        console.warn('Square webhook signature mismatch');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = JSON.parse(body);
    console.log('Square webhook event:', event.type);

    switch (event.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data.object.subscription);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data.object.subscription);
        break;
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data.object.subscription);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object.invoice);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

async function handleSubscriptionCreated(subscription) {
  const user = await queryOne('SELECT id FROM users WHERE square_subscription_id = ?', [subscription.id]);
  if (user) {
    await query(
      'UPDATE users SET subscription_tier = ?, subscription_status = ? WHERE id = ?',
      ['platinum', 'active', user.id]
    );
  }
}

async function handleSubscriptionUpdated(subscription) {
  const user = await queryOne('SELECT id FROM users WHERE square_subscription_id = ?', [subscription.id]);
  if (!user) return;

  const status = subscription.status === 'ACTIVE' ? 'active'
    : subscription.status === 'CANCELED' ? 'canceled'
    : subscription.status === 'PAUSED' ? 'past_due'
    : 'none';

  const tier = status === 'active' ? 'platinum' : 'free';
  await query(
    'UPDATE users SET subscription_status = ?, subscription_tier = ? WHERE id = ?',
    [status, tier, user.id]
  );
}

async function handleSubscriptionCanceled(subscription) {
  const user = await queryOne('SELECT id FROM users WHERE square_subscription_id = ?', [subscription.id]);
  if (user) {
    await query(
      'UPDATE users SET subscription_status = ?, subscription_tier = ? WHERE id = ?',
      ['canceled', 'free', user.id]
    );
  }
}

async function handlePaymentFailed(invoice) {
  if (!invoice.subscription_id) return;
  const user = await queryOne('SELECT id FROM users WHERE square_subscription_id = ?', [invoice.subscription_id]);
  if (user) {
    await query(
      'UPDATE users SET subscription_status = ? WHERE id = ?',
      ['past_due', user.id]
    );
  }
}

module.exports = router;
