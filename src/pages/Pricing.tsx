import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import PricingSection from '@/components/sections/Pricing';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFromInternalPage, setIsFromInternalPage] = useState(false);
  
  // Check if user came from an internal page (like profile)
  useEffect(() => {
    const fromPath = location.state?.from || '';
    setIsFromInternalPage(fromPath.includes('/profile') || fromPath.includes('/dashboard'));
  }, [location]);
  
  // Handle back button click
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Check for selected plan in URL params or state
  useEffect(() => {
    // If user is logged in and there's a selected plan in the URL, state, or localStorage, redirect to payment
    if (user) {
      const searchParams = new URLSearchParams(location.search);
      const planFromUrl = searchParams.get('plan');
      const planFromState = location.state?.selectedPlan;
      const planFromStorage = localStorage.getItem('selectedPlan');
      const billingCycleFromUrl = searchParams.get('billing');
      const billingCycleFromState = location.state?.billingCycle;
      const billingCycleFromStorage = localStorage.getItem('billingCycle');
      const tokenFromUrl = searchParams.get('token');
      const tokenFromState = location.state?.subscriptionToken;
      const tokenFromStorage = localStorage.getItem('subscriptionToken');
      
      const selectedPlan = planFromUrl || planFromState || planFromStorage;
      const billingCycle = billingCycleFromUrl || billingCycleFromState || billingCycleFromStorage || 'annual';
      
      // Validate that we have matching tokens if we have a plan from URL
      const isValidSelection = 
        // Either tokens match (from URL and storage)
        (tokenFromUrl && tokenFromStorage && tokenFromUrl === tokenFromStorage) ||
        // Or plan is from state/storage (not URL)
        (!planFromUrl && (planFromState || planFromStorage));
      
      if (selectedPlan && isValidSelection) {
        // Clear stored plan info
        localStorage.removeItem('selectedPlan');
        localStorage.removeItem('billingCycle');
        localStorage.removeItem('subscriptionToken');
        
        navigate('/payment', { 
          state: { 
            selectedPlan: selectedPlan,
            billingCycle: billingCycle
          },
          replace: true 
        });
      } else if (selectedPlan) {
        // Plan selected but tokens don't match, clear localStorage
        localStorage.removeItem('selectedPlan');
        localStorage.removeItem('billingCycle');
        localStorage.removeItem('subscriptionToken');
      }
    }
    // If user is not logged in, redirect to sign in with return URL that includes plan info
    else if (!user && !location.pathname.includes('/pricing')) {
      const searchParams = new URLSearchParams(location.search);
      const plan = searchParams.get('plan');
      const billing = searchParams.get('billing') || 'annual';
      
      if (plan) {
        navigate('/signin', { 
          state: { 
            returnTo: `/pricing?plan=${plan}&billing=${billing}`,
            selectedPlan: plan,
            billingCycle: billing
          } 
        });
      } else {
        navigate('/signin', { state: { returnTo: '/pricing' } });
      }
    }
  }, [user, navigate, location]);

  return (
    <>
      {isFromInternalPage ? (
        <div className="min-h-screen bg-white">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2" 
                onClick={handleBackToDashboard}
              >
                <ArrowLeft size={16} />
                Go Back to Dashboard
              </Button>
            </div>
            <PricingSection isAuthenticated={!!user} />
          </div>
        </div>
      ) : (
        <Layout>
          <PricingSection isAuthenticated={!!user} />
        </Layout>
      )}
    </>
  );
};

export default Pricing;
