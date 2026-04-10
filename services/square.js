const { Client, Environment } = require('square');

function getClient() {
  return new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production'
      ? Environment.Production
      : Environment.Sandbox,
  });
}

// Square subscriptions require planVariationId, not planId
const VARIATION_IDS = {
  monthly: process.env.SQUARE_MONTHLY_VARIATION_ID,
  annual: process.env.SQUARE_ANNUAL_VARIATION_ID,
};

async function createSubscription(user, plan, paymentNonce) {
  const client = getClient();

  // Create or find customer
  let customerId = user.square_customer_id;
  if (!customerId) {
    const { result } = await client.customersApi.createCustomer({
      emailAddress: user.email,
      givenName: user.display_name || user.email.split('@')[0],
      referenceId: String(user.id),
    });
    customerId = result.customer.id;
  }

  // Create payment method
  const { result: cardResult } = await client.cardsApi.createCard({
    idempotencyKey: `card-${user.id}-${Date.now()}`,
    sourceId: paymentNonce,
    card: { customerId },
  });
  const cardId = cardResult.card.id;

  // Create subscription using plan variation ID
  const planVariationId = VARIATION_IDS[plan];
  if (!planVariationId) throw new Error(`No variation ID configured for plan: ${plan}`);

  const { result: subResult } = await client.subscriptionsApi.createSubscription({
    idempotencyKey: `sub-${user.id}-${Date.now()}`,
    locationId: process.env.SQUARE_LOCATION_ID,
    planVariationId,
    customerId,
    cardId,
    startDate: new Date().toISOString().split('T')[0],
  });

  return {
    customerId,
    subscriptionId: subResult.subscription.id,
    status: subResult.subscription.status,
  };
}

async function changeSubscription(subscriptionId, newPlan) {
  const client = getClient();
  const planVariationId = VARIATION_IDS[newPlan];
  if (!planVariationId) throw new Error(`No variation ID configured for plan: ${newPlan}`);

  await client.subscriptionsApi.swapPlan(subscriptionId, {
    newPlanVariationId: planVariationId,
  });
}

async function cancelSubscription(subscriptionId) {
  const client = getClient();
  const { result } = await client.subscriptionsApi.cancelSubscription(subscriptionId);
  return result.subscription;
}

async function createCheckoutLink(user, plan) {
  const client = getClient();
  const appUrl = process.env.APP_URL || 'https://minutemantra.com';

  const planVariationId = VARIATION_IDS[plan];
  if (!planVariationId) throw new Error(`No variation ID configured for plan: ${plan}`);

  const price = plan === 'annual' ? 988 : 108; // cents
  const planLabel = plan === 'annual' ? 'Annual Gold ($9.88/yr)' : 'Monthly Gold ($1.08/mo)';

  const { result } = await client.checkoutApi.createPaymentLink({
    idempotencyKey: `checkout-${user.id}-${plan}-${Date.now()}`,
    order: {
      locationId: process.env.SQUARE_LOCATION_ID,
      lineItems: [{
        name: `Minute Mantra ${planLabel}`,
        quantity: '1',
        basePriceMoney: {
          amount: BigInt(price),
          currency: 'USD',
        },
      }],
      referenceId: `user-${user.id}-${plan}`,
    },
    checkoutOptions: {
      redirectUrl: `${appUrl}/settings?checkout=success&plan=${plan}`,
      askForShippingAddress: false,
    },
    prePopulatedData: {
      buyerEmail: user.email,
    },
  });

  return {
    checkoutUrl: result.paymentLink.url,
    orderId: result.paymentLink.orderId,
  };
}

module.exports = { createSubscription, changeSubscription, cancelSubscription, createCheckoutLink };
