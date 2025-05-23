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
    
    const subscriptionRef = doc(db, 'subscriptions', userId);
    console.log(`Subscription ref created for path: subscriptions/${userId}`);
    
    const subscriptionDoc = await getDoc(subscriptionRef);
    console.log(`Document exists: ${subscriptionDoc.exists()}`);
    
    if (subscriptionDoc.exists()) {
      const data = subscriptionDoc.data() as SubscriptionData;
      console.log('Subscription data retrieved:', data);
      return data;
    }
    
    console.log('No subscription found for user');
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