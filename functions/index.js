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
  console.log('Webhook request received');
  
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('Webhook headers:', JSON.stringify(req.headers));
  console.log('Webhook secret:', endpointSecret ? 'Present' : 'Missing');

  let event;

  try {
    // req.body is a Buffer when using express.raw
    // Stripe webhook requires the raw body, not the parsed JSON
    if (!sig || !endpointSecret) {
      console.log('Missing signature or webhook secret, skipping verification');
      // For development, if signature verification fails, try to parse the body directly
      try {
        event = JSON.parse(req.body.toString());
        console.log('Parsed webhook body directly:', event.type);
      } catch (parseError) {
        console.error('Error parsing webhook body:', parseError);
        return res.status(400).send('Webhook Error: Invalid payload');
      }
    } else {
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        endpointSecret
      );
      console.log('Webhook signature verified:', event.type);
    }
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    
    // For development, if signature verification fails, try to parse the body directly
    try {
      event = JSON.parse(req.body.toString());
      console.log('Parsed webhook body after verification failure:', event.type);
    } catch (parseError) {
      console.error('Error parsing webhook body:', parseError);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Handle the event
  try {
    console.log('Processing webhook event:', event.type);
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        await handleSuccessfulPayment(session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        console.log('Subscription updated/deleted:', subscription.id);
        await handleSubscriptionChange(subscription);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);
        await handleSuccessfulInvoicePayment(invoice);
        break;
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('Invoice payment failed:', failedInvoice.id);
        await handleFailedInvoicePayment(failedInvoice);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    console.log('Webhook processing completed successfully');
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook event:', error);
    res.status(500).json({ error: 'Error processing webhook event' });
  }
});

// Handle successful payment
const handleSuccessfulPayment = async (session) => {
  const { userId, planId, billingCycle } = session.metadata;
  
  if (!userId || !planId || !billingCycle) {
    console.error('Missing metadata in session:', session.id);
    return;
  }

  try {
    console.log(`Processing successful payment for user ${userId}, plan ${planId}, billing ${billingCycle}`);
    
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    console.log('Retrieved subscription from Stripe:', subscription.id);
    
    // Get product and price details
    const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
    const product = await stripe.products.retrieve(price.product);
    console.log('Retrieved product:', product.name);
    
    // Calculate expiration date based on billing cycle
    const currentDate = new Date();
    const expirationDate = new Date(currentDate);
    if (billingCycle === 'monthly') {
      expirationDate.setMonth(currentDate.getMonth() + 1);
    } else if (billingCycle === 'annual') {
      expirationDate.setFullYear(currentDate.getFullYear() + 1);
    }

    // Prepare subscription data
    const subscriptionData = {
      planId,
      billingCycle,
      status: subscription.status,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
      productName: product.name,
      amount: price.unit_amount / 100,
      interval: price.recurring.interval,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      features: PRODUCTS[planId].features
    };

    // Save subscription details to Firestore
    await db.collection('users').doc(userId).set({
      subscription: subscriptionData
    }, { merge: true });

    console.log(`Subscription saved for user ${userId}`);
    
    // Double-check that the data was saved correctly
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.subscription && userData.subscription.stripeSubscriptionId === subscription.id) {
          console.log(`Verified subscription data for user ${userId}`);
        } else {
          console.warn(`Subscription data verification failed for user ${userId}`);
          // Try to save again
          await db.collection('users').doc(userId).set({
            subscription: subscriptionData
          }, { merge: true });
        }
      }
    } catch (verifyError) {
      console.error('Error verifying subscription data:', verifyError);
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
    // Try one more time with a delay
    setTimeout(async () => {
      try {
        console.log(`Retrying subscription save for user ${userId}`);
        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Save minimal subscription details to Firestore
        await db.collection('users').doc(userId).set({
          subscription: {
            planId,
            billingCycle,
            status: subscription.status,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
            features: PRODUCTS[planId].features
          }
        }, { merge: true });
        
        console.log(`Retry successful for user ${userId}`);
      } catch (retryError) {
        console.error('Error in retry:', retryError);
      }
    }, 5000);
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

    // Get product and price details
    let productName = null;
    let amount = null;
    let interval = null;

    try {
      const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
      const product = await stripe.products.retrieve(price.product);
      
      productName = product.name;
      amount = price.unit_amount / 100;
      interval = price.recurring.interval;
    } catch (error) {
      console.error('Error fetching price/product details:', error);
    }

    // Update subscription status for each user (there should be only one)
    for (const doc of querySnapshot.docs) {
      const updateData = {
        'subscription.status': subscription.status,
        'subscription.currentPeriodEnd': admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
        'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      };

      // Add product details if available
      if (productName) updateData['subscription.productName'] = productName;
      if (amount) updateData['subscription.amount'] = amount;
      if (interval) updateData['subscription.interval'] = interval;

      await db.collection('users').doc(doc.id).update(updateData);
      
      console.log(`Subscription updated for user ${doc.id}`);
    }
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
};

// Handle successful invoice payment (renewal)
const handleSuccessfulInvoicePayment = async (invoice) => {
  // Only process subscription invoices
  if (!invoice.subscription) return;
  
  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    
    // Find the user with this subscription
    const querySnapshot = await db.collection('users')
      .where('subscription.stripeSubscriptionId', '==', invoice.subscription)
      .get();
    
    if (querySnapshot.empty) {
      console.log(`No user found with subscription ID: ${invoice.subscription}`);
      return;
    }

    // Update payment info for each user (there should be only one)
    for (const doc of querySnapshot.docs) {
      await db.collection('users').doc(doc.id).update({
        'subscription.lastPaymentDate': admin.firestore.Timestamp.fromDate(new Date(invoice.status_transitions.paid_at * 1000)),
        'subscription.currentPeriodEnd': admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
        'subscription.status': subscription.status,
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Payment recorded for user ${doc.id}`);
    }
  } catch (error) {
    console.error('Error handling successful invoice payment:', error);
  }
};

// Handle failed invoice payment
const handleFailedInvoicePayment = async (invoice) => {
  // Only process subscription invoices
  if (!invoice.subscription) return;
  
  try {
    // Find the user with this subscription
    const querySnapshot = await db.collection('users')
      .where('subscription.stripeSubscriptionId', '==', invoice.subscription)
      .get();
    
    if (querySnapshot.empty) {
      console.log(`No user found with subscription ID: ${invoice.subscription}`);
      return;
    }

    // Update subscription status for each user (there should be only one)
    for (const doc of querySnapshot.docs) {
      await db.collection('users').doc(doc.id).update({
        'subscription.status': 'past_due',
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Payment failure recorded for user ${doc.id}`);
    }
  } catch (error) {
    console.error('Error handling failed invoice payment:', error);
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
    
    // If subscription exists, enrich with additional data from Stripe
    if (subscription && subscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
        const product = await stripe.products.retrieve(stripeSubscription.items.data[0].price.product);
        const price = stripeSubscription.items.data[0].price;
        
        // Enrich subscription data with Stripe details
        subscription.productName = product.name;
        subscription.amount = price.unit_amount / 100; // Convert from cents to dollars
        subscription.interval = price.recurring.interval;
        subscription.status = stripeSubscription.status;
        subscription.currentPeriodEnd = stripeSubscription.current_period_end;
        
        // Add last payment date if available
        if (stripeSubscription.latest_invoice) {
          const invoice = await stripe.invoices.retrieve(stripeSubscription.latest_invoice);
          if (invoice.status === 'paid') {
            subscription.lastPaymentDate = invoice.status_transitions.paid_at;
          }
        }
      } catch (stripeError) {
        console.error('Error fetching additional subscription data from Stripe:', stripeError);
        // Continue with the basic subscription data
      }
    }
    
    res.json({ subscription });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Create Stripe Customer Portal session
app.post('/create-customer-portal', async (req, res) => {
  const { userId, returnUrl } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing user ID' });
  }

  try {
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Check if user has a Stripe customer ID
    if (!userData.subscription || !userData.subscription.stripeCustomerId) {
      return res.status(400).json({ error: 'User does not have an active subscription' });
    }

    // Create a customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.subscription.stripeCustomerId,
      return_url: returnUrl || `${req.headers.origin}/profile`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: 'Failed to create customer portal session' });
  }
});

// Cancel subscription
app.post('/cancel-subscription', async (req, res) => {
  const { userId, subscriptionId } = req.body;
  
  if (!userId || !subscriptionId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Verify that the subscription belongs to this user
    if (!userData.subscription || userData.subscription.stripeSubscriptionId !== subscriptionId) {
      return res.status(403).json({ error: 'Subscription does not belong to this user' });
    }

    // Cancel the subscription at the end of the current period
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update the subscription in Firestore
    await db.collection('users').doc(userId).update({
      'subscription.cancelAtPeriodEnd': true,
      'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
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
