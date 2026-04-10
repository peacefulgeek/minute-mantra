const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const squareService = require('../services/square');

// GET /api/subscriptions/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = await queryOne(
      'SELECT subscription_tier, subscription_status, subscription_plan, square_subscription_id FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ subscription: user });
  } catch (err) {
    console.error('Get subscription status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/subscriptions/create
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { plan, payment_nonce } = req.body;
    if (!plan || !payment_nonce) {
      return res.status(400).json({ error: 'plan and payment_nonce are required' });
    }
    if (!['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ error: 'plan must be monthly or annual' });
    }

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const result = await squareService.createSubscription(user, plan, payment_nonce);

    await query(
      'UPDATE users SET square_customer_id = ?, square_subscription_id = ?, subscription_tier = ?, subscription_status = ?, subscription_plan = ? WHERE id = ?',
      [result.customerId, result.subscriptionId, 'gold', 'active', plan, req.user.id]
    );

    res.json({ message: 'Subscription created successfully', subscription: result });
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(500).json({ error: err.message || 'Failed to create subscription' });
  }
});

// POST /api/subscriptions/change
router.post('/change', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ error: 'plan must be monthly or annual' });
    }

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user.square_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    await squareService.changeSubscription(user.square_subscription_id, plan);
    await query('UPDATE users SET subscription_plan = ? WHERE id = ?', [plan, req.user.id]);

    res.json({ message: 'Subscription plan updated' });
  } catch (err) {
    console.error('Change subscription error:', err);
    res.status(500).json({ error: err.message || 'Failed to change subscription' });
  }
});

// POST /api/subscriptions/cancel
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user.square_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const result = await squareService.cancelSubscription(user.square_subscription_id);

    // Set status to canceled AND tier to free. Square webhook will also fire,
    // but we update immediately so the UI reflects the change right away.
    // Also clear square_subscription_id so the user can re-subscribe later.
    await query(
      `UPDATE users SET subscription_status = 'canceled', subscription_tier = 'free',
       subscription_plan = 'none', square_subscription_id = NULL, updated_at = NOW() WHERE id = ?`,
      [req.user.id]
    );

    res.json({ message: 'Subscription canceled.', effective_date: result.chargedThroughDate });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ error: err.message || 'Failed to cancel subscription' });
  }
});

// POST /api/subscriptions/checkout-link
// Creates a Square checkout link and returns the URL for the frontend to open in a new tab
router.post('/checkout-link', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ error: 'plan must be monthly or annual' });
    }

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const result = await squareService.createCheckoutLink(user, plan);

    res.json({ checkoutUrl: result.checkoutUrl, orderId: result.orderId });
  } catch (err) {
    console.error('Create checkout link error:', err);
    res.status(500).json({ error: err.message || 'Failed to create checkout link' });
  }
});

module.exports = router;
