# SmartFormAI Subscription System

This document outlines the subscription system for SmartFormAI, which uses Firebase and Stripe for payment processing and subscription management.

## Overview

The subscription system includes:

1. **Firebase Authentication** for user management
2. **Firebase Firestore** for storing subscription data
3. **Stripe** for payment processing
4. **Token-based AI request tracking** to limit usage based on subscription tier

## Subscription Tiers

- **Free**: 10 AI requests per month
- **Starter**: 30 AI requests per month
- **Pro**: 150 AI requests per month

## Technical Implementation

### Backend (Firebase Cloud Functions)

The backend handles:

1. **Stripe integration** for payment processing
2. **Token tracking** for AI request limits
3. **Webhook handling** for subscription events
4. **Subscription management** (creation, cancellation, etc.)

### Frontend Components

1. **TokenUsageContext**: Tracks and provides token usage data
2. **TokenUsageDisplay**: Displays token usage information
3. **SubscriptionContext**: Manages subscription state
4. **FormBuilder**: Updated to include token usage tracking

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the `functions` directory with the following:

```
StripeSecreteKey=your_stripe_secret_key
ChatGbtKey=your_openai_api_key
```

### 2. Firebase Configuration

Make sure your Firebase project is set up with:
- Authentication
- Firestore Database
- Cloud Functions

### 3. Stripe Configuration

1. Create a Stripe account
2. Set up products for each subscription tier
3. Configure webhook endpoints to point to your Firebase function

### 4. Deploy Firebase Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

## How It Works

1. **User Signs Up**: New users are assigned the free tier with 10 AI requests
2. **Subscription Purchase**: Users can upgrade to Starter or Pro plans
3. **Token Usage**: Each AI request decrements the available tokens
4. **Monthly Reset**: Tokens reset on the billing date each month
5. **Subscription Management**: Users can view, upgrade, or cancel subscriptions

## Database Schema

### Users Collection

```
users/{userId}
  - tokenUsage: {
      aiRequestsUsed: number
      aiRequestsLimit: number
      lastResetDate: timestamp
      nextResetDate: timestamp
      planId: string ('free', 'starter', 'pro')
    }
```

### Subscriptions Collection

```
subscriptions/{userId}
  - planId: string ('starter', 'pro')
  - billingCycle: string ('monthly', 'annual')
  - price: number
  - status: string ('active', 'canceled', 'past_due')
  - stripeSubscriptionId: string
  - startDate: timestamp
  - endDate: timestamp (if canceled)
  - createdAt: timestamp
  - updatedAt: timestamp
```

## API Endpoints

- `POST /chat`: Generate AI form questions (checks token usage)
- `GET /token-usage/:userId`: Get user's token usage information
- `POST /create-checkout-session`: Create a Stripe checkout session
- `POST /webhook`: Handle Stripe webhook events
- `POST /save-subscription`: Manually save subscription data
- `POST /cancel-subscription`: Cancel a subscription
- `GET /get-session/:sessionId`: Get Stripe session data

## Testing

To test the subscription system:

1. Create a test user
2. Use the free tier to make AI requests
3. Upgrade to a paid tier
4. Verify token limits increase
5. Test token reset on billing date
6. Test cancellation flow 