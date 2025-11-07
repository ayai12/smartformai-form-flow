import { getFirestore, doc, getDoc, updateDoc, increment, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth } from './firebase';

/**
 * Credit costs for different actions
 */
export const CREDIT_COSTS = {
  TRAIN_AGENT: 3,
  REGENERATE_QUESTIONS: 1,
  ANALYZE_RESPONSES: 1,
  CLONE_AGENT: 2,
  EXPORT_RESULTS: 1,
  PUBLISH_AGENT: 1, // Cost to publish/share an agent
} as const;

/**
 * Get user's current credit balance and plan
 */
export const getUserCredits = async (userId: string): Promise<{ 
  credits: number; 
  plan: string;
}> => {
  const db = getFirestore();
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();
  
  return {
    credits: userData?.credits ?? 0,
    plan: userData?.plan ?? 'free',
  };
};

/**
 * Check if user can perform an action
 * Pro users bypass all checks
 */
export const canPerformAction = async (
  userId: string,
  actionCost: number
): Promise<{ 
  allowed: boolean; 
  credits: number; 
  plan: string;
  message?: string;
}> => {
  const { credits, plan } = await getUserCredits(userId);
  
  // Pro users bypass all checks
  if (plan === 'pro') {
    return { 
      allowed: true, 
      credits, 
      plan,
    };
  }
  
  // Check credits
  if (credits >= actionCost) {
    return {
      allowed: true,
      credits,
      plan,
    };
  }
  
  // No credits
  return {
    allowed: false,
    credits,
    plan,
    message: "Insufficient credits. Buy a credit pack (€9.99 for 40 credits) or upgrade to Pro (€14.99/mo) for unlimited access."
  };
};

/**
 * Deduct credits for an action and record in history
 * Pro users bypass credit deduction
 */
export const deductCredits = async (
  userId: string,
  actionCost: number,
  actionName: string
): Promise<{ success: boolean; remainingCredits: number; message?: string }> => {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    const plan = userData?.plan ?? 'free';
    
    // Pro users bypass credit deduction
    if (plan === 'pro') {
      return {
        success: true,
        remainingCredits: userData?.credits ?? 0,
      };
    }
    
    const currentCredits = userData?.credits ?? 0;
    
    if (currentCredits < actionCost) {
      return {
        success: false,
        remainingCredits: currentCredits,
        message: `Insufficient credits. You need ${actionCost} credits but only have ${currentCredits}.`,
      };
    }
    
    const userRef = doc(db, 'users', userId);
    
    // Deduct credits atomically
    await updateDoc(userRef, {
      credits: increment(-actionCost),
      updatedAt: serverTimestamp(),
    });
    
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

