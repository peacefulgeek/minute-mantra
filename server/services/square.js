const { Client, Environment } = require('square');

function getClient() {
  return new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production'
      ? Environment.Production
      : Environment.Sandbox,
  });
}

const PLAN_IDS = {
  monthly: process.env.SQUARE_MONTHLY_PLAN_ID,
  annual: process.env.SQUARE_ANNUAL_PLAN_ID,
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

  // Create subscription
  const planId = PLAN_IDS[plan];
  if (!planId) throw new Error(`No plan ID configured for ${plan}`);

  const { result: subResult } = await client.subscriptionsApi.createSubscription({
    idempotencyKey: `sub-${user.id}-${Date.now()}`,
    locationId: process.env.SQUARE_LOCATION_ID,
    planVariationId: planId,
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
  const planId = PLAN_IDS[newPlan];
  if (!planId) throw new Error(`No plan ID configured for ${newPlan}`);

  await client.subscriptionsApi.swapPlan(subscriptionId, {
    newPlanVariationId: planId,
  });
}

async function cancelSubscription(subscriptionId) {
  const client = getClient();
  const { result } = await client.subscriptionsApi.cancelSubscription(subscriptionId);
  return result.subscription;
}

module.exports = { createSubscription, changeSubscription, cancelSubscription };
