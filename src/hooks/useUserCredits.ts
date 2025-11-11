import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserCredits, canPerformAction, deductCredits, CREDIT_COSTS, MONTHLY_LIMITS } from '@/firebase/credits';

export interface UserCreditsData {
  credits: number;
  userType: 'credit' | 'subscribed';
  summariesThisMonth: number;
  lastSummaryReset: Date | null;
  loading: boolean;
}

export interface ActionPermission {
  allowed: boolean;
  message?: string;
  requiresCredits?: number;
  requiresUpgrade?: boolean;
}

export const useUserCredits = () => {
  const { user } = useAuth();
  const [creditsData, setCreditsData] = useState<UserCreditsData>({
    credits: 0,
    userType: 'credit',
    summariesThisMonth: 0,
    lastSummaryReset: null,
    loading: true,
  });

  const loadCreditsData = async () => {
    if (!user?.uid) {
      setCreditsData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const data = await getUserCredits(user.uid);
      setCreditsData({
        ...data,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading credits data:', error);
      setCreditsData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadCreditsData();
  }, [user?.uid]);

  const checkPermission = async (actionType: keyof typeof CREDIT_COSTS): Promise<ActionPermission> => {
    if (!user?.uid) {
      return { allowed: false, message: 'Please sign in to continue', requiresUpgrade: false };
    }

    const actionCost = CREDIT_COSTS[actionType];
    
    try {
      const result = await canPerformAction(user.uid, actionCost, actionType);
      
      if (!result.allowed) {
        return {
          allowed: false,
          message: result.message,
          requiresCredits: actionCost,
          requiresUpgrade: result.userType === 'credit',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking permission:', error);
      return { allowed: false, message: 'Error checking permissions' };
    }
  };

  const performAction = async (actionType: keyof typeof CREDIT_COSTS, actionName: string): Promise<{
    success: boolean;
    message?: string;
    remainingCredits?: number;
    requiresUpgrade?: boolean;
  }> => {
    if (!user?.uid) {
      return { success: false, message: 'Please sign in to continue' };
    }

    const actionCost = CREDIT_COSTS[actionType];

    try {
      // Check permission first
      const permission = await checkPermission(actionType);
      if (!permission.allowed) {
        return {
          success: false,
          message: permission.message,
          requiresUpgrade: permission.requiresUpgrade || permission.requiresCredits !== undefined,
        };
      }

      const result = await deductCredits(user.uid, actionCost, actionName, actionType);
      
      if (result.success) {
        // Refresh credits data after successful action
        await loadCreditsData();
      } else {
        // If deduction failed, it's likely a credit issue
        return {
          success: false,
          message: result.message,
          requiresUpgrade: true,
        };
      }

      return {
        success: result.success,
        message: result.message,
        remainingCredits: result.remainingCredits,
      };
    } catch (error) {
      console.error('Error performing action:', error);
      return { success: false, message: 'Error performing action' };
    }
  };

  const canUseAISummary = (): ActionPermission => {
    if (creditsData.userType === 'subscribed') {
      // Subscribed users have up to 20 summaries per month
      if (creditsData.summariesThisMonth >= 20) {
        return {
          allowed: false,
          message: 'You\'ve reached your monthly limit of 20 AI summaries',
          requiresUpgrade: false,
        };
      }
      return { allowed: true };
    }

    // Credit users: check monthly limit first
    if (creditsData.summariesThisMonth >= MONTHLY_LIMITS.AI_TOTAL_SUMMARY) {
      return {
        allowed: false,
        message: `You've used all ${MONTHLY_LIMITS.AI_TOTAL_SUMMARY} AI summaries this month`,
        requiresUpgrade: true,
      };
    }

    // Then check credits
    if (creditsData.credits < CREDIT_COSTS.AI_TOTAL_SUMMARY) {
      return {
        allowed: false,
        message: 'Not enough credits for AI summary',
        requiresCredits: CREDIT_COSTS.AI_TOTAL_SUMMARY,
        requiresUpgrade: true,
      };
    }

    return { allowed: true };
  };

  const getSummaryUsageText = (): string => {
    if (creditsData.userType === 'subscribed') {
      return `AI Summaries this month: ${creditsData.summariesThisMonth} of 20 used`;
    }
    return `AI Summaries this month: ${creditsData.summariesThisMonth} of ${MONTHLY_LIMITS.AI_TOTAL_SUMMARY} used`;
  };

  const refreshCredits = loadCreditsData;

  return {
    ...creditsData,
    checkPermission,
    performAction,
    canUseAISummary,
    getSummaryUsageText,
    refreshCredits,
    CREDIT_COSTS,
    MONTHLY_LIMITS,
  };
};
