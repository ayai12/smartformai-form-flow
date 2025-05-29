# SmartFormAI Backend

This repository contains the backend code for SmartFormAI, including both the Firebase Cloud Functions and Express API server.

## Project Structure

- `functions/`: Contains the Firebase Cloud Functions and Express API server
  - `index.js`: Entry point for Firebase Cloud Functions
  - `server.js`: Standalone Express API server
  - `src/stripe-handlers.js`: Handlers for Stripe webhook events

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Firestore enabled
- Stripe account with API keys

### Environment Variables

Create a `.env` file in the `functions/` directory with the following variables:

```
ChatGbtKey=your_openai_api_key
StripeSecreteKey=your_stripe_secret_key
```

### Firebase Service Account

1. Go to your Firebase project settings
2. Navigate to "Service accounts"
3. Click "Generate new private key"
4. Save the file as `serviceAccountKey.json` in the `functions/` directory

### Installation

1. Install dependencies:
   ```
   cd functions
   npm install
   ```

## Running the Backend

### Option 1: Run the Express API Server Only

This is useful for local development when you want to test the API endpoints without deploying to Firebase.

```
cd functions
npm run dev  # Uses nodemon for auto-reloading
```

Or without auto-reloading:

```
cd functions
npm run server
```

The server will be available at http://localhost:5000

### Option 2: Run Firebase Functions Locally

This is useful for testing the Firebase Cloud Functions locally.

```
cd functions
npm run serve
```

### Deploying to Firebase

```
cd functions
npm run deploy
```

## API Endpoints

- `POST /chat`: Generate AI form questions based on a prompt
- `GET /token-usage/:userId`: Get the token usage for a user
- `POST /create-checkout-session`: Create a Stripe checkout session for subscription

## Firebase Cloud Functions

- `onCheckoutSessionCompleted`: Handles the checkout.session.completed event from Stripe
- `onSubscriptionUpdated`: Handles the customer.subscription.updated event from Stripe
- `onSubscriptionDeleted`: Handles the customer.subscription.deleted event from Stripe
- `resetTokenUsage`: Scheduled function to reset token usage on billing date

## Troubleshooting

### Common Issues

1. **Firebase Admin SDK Initialization Error**
   - Make sure `serviceAccountKey.json` is in the correct location
   - Verify the file has the correct permissions

2. **Stripe API Key Error**
   - Check that the Stripe secret key is correctly set in the `.env` file
   - Verify the key is valid and has the correct permissions

3. **OpenAI API Key Error**
   - Check that the OpenAI API key is correctly set in the `.env` file
   - Verify the key is valid and has the correct permissions

4. **Firebase Functions Deployment Error**
   - Make sure you're logged in to Firebase CLI (`firebase login`)
   - Verify you have the correct permissions for the Firebase project

### Logs

- Express API server logs are output to the console
- Firebase Functions logs can be viewed with `npm run logs` 