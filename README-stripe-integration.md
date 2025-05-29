# SmartFormAI Subscription System

This document provides instructions for setting up and using the SmartFormAI subscription system, which uses Firebase and Stripe.

## Overview

The subscription system allows users to:
- Start with a Free Plan (10 AI requests/month)
- Upgrade to a Starter Plan (30 AI requests/month)
- Upgrade to a Pro Plan (150 AI requests/month)
- Track their token usage
- Manage their subscription

## Setup Instructions

### 1. Install and Configure the Firebase Stripe Extension

Follow the detailed instructions in the [Firebase Stripe Extension Setup Guide](./firebase-extension-setup.md).

### 2. Deploy the Cloud Functions

The Cloud Functions handle subscription events and token resets:

1. Navigate to the `functions` directory:
   ```
   cd functions
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Deploy the functions:
   ```
   firebase deploy --only functions
   ```

### 3. Update Firestore Security Rules

Update your Firestore security rules to allow access to the necessary collections:

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

## System Components

### 1. Frontend Components

- **TokenUsageContext**: Manages and provides token usage data to components
- **SubscriptionContext**: Manages subscription data and provides methods for upgrading/managing subscriptions
- **Pricing.tsx**: Displays subscription plans and handles subscription creation
- **Profile.tsx**: Shows user's current plan, token usage, and subscription management options

### 2. Backend Services

- **stripeService.ts**: Handles Stripe-related operations (checkout sessions, customer portal, etc.)
- **tokenService.ts**: Manages token usage tracking and updates
- **stripe-handlers.js**: Cloud Functions that handle Stripe webhook events

### 3. Database Structure

#### Users Collection
```
/users/{userId}
  - tokenUsage:
      - aiRequestsUsed: number
      - aiRequestsLimit: number
      - lastResetDate: timestamp
      - nextResetDate: timestamp
      - planId: string ('free', 'starter', 'pro')
  - firstName: string
  - lastName: string
  - email: string
  - ...other user data
```

#### Customers Collection (managed by Stripe extension)
```
/customers/{userId}
  - stripeId: string
  - ...other customer data
  
  /customers/{userId}/subscriptions/{subscriptionId}
    - status: string
    - planId: string
    - billingCycle: string
    - ...other subscription data
  
  /customers/{userId}/checkout_sessions/{sessionId}
    - ...checkout session data
```

## Usage Guide

### 1. Token Usage Tracking

To check if a user has tokens available and use a token:

```typescript
import { useTokenUsage } from '@/context/TokenUsageContext';

function MyComponent() {
  const { hasTokensAvailable, tokensRemaining, useToken } = useTokenUsage();
  
  const handleAIRequest = async () => {
    if (hasTokensAvailable) {
      // Use a token
      const success = await useToken();
      
      if (success) {
        // Make the AI request
        // ...
      } else {
        // Token usage failed
        console.error('Failed to use token');
      }
    } else {
      // No tokens available
      console.error('No tokens available');
    }
  };
  
  return (
    <div>
      <p>Tokens remaining: {tokensRemaining}</p>
      <button onClick={handleAIRequest}>Generate AI Content</button>
    </div>
  );
}
```

### 2. Subscription Management

To create a new subscription or manage an existing one:

```typescript
import { useSubscription } from '@/context/SubscriptionContext';

function SubscriptionManager() {
  const { 
    isSubscribed, 
    isPro, 
    isStarter, 
    createSubscription, 
    openCustomerPortal 
  } = useSubscription();
  
  const handleUpgrade = async (planId, billingCycle) => {
    const result = await createSubscription(planId, billingCycle);
    if (!result.success) {
      console.error('Failed to create subscription:', result.error);
    }
  };
  
  const handleManageSubscription = async () => {
    await openCustomerPortal();
  };
  
  return (
    <div>
      {isSubscribed ? (
        <div>
          <p>You are subscribed to the {isPro ? 'Pro' : 'Starter'} plan</p>
          <button onClick={handleManageSubscription}>Manage Subscription</button>
        </div>
      ) : (
        <div>
          <p>You are on the Free plan</p>
          <button onClick={() => handleUpgrade('starter', 'monthly')}>
            Upgrade to Starter (Monthly)
          </button>
          <button onClick={() => handleUpgrade('pro', 'annual')}>
            Upgrade to Pro (Annual)
          </button>
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Webhook Events Not Being Received**
   - Check the Stripe Dashboard > Developers > Webhooks > Recent Events
   - Verify the webhook URL is correct
   - Ensure the webhook secret is properly configured

2. **Subscription Not Created**
   - Check the Firebase Functions logs for errors
   - Verify the user is being created in Stripe (Customers section)
   - Check the Firestore database for errors in the checkout_sessions collection

3. **Token Usage Not Updating**
   - Check the user document in Firestore to ensure tokenUsage field exists
   - Verify the Cloud Functions are deployed correctly
   - Check the Firebase Functions logs for errors

### Debugging

- Use the Firebase Console > Functions > Logs to view Cloud Function logs
- Use the Stripe Dashboard > Developers > Events to view webhook events
- Check the browser console for frontend errors

## Going Live

When you're ready to go live:

1. Switch your Stripe account from test mode to live mode
2. Update the extension configuration with your live Stripe API keys
3. Set up the webhook again with your live Stripe account
4. Update the webhook secret in the extension configuration 