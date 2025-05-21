import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useAuth } from './AuthContext';
import { getUserSubscription, updateUserSubscription, UserSubscription } from '@/firebase/userSubscription';

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
  createCustomerPortal: (returnUrl: string) => Promise<string | null>;
  cancelSubscription: (subscriptionId: string) => Promise<boolean>;
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
      // First try to get subscription from Firestore
      const firestoreSubscription = await getUserSubscription(user.uid);
      
      if (firestoreSubscription && firestoreSubscription.status === 'active') {
        console.log('Found active subscription in Firestore:', firestoreSubscription);
        return firestoreSubscription;
      }
      
      // If not found in Firestore or not active, fetch from the API
      console.log('Fetching subscription from API...');
      const response = await fetch(`${API_URL}/subscription/${user.uid}`);
      if (!response.ok) {
        console.log('API response not OK:', response.status);
        // If API fails but we have a Firestore subscription (even if not active), return it
        if (firestoreSubscription) {
          return firestoreSubscription;
        }
        return null;
      }
      
      const data = await response.json();
      console.log('API subscription data:', data.subscription);
      
      // Update Firestore with the latest subscription data
      if (data.subscription) {
        await updateUserSubscription(user.uid, data.subscription);
        return data.subscription;
      }
      
      // If API returns no subscription but we have a Firestore subscription, return it
      if (firestoreSubscription) {
        return firestoreSubscription;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // If there's an error, try to return the Firestore subscription as a fallback
      try {
        const fallbackSubscription = await getUserSubscription(user.uid);
        return fallbackSubscription;
      } catch (fallbackError) {
        console.error('Error fetching fallback subscription:', fallbackError);
        return null;
      }
    }
  };

  const createCustomerPortal = async (returnUrl: string): Promise<string | null> => {
    if (!user) {
      throw new Error('User must be logged in to access customer portal');
    }

    try {
      const response = await fetch(`${API_URL}/create-customer-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          returnUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer portal session');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      return null;
    }
  };

  const cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('User must be logged in to cancel subscription');
    }

    try {
      const response = await fetch(`${API_URL}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const { success } = await response.json();
      
      // Update subscription status in Firestore
      if (success) {
        await updateUserSubscription(user.uid, {
          cancelAtPeriodEnd: true,
          updatedAt: new Date()
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  };

  const value = {
    stripe,
    publishableKey,
    loading,
    createCheckoutSession,
    getCurrentSubscription,
    createCustomerPortal,
    cancelSubscription,
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