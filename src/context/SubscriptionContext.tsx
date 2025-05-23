import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  isSubscriptionLoading: boolean;
  isSubscribed: boolean;
  isPro: boolean;
  isStarter: boolean;
  refreshSubscription: () => Promise<void>;
}

export interface SubscriptionData {
  planId: string;
  billingCycle: string;
  price: number;
  status: string;
  stripeSubscriptionId: string;
  startDate: {
    toDate: () => Date;
  };
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isSubscriptionLoading: true,
  isSubscribed: false,
  isPro: false,
  isStarter: false,
  refreshSubscription: async () => {},
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
      const subscriptionRef = doc(db, 'subscriptions', user.uid);
      const subscriptionDoc = await getDoc(subscriptionRef);
      
      if (subscriptionDoc.exists()) {
        const data = subscriptionDoc.data() as SubscriptionData;
        setSubscription(data);
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
  };
  
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 