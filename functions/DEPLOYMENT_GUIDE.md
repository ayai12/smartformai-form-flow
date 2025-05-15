# Stripe Payment Integration Deployment Guide

This guide walks you through deploying the SmartFormAI payment system using Firebase Functions and Stripe.

## Prerequisites

1. Firebase CLI installed (`npm install -g firebase-tools`)
2. Stripe account with API keys
3. Firebase project already set up

## Step 1: Set Up Service Account

For local development and testing:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project "smartformai-51e03"
3. Go to Project Settings > Service accounts
4. Click "Generate new private key"
5. Save the JSON file as `serviceAccountKey.json` in the `functions` directory
6. Add this file to your `.gitignore` to keep it secure

## Step 2: Configure Environment Variables

1. Make sure your `.env` file in the `functions` directory has all required variables:
```
ChatGbtKey = your_openai_key
StripePublishbleKey = your_stripe_publishable_key
StripeSecreteKey = your_stripe_secret_key
STRIPE_WEBHOOK_SECRET = your_stripe_webhook_secret
```

2. For production deployment, set these environment variables in Firebase:
```bash
firebase functions:config:set stripe.publishable_key="your_stripe_publishable_key" stripe.secret_key="your_stripe_secret_key" stripe.webhook_secret="your_stripe_webhook_secret" openai.key="your_openai_key"
```

## Step 3: Update API URLs

Ensure the `API_URL` in `src/context/StripeContext.tsx` points to your deployed Function URL:

```javascript
const API_URL = import.meta.env.PROD 
  ? 'https://us-central1-smartformai-51e03.cloudfunctions.net' 
  : 'http://localhost:5000';
```

## Step 4: Set Up Stripe Webhooks

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. For local testing:
   - Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks to your local server
   - Run `stripe listen --forward-to http://localhost:5000/webhook`

4. For production:
   - Enter your deployed function URL with `/webhook` path:
     `https://us-central1-smartformai-51e03.cloudfunctions.net/webhook`
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
5. Copy the webhook signing secret and update your environment variables

## Step 5: Deploy to Firebase

1. Build your frontend:
```bash
npm run build
```

2. Deploy the functions:
```bash
firebase deploy --only functions
```

3. Deploy the frontend:
```bash
firebase deploy --only hosting
```

## Step 6: Testing the Integration

1. Test the payment flow with Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0000 0000 3220`

2. Verify subscription data is saved in Firestore under the user's document

## Troubleshooting

### Firebase Functions Not Initializing
- Check that your service account has proper permissions
- Verify that your project ID matches in all configuration files

### Stripe Webhook Errors
- Ensure the webhook secret matches between Stripe and your environment
- Check that your function has proper access to handle incoming webhooks
- Inspect HTTP headers in the webhook logs

### Subscription Not Showing in Dashboard
- Check Firestore rules to make sure they allow writes from Functions
- Inspect webhook logs to see if the event is being processed
- Verify user ID is correctly passed to the checkout session

## Support

For issues with:
- Stripe integration: [Stripe Support](https://support.stripe.com/)
- Firebase: [Firebase Support](https://firebase.google.com/support) 