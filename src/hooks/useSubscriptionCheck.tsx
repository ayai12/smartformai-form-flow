import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useStripe } from '@/context/StripeContext';
import { useAlert } from '@/components/AlertProvider';

// Define subscription feature limits by plan
const PLAN_LIMITS = {
  free: {
    activeForms: 20,
    aiGeneratedForms: 10,
    removeSmartFormAIBranding: false
  },
  starter: {
    activeForms: 50,
    aiGeneratedForms: 30,
    removeSmartFormAIBranding: false
  },
  pro: {
    activeForms: -1, // unlimited
    aiGeneratedForms: 100,
    removeSmartFormAIBranding: true
  }
};

interface SubscriptionCheckOptions {
  redirectOnFailure?: boolean;
  showAlert?: boolean;
}

/**
 * Hook to check if user has access to a feature based on their subscription
 */
export const useSubscriptionCheck = (options: SubscriptionCheckOptions = {}) => {
  const { redirectOnFailure = true, showAlert: shouldShowAlert = true } = options;
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [limits, setLimits] = useState(PLAN_LIMITS.free);
  const { user } = useAuth();
  const { getCurrentSubscription } = useStripe();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const subscriptionData = await getCurrentSubscription();
        setSubscription(subscriptionData);

        // Determine plan limits
        if (subscriptionData?.planId === 'pro') {
          setLimits(PLAN_LIMITS.pro);
        } else if (subscriptionData?.planId === 'starter') {
          setLimits(PLAN_LIMITS.starter);
        } else {
          setLimits(PLAN_LIMITS.free);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setLimits(PLAN_LIMITS.free); // Fallback to free plan on error
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user, getCurrentSubscription]);

  // Function to check if user can access a specific feature
  const canAccess = (feature: keyof typeof PLAN_LIMITS.free, count?: number) => {
    if (loading) return false;

    // If checking forms count against limit
    if (count !== undefined && feature === 'activeForms') {
      // Unlimited if limit is -1
      if (limits.activeForms === -1) return true;
      // Otherwise check against limit
      return count <= limits.activeForms;
    }
    
    // If checking AI generations count against limit
    if (count !== undefined && feature === 'aiGeneratedForms') {
      return count <= limits.aiGeneratedForms;
    }

    // For boolean features (like removing branding)
    if (typeof limits[feature] === 'boolean') {
      return limits[feature];
    }

    return false;
  };

  // Function to handle feature access denial
  const handleAccessDenied = (feature: string) => {
    if (shouldShowAlert) {
      showAlert(
        'Subscription Required', 
        `This feature requires a ${feature === 'removeSmartFormAIBranding' ? 'Pro' : 'paid'} subscription. Please upgrade your plan to access it.`, 
        'warning'
      );
    }
    
    if (redirectOnFailure) {
      navigate('/pricing', { state: { from: window.location.pathname } });
    }
    
    return false;
  };

  // Main function to check access and handle denial
  const checkAccess = (feature: keyof typeof PLAN_LIMITS.free, count?: number) => {
    const hasAccess = canAccess(feature, count);
    
    if (!hasAccess) {
      return handleAccessDenied(feature);
    }
    
    return true;
  };

  return {
    loading,
    subscription,
    limits,
    checkAccess,
    isPro: subscription?.planId === 'pro',
    isStarter: subscription?.planId === 'starter',
    isFree: !subscription || (!subscription.planId)
  };
};

export default useSubscriptionCheck; 