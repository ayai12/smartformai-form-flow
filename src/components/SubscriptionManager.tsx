import React, { useState, useEffect } from 'react';
import { useStripe } from '@/context/StripeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, CreditCard, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionManager: React.FC = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { getCurrentSubscription } = useStripe();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscription = async () => {
      if (user) {
        try {
          setLoading(true);
          const data = await getCurrentSubscription();
          setSubscription(data);
        } catch (error) {
          console.error('Error fetching subscription:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSubscription();
  }, [user, getCurrentSubscription]);

  const goToPricing = () => {
    navigate('/pricing');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Your current plan and billing details</CardDescription>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  // Free plan or no subscription
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Your current plan and billing details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Plan</span>
              <div className="flex items-center">
                <Badge variant="outline" className="bg-gray-100">Free</Badge>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              You're currently on the Free Plan with limited features. Upgrade to unlock more powerful features.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={goToPricing} className="w-full">Upgrade Now</Button>
        </CardFooter>
      </Card>
    );
  }

  // Paid subscription
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>Your current plan and billing details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Current Plan</span>
            <div className="flex items-center">
              <Badge className={subscription.planId === 'starter' ? 'bg-[#FF9500]' : 'bg-[#0066CC]'}>
                {subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Billing Cycle</span>
            <span className="text-sm font-medium">
              {subscription.billingCycle.charAt(0).toUpperCase() + subscription.billingCycle.slice(1)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <Badge variant={subscription.status === 'active' ? 'default' : 'outline'} className={subscription.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}>
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Next Billing Date</span>
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              <span className="text-sm font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
            </div>
          </div>

          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium mb-2">Plan Features</h4>
            <ul className="space-y-1">
              <li className="flex items-start">
                <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">
                  {subscription.features.activeForms === -1 
                    ? 'Unlimited active forms' 
                    : `Up to ${subscription.features.activeForms} active forms`}
                </span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">{subscription.features.aiGeneratedForms} AI-generated forms/month</span>
              </li>
              {subscription.features.removeSmartFormAIBranding && (
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm">SmartFormAI branding removed</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button onClick={goToPricing} className="w-full">Change Plan</Button>
        {subscription.cancelAtPeriodEnd ? (
          <p className="text-xs text-gray-500 text-center">
            Your subscription will end on {formatDate(subscription.currentPeriodEnd)}.
          </p>
        ) : (
          <p className="text-xs text-gray-500 text-center">
            Contact support to cancel your subscription before the next billing date.
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default SubscriptionManager; 