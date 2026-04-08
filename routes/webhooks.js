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

// Helper: determine plan from Square subscription's plan_variation_id
function determinePlan(subscription) {
  const variationId = subscription.plan_variation_id;
  const monthlyId = process.env.SQUARE_MONTHLY_VARIATION_ID;
  const annualId = process.env.SQUARE_ANNUAL_VARIATION_ID;
  if (variationId === monthlyId) return 'monthly';
  if (variationId === annualId) return 'annual';
  // Fallback: check if any phase cadence hints at the plan
  return 'monthly';
}

async function handleSubscriptionCreated(subscription) {
  const user = await queryOne('SELECT id FROM users WHERE square_subscription_id = ?', [subscription.id]);
  if (!user) return;

  const plan = determinePlan(subscription);
  await query(
    `UPDATE users SET subscription_tier = 'platinum', subscription_status = 'active',
     subscription_plan = ?, updated_at = NOW() WHERE id = ?`,
    [plan, user.id]
  );
}

async function handleSubscriptionUpdated(subscription) {
  const user = await queryOne('SELECT id FROM users WHERE square_subscription_id = ?', [subscription.id]);
  if (!user) return;

  const status = subscription.status === 'ACTIVE' ? 'active'
    : subscription.status === 'CANCELED' ? 'canceled'
    : subscription.status === 'PAUSED' ? 'past_due'
    : 'none';

  if (status === 'active') {
    // Subscription is active — ensure all fields reflect platinum
    const plan = determinePlan(subscription);
    await query(
      `UPDATE users SET subscription_tier = 'platinum', subscription_status = 'active',
       subscription_plan = ?, updated_at = NOW() WHERE id = ?`,
      [plan, user.id]
    );
  } else if (status === 'canceled') {
    // Fully canceled — clear everything
    await query(
      `UPDATE users SET subscription_tier = 'free', subscription_status = 'canceled',
       subscription_plan = 'none', square_subscription_id = NULL, updated_at = NOW() WHERE id = ?`,
      [user.id]
    );
  } else {
    // past_due or other — keep tier but flag status
    await query(
      `UPDATE users SET subscription_status = ?, updated_at = NOW() WHERE id = ?`,
      [status, user.id]
    );
  }
}

async function handleSubscriptionCanceled(subscription) {
  const user = await queryOne('SELECT id FROM users WHERE square_subscription_id = ?', [subscription.id]);
  if (!user) return;

  await query(
    `UPDATE users SET subscription_tier = 'free', subscription_status = 'canceled',
     subscription_plan = 'none', square_subscription_id = NULL, updated_at = NOW() WHERE id = ?`,
    [user.id]
  );
}

async function handlePaymentFailed(invoice) {
  if (!invoice.subscription_id) return;
  const user = await queryOne('SELECT id FROM users WHERE square_subscription_id = ?', [invoice.subscription_id]);
  if (!user) return;

  // Keep platinum access but flag as past_due so admin can see
  await query(
    `UPDATE users SET subscription_status = 'past_due', updated_at = NOW() WHERE id = ?`,
    [user.id]
  );
}

module.exports = router;
