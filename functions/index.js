require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const stripe = require('stripe')(process.env.StripeSecreteKey);
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin with service account directly
// Explicitly set the projectId as recommended in the docs
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'smartformai-51e03'
});

const db = admin.firestore();
const auth = admin.auth();

const app = express();
const port = process.env.PORT || 5000;

// Use CORS and JSON body parsing
app.use(cors({ origin: true }));
app.use(express.json());

// Get OpenAI API key from .env
const OPENAI_API_KEY = process.env.ChatGbtKey;
if (!OPENAI_API_KEY) {
  console.error('OpenAI API key not found in .env (ChatGbtKey)');
  process.exit(1);
}

// Products and price IDs
const PRODUCTS = {
  starter: {
    monthly: {
      priceId: null, // Will be populated once created in Stripe
      amount: 9
    },
    annual: {
      priceId: null, // Will be populated once created in Stripe
      amount: 90 // 10 months (2 months free)
    },
    features: {
      activeForms: 50,
      aiGeneratedForms: 30,
      removeSmartFormAIBranding: false
    }
  },
  pro: {
    monthly: {
      priceId: null, // Will be populated once created in Stripe
      amount: 29
    },
    annual: {
      priceId: null, // Will be populated once created in Stripe
      amount: 290 // 10 months (2 months free)
    },
    features: {
      activeForms: -1, // unlimited
      aiGeneratedForms: 100,
      removeSmartFormAIBranding: true
    }
  }
};

// Create products and prices in Stripe if they don't exist
const initializeStripePrices = async () => {
  try {
    // Create Starter product if it doesn't exist
    let starterProduct = await stripe.products.create({
      name: 'Starter Plan',
      description: 'For light users who want a little more freedom without the full commitment.'
    });

    // Create Pro product if it doesn't exist
    let proProduct = await stripe.products.create({
      name: 'Pro Plan',
      description: 'For serious form builders who want full control, better insights, and zero limits.'
    });

    // Create prices for Starter plan
    const starterMonthlyPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: PRODUCTS.starter.monthly.amount * 100, // in cents
      currency: 'usd',
      recurring: { interval: 'month' },
      nickname: 'Starter Monthly'
    });
    
    const starterAnnualPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: PRODUCTS.starter.annual.amount * 100, // in cents
      currency: 'usd',
      recurring: { interval: 'year' },
      nickname: 'Starter Annual'
    });

    // Create prices for Pro plan
    const proMonthlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: PRODUCTS.pro.monthly.amount * 100, // in cents
      currency: 'usd',
      recurring: { interval: 'month' },
      nickname: 'Pro Monthly'
    });
    
    const proAnnualPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: PRODUCTS.pro.annual.amount * 100, // in cents
      currency: 'usd',
      recurring: { interval: 'year' },
      nickname: 'Pro Annual'
    });

    // Save price IDs
    PRODUCTS.starter.monthly.priceId = starterMonthlyPrice.id;
    PRODUCTS.starter.annual.priceId = starterAnnualPrice.id;
    PRODUCTS.pro.monthly.priceId = proMonthlyPrice.id;
    PRODUCTS.pro.annual.priceId = proAnnualPrice.id;

    console.log('Stripe products and prices initialized successfully');
  } catch (error) {
    console.error('Error initializing Stripe products and prices:', error);
  }
};

// POST /chat endpoint
app.post('/chat', async (req, res) => {
  // Expect: { prompt: string } in the body
  const { 
    prompt, 
    tone = "business", 
    questionCount = 5,
    action = "add",
    currentQuestions = [],
    model = "gpt-4.1-mini", 
    temperature = 0.7, 
    max_tokens = 512 
  } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body.' });
  }

  // Build the special system/user prompt
  let aiPrompt;
  
    // Use the same prompt for both 'add' and 'rebuild' - frontend will handle clearing old questions
    aiPrompt = `Using the following prompt:\n${prompt}\nI want you to generate a customer survey based on that with a tone of ${tone}. Please create appropriate questions and return the output in JSON format.\nI want you to create exactly ${questionCount} questions.\nEach question should clearly specify its type:\nIf it's a text response, set the type as \"text box\".\nIf it's a rating question, set the type as \"rating\" and include the full scale using numbers (e.g., \"1\", \"2\", ..., \"5\").\nIf it's a multiple choice question, set the type as \"multiple choice\" and provide a list of options.\nPlease only return the json format and nothing else don't add any other thing except the json.`;
  

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: 'You are a helpful AI Form Generator.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature,
        max_tokens
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    // Extract only the JSON from the response
    let aiText = response.data.choices?.[0]?.message?.content || '';
    // Try to extract the first JSON object from the response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiText = jsonMatch[0];
      try {
        const json = JSON.parse(aiText);
        res.json(json);
        return;
      } catch (e) {
        // If parsing fails, just send the text
      }
    }
    res.send(aiText);
  } catch (error) {
    console.error('Error calling OpenAI API:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to communicate with OpenAI API',
      details: error.response?.data || error.message
    });
  }
});

// Create Stripe checkout session
app.post('/create-checkout-session', async (req, res) => {
  const { planId, billingCycle, userId } = req.body;
  
  if (!planId || !billingCycle || !userId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Validate plan and billing cycle
  if (!PRODUCTS[planId] || !PRODUCTS[planId][billingCycle]) {
    return res.status(400).json({ error: 'Invalid plan or billing cycle' });
  }

  try {
    // Verify that the user exists
    await auth.getUser(userId);
    
    // Get price ID
    const priceId = PRODUCTS[planId][billingCycle].priceId;
    if (!priceId) {
      return res.status(500).json({ error: 'Price ID not initialized' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      client_reference_id: userId,
      metadata: {
        userId,
        planId,
        billingCycle
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook to handle subscription events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // req.body is a Buffer when using express.raw
    // Stripe webhook requires the raw body, not the parsed JSON
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      endpointSecret
    );
    
    console.log('Webhook received:', event.type);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleSuccessfulPayment(session);
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionChange(subscription);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Handle successful payment
const handleSuccessfulPayment = async (session) => {
  const { userId, planId, billingCycle } = session.metadata;
  
  if (!userId || !planId || !billingCycle) {
    console.error('Missing metadata in session:', session.id);
    return;
  }

  try {
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Calculate expiration date based on billing cycle
    const currentDate = new Date();
    const expirationDate = new Date(currentDate);
    if (billingCycle === 'monthly') {
      expirationDate.setMonth(currentDate.getMonth() + 1);
    } else if (billingCycle === 'annual') {
      expirationDate.setFullYear(currentDate.getFullYear() + 1);
    }

    // Save subscription details to Firestore
    await db.collection('users').doc(userId).set({
      subscription: {
        planId,
        billingCycle,
        status: subscription.status,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        features: PRODUCTS[planId].features
      }
    }, { merge: true });

    console.log(`Subscription saved for user ${userId}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
};

// Handle subscription changes
const handleSubscriptionChange = async (subscription) => {
  try {
    // Find the user with this subscription
    const querySnapshot = await db.collection('users')
      .where('subscription.stripeSubscriptionId', '==', subscription.id)
      .get();
    
    if (querySnapshot.empty) {
      console.log(`No user found with subscription ID: ${subscription.id}`);
      return;
    }

    // Update subscription status for each user (there should be only one)
    for (const doc of querySnapshot.docs) {
      await db.collection('users').doc(doc.id).set({
        subscription: {
          status: subscription.status,
          currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      }, { merge: true });
      
      console.log(`Subscription updated for user ${doc.id}`);
    }
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
};

// Get subscription status
app.get('/subscription/:userId', async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing user ID' });
  }

  try {
    const doc = await db.collection('users').doc(userId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = doc.data();
    const subscription = userData.subscription || null;
    
    res.json({ subscription });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Get client secret for Stripe
app.get('/config', (req, res) => {
  res.json({ 
    publishableKey: process.env.StripePublishbleKey 
  });
});

// Add a test endpoint to verify Firebase Admin is working
app.get('/test-firebase', async (req, res) => {
  try {
    console.log('Testing Firebase Admin connection...');
    
    // Test Firestore
    const snapshot = await db.collection('users').limit(1).get();
    console.log(`Firestore test: Found ${snapshot.size} documents`);
    
    // Test Authentication
    const usersList = await auth.listUsers(1);
    console.log(`Auth test: Found ${usersList.users.length} users`);
    
    res.json({ 
      success: true, 
      message: 'Firebase Admin SDK is working correctly',
      firestoreTest: `Found ${snapshot.size} documents`,
      authTest: `Found ${usersList.users.length} users`
    });
  } catch (error) {
    console.error('Error testing Firebase Admin:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
});

app.get('/', (req, res) => {
  res.send('SmartFormAI Express backend is running!');
});

// Initialize Stripe prices when the server starts
initializeStripePrices();

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
