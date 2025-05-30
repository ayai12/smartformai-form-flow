const functions = require('firebase-functions');
const admin = require('firebase-admin');

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
      price: 90,
      aiRequestsLimit: 30,
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
      price: 190,
      aiRequestsLimit: 150,
      name: 'Pro Plan (Annual)'
    }
  }
};

/**
 * Handles the checkout.session.completed event from Stripe
 * Updates the user's token usage based on their subscription
 */
exports.onCheckoutSessionCompleted = functions.https.onCall(
  async (event) => {
    try {
      const session = event.data;
      console.log('Processing checkout session completed:', session.id);
      
      // Get the customer ID from the session
      const customerId = session.customer;
      if (!customerId) {
        console.error('No customer ID found in session:', session.id);
        return;
      }
      
      // Find the Firebase user associated with this Stripe customer
      const customerSnapshot = await admin.firestore()
        .collection('customers')
        .where('stripeId', '==', customerId)
        .limit(1)
        .get();
      
      if (customerSnapshot.empty) {
        console.error('No Firebase user found for Stripe customer:', customerId);
        return;
      }
      
      const userId = customerSnapshot.docs[0].id;
      console.log(`Found user ${userId} for Stripe customer ${customerId}`);
      
      // Get the subscription details from the session
      const subscription = await admin.firestore()
        .collection('customers')
        .doc(userId)
        .collection('subscriptions')
        .where('status', '==', 'active')
        .limit(1)
        .get();
      
      if (subscription.empty) {
        console.error('No active subscription found for user:', userId);
        return;
      }
      
      const subscriptionData = subscription.docs[0].data();
      const priceId = subscriptionData.items[0]?.price?.id;
      const productId = subscriptionData.items[0]?.price?.product;
      
      // Get the product details to determine the plan
      const productSnapshot = await admin.firestore()
        .collection('products')
        .doc(productId)
        .get();
      
      if (!productSnapshot.exists) {
        console.error('Product not found:', productId);
        return;
      }
      
      const product = productSnapshot.data();
      const planName = product.name.toLowerCase();
      
      // Determine the plan type and billing cycle
      let planId = 'starter'; // Default
      if (planName.includes('pro')) {
        planId = 'pro';
      }
      
      const billingCycle = subscriptionData.items[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';
      
      // Calculate token limit based on plan and billing cycle
      let aiRequestsLimit = SUBSCRIPTION_PLANS.free.aiRequestsLimit; // Default
      
      if (planId === 'starter') {
        aiRequestsLimit = SUBSCRIPTION_PLANS.starter[billingCycle].aiRequestsLimit;
      } else if (planId === 'pro') {
        aiRequestsLimit = SUBSCRIPTION_PLANS.pro[billingCycle].aiRequestsLimit;
      }
      
      console.log(`Setting token limit for user ${userId} to ${aiRequestsLimit} (${planId} ${billingCycle})`);
      
      // Calculate next reset date
      const now = admin.firestore.Timestamp.now();
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
      
      // Update the user's token usage in Firestore
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .set({
          tokenUsage: {
            aiRequestsUsed: 0, // Reset to 0 when subscription starts
            aiRequestsLimit: aiRequestsLimit,
            lastResetDate: now,
            nextResetDate: nextResetDate,
            planId: planId
          },
          updatedAt: now
        }, { merge: true });
      
      console.log(`Token usage updated for user ${userId}`);
    } catch (error) {
      console.error('Error processing checkout session:', error);
    }
  }
);

/**
 * Handles the customer.subscription.updated event from Stripe
 * Updates the user's token usage when their subscription changes
 */
exports.onSubscriptionUpdated = functions.https.onCall(
  async (event) => {
    try {
      const subscription = event.data;
      console.log('Processing subscription updated:', subscription.id);
      
      // Get the customer ID from the subscription
      const customerId = subscription.customer;
      if (!customerId) {
        console.error('No customer ID found in subscription:', subscription.id);
        return;
      }
      
      // Find the Firebase user associated with this Stripe customer
      const customerSnapshot = await admin.firestore()
        .collection('customers')
        .where('stripeId', '==', customerId)
        .limit(1)
        .get();
      
      if (customerSnapshot.empty) {
        console.error('No Firebase user found for Stripe customer:', customerId);
        return;
      }
      
      const userId = customerSnapshot.docs[0].id;
      console.log(`Found user ${userId} for Stripe customer ${customerId}`);
      
      // Check if the subscription status has changed
      if (subscription.status === 'canceled') {
        console.log(`Subscription ${subscription.id} has been canceled`);
        // No immediate action needed - user keeps access until the end of the billing period
        return;
      }
      
      // Check if the subscription has been updated to a different plan
      const priceId = subscription.items.data[0]?.price?.id;
      const productId = subscription.items.data[0]?.price?.product;
      
      // Get the product details to determine the plan
      const productSnapshot = await admin.firestore()
        .collection('products')
        .doc(productId)
        .get();
      
      if (!productSnapshot.exists) {
        console.error('Product not found:', productId);
        return;
      }
      
      const product = productSnapshot.data();
      const planName = product.name.toLowerCase();
      
      // Determine the plan type and billing cycle
      let planId = 'starter'; // Default
      if (planName.includes('pro')) {
        planId = 'pro';
      }
      
      const billingCycle = subscription.items.data[0]?.plan?.interval === 'year' ? 'annual' : 'monthly';
      
      // Calculate token limit based on plan and billing cycle
      let aiRequestsLimit = SUBSCRIPTION_PLANS.free.aiRequestsLimit; // Default
      
      if (planId === 'starter') {
        aiRequestsLimit = SUBSCRIPTION_PLANS.starter[billingCycle].aiRequestsLimit;
      } else if (planId === 'pro') {
        aiRequestsLimit = SUBSCRIPTION_PLANS.pro[billingCycle].aiRequestsLimit;
      }
      
      console.log(`Updating token limit for user ${userId} to ${aiRequestsLimit} (${planId} ${billingCycle})`);
      
      // Update the user's token usage in Firestore
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .update({
          'tokenUsage.aiRequestsLimit': aiRequestsLimit,
          'tokenUsage.planId': planId,
          updatedAt: admin.firestore.Timestamp.now()
        });
      
      console.log(`Token usage updated for user ${userId}`);
    } catch (error) {
      console.error('Error processing subscription update:', error);
    }
  }
);

/**
 * Handles the customer.subscription.deleted event from Stripe
 * Downgrades the user to the free plan when their subscription is deleted
 */
exports.onSubscriptionDeleted = functions.https.onCall(
  async (event) => {
    try {
      const subscription = event.data;
      console.log('Processing subscription deleted:', subscription.id);
      
      // Get the customer ID from the subscription
      const customerId = subscription.customer;
      if (!customerId) {
        console.error('No customer ID found in subscription:', subscription.id);
        return;
      }
      
      // Find the Firebase user associated with this Stripe customer
      const customerSnapshot = await admin.firestore()
        .collection('customers')
        .where('stripeId', '==', customerId)
        .limit(1)
        .get();
      
      if (customerSnapshot.empty) {
        console.error('No Firebase user found for Stripe customer:', customerId);
        return;
      }
      
      const userId = customerSnapshot.docs[0].id;
      console.log(`Found user ${userId} for Stripe customer ${customerId}`);
      
      // Downgrade the user to the free plan
      const now = admin.firestore.Timestamp.now();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .set({
          tokenUsage: {
            aiRequestsUsed: 0,
            aiRequestsLimit: SUBSCRIPTION_PLANS.free.aiRequestsLimit,
            lastResetDate: now,
            nextResetDate: admin.firestore.Timestamp.fromDate(nextMonth),
            planId: 'free'
          },
          updatedAt: now
        }, { merge: true });
      
      console.log(`User ${userId} downgraded to free plan`);
    } catch (error) {
      console.error('Error processing subscription deletion:', error);
    }
  }
);

/**
 * Scheduled function to reset token usage on billing date
 * Runs daily and checks if any users need their tokens reset
 */
exports.resetTokenUsage = functions.pubsub.schedule('0 0 * * *')
  .timeZone('America/New_York') // Adjust to your preferred timezone
  .onRun(
  async (event) => {
    try {
      console.log('Running scheduled token reset job');
      
      const now = admin.firestore.Timestamp.now();
      
      // Find users whose token reset date is in the past
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('tokenUsage.nextResetDate', '<=', now)
        .get();
      
      console.log(`Found ${usersSnapshot.size} users that need token reset`);
      
      let batch = admin.firestore().batch();
      let count = 0;
      
      // Process each user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const tokenUsage = userData.tokenUsage || {};
        const planId = tokenUsage.planId || 'free';
        
        // Get the user's subscription to determine billing cycle
        let billingCycle = 'monthly'; // Default
        let aiRequestsLimit = SUBSCRIPTION_PLANS.free.aiRequestsLimit; // Default
        
        if (planId !== 'free') {
          // Check if user has an active subscription
          const subscriptionsSnapshot = await admin.firestore()
            .collection('customers')
            .doc(userId)
            .collection('subscriptions')
            .where('status', '==', 'active')
            .limit(1)
            .get();
          
          if (!subscriptionsSnapshot.empty) {
            const subscription = subscriptionsSnapshot.docs[0].data();
            billingCycle = subscription.items[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';
            
            // Set token limit based on plan and billing cycle
            if (planId === 'starter') {
              aiRequestsLimit = SUBSCRIPTION_PLANS.starter[billingCycle].aiRequestsLimit;
            } else if (planId === 'pro') {
              aiRequestsLimit = SUBSCRIPTION_PLANS.pro[billingCycle].aiRequestsLimit;
            }
          }
        }
        
        // Calculate next reset date
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
        
        // Update the user's token usage
        batch.update(userDoc.ref, {
          'tokenUsage.aiRequestsUsed': 0,
          'tokenUsage.aiRequestsLimit': aiRequestsLimit,
          'tokenUsage.lastResetDate': now,
          'tokenUsage.nextResetDate': nextResetDate,
          updatedAt: now
        });
        
        count++;
        
        // Firestore batches have a limit of 500 operations
        if (count >= 500) {
          await batch.commit();
          batch = admin.firestore().batch();
          count = 0;
        }
      }
      
      // Commit any remaining operations
      if (count > 0) {
        await batch.commit();
      }
      
      console.log('Token reset job completed successfully');
      return null;
    } catch (error) {
      console.error('Error resetting token usage:', error);
      return null;
    }
  }
); 