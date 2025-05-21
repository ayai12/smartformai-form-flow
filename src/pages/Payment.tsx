import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useStripe } from '@/context/StripeContext';
import { useAlert } from '@/components/AlertProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Loader2 } from 'lucide-react';

const Payment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { createCheckoutSession } = useStripe();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const checkoutInitiated = useRef(false);
  
  useEffect(() => {
    // Prevent multiple checkout attempts
    if (checkoutInitiated.current) {
      return;
    }
    
    // Redirect to sign in if not authenticated
    if (!user) {
      navigate('/signin', { state: { returnTo: '/pricing' } });
      return;
    }
    
    // Get plan details from location state, URL parameters, or localStorage
    const searchParams = new URLSearchParams(location.search);
    const planFromUrl = searchParams.get('plan');
    const planFromState = location.state?.selectedPlan;
    const planFromStorage = localStorage.getItem('selectedPlan');
    const billingCycleFromUrl = searchParams.get('billing');
    const billingCycleFromState = location.state?.billingCycle;
    const billingCycleFromStorage = localStorage.getItem('billingCycle');
    
    const selectedPlan = planFromUrl || planFromState || planFromStorage;
    const billingCycle = (billingCycleFromUrl || billingCycleFromState || billingCycleFromStorage || 'annual') as 'monthly' | 'annual';
    
    // Clear stored plan info
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('billingCycle');
    
    if (!selectedPlan) {
      // No plan selected, redirect to pricing page
      navigate('/pricing');
      return;
    }
    
    const initiateCheckout = async () => {
      // Set flag to prevent multiple checkout attempts
      checkoutInitiated.current = true;
      
      try {
        setLoading(true);
        const checkoutUrl = await createCheckoutSession(selectedPlan, billingCycle);
        
        if (checkoutUrl) {
          // Redirect to Stripe checkout
          window.location.href = checkoutUrl;
        } else {
          showAlert('Error', 'Failed to create checkout session', 'error');
          // Redirect back to pricing page after error
          navigate('/pricing');
        }
      } catch (error) {
        console.error('Error creating checkout session:', error);
        showAlert('Error', 'An error occurred while processing your request', 'error');
        navigate('/pricing');
      } finally {
        setLoading(false);
      }
    };
    
    initiateCheckout();
  }, [user, navigate, location, createCheckoutSession, showAlert]);
  
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-medium mb-2">Preparing your checkout...</h2>
        <p className="text-gray-600">Please wait while we redirect you to our secure payment processor.</p>
      </div>
    </DashboardLayout>
  );
};

export default Payment; 