# Firebase Stripe Extension Setup Guide

This guide explains how to set up the Firebase Stripe extension for SmartFormAI's subscription system.

## 1. Install the Extension

1. Go to the [Firebase Console](https://console.firebase.google.com/) and select your project.
2. Navigate to Extensions in the left sidebar.
3. Search for "Run Payments with Stripe" and select the extension by Invertase (not the one by Stripe).
4. Click "Install" and follow the prompts.

## 2. Configure the Extension

When configuring the extension, use these settings:

- **Stripe API Secret Key**: Use your Stripe secret key from the Stripe Dashboard.
- **Cloud Firestore collection path**: `customers`
- **Sync new users to Stripe customers**: Enable this option.
- **Default Firestore document ID**: `uid`
- **Enable Events**: Enable this option and select all events.

## 3. Set Up Stripe Webhook

1. After installing the extension, go to the extension details page.
2. Copy the webhook URL provided in the extension details.
3. Go to your [Stripe Dashboard](https://dashboard.stripe.com/).
4. Navigate to Developers > Webhooks.
5. Click "Add Endpoint" and paste the webhook URL.
6. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
7. Click "Add Endpoint" to create the webhook.
8. Copy the "Signing Secret" from the webhook details page.
9. Go back to the Firebase extension configuration and update the "Stripe webhook secret" field with this value.

## 4. Create Subscription Products in Stripe

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/).
2. Navigate to Products > Add Product.
3. Create the following products:

### Starter Plan (Monthly)
- Name: "Starter Plan (Monthly)"
- Price: $9 per month
- Billing period: Monthly
- Description: "30 AI requests per month"

### Starter Plan (Annual)
- Name: "Starter Plan (Annual)"
- Price: $90 per year
- Billing period: Yearly
- Description: "30 AI requests per month, billed annually"

### Pro Plan (Monthly)
- Name: "Pro Plan (Monthly)"
- Price: $29 per month
- Billing period: Monthly
- Description: "150 AI requests per month"

### Pro Plan (Annual)
- Name: "Pro Plan (Annual)"
- Price: $290 per year
- Billing period: Yearly
- Description: "150 AI requests per month, billed annually"

## 5. Update Price IDs in the Code

After creating the products, copy their price IDs from Stripe and update them in the `src/firebase/stripeConfig.ts` file:

```typescript
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
      priceId: 'price_xxxxx' // Replace with your Stripe price ID
    },
    annual: {
      price: 90,
      aiRequestsLimit: 30,
      name: 'Starter Plan (Annual)',
      priceId: 'price_xxxxx' // Replace with your Stripe price ID
    }
  },
  pro: {
    monthly: {
      price: 29,
      aiRequestsLimit: 150,
      name: 'Pro Plan (Monthly)',
      priceId: 'price_xxxxx' // Replace with your Stripe price ID
    },
    annual: {
      price: 290,
      aiRequestsLimit: 150,
      name: 'Pro Plan (Annual)',
      priceId: 'price_xxxxx' // Replace with your Stripe price ID
    }
  }
};
```

## 6. Set Up Firestore Rules

Update your Firestore security rules to allow access to subscription and customer data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Stripe extension rules
    match /customers/{uid} {
      allow read: if request.auth.uid == uid;

      match /checkout_sessions/{id} {
        allow read, write: if request.auth.uid == uid;
      }
      match /subscriptions/{id} {
        allow read: if request.auth.uid == uid;
      }
      match /payments/{id} {
        allow read: if request.auth.uid == uid;
      }
    }

    match /products/{id} {
      allow read: if true;

      match /prices/{id} {
        allow read: if true;
      }

      match /tax_rates/{id} {
        allow read: if true;
      }
    }
  }
}
```

## 7. Testing the Integration

1. Create a test user in your app.
2. Navigate to the Pricing page.
3. Select a plan and complete the checkout process using Stripe test cards:
   - Test Card Number: `4242 4242 4242 4242`
   - Expiration: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

4. Verify that the subscription is created in Firestore and the user's token limit is updated.

## 8. Going Live

When you're ready to go live:

1. Switch your Stripe account from test mode to live mode.
2. Update the extension configuration with your live Stripe API keys.
3. Set up the webhook again with your live Stripe account.
4. Update the webhook secret in the extension configuration.

## Troubleshooting

- **Webhook Issues**: If webhooks aren't being received, check the Stripe Dashboard > Developers > Webhooks > Recent Events to see if they're being sent correctly.
- **Extension Logs**: Check the Firebase Functions logs for any errors related to the extension.
- **Subscription Not Created**: Verify that the user is being created in Stripe by checking the Customers section in the Stripe Dashboard. 