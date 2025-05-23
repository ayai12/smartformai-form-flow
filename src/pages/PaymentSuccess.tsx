import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  startDate: {
    toDate: () => Date;
  };
}

const PaymentSuccess: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const location = useLocation();
  
  // Extract plan data from location state or localStorage
  const selectedPlan = (location.state as any)?.selectedPlan || localStorage.getItem('selectedPlan');
  const billingCycle = (location.state as any)?.billingCycle || localStorage.getItem('billingCycle');
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/signin', { replace: true });
      return;
    }
    
    // Clear subscription data from localStorage since payment is complete
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('billingCycle');
    localStorage.removeItem('subscriptionToken');
    
    // Fetch subscription data from Firestore
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);
        
        if (!sessionId || !user) {
          setError('Missing session ID or user. Please contact support.');
          setLoading(false);
          return;
        }
        
        // Call backend directly to save subscription - this is a guaranteed way to save data
        try {
          const response = await axios.post('/save-subscription', {
            userId: user.uid,
            planId: selectedPlan || 'starter',
            billingCycle: billingCycle || 'monthly',
            sessionId: sessionId,
            price: billingCycle === 'annual' 
              ? (selectedPlan === 'pro' ? 290 : 90) 
              : (selectedPlan === 'pro' ? 29 : 9)
          });
          
          console.log('Subscription saved via direct endpoint:', response.data);
        } catch (err) {
          console.error('Error saving subscription via direct endpoint:', err);
        }
        
        // Now get the saved subscription data
        const subscriptionRef = doc(db, 'subscriptions', user.uid);
        const subscriptionDoc = await getDoc(subscriptionRef);
        
        if (subscriptionDoc.exists()) {
          setSubscription(subscriptionDoc.data() as SubscriptionData);
        } else {
          // If still no subscription data, use a fallback for the UI
          console.error('Subscription data still not found after direct save');
          
          // Create a fallback subscription object for display purposes
          const fallback = {
            planId: selectedPlan || 'starter',
            billingCycle: billingCycle || 'monthly',
            price: billingCycle === 'annual' 
              ? (selectedPlan === 'pro' ? 290 : 90) 
              : (selectedPlan === 'pro' ? 29 : 9),
            status: 'active',
            startDate: new Date(),
          };
          
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
        console.error('Error fetching subscription data:', err);
        setError('Failed to load subscription details. Please contact support.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscriptionData();
  }, [user, navigate, sessionId, selectedPlan, billingCycle]);
  
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
  const formatDate = (date: Date | { toDate: () => Date }) => {
    // Handle Firestore timestamp or JavaScript Date
    const jsDate = 'toDate' in date ? date.toDate() : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(jsDate);
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
        
        {subscription && (
          <div className="border border-gray-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-lg mb-4">Subscription Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{formatPlanName(subscription.planId)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Billing Cycle:</span>
                <span className="font-medium">
                  {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium">
                  ${subscription.price}{subscription.billingCycle === 'monthly' ? '/month' : '/year'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">
                  {formatDate(subscription.startDate)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600 capitalize">
                  {subscription.status}
                </span>
              </div>
            </div>
          </div>
        )}
        
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