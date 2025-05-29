import { doc, collection, addDoc, onSnapshot, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { SUBSCRIPTION_PLANS } from './stripeConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';
import axios from 'axios';

// Get the base URL for API requests
const getBaseUrl = () => {
  // In development, the proxy will handle the requests
  if (import.meta.env.DEV) {
    return '';
  }
  
  // In production, use the deployed backend URL
  // Replace with your actual production API URL
  return 'https://smartformai-api.onrender.com';
};

// Create a checkout session for Stripe
export const createCheckoutSession = async (
  userId: string, 
  planId: string, 
  billingCycle: 'monthly' | 'annual'
): Promise<{ url: string | null, error: string | null }> => {
  try {
    if (!userId) {
      return { url: null, error: 'User ID is required' };
    }

    console.log(`Creating checkout session for user ${userId}, plan ${planId}, billing ${billingCycle}`);
    
    // Make a direct API call to our backend server endpoint
    const response = await fetch(`${getBaseUrl()}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        planId,
        billingCycle
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error creating checkout session:', errorData);
      return { url: null, error: errorData.error || 'Failed to create checkout session' };
    }
    
    const data = await response.json();
    
    if (data && data.url) {
      return { url: data.url, error: null };
    } else {
      console.error('Invalid response from server:', data);
      return { url: null, error: 'Invalid response from server' };
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { url: null, error: 'Failed to create checkout session' };
  }
};

// Get active subscriptions for the current user
export const getActiveSubscriptions = async (userId: string) => {
  try {
    console.log(`Checking subscription for user: ${userId}`);
    
    if (!userId) {
      console.error('No user ID provided for getActiveSubscriptions');
      return null;
    }
    
    // Try to get subscription from the subscriptions collection directly
    // This matches our security rule: match /subscriptions/{userId}
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (subscriptionDoc.exists()) {
      const data = subscriptionDoc.data();
      console.log('Found subscription in subscriptions collection:', data);
      return data;
    }
    
    // If no direct subscription found, check the user document for free plan
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().subscription) {
      const data = userDoc.data().subscription;
      console.log('Found subscription in user document:', data);
      return data;
    }
    
    console.log('No subscription found for user');
    return null;
  } catch (error) {
    console.error('Error getting active subscriptions:', error);
    return null;
  }
};

// Create a customer portal session for managing subscriptions
export const createCustomerPortalSession = async (userId: string): Promise<string | null> => {
  try {
    if (!userId) {
      console.error('No user ID provided for createCustomerPortalSession');
      return null;
    }
    
    // Make a direct API call to our backend server endpoint
    const response = await fetch(`${getBaseUrl()}/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        returnUrl: window.location.origin + '/profile'
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error creating portal session:', errorData);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.url) {
      return data.url;
    } else {
      console.error('Invalid response from server:', data);
      return null;
    }
  } catch (error) {
    console.error('Error creating portal session:', error);
    return null;
  }
};

// Get all products and prices from Stripe
export const getStripePrices = async () => {
  try {
    // Make a direct API call to our backend server endpoint
    const response = await fetch(`${getBaseUrl()}/get-stripe-prices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error('Server error fetching stripe prices:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (data && Array.isArray(data.products)) {
      return data.products;
    } else {
      console.error('Invalid response from server:', data);
      return [];
    }
  } catch (error) {
    console.error('Error getting Stripe products and prices:', error);
    return [];
  }
}; 