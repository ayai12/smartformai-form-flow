require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const stripe = require('stripe')(process.env.StripeSecreteKey);

// Initialize Firebase Admin with service account directly
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
      aiRequestsLimit: 30,
      name: 'Starter Plan (Annual)'
    }
  },
  pro: {
    monthly: {
      price: 29,
      aiRequestsLimit: 150,
      name: 'Pro Plan (Monthly)'
    },
    annual: {
      price: 290, // 10 months instead of 12
      aiRequestsLimit: 150,
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
            nextResetDate.setFullYear(nextResetDate.getFullYear() + 1);
          } else {
            nextResetDate.setMonth(nextResetDate.getMonth() + 1);
          }
          
          // If we've passed the reset date, calculate the next one
          while (nextResetDate < now.toDate()) {
            if (subscriptionData.billingCycle === 'annual') {
              nextResetDate.setFullYear(nextResetDate.getFullYear() + 1);
            } else {
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
      planId: planId
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

// Create Stripe customer portal session
app.post('/create-portal-session', async (req, res) => {
  try {
    const { userId, returnUrl } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log(`Creating customer portal session for user: ${userId}`);
    
    // First, get the customer ID for this user
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    const subscription = await subscriptionRef.get();
    
    if (!subscription.exists) {
      return res.status(404).json({ error: 'No subscription found for this user' });
    }
    
    const subscriptionData = subscription.data();
    const stripeCustomerId = subscriptionData.stripeCustomerId;
    
    if (!stripeCustomerId) {
      return res.status(404).json({ error: 'No Stripe customer ID found for this user' });
    }
    
    // Create the portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || `${req.headers.origin}/profile`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ 
      error: 'Failed to create portal session',
      details: error.message
    });
  }
});

// Get Stripe products and prices
app.get('/get-stripe-prices', async (req, res) => {
  try {
    console.log('Fetching Stripe products and prices');
    
    // Get all products
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });
    
    // Format the response to match what the frontend expects
    const formattedProducts = products.data.map(product => {
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata,
        prices: [product.default_price].filter(Boolean).map(price => {
          return {
            id: price.id,
            currency: price.currency,
            unit_amount: price.unit_amount,
            recurring: price.recurring,
            metadata: price.metadata
          };
        })
      };
    });
    
    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Stripe products',
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
    
    // Get the session directly from Stripe with expanded line_items and subscription
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
          (planId === 'pro' && numericPrice >= 290)) {
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
    
    // Save subscription data directly to Firestore
    await db.collection('subscriptions').doc(userId).set({
      planId,
      billingCycle: actualBillingCycle,
      price: numericPrice || 0,
      status: 'active',
      stripeSubscriptionId: sessionId,
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Subscription manually created for user ${userId} with billing cycle ${actualBillingCycle}`);
    res.json({ success: true, billingCycle: actualBillingCycle });
  } catch (error) {
    console.error('Error saving subscription data:', error);
    res.status(500).json({ 
      error: 'Failed to save subscription data',
      details: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.send('SmartFormAI Express backend is running!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
}); 