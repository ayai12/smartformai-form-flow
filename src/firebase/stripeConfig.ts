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
      priceId: '' // Add your Stripe price ID from the Starter Plan (Monthly) product
    },
    annual: {
      price: 90, // 10 months instead of 12
      aiRequestsLimit: 360, // 30 * 12 months
      name: 'Starter Plan (Annual)',
      priceId: '' // Add your Stripe price ID from the Starter Plan (Annual) product
    }
  },
  pro: {
    monthly: {
      price: 19,
      aiRequestsLimit: 150,
      name: 'Pro Plan (Monthly)',
      priceId: '' // IMPORTANT: Add the price_XXXXX ID from your NEW €19 monthly price in Stripe
    },
    annual: {
      price: 190, // 10 months instead of 12
      aiRequestsLimit: 1800, // 150 * 12 months
      name: 'Pro Plan (Annual)',
      priceId: '' // IMPORTANT: Add the price_XXXXX ID from your NEW €190 annual price in Stripe
    }
  }
};

// Default token usage for new users
export const DEFAULT_TOKEN_USAGE = {
  aiRequestsUsed: 0,
  aiRequestsLimit: SUBSCRIPTION_PLANS.free.aiRequestsLimit,
  planId: 'free'
}; 