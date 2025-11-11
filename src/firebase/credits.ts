import { getFirestore, doc, getDoc, updateDoc, increment, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth } from './firebase';

/**
 * Credit costs for different actions - Updated for SmartFormAI requirements
 */
export const CREDIT_COSTS = {
  // AI Agent costs (original values)
  GENERATE_AGENT: 8,
  REBUILD_AGENT: 6,
  AI_TOTAL_SUMMARY: 10,
  
  // Legacy costs (kept for compatibility)
  TRAIN_AGENT: 8,  // Matches GENERATE_AGENT
  REGENERATE_QUESTIONS: 6,  // Matches REBUILD_AGENT
  ANALYZE_RESPONSES: 1,
  CLONE_AGENT: 2,
  EXPORT_RESULTS: 1,
  PUBLISH_AGENT: 1,
} as const;

/**
 * Default credits for new users
 */
export const DEFAULT_NEW_USER_CREDITS = 8;

/**
 * Monthly limits for credit users
 */
export const MONTHLY_LIMITS = {
  AI_TOTAL_SUMMARY: 3, // Credit users can use AI Total Summary 3 times per month
} as const;

/**
 * Get user's current credit balance, plan, and monthly usage
 */
export const getUserCredits = async (userId: string): Promise<{ 
  credits: number; 
  userType: 'credit' | 'subscribed';
  summariesThisMonth: number;
  lastSummaryReset: Date | null;
}> => {
  const db = getFirestore();
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();
  
  // Map legacy 'plan' field to new 'userType'
  let userType: 'credit' | 'subscribed' = 'credit';
  if (userData?.plan === 'pro' || userData?.userType === 'subscribed') {
    userType = 'subscribed';
  }
  
  return {
    credits: userData?.credits ?? 0,
    userType,
    summariesThisMonth: userData?.summariesThisMonth ?? 0,
    lastSummaryReset: userData?.lastSummaryReset?.toDate() ?? null,
  };
};

/**
 * Check if user can perform an action
 * Subscribed users bypass credit checks
 */
export const canPerformAction = async (
  userId: string,
  actionCost: number,
  actionType?: string
): Promise<{ 
  allowed: boolean; 
  credits: number; 
  userType: 'credit' | 'subscribed';
  message?: string;
}> => {
  const { credits, userType, summariesThisMonth } = await getUserCredits(userId);
  
  // Subscribed users bypass all credit checks
  if (userType === 'subscribed') {
    return { 
      allowed: true, 
      credits, 
      userType,
    };
  }
  
  // For AI Total Summary, check monthly limit
  if (actionType === 'AI_TOTAL_SUMMARY') {
    if (summariesThisMonth >= MONTHLY_LIMITS.AI_TOTAL_SUMMARY) {
      return {
        allowed: false,
        credits,
        userType,
        message: `You've reached your monthly limit of ${MONTHLY_LIMITS.AI_TOTAL_SUMMARY} AI summaries. Upgrade to Pro for unlimited access.`
      };
    }
  }
  
  // Check credits
  if (credits >= actionCost) {
    return {
      allowed: true,
      credits,
      userType,
    };
  }
  
  // No credits
  return {
    allowed: false,
    credits,
    userType,
    message: "Not enough credits. Buy more to continue or upgrade to Pro for unlimited access."
  };
};

/**
 * Deduct credits for an action and record in history
 * Subscribed users bypass credit deduction but still track usage
 */
export const deductCredits = async (
  userId: string,
  actionCost: number,
  actionName: string,
  actionType?: string
): Promise<{ success: boolean; remainingCredits: number; message?: string }> => {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    const userType = userData?.userType === 'subscribed' || userData?.plan === 'pro' ? 'subscribed' : 'credit';
    const currentCredits = userData?.credits ?? 0;
    
    // Subscribed users bypass credit deduction
    if (userType === 'subscribed') {
      // Still track usage for AI Total Summary
      if (actionType === 'AI_TOTAL_SUMMARY') {
        await updateMonthlyUsage(userId, 'AI_TOTAL_SUMMARY');
      }
      
      return {
        success: true,
        remainingCredits: currentCredits,
      };
    }
    
    // For credit users, check monthly limits first
    if (actionType === 'AI_TOTAL_SUMMARY') {
      const summariesThisMonth = userData?.summariesThisMonth ?? 0;
      if (summariesThisMonth >= MONTHLY_LIMITS.AI_TOTAL_SUMMARY) {
        return {
          success: false,
          remainingCredits: currentCredits,
          message: `Monthly limit reached. You can use ${MONTHLY_LIMITS.AI_TOTAL_SUMMARY} AI summaries per month.`,
        };
      }
    }
    
    if (currentCredits < actionCost) {
      return {
        success: false,
        remainingCredits: currentCredits,
        message: `Insufficient credits. You need ${actionCost} credits but only have ${currentCredits}.`,
      };
    }
    
    const userRef = doc(db, 'users', userId);
    const updateData: any = {
      credits: increment(-actionCost),
      updatedAt: serverTimestamp(),
    };
    
    // Track monthly usage for AI Total Summary
    if (actionType === 'AI_TOTAL_SUMMARY') {
      updateData.summariesThisMonth = increment(1);
      // Reset counter if it's a new month
      const lastReset = userData?.lastSummaryReset?.toDate();
      const now = new Date();
      if (!lastReset || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        updateData.summariesThisMonth = 1;
        updateData.lastSummaryReset = serverTimestamp();
      }
    }
    
    // Deduct credits atomically
    await updateDoc(userRef, updateData);
    
    // Record in credit history
    try {
      await addDoc(collection(db, 'credit_history'), {
        userId,
        action: actionName,
        creditsUsed: actionCost,
        creditsBefore: currentCredits,
        creditsAfter: currentCredits - actionCost,
        timestamp: serverTimestamp(),
      });
    } catch (historyError) {
      console.warn('Failed to record credit history:', historyError);
      // Don't fail the entire operation if history recording fails
    }
    
    const remainingCredits = currentCredits - actionCost;
    console.log(`✅ Credits deducted. New balance: ${remainingCredits}`);
    
    return {
      success: true,
      remainingCredits,
    };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return {
      success: false,
      remainingCredits: 0,
      message: 'Failed to deduct credits. Please try again.',
    };
  }
};

/**
 * Record credit addition (for purchases)
 */
export const addCredits = async (
  userId: string,
  creditsAmount: number,
  source: string
): Promise<{ success: boolean; newBalance: number; message?: string }> => {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    const currentCredits = userData?.credits ?? 0;
    const userRef = doc(db, 'users', userId);
    
    // Add credits atomically
    await updateDoc(userRef, {
      credits: increment(creditsAmount),
      updatedAt: serverTimestamp(),
    });
    
    // Record in credit history
    try {
      await addDoc(collection(db, 'credit_history'), {
        userId,
        action: `Credit Purchase: ${source}`,
        creditsUsed: -creditsAmount, // Negative for additions
        creditsBefore: currentCredits,
        creditsAfter: currentCredits + creditsAmount,
        timestamp: serverTimestamp(),
      });
    } catch (historyError) {
      console.warn('Failed to record credit history:', historyError);
    }
    
    const newBalance = currentCredits + creditsAmount;
    console.log(`✅ Credits added. New balance: ${newBalance}`);
    
    return {
      success: true,
      newBalance,
    };
  } catch (error) {
    console.error('Error adding credits:', error);
    return {
      success: false,
      newBalance: 0,
      message: 'Failed to add credits. Please try again.',
    };
  }
};

/**
 * Get credit usage history for a user
 */
export const getCreditHistory = async (
  userId: string,
  limitCount: number = 20
): Promise<Array<{
  id: string;
  action: string;
  creditsUsed: number;
  creditsBefore: number;
  creditsAfter: number;
  timestamp: Date;
}>> => {
  try {
    const db = getFirestore();
    const historyCollection = collection(db, 'credit_history');
    
    // Query without orderBy to avoid requiring a composite index
    // We'll sort in JavaScript instead
    const q = query(
      historyCollection,
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        action: data.action || 'Unknown',
        creditsUsed: data.creditsUsed || 0,
        creditsBefore: data.creditsBefore || 0,
        creditsAfter: data.creditsAfter || 0,
        timestamp: data.timestamp?.toDate() || new Date(),
      };
    });
    
    // Sort by timestamp descending (most recent first) in JavaScript
    history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Limit after sorting
    return history.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching credit history:', error);
    return [];
  }
};

/**
 * Update monthly usage for subscribed users
 */
export const updateMonthlyUsage = async (
  userId: string,
  actionType: string
): Promise<void> => {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    
    if (actionType === 'AI_TOTAL_SUMMARY') {
      // Reset counter if it's a new month
      const lastReset = userData?.lastSummaryReset?.toDate();
      const now = new Date();
      if (!lastReset || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        updateData.summariesThisMonth = 1;
        updateData.lastSummaryReset = serverTimestamp();
      } else {
        updateData.summariesThisMonth = increment(1);
      }
    }
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating monthly usage:', error);
  }
};
