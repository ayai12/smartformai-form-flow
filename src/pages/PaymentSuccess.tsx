import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

interface SubscriptionData {
  planId: string;
  billingCycle: string;
  price: number;
  status: string;
  startDate: any;
}

interface StripeSessionData {
  sessionId: string;
  metadata: {
    userId: string;
    planId: string;
    billingCycle: string;
    price: string;
  };
  lineItems: any[];
  amount_total: number;
  currency: string;
}

const PaymentSuccess: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [sessionData, setSessionData] = useState<StripeSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/signin', { replace: true });
      return;
    }
    
    // Clear any leftover subscription data
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('billingCycle');
    localStorage.removeItem('subscriptionToken');
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!sessionId || !user) {
          setError('Missing session ID or user. Please contact support.');
          setLoading(false);
          return;
        }
        
        // STEP 1: Get the actual session data directly from Stripe
        console.log(`Fetching session data for ${sessionId}`);
        const sessionResponse = await axios.get(`/get-session/${sessionId}`);
        const stripeSessionData = sessionResponse.data;
        console.log('Stripe session data:', stripeSessionData);
        
        // Set the session data for display
        setSessionData(stripeSessionData);
        
        // Extract the important details
        const planId = stripeSessionData.metadata?.planId || 'pro';
        const billingCycle = stripeSessionData.metadata?.billingCycle || 'annual';
        const price = parseFloat(stripeSessionData.metadata?.price || '0');
        
        console.log(`Session details - Plan: ${planId}, Billing: ${billingCycle}, Price: ${price}`);
        
        // STEP 2: Save the subscription data to Firestore
        try {
          const response = await axios.post('/save-subscription', {
            userId: user.uid,
            planId: planId,
            billingCycle: billingCycle,
            sessionId: sessionId,
            price: price
          });
          
          console.log('Subscription saved via direct endpoint:', response.data);
          
          // Wait a moment to ensure Firestore has updated
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error('Error saving subscription via direct endpoint:', err);
        }
        
        // STEP 3: Get the saved subscription data from Firestore
        const subscriptionRef = doc(db, 'subscriptions', user.uid);
        console.log(`Fetching subscription data for user ${user.uid}`);
        const subscriptionDoc = await getDoc(subscriptionRef);
        
        if (subscriptionDoc.exists()) {
          const data = subscriptionDoc.data() as SubscriptionData;
          console.log('Subscription data from Firestore:', data);
          setSubscription(data);
        } else {
          // If still no subscription data, use a fallback based on the Stripe session
          console.error('Subscription data not found in Firestore, using session data as fallback');
          
          // Create a fallback subscription object for display purposes
          const fallback = {
            planId: planId,
            billingCycle: billingCycle,
            price: price,
            status: 'active',
            startDate: new Date(),
          };
          
          console.log('Using fallback subscription data:', fallback);
          setSubscription(fallback as any);
          
          // Last attempt to save data in Firestore from frontend
          try {
            await setDoc(subscriptionRef, {
              ...fallback,
              stripeSubscriptionId: sessionId,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log('Last resort: saved subscription data from frontend');
          } catch (e) {
            console.error('Failed final attempt to save subscription data:', e);
          }
        }
      } catch (err) {
        console.error('Error in payment success flow:', err);
        setError('Failed to load subscription details. Please contact support.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, navigate, sessionId]);
  
  const handleDashboardClick = () => {
    navigate('/dashboard');
  };
  
  // Helper function to format plan name
  const formatPlanName = (planId: string) => {
    if (planId === 'starter') return 'Starter Plan';
    if (planId === 'pro') return 'Pro Plan';
    return planId;
  };
  
  // Helper function to format date
  const formatDate = (date: any) => {
    try {
      // Handle Firestore timestamp or JavaScript Date
      const jsDate = typeof date === 'object' && 'toDate' in date ? date.toDate() : new Date(date);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(jsDate);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number, currency: string = 'usd') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(amount);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#7B61FF] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading subscription details...</h2>
          <p className="text-gray-600">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-center">Something went wrong</h2>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <Button 
            className="w-full bg-[#7B61FF] hover:bg-[#6B51EF]"
            onClick={handleDashboardClick}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  // Use session data if available, otherwise fall back to subscription data
  const displayData = {
    planId: subscription?.planId || sessionData?.metadata?.planId || 'pro',
    billingCycle: subscription?.billingCycle || sessionData?.metadata?.billingCycle || 'annual',
    price: subscription?.price || parseFloat(sessionData?.metadata?.price || '0') || 290,
    status: subscription?.status || 'active',
    startDate: subscription?.startDate || new Date(),
    currency: sessionData?.currency || 'usd'
  };
  
  // Debug output
  console.log("Display data:", displayData);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-center">Payment Successful!</h2>
        <p className="text-gray-600 mb-8 text-center">
          Thank you for your subscription. Your account has been upgraded successfully.
        </p>
        
        <div className="border border-gray-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-lg mb-4">Subscription Details</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium">{formatPlanName(displayData.planId)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Billing Cycle:</span>
              <span className="font-medium">
                {displayData.billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Price:</span>
              <span className="font-medium">
                {formatCurrency(displayData.price, displayData.currency)}
                {displayData.billingCycle === 'monthly' ? '/month' : '/year'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span className="font-medium">
                {formatDate(displayData.startDate)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-600 capitalize">
                {displayData.status}
              </span>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full bg-[#7B61FF] hover:bg-[#6B51EF] flex items-center justify-center gap-2"
          onClick={handleDashboardClick}
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess; 