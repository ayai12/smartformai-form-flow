import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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

// Cancel user's subscription
export const cancelSubscription = async (userId: string, stripeSubscriptionId?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Get current subscription data
    const subscription = await getUserSubscription(userId);
    console.log('Retrieved subscription data:', subscription);
    
    if (!subscription) {
      return { success: false, error: 'No active subscription found' };
    }
    
    if (subscription.status === 'canceled') {
      return { success: false, error: 'Subscription is already canceled' };
    }
    
    // Use the subscription ID from parameter or from the stored subscription data
    const subscriptionId = stripeSubscriptionId || subscription.stripeSubscriptionId;
    console.log('Using subscription ID:', subscriptionId);
    
    if (!subscriptionId) {
      return { success: false, error: 'Subscription ID not found' };
    }
    
    // Check if this is likely a checkout session ID rather than a subscription ID
    if (subscriptionId.startsWith('cs_')) {
      console.warn('Warning: Attempting to cancel using what appears to be a checkout session ID, not a subscription ID');
    }
    
    // Call the backend API to cancel the subscription in Stripe
    // Use a hardcoded URL or determine based on environment
    const apiUrl = 'https://us-central1-smartformai-51e03.cloudfunctions.net/api';
    console.log(`Sending cancellation request to: ${apiUrl}/api/cancel-subscription`);
    
    const response = await axios.post(`${apiUrl}/api/cancel-subscription`, {
      userId,
      subscriptionId
    });
    
    console.log('Cancellation response:', response.data);
    
    if (!response.data.success) {
      return { 
        success: false, 
        error: response.data.error || 'Failed to cancel subscription in Stripe'
      };
    }
    
    // Update subscription status in Firestore (this is also done on the server, but update locally for UI)
    const subscriptionRef = doc(db, 'subscriptions', userId);
    
    await updateDoc(subscriptionRef, {
      status: 'canceled',
      canceledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`Subscription ${subscriptionId} canceled successfully for user ${userId}`);
    
    // If there was a warning but operation was successful, still return success
    if (response.data.warning) {
      console.warn('Cancellation warning:', response.data.warning);
      return { 
        success: true, 
        error: response.data.warning  // Include the warning as an "error" for display
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}; 