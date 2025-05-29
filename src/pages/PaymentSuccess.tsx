import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useTokenUsage } from '@/context/TokenUsageContext';
import { updateTokenLimit } from '@/firebase/tokenService';
import { Logo } from '@/logo';
import axios from 'axios';

interface SubscriptionData {
  planId: string;
  billingCycle: string;
  price: number;
  status: string;
  startDate: any;
}

// Get base URL for API requests
const getBaseUrl = () => {
  // In development, the proxy will handle the requests
  if (import.meta.env.DEV) {
    return '';
  }
  
  // In production, use the deployed backend URL
  return 'https://smartformai-api.onrender.com';
};

const PaymentSuccess: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();
  const { refreshTokenUsage } = useTokenUsage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/signin', { replace: true });
      return;
    }
    
    // Check if this session was already processed
    const processedSessions = JSON.parse(localStorage.getItem('processedSessions') || '{}');
    if (sessionId && processedSessions[sessionId]) {
      console.log(`Session ${sessionId} was already processed, loading data`);
      
      // If we already processed this session, just load the saved data
      if (processedSessions[sessionId].subscription) {
        setSubscription(processedSessions[sessionId].subscription);
        setLoading(false);
        return;
      }
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
        
        console.log(`Processing successful payment for session: ${sessionId}`);
        
        // Get session details from the backend
        const response = await axios.get(`${getBaseUrl()}/get-session/${sessionId}`);
        
        if (!response.data) {
          setError('Could not retrieve session data. Please contact support.');
          setLoading(false);
          return;
        }
        
        console.log('Session data retrieved:', response.data);
        
        // Extract metadata from the session
        const { metadata } = response.data;
        
        if (!metadata || !metadata.planId) {
          setError('Invalid session data. Please contact support.');
          setLoading(false);
          return;
        }
        
        // Save subscription data directly
        try {
          await axios.post(`${getBaseUrl()}/save-subscription`, {
            userId: user.uid,
            planId: metadata.planId,
            billingCycle: metadata.billingCycle || 'monthly',
            sessionId: sessionId,
            price: metadata.price || 0
          });
          
          console.log('Subscription data saved successfully');
          
          // Create subscription object for display
          const subscriptionData: SubscriptionData = {
            planId: metadata.planId,
            billingCycle: metadata.billingCycle || 'monthly',
            price: Number(metadata.price || 0),
            status: 'active',
            startDate: new Date()
          };
          
          setSubscription(subscriptionData);
          
          // Mark this session as processed
          const updatedProcessedSessions = {
            ...processedSessions,
            [sessionId]: {
              processed: true,
              timestamp: new Date().toISOString(),
              subscription: subscriptionData
            }
          };
          localStorage.setItem('processedSessions', JSON.stringify(updatedProcessedSessions));
          
          // Update token limits based on subscription
          await updateTokenLimit(user.uid, metadata.planId, metadata.billingCycle || 'monthly');
          console.log(`Updated token limits for user ${user.uid} to plan ${metadata.planId} (${metadata.billingCycle || 'monthly'})`);
          console.log(`AI Requests Limit should now be: ${metadata.planId === 'starter' ? 30 : metadata.planId === 'pro' ? 150 : 10}`);
          
          // Refresh contexts
          await refreshSubscription();
          await refreshTokenUsage();
          console.log('Refreshed subscription and token usage contexts');
        } catch (saveError) {
          console.error('Error saving subscription data:', saveError);
          setError('Failed to save subscription details. Please contact support.');
        }
      } catch (err) {
        console.error('Error in payment success flow:', err);
        setError('Failed to load subscription details. Please contact support.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    // We need sessionId in the dependency array to trigger the effect when it changes
    // but we're preventing re-processing with our localStorage check
  }, [user, navigate, sessionId, refreshSubscription, refreshTokenUsage]);
  
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
          <div className="flex justify-center mb-4">
            <Logo size={40} />
          </div>
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
          <div className="flex justify-center mb-4">
            <Logo size={40} />
          </div>
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
  
  if (!subscription) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <div className="flex justify-center mb-4">
            <Logo size={40} />
          </div>
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
            <span className="text-yellow-500 text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-center">Payment Processing</h2>
          <p className="text-gray-600 mb-6 text-center">
            Your payment is being processed. It may take a few moments to update your subscription.
          </p>
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <div className="flex justify-center mb-4">
          <Logo size={40} />
        </div>
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-center">Payment Successful!</h2>
        <p className="text-gray-600 mb-8 text-center">
          Thank you for your subscription. Your account has been upgraded successfully.
        </p>
        
        <div className="space-y-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Subscription Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{formatPlanName(subscription.planId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing:</span>
                <span className="font-medium">{subscription.billingCycle === 'annual' ? 'Annual' : 'Monthly'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium">{formatCurrency(subscription.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">{formatDate(subscription.startDate)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button 
            className="bg-[#7B61FF] hover:bg-[#6B51EF]"
            onClick={handleDashboardClick}
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/profile')}
          >
            View Account Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 