# Stripe Subscription Integration Setup Guide

This guide will help you set up the Stripe subscription system for your application.

## Prerequisites

1. A Stripe account (https://stripe.com)
2. Firebase project with Firestore and Cloud Functions enabled
3. Node.js and npm installed

## Setup Steps

### 1. Stripe Dashboard Configuration

1. Log in to your Stripe Dashboard
2. Create Products and Pricing Plans:
   - Go to Products > Add Product
   - Create products for each subscription tier (e.g., "Starter Plan", "Pro Plan")
   - For each product, create pricing options (monthly and annual)
   - Note down the price IDs for each plan

### 2. Environment Variables

In your Firebase Functions directory, create or update the `.env` file with your Stripe keys:

```
StripeSecreteKey=sk_test_your_stripe_secret_key
StripePublishbleKey=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 3. Set Up Stripe Webhook

1. In the Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-firebase-function-url/webhook`
4. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing Secret" and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### 4. Testing the Integration

1. Use Stripe test mode for development
2. Test the subscription flow:
   - Create a subscription with a test card
   - Verify the subscription is saved in Firestore
   - Test subscription cancellation
   - Test subscription renewal

### 5. Going Live

1. Switch Stripe from test mode to live mode
2. Update your environment variables with live keys
3. Create live products and pricing plans in Stripe
4. Update the webhook endpoint with your production URL
5. Test the entire flow with real cards

## Webhook Events Handled

The system handles the following Stripe webhook events:

- `checkout.session.completed`: When a customer completes the checkout process
- `customer.subscription.updated`: When a subscription is updated (e.g., plan change)
- `customer.subscription.deleted`: When a subscription is deleted
- `invoice.payment_succeeded`: When a payment succeeds (e.g., renewal)
- `invoice.payment_failed`: When a payment fails

## Firestore Data Structure

Subscription data is stored in the user document with the following structure:

```javascript
{
  subscription: {
    planId: "starter", // or "pro"
    billingCycle: "monthly", // or "annual"
    status: "active", // or "canceled", "past_due", etc.
    stripeSubscriptionId: "sub_xyz123",
    stripeCustomerId: "cus_abc456",
    productName: "Starter Plan",
    amount: 9.99,
    interval: "month",
    createdAt: Timestamp,
    updatedAt: Timestamp,
    currentPeriodEnd: Timestamp,
    lastPaymentDate: Timestamp,
    cancelAtPeriodEnd: false,
    features: {
      activeForms: 50,
      aiGeneratedForms: 30,
      removeSmartFormAIBranding: false
    }
  }
}
```

## Troubleshooting

- Check Stripe Dashboard > Developers > Logs for webhook events
- Check Firebase Functions logs for errors
- Verify that your webhook endpoint is accessible from the internet
- Ensure your Stripe API keys are correctly set in the environment variables 