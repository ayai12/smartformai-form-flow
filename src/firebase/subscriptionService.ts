import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import axios from 'axios';

export interface SubscriptionData {
  planId: string;
  billingCycle: string;
  price: number;
  status: string;
  stripeSubscriptionId?: string;
  startDate: any;
  endDate?: any;
  createdAt?: any;
  updatedAt?: any;
  canceledAt?: any;
}

// Get user's subscription data
export const getUserSubscription = async (userId: string): Promise<SubscriptionData | null> => {
  try {
    console.log(`Getting subscription for user: ${userId}`);
    
    if (!userId) {
      console.error('getUserSubscription called with empty userId');
      return null;
    }
    
    // First check the subscriptions collection
    const subscriptionRef = doc(db, 'subscriptions', userId);
    console.log(`Subscription ref created for path: subscriptions/${userId}`);
    
    const subscriptionDoc = await getDoc(subscriptionRef);
    console.log(`Document exists in subscriptions collection: ${subscriptionDoc.exists()}`);
    
    if (subscriptionDoc.exists()) {
      const data = subscriptionDoc.data() as SubscriptionData;
      console.log('Subscription data retrieved from subscriptions collection:', data);
      return data;
    }
    
    // If not found in subscriptions collection, check the user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().subscription) {
      const data = userDoc.data().subscription as SubscriptionData;
      console.log('Subscription data retrieved from user document:', data);
      
      // If we have a free plan in the user document, set the billing cycle
      if (data.planId === 'free' && !data.billingCycle) {
        data.billingCycle = 'monthly';
      }
      
      return data;
    }
    
    console.log('No subscription found for user in either collection');
    return null;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
};

// Cancel a subscription
export const cancelSubscription = async (userId: string, stripeSubscriptionId?: string): Promise<boolean> => {
  try {
    // First try to cancel with Stripe through our backend if we have a subscription ID
    if (stripeSubscriptionId) {
      try {
        await axios.post('/cancel-subscription', {
          userId: userId,
          subscriptionId: stripeSubscriptionId
        });
      } catch (err) {
        console.error('Error canceling subscription in Stripe:', err);
        // Continue anyway to update local database
      }
    }
    
    // Update the subscription status in Firestore
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (subscriptionDoc.exists()) {
      // Mark subscription as canceled but still active until end of billing period
      await updateDoc(subscriptionRef, {
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date()
      });
      
      return true;
    }
    
    // Check if subscription is in user document (free plan)
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().subscription) {
      // For free plans, we don't actually cancel, but we could update the status if needed
      // This is just a placeholder in case you want to add more logic later
      await updateDoc(userRef, {
        'subscription.status': 'active', // Keep as active since it's free
        'subscription.updatedAt': new Date()
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
};

// Format the next billing date
export const getNextBillingDate = (subscription: SubscriptionData | null): string => {
  if (!subscription || !subscription.startDate) return 'Unknown';
  
  try {
    const startDate = subscription.startDate.toDate ? subscription.startDate.toDate() : new Date(subscription.startDate);
    const nextDate = new Date(startDate);
    
    // If subscription is canceled, return end date instead
    if (subscription.status === 'canceled' && subscription.endDate) {
      try {
        const endDate = subscription.endDate.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);
        return formatDate(endDate);
      } catch (error) {
        console.error('Error formatting end date:', error);
        return 'Unknown';
      }
    }
    
    // Calculate next billing date based on billing cycle
    if (subscription.billingCycle === 'annual') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return formatDate(nextDate);
  } catch (error) {
    console.error('Error calculating next billing date:', error);
    return 'Unknown';
  }
};

// Helper function to format date
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}; 