import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_TOKEN_USAGE, SUBSCRIPTION_PLANS } from './stripeConfig';
import { TokenUsage } from '@/context/TokenUsageContext';

// Initialize token usage for a new user
export const initializeTokenUsage = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) return false;
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    // Only initialize if the user doesn't already have token usage data
    if (!userDoc.exists() || !userDoc.data().tokenUsage) {
      // Calculate next reset date (1 month from now)
      const nextResetDate = new Date();
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);
      
      await setDoc(userRef, {
        tokenUsage: {
          ...DEFAULT_TOKEN_USAGE,
          lastResetDate: serverTimestamp(),
          nextResetDate: nextResetDate,
        },
        // Add subscription data directly in the user document for free users
        subscription: {
          planId: 'free',
          status: 'active',
          price: 0,
          startDate: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing token usage:', error);
    return false;
  }
};

// Get token usage for a user
export const getTokenUsage = async (userId: string): Promise<TokenUsage | null> => {
  try {
    if (!userId) return null;
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().tokenUsage) {
      const tokenData = userDoc.data().tokenUsage;
      
      // Convert Firebase timestamps to JS Date objects
      if (tokenData.lastResetDate) {
        tokenData.lastResetDate = tokenData.lastResetDate.toDate ? 
          tokenData.lastResetDate.toDate() : 
          new Date(tokenData.lastResetDate);
      }
      
      if (tokenData.nextResetDate) {
        tokenData.nextResetDate = tokenData.nextResetDate.toDate ? 
          tokenData.nextResetDate.toDate() : 
          new Date(tokenData.nextResetDate);
      }
      
      return tokenData as TokenUsage;
    }
    
    // If no token usage data exists, initialize it
    // await initializeTokenUsage(userId);
    // return DEFAULT_TOKEN_USAGE as TokenUsage;
    return null;
  } catch (error) {
    console.error('Error getting token usage:', error);
    return null;
  }
};

// Update token usage when a user consumes a token
export const incrementTokenUsage = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) return false;
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await initializeTokenUsage(userId);
      return true;
    }
    
    const userData = userDoc.data();
    const tokenUsage = userData.tokenUsage || DEFAULT_TOKEN_USAGE;
    
    // Increment the token usage
    tokenUsage.aiRequestsUsed += 1;
    
    // Update the user document
    await updateDoc(userRef, {
      'tokenUsage.aiRequestsUsed': tokenUsage.aiRequestsUsed,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error incrementing token usage:', error);
    return false;
  }
};

// Reset token usage (typically called when subscription renews)
export const resetTokenUsage = async (userId: string, aiRequestsLimit: number): Promise<boolean> => {
  try {
    if (!userId) return false;
    
    const userRef = doc(db, 'users', userId);
    
    // Calculate next reset date (1 month from now)
    const nextResetDate = new Date();
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    
    // Update the token usage
    await updateDoc(userRef, {
      'tokenUsage.aiRequestsUsed': 0,
      'tokenUsage.aiRequestsLimit': aiRequestsLimit,
      'tokenUsage.lastResetDate': serverTimestamp(),
      'tokenUsage.nextResetDate': nextResetDate,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error resetting token usage:', error);
    return false;
  }
};

// Update token usage limit based on subscription plan
export const updateTokenLimit = async (userId: string, planId: string, billingCycle?: string): Promise<boolean> => {
  try {
    if (!userId || !planId) return false;
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await initializeTokenUsage(userId);
    }
    
    let aiRequestsLimit = 10; // Default free plan
    
    // Determine the token limit based on the plan and billing cycle
    if (planId === 'free') {
      aiRequestsLimit = SUBSCRIPTION_PLANS.free.aiRequestsLimit;
    } else if (planId === 'starter') {
      if (billingCycle === 'annual') {
        aiRequestsLimit = SUBSCRIPTION_PLANS.starter.annual.aiRequestsLimit; // 360 tokens for annual
        console.log(`Setting annual starter plan token limit: ${aiRequestsLimit}`);
      } else {
        aiRequestsLimit = SUBSCRIPTION_PLANS.starter.monthly.aiRequestsLimit; // 30 tokens for monthly
        console.log(`Setting monthly starter plan token limit: ${aiRequestsLimit}`);
      }
    } else if (planId === 'pro') {
      if (billingCycle === 'annual') {
        aiRequestsLimit = SUBSCRIPTION_PLANS.pro.annual.aiRequestsLimit; // 1800 tokens for annual
        console.log(`Setting annual pro plan token limit: ${aiRequestsLimit}`);
      } else {
        aiRequestsLimit = SUBSCRIPTION_PLANS.pro.monthly.aiRequestsLimit; // 150 tokens for monthly
        console.log(`Setting monthly pro plan token limit: ${aiRequestsLimit}`);
      }
    }
    
    // Calculate next reset date based on billing cycle
    const nextResetDate = new Date();
    if (billingCycle === 'annual') {
      nextResetDate.setFullYear(nextResetDate.getFullYear() + 1);
    } else {
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    }
    
    // Update the token usage - reset the used tokens to 0 when upgrading
    await updateDoc(userRef, {
      'tokenUsage.aiRequestsUsed': 0, // Reset to 0 when upgrading
      'tokenUsage.aiRequestsLimit': aiRequestsLimit,
      'tokenUsage.planId': planId,
      'tokenUsage.billingCycle': billingCycle || 'monthly', // Store billing cycle for reference
      'tokenUsage.lastResetDate': serverTimestamp(),
      'tokenUsage.nextResetDate': nextResetDate,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating token limit:', error);
    return false;
  }
}; 