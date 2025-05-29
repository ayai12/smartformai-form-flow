// Stripe subscription configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    aiRequestsLimit: 10,
    name: 'Free Plan'
  },
  starter: {
    monthly: {
      price: 9,
      aiRequestsLimit: 30,
      name: 'Starter Plan (Monthly)',
      priceId: '' // You'll add your Stripe price ID here
    },
    annual: {
      price: 90, // 10 months instead of 12
      aiRequestsLimit: 360, // 30 * 12 months
      name: 'Starter Plan (Annual)',
      priceId: '' // You'll add your Stripe price ID here
    }
  },
  pro: {
    monthly: {
      price: 29,
      aiRequestsLimit: 150,
      name: 'Pro Plan (Monthly)',
      priceId: '' // You'll add your Stripe price ID here
    },
    annual: {
      price: 290, // 10 months instead of 12
      aiRequestsLimit: 1800, // 150 * 12 months
      name: 'Pro Plan (Annual)',
      priceId: '' // You'll add your Stripe price ID here
    }
  }
};

// Default token usage for new users
export const DEFAULT_TOKEN_USAGE = {
  aiRequestsUsed: 0,
  aiRequestsLimit: SUBSCRIPTION_PLANS.free.aiRequestsLimit,
  planId: 'free'
}; 