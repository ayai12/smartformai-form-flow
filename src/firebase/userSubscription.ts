import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserSubscription {
  id?: string;
  planId?: string;
  billingCycle?: 'monthly' | 'annual';
  status?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  productName?: string;
  amount?: number;
  interval?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  currentPeriodEnd?: Date | Timestamp | number;
  lastPaymentDate?: Date | Timestamp | number;
  cancelAtPeriodEnd?: boolean;
  features?: {
    activeForms?: number;
    aiGeneratedForms?: number;
    removeSmartFormAIBranding?: boolean;
    [key: string]: any;
  };
}

/**
 * Get the user's subscription details from Firestore
 * @param userId The user ID
 * @returns The user's subscription or null if not found
 */
export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    if (!userData.subscription) {
      return null;
    }
    
    // Convert Firestore timestamps to JavaScript Dates
    const subscription = { ...userData.subscription };
    
    // Process timestamps
    if (subscription.createdAt && typeof subscription.createdAt.toDate === 'function') {
      subscription.createdAt = subscription.createdAt.toDate();
    }
    
    if (subscription.updatedAt && typeof subscription.updatedAt.toDate === 'function') {
      subscription.updatedAt = subscription.updatedAt.toDate();
    }
    
    if (subscription.currentPeriodEnd && typeof subscription.currentPeriodEnd.toDate === 'function') {
      subscription.currentPeriodEnd = subscription.currentPeriodEnd.toDate();
    } else if (typeof subscription.currentPeriodEnd === 'number') {
      // Handle Unix timestamp (seconds since epoch)
      subscription.currentPeriodEnd = new Date(subscription.currentPeriodEnd * 1000);
    }
    
    if (subscription.lastPaymentDate && typeof subscription.lastPaymentDate.toDate === 'function') {
      subscription.lastPaymentDate = subscription.lastPaymentDate.toDate();
    } else if (typeof subscription.lastPaymentDate === 'number') {
      // Handle Unix timestamp (seconds since epoch)
      subscription.lastPaymentDate = new Date(subscription.lastPaymentDate * 1000);
    }
    
    return subscription;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
};

/**
 * Update the user's subscription details in Firestore
 * @param userId The user ID
 * @param subscription The subscription data to update
 * @returns True if successful, false otherwise
 */
export const updateUserSubscription = async (
  userId: string, 
  subscription: Partial<UserSubscription>
): Promise<boolean> => {
  try {
    // Create a copy of the subscription to avoid modifying the original
    const subscriptionData = { ...subscription };
    
    // Set updatedAt to current date if not provided
    if (!subscriptionData.updatedAt) {
      subscriptionData.updatedAt = new Date();
    }
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { subscription: subscriptionData });
    return true;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return false;
  }
};

/**
 * Cancel the user's subscription in Firestore
 * @param userId The user ID
 * @returns True if successful, false otherwise
 */
export const cancelUserSubscription = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      'subscription.cancelAtPeriodEnd': true,
      'subscription.updatedAt': new Date()
    });
    return true;
  } catch (error) {
    console.error('Error cancelling user subscription:', error);
    return false;
  }
};

/**
 * Check if a user has an active subscription
 * @param userId The user ID
 * @returns True if the user has an active subscription, false otherwise
 */
export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  const subscription = await getUserSubscription(userId);
  return !!subscription && subscription.status === 'active';
};

/**
 * Check if the user has access to a specific feature based on their subscription
 * @param userId The user ID
 * @param feature The feature to check access for
 * @returns True if the user has access to the feature, false otherwise
 */
export const hasFeatureAccess = async (
  userId: string, 
  feature: string
): Promise<boolean> => {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription || subscription.status !== 'active') {
    return false;
  }
  
  return subscription.features?.[feature] === true;
};

/**
 * Get the user's subscription limit for a specific feature
 * @param userId The user ID
 * @param feature The feature to check the limit for
 * @returns The limit value or 0 if not found
 */
export const getSubscriptionLimit = async (
  userId: string, 
  feature: string
): Promise<number> => {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription || subscription.status !== 'active') {
    // Return free tier limits
    switch (feature) {
      case 'activeForms':
        return 20;
      case 'aiGeneratedForms':
        return 10;
      default:
        return 0;
    }
  }
  
  return subscription.features?.[feature] || 0;
}; 