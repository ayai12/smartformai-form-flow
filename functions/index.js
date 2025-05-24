require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const path = require('path');
const fs = require('fs');
const stripe = require('stripe')(process.env.StripeSecreteKey);

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
  try {
    const { planId, billingCycle, userId } = req.body;
    
    console.log('Creating checkout session with params:', { planId, billingCycle, userId });
    
    if (!planId || !billingCycle || !userId) {
      return res.status(400).json({ 
        error: 'Missing required parameters: planId, billingCycle, userId' 
      });
    }
    
    // Get plan details based on planId and billingCycle
    const plans = {
      starter: {
        monthly: {
          price: 9,
          name: 'Starter Plan (Monthly)'
        },
        annual: {
          price: 90, // 10 months instead of 12
          name: 'Starter Plan (Annual)'
        }
      },
      pro: {
        monthly: {
          price: 29,
          name: 'Pro Plan (Monthly)'
        },
        annual: {
          price: 290, // 10 months instead of 12
          name: 'Pro Plan (Annual)'
        }
      }
    };
    
    const plan = plans[planId]?.[billingCycle];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan or billing cycle' });
    }
    
    // Prepare metadata object
    const metadata = {
      userId: userId,
      planId: planId,
      billingCycle: billingCycle,
      price: plan.price.toString()
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
              description: `SmartFormAI ${planId} plan - ${billingCycle} billing`,
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
  console.log('Received webhook from Stripe');
  
  let event;
  
  try {
    // Just try to parse the webhook data
    if (typeof req.body === 'string') {
      event = JSON.parse(req.body);
    } else if (Buffer.isBuffer(req.body)) {
      event = JSON.parse(req.body.toString());
    } else {
      event = req.body;
    }
    
    console.log('Webhook event type:', event.type);
    
    // Just handle checkout.session.completed event
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
        
        // Logic to determine billing cycle based on the price
        if (price) {
          // If price is greater than or equal to annual threshold, it's an annual plan
          if ((planId === 'starter' && price >= 90) || 
              (planId === 'pro' && price >= 290)) {
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
        
        // Save subscription data to Firestore
        await db.collection('subscriptions').doc(metadata.userId).set({
          planId: planId,
          billingCycle: billingCycle,
          price: price,
          status: 'active',
          stripeSubscriptionId: session.subscription || session.id,
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Webhook: Subscription created for user ${metadata.userId} with billing cycle ${billingCycle}`);
      }
    }
    
    // Return a 200 response
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(200).json({ received: true }); // Still return 200 to acknowledge
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

// Add an endpoint to cancel a subscription
app.post('/cancel-subscription', async (req, res) => {
  try {
    const { userId, subscriptionId } = req.body;
    
    console.log('Canceling subscription:', { userId, subscriptionId });
    
    if (!userId || !subscriptionId) {
      return res.status(400).json({ 
        error: 'Missing required parameters: userId, subscriptionId' 
      });
    }
    
    // 1. Get the subscription from Firestore to check if it exists
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    const subscriptionDoc = await subscriptionRef.get();
    
    if (!subscriptionDoc.exists) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    const subscriptionData = subscriptionDoc.data();
    
    // Only try to cancel in Stripe if it's not already canceled
    if (subscriptionData.status !== 'canceled') {
      try {
        // 2. Cancel the subscription in Stripe - set to cancel at period end
        if (subscriptionId.startsWith('sub_')) {
          // This is a real Stripe subscription ID
          await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
          });
          console.log(`Stripe subscription ${subscriptionId} set to cancel at period end`);
        } else {
          console.log(`Not a Stripe subscription ID: ${subscriptionId}, skipping Stripe API call`);
        }
      } catch (stripeError) {
        console.error('Error canceling in Stripe:', stripeError);
        // Continue anyway to update our database
      }
      
      // 3. Update subscription status in Firestore
      const startDate = subscriptionData.startDate.toDate();
      let endDate = new Date(startDate);
      
      // Calculate end date (when subscription will actually end)
      if (subscriptionData.billingCycle === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
      
      // Update the subscription document
      await subscriptionRef.update({
        status: 'canceled',
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        endDate: endDate,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Subscription for user ${userId} marked as canceled, active until ${endDate}`);
    }
    
    res.json({ 
      success: true,
      message: 'Subscription has been canceled and will end at the end of the billing period'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});