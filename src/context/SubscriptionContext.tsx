import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getActiveSubscriptions, createCustomerPortalSession, createCheckoutSession } from '@/firebase/stripeService';
import { updateTokenLimit } from '@/firebase/tokenService';

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  isSubscriptionLoading: boolean;
  isSubscribed: boolean;
  isPro: boolean;
  isStarter: boolean;
  refreshSubscription: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  createSubscription: (planId: string, billingCycle: 'monthly' | 'annual') => Promise<{ success: boolean, error?: string }>;
}

export interface SubscriptionData {
  planId: string;
  billingCycle: string;
  price: number;
  status: string;
  stripeSubscriptionId: string;
  startDate: any;
  endDate?: any;
  canceledAt?: any;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isSubscriptionLoading: true,
  isSubscribed: false,
  isPro: false,
  isStarter: false,
  refreshSubscription: async () => {},
  openCustomerPortal: async () => {},
  createSubscription: async () => ({ success: false }),
});

export const useSubscription = () => useContext(SubscriptionContext);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  const { user } = useAuth();
  
  const fetchSubscriptionData = async () => {
    if (!user) {
      setSubscription(null);
      setIsSubscriptionLoading(false);
      return;
    }
    
    try {
      setIsSubscriptionLoading(true);
      const subscriptionData = await getActiveSubscriptions(user.uid);
      
      if (subscriptionData) {
        setSubscription(subscriptionData as SubscriptionData);
        
        // Update token limits based on subscription
        await updateTokenLimit(
          user.uid, 
          subscriptionData.planId || 'free',
          subscriptionData.billingCycle || 'monthly'
        );
        
        console.log(`Updated token limits for ${subscriptionData.planId} plan`);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setSubscription(null);
    } finally {
      setIsSubscriptionLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);
  
  // Open the Stripe Customer Portal
  const openCustomerPortal = async () => {
    if (!user) return;
    
    try {
      const portalUrl = await createCustomerPortalSession(user.uid);
      if (portalUrl) {
        window.location.href = portalUrl;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };
  
  // Create a new subscription
  const createSubscription = async (planId: string, billingCycle: 'monthly' | 'annual') => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { url, error } = await createCheckoutSession(user.uid, planId, billingCycle);
      
      if (error) {
        return { success: false, error };
      }
      
      if (url) {
        window.location.href = url;
        return { success: true };
      }
      
      return { success: false, error: 'Failed to create checkout session' };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };
  
  // Calculate subscription status
  const isSubscribed = !!subscription && subscription.status === 'active';
  const isPro = isSubscribed && subscription.planId === 'pro';
  const isStarter = isSubscribed && subscription.planId === 'starter';
  
  const value = {
    subscription,
    isSubscriptionLoading,
    isSubscribed,
    isPro,
    isStarter,
    refreshSubscription: fetchSubscriptionData,
    openCustomerPortal,
    createSubscription,
  };
  
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 