const functions = require('firebase-functions');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const path = require('path');
const fs = require('fs');
// Get Firebase config values with fallbacks
const firebaseConfig = functions.config() || {};
const stripeConfig = firebaseConfig.stripe || {};
const openaiConfig = firebaseConfig.openai || {};

// Initialize Stripe with secret key
const OPENAI_API_KEY  = functions.config().openai.chatgpt_key;
const STRIPE_PUBLISHABLE_KEY = functions.config().stripe.publishable_key;
const  STRIPE_SECRET_KEY = functions.config().stripe.secret_key;
const STRIPE_WEBHOOK_SECRET  = functions.config().stripe.webhook_secret;


// Check if required config is available
if (!STRIPE_SECRET_KEY) {
  console.error('Stripe secret key not found in config or environment variables');
}

const stripe = require('stripe')(STRIPE_SECRET_KEY);
const stripeHandlers = require('./src/stripe-handlers');

// Initialize Firebase Admin with service account directly
// Explicitly set the projectId as recommended in the docs
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'smartformai-51e03'
});

const db = admin.firestore();
const auth = admin.auth();

const app = express();
// No need to define port for Firebase Functions

// Use CORS and JSON body parsing
app.use(cors({ origin: true }));
app.use(express.json());

// OpenAI API key is already defined above
if (!OPENAI_API_KEY) {
  console.error('OpenAI API key not found in config or environment variables');
  // Don't exit process in Firebase Functions
}

// Define subscription plans and token limits
const SUBSCRIPTION_PLANS = {
  free: {
    aiRequestsLimit: 10,
    name: 'Free Plan'
  },
  starter: {
    monthly: {
      price: 9,
      aiRequestsLimit: 30,
      name: 'Starter Plan (Monthly)'
    },
    annual: {
      price: 90, // 10 months instead of 12
      aiRequestsLimit: 360, // 30 * 12 months
      name: 'Starter Plan (Annual)'
    }
  },
  pro: {
    monthly: {
      price: 19,
      aiRequestsLimit: 150,
      name: 'Pro Plan (Monthly)'
    },
    annual: {
      price: 190, // 10 months instead of 12
      aiRequestsLimit: 1800, // 150 * 12 months
      name: 'Pro Plan (Annual)'
    }
  }
};

// Helper function to check and update user's token usage
async function checkAndUpdateTokenUsage(userId) {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }

  try {
    // Get user's token usage and subscription data
    const userRef = db.collection('users').doc(userId);
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    
    const [userDoc, subscriptionDoc] = await Promise.all([
      userRef.get(),
      subscriptionRef.get()
    ]);
    
    // Get current date to check if we need to reset tokens
    const now = admin.firestore.Timestamp.now();
    
    // Default to free plan if no subscription exists
    let tokenLimit = SUBSCRIPTION_PLANS.free.aiRequestsLimit;
    let planId = 'free';
    let nextResetDate = null;
    
    // If user has an active subscription, use that plan's limit
    if (subscriptionDoc.exists) {
      const subscriptionData = subscriptionDoc.data();
      if (subscriptionData.status === 'active') {
        planId = subscriptionData.planId || 'free';
        
        // Get token limit based on plan
        if (planId !== 'free') {
          const billingCycle = subscriptionData.billingCycle || 'monthly';
          tokenLimit = SUBSCRIPTION_PLANS[planId]?.[billingCycle]?.aiRequestsLimit || tokenLimit;
        }
        
        // Calculate next reset date based on subscription start date
        if (subscriptionData.startDate) {
          const startDate = subscriptionData.startDate.toDate();
          nextResetDate = new Date(startDate);
          
          if (subscriptionData.billingCycle === 'annual') {
            // For annual plans, tokens reset after a full year
            nextResetDate.setFullYear(nextResetDate.getFullYear() + 1);
          } else {
            // For monthly plans, tokens reset every month
            nextResetDate.setMonth(nextResetDate.getMonth() + 1);
          }
          
          // If we've passed the reset date, calculate the next one
          while (nextResetDate < now.toDate()) {
            if (subscriptionData.billingCycle === 'annual') {
              // Annual plans: add another year for the next reset date
              nextResetDate.setFullYear(nextResetDate.getFullYear() + 1);
            } else {
              // Monthly plans: add another month for the next reset date
              nextResetDate.setMonth(nextResetDate.getMonth() + 1);
            }
          }
        }
      }
    }
    
    // Initialize or get the user's token usage
    let tokenUsage = {
      aiRequestsUsed: 0,
      aiRequestsLimit: tokenLimit,
      lastResetDate: now,
      nextResetDate: nextResetDate ? admin.firestore.Timestamp.fromDate(nextResetDate) : null,
      planId: planId,
      billingCycle: subscriptionDoc.exists ? subscriptionDoc.data().billingCycle || 'monthly' : 'monthly'
    };
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // If user has token usage data
      if (userData.tokenUsage) {
        // Check if we need to reset based on the reset date
        if (userData.tokenUsage.nextResetDate && 
            userData.tokenUsage.nextResetDate.toDate() <= now.toDate()) {
          // Reset tokens as we've passed the reset date
          tokenUsage = {
            ...userData.tokenUsage,
            aiRequestsUsed: 0,
            lastResetDate: now,
            aiRequestsLimit: tokenLimit,
            planId: planId
          };
          
          // Calculate next reset date
          if (nextResetDate) {
            tokenUsage.nextResetDate = admin.firestore.Timestamp.fromDate(nextResetDate);
          }
        } else {
          // Use existing data but ensure limits match current subscription
          tokenUsage = {
            ...userData.tokenUsage,
            aiRequestsLimit: tokenLimit,
            planId: planId
          };
          
          // Update next reset date if subscription changed
          if (nextResetDate) {
            tokenUsage.nextResetDate = admin.firestore.Timestamp.fromDate(nextResetDate);
          }
        }
      }
    }
    
    // Check if user has tokens available
    if (tokenUsage.aiRequestsUsed >= tokenUsage.aiRequestsLimit) {
      return { 
        success: false, 
        error: 'AI request limit reached', 
        tokenUsage 
      };
    }
    
    // Increment token usage
    tokenUsage.aiRequestsUsed += 1;
    
    // Update the user document with new token usage
    await userRef.set({ 
      tokenUsage,
      updatedAt: now
    }, { merge: true });
    
    return { success: true, tokenUsage };
  } catch (error) {
    console.error('Error checking token usage:', error);
    return { success: false, error: 'Failed to check token usage' };
  }
}

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
    max_tokens = 512,
    userId
  } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body.' });
  }
  
  // Check if user has tokens available (skip for users without userId)
  if (userId) {
    const tokenCheck = await checkAndUpdateTokenUsage(userId);
    if (!tokenCheck.success) {
      return res.status(403).json({ 
        error: tokenCheck.error,
        tokenUsage: tokenCheck.tokenUsage
      });
    }
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

// Get user token usage
app.get('/token-usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const tokenUsage = userData.tokenUsage || {
      aiRequestsUsed: 0,
      aiRequestsLimit: SUBSCRIPTION_PLANS.free.aiRequestsLimit,
      planId: 'free'
    };
    
    res.json({ tokenUsage });
  } catch (error) {
    console.error('Error fetching token usage:', error);
    res.status(500).json({ error: 'Failed to fetch token usage' });
  }
});

// Create Stripe checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { planId, billingCycle, userId } = req.body;
    
    console.log('Creating checkout session with params:', { planId, billingCycle, userId });
    
    if (!planId || !billingCycle || !userId) {
      return res.status(400).json({ 
        error: 'Missing required parameters: planId, billingCycle, userId' 
      });
    }
    
    // Get plan details based on planId and billingCycle
    const plan = SUBSCRIPTION_PLANS[planId]?.[billingCycle];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan or billing cycle' });
    }
    
    // Prepare metadata object
    const metadata = {
      userId: userId,
      planId: planId,
      billingCycle: billingCycle,
      price: plan.price.toString(),
      aiRequestsLimit: plan.aiRequestsLimit.toString()
    };
    
    console.log('Setting session metadata:', metadata);
    console.log(`Creating ${billingCycle} subscription with interval: ${billingCycle === 'annual' ? 'year' : 'month'}`);
    
    // Create a checkout session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: `SmartFormAI ${planId} plan - ${billingCycle} billing (${plan.aiRequestsLimit} AI requests/month)`,
              metadata: metadata
            },
            unit_amount: plan.price * 100, // Convert dollars to cents
            recurring: {
              interval: billingCycle === 'annual' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      client_reference_id: userId,
      metadata: metadata,
    });
    
    console.log('Checkout session created successfully:', session.id);
    console.log('Subscription interval set to:', billingCycle === 'annual' ? 'year' : 'month');
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
});

// Stripe webhook endpoint to handle subscription events
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Webhook event type:', event.type);
  
  try {
    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Extract customer ID and metadata
      const { metadata } = session;
      console.log('Session metadata:', metadata);
      
      if (metadata && metadata.userId) {
        // Determine the correct billing cycle based on price
        let billingCycle = metadata.billingCycle || 'monthly';
        const price = parseFloat(metadata.price || 0);
        const planId = metadata.planId || 'starter';
        const aiRequestsLimit = parseInt(metadata.aiRequestsLimit || SUBSCRIPTION_PLANS[planId][billingCycle].aiRequestsLimit);
        
        // Logic to determine billing cycle based on the price
        if (price) {
          // If price is greater than or equal to annual threshold, it's an annual plan
          if ((planId === 'starter' && price >= 90) || 
              (planId === 'pro' && price >= 190)) {
            billingCycle = 'annual';
            console.log(`Webhook: Price ${price} indicates annual billing for ${planId} plan`);
          } else {
            billingCycle = 'monthly';
            console.log(`Webhook: Price ${price} indicates monthly billing for ${planId} plan`);
          }
          console.log(`Webhook: Determined billing cycle: ${billingCycle} based on price ${price}`);
        } else if (metadata.billingCycle) {
          // If no price but we have billingCycle in metadata, use that directly
          console.log(`Webhook: Using provided billing cycle: ${metadata.billingCycle} (no price available)`);
          billingCycle = metadata.billingCycle;
        }
        
        // Calculate next reset date
        const now = admin.firestore.FieldValue.serverTimestamp();
        const startDate = now;
        let nextResetDate;
        
        if (billingCycle === 'annual') {
          // For annual plans, set next reset date to 1 year from now
          const nextYear = new Date();
          nextYear.setFullYear(nextYear.getFullYear() + 1);
          nextResetDate = admin.firestore.Timestamp.fromDate(nextYear);
        } else {
          // For monthly plans, set next reset date to 1 month from now
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextResetDate = admin.firestore.Timestamp.fromDate(nextMonth);
        }
        
        // Get the subscription ID, trying to retrieve it from the Stripe API if necessary
        let subscriptionId = session.subscription;
        
        // If no subscription ID in the session data, try to retrieve it
        if (!subscriptionId && session.id) {
          try {
            console.log(`Webhook: No subscription ID found in session data. Retrieving session ${session.id} to get subscription details.`);
            const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['subscription']
            });
            
            if (fullSession.subscription) {
              if (typeof fullSession.subscription === 'string') {
                subscriptionId = fullSession.subscription;
              } else if (fullSession.subscription.id) {
                subscriptionId = fullSession.subscription.id;
              }
              console.log(`Webhook: Retrieved subscription ID: ${subscriptionId}`);
            } else {
              console.log('Webhook: No subscription found in expanded session data');
            }
          } catch (error) {
            console.error('Webhook: Error retrieving subscription from session:', error);
          }
        }
        
        if (!subscriptionId) {
          console.log(`Webhook: Using session ID ${session.id} as fallback since no subscription ID was found`);
          subscriptionId = session.id;
        }
        
        // Save subscription data to Firestore
        await db.collection('subscriptions').doc(metadata.userId).set({
          planId: planId,
          billingCycle: billingCycle,
          price: price,
          status: 'active',
          stripeSubscriptionId: subscriptionId,
          startDate: now,
          createdAt: now,
          updatedAt: now
        });
        
        // Update user's token usage
        const userRef = db.collection('users').doc(metadata.userId);
        const userDoc = await userRef.get();
        
        // Initialize token usage data
        const tokenUsage = {
          aiRequestsUsed: 0,
          aiRequestsLimit: aiRequestsLimit,
          lastResetDate: now,
          nextResetDate: nextResetDate,
          planId: planId
        };
        
        // Update or create user document with token usage
        if (userDoc.exists) {
          await userRef.update({
            tokenUsage: tokenUsage,
            updatedAt: now
          });
        } else {
          await userRef.set({
            tokenUsage: tokenUsage,
            createdAt: now,
            updatedAt: now
          });
        }
        
        console.log(`Webhook: Subscription created for user ${metadata.userId} with billing cycle ${billingCycle}`);
        console.log(`Webhook: Token usage updated with limit of ${aiRequestsLimit} AI requests`);
        console.log(`Webhook: Stored subscription ID: ${subscriptionId}`);
      }
    }
    
    // Handle subscription.updated event
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      // Find the user associated with this customer
      const usersRef = db.collection('subscriptions');
      const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
      
      if (!snapshot.empty) {
        const userId = snapshot.docs[0].id;
        
        // Update subscription status
        await db.collection('subscriptions').doc(userId).update({
          status: subscription.status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Webhook: Subscription updated for user ${userId} with status ${subscription.status}`);
      }
    }
    
    // Return a 200 response
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(200).json({ received: true }); // Still return 200 to acknowledge
  }
});

// Cancel subscription endpoint
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { userId, subscriptionId } = req.body;
    
    if (!userId || !subscriptionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: userId, subscriptionId' 
      });
    }
    
    console.log(`Canceling subscription ${subscriptionId} for user ${userId}`);
    
    // Check if the ID is a checkout session ID (starts with cs_) rather than a subscription ID (starts with sub_)
    if (subscriptionId.startsWith('cs_')) {
      console.log('Received checkout session ID instead of subscription ID');
      
      // Try to find the actual subscription ID from Firestore
      const subscriptionDoc = await db.collection('subscriptions').doc(userId).get();
      
      if (!subscriptionDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Subscription document not found'
        });
      }
      
      const subscriptionData = subscriptionDoc.data();
      const actualSubscriptionId = subscriptionData.stripeSubscriptionId;
      
      console.log('Retrieved subscription data from Firestore:', { 
        providedId: subscriptionId,
        actualIdFromFirestore: actualSubscriptionId 
      });
      
      // If no valid subscription ID or it's the same session ID
      if (!actualSubscriptionId || actualSubscriptionId === subscriptionId) {
        // If it's a session ID but we have no subscription ID, try to retrieve it from Stripe
        try {
          // Try to get the subscription ID from the checkout session
          const session = await stripe.checkout.sessions.retrieve(subscriptionId, {
            expand: ['subscription']
          });
          
          if (session.subscription) {
            // Found the subscription ID from the session
            console.log(`Found subscription ID ${session.subscription} from checkout session ${subscriptionId}`);
            
            // Update the subscription document with the correct subscription ID
            await db.collection('subscriptions').doc(userId).update({
              stripeSubscriptionId: session.subscription,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // Cancel the subscription using the newly found ID
            const subscription = await stripe.subscriptions.update(session.subscription, {
              cancel_at_period_end: true
            });
            
            // Get the current end date of the subscription period
            const periodEnd = new Date(subscription.current_period_end * 1000);
            
            // Update the subscription status in Firebase
            await db.collection('subscriptions').doc(userId).update({
              status: 'canceled',
              canceledAt: admin.firestore.FieldValue.serverTimestamp(),
              endDate: admin.firestore.Timestamp.fromDate(periodEnd),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`Subscription ${session.subscription} canceled successfully. Access until: ${periodEnd}`);
            
            return res.json({ 
              success: true, 
              message: 'Subscription canceled successfully',
              endDate: periodEnd
            });
          }
        } catch (stripeError) {
          console.error('Error retrieving subscription from session:', stripeError);
        }
        
        // If we get here, we couldn't find a valid subscription ID
        // Update Firebase with canceled status even if we can't cancel in Stripe
        await db.collection('subscriptions').doc(userId).update({
          status: 'canceled',
          canceledAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Could not find valid Stripe subscription ID. Updated status in Firebase only.`);
        
        return res.json({
          success: true,
          message: 'Subscription marked as canceled in our database',
          warning: 'Could not cancel in Stripe due to missing subscription ID'
        });
      }
      
      console.log(`Found actual subscription ID: ${actualSubscriptionId}`);
      
      // Use the actual subscription ID
      const subscription = await stripe.subscriptions.update(actualSubscriptionId, {
        cancel_at_period_end: true
      });
      
      // Get the current end date of the subscription period
      const periodEnd = new Date(subscription.current_period_end * 1000);
      
      // Update the subscription status in Firebase
      await db.collection('subscriptions').doc(userId).update({
        status: 'canceled',
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        endDate: admin.firestore.Timestamp.fromDate(periodEnd),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Subscription ${actualSubscriptionId} canceled successfully. Access until: ${periodEnd}`);
      
      return res.json({ 
        success: true, 
        message: 'Subscription canceled successfully',
        endDate: periodEnd
      });
    }
    
    // Normal flow for subscription IDs
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    
    // Get the current end date of the subscription period
    const periodEnd = new Date(subscription.current_period_end * 1000);
    
    // Update the subscription status in Firebase
    await db.collection('subscriptions').doc(userId).update({
      status: 'canceled',
      canceledAt: admin.firestore.FieldValue.serverTimestamp(),
      endDate: admin.firestore.Timestamp.fromDate(periodEnd),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Subscription ${subscriptionId} canceled successfully. Access until: ${periodEnd}`);
    
    res.json({ 
      success: true, 
      message: 'Subscription canceled successfully',
      endDate: periodEnd
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    
    // Handle the case where we can't cancel in Stripe but want to update in Firebase
    try {
      if (error.code === 'resource_missing' && req.body.userId) {
        // Update Firebase with canceled status even if we can't cancel in Stripe
        await db.collection('subscriptions').doc(req.body.userId).update({
          status: 'canceled',
          canceledAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Subscription not found in Stripe. Updated status in Firebase only.`);
        
        return res.json({
          success: true,
          message: 'Subscription marked as canceled in our database',
          warning: 'Could not cancel in Stripe: ' + error.message
        });
      }
    } catch (fbError) {
      console.error('Error updating Firebase:', fbError);
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to cancel subscription' 
    });
  }
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

// Add a direct endpoint to save subscription data
app.post('/save-subscription', async (req, res) => {
  try {
    const { userId, planId, billingCycle, sessionId, price } = req.body;
    
    console.log('Manually saving subscription data:', { userId, planId, billingCycle, sessionId, price });
    
    if (!userId || !planId || !sessionId) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }
    
    // Determine the actual billing cycle based on the price if provided
    let actualBillingCycle = billingCycle;
    const numericPrice = parseFloat(price);
    
    // Logic to determine billing cycle based on the price
    if (numericPrice) {
      // If price is greater than or equal to annual threshold, it's an annual plan
      if ((planId === 'starter' && numericPrice >= 90) || 
          (planId === 'pro' && numericPrice >= 190)) {
        actualBillingCycle = 'annual';
        console.log(`Price ${numericPrice} indicates annual billing for ${planId} plan`);
      } else {
        actualBillingCycle = 'monthly';
        console.log(`Price ${numericPrice} indicates monthly billing for ${planId} plan`);
      }
      console.log(`Determined billing cycle: ${actualBillingCycle} based on price ${numericPrice}`);
    } else if (billingCycle) {
      // If no price but we have billingCycle, use that directly
      console.log(`Using provided billing cycle: ${billingCycle} (no price available)`);
      actualBillingCycle = billingCycle;
    }
    
    // If the sessionId looks like a checkout session ID, try to get the actual subscription ID
    let actualSubscriptionId = sessionId;
    
    if (sessionId.startsWith('cs_')) {
      try {
        console.log(`Session ID ${sessionId} appears to be a checkout session ID. Retrieving actual subscription ID...`);
        
        // Try to get the subscription ID from the checkout session
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription']
        });
        
        if (session.subscription) {
          if (typeof session.subscription === 'string') {
            actualSubscriptionId = session.subscription;
          } else if (session.subscription.id) {
            actualSubscriptionId = session.subscription.id;
          }
          
          console.log(`Found actual subscription ID: ${actualSubscriptionId} from checkout session`);
        } else {
          console.log('No subscription found in checkout session');
        }
      } catch (error) {
        console.error('Error retrieving subscription from session:', error);
        // Continue with the original session ID if there's an error
      }
    }
    
    // Save subscription data directly to Firestore
    await db.collection('subscriptions').doc(userId).set({
      planId,
      billingCycle: actualBillingCycle,
      price: numericPrice || 0,
      status: 'active',
      stripeSubscriptionId: actualSubscriptionId,
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Subscription manually created for user ${userId} with billing cycle ${actualBillingCycle}`);
    console.log(`Stored subscription ID: ${actualSubscriptionId}`);
    res.json({ success: true, billingCycle: actualBillingCycle, subscriptionId: actualSubscriptionId });
  } catch (error) {
    console.error('Error saving subscription data:', error);
    res.status(500).json({ 
      error: 'Failed to save subscription data',
      details: error.message
    });
  }
});

// Add an endpoint to get session data directly from Stripe
app.get('/get-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session ID' });
    }
    
    console.log(`Retrieving Stripe session data for ${sessionId}`);
    
    // Get the session directly from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'subscription']
    });
    
    console.log('Retrieved session data:', {
      id: session.id,
      metadata: session.metadata,
      lineItems: session.line_items?.data?.length,
      subscription: session.subscription ? 'present' : 'absent'
    });
    
    // Extract the important data
    const responseData = {
      sessionId: session.id,
      metadata: session.metadata || {},
      lineItems: session.line_items?.data || [],
      subscription: session.subscription || null,
      customer: session.customer || null,
      amount_total: session.amount_total,
      currency: session.currency
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve session data',
      details: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.send('SmartFormAI Express backend is running!');
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);

// Export all Stripe event handlers for Firebase Functions
exports.onCheckoutSessionCompleted = stripeHandlers.onCheckoutSessionCompleted;
exports.onSubscriptionUpdated = stripeHandlers.onSubscriptionUpdated;
exports.onSubscriptionDeleted = stripeHandlers.onSubscriptionDeleted;
exports.resetTokenUsage = stripeHandlers.resetTokenUsage;
