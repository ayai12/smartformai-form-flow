import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useAuth } from './AuthContext';

// Define API URL based on environment
const API_URL = import.meta.env.PROD 
  ? 'https://us-central1-smartformai-51e03.cloudfunctions.net' // Replace with your actual deployed URL
  : 'http://localhost:5000';

interface StripeContextType {
  stripe: Stripe | null;
  publishableKey: string | null;
  loading: boolean;
  createCheckoutSession: (planId: string, billingCycle: 'monthly' | 'annual') => Promise<string | null>;
  getCurrentSubscription: () => Promise<any>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const useStripe = (): StripeContextType => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPublishableKey = async () => {
      try {
        const response = await fetch(`${API_URL}/config`);
        const { publishableKey } = await response.json();
        setPublishableKey(publishableKey);

        if (publishableKey) {
          const stripePromise = loadStripe(publishableKey);
          const stripeInstance = await stripePromise;
          setStripe(stripeInstance);
        }
      } catch (error) {
        console.error('Error loading Stripe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishableKey();
  }, []);

  const createCheckoutSession = async (planId: string, billingCycle: 'monthly' | 'annual'): Promise<string | null> => {
    if (!user) {
      throw new Error('User must be logged in to create a checkout session');
    }

    try {
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle,
          userId: user.uid,
        }),
      });

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  };

  const getCurrentSubscription = async (): Promise<any> => {
    if (!user) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/subscription/${user.uid}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.subscription;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  };

  const value = {
    stripe,
    publishableKey,
    loading,
    createCheckoutSession,
    getCurrentSubscription,
  };

  return (
    <StripeContext.Provider value={value}>
      {publishableKey ? (
        <Elements stripe={loadStripe(publishableKey)}>
          {children}
        </Elements>
      ) : (
        children
      )}
    </StripeContext.Provider>
  );
};

export default StripeProvider; 