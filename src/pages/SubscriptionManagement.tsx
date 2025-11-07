import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Loader2, Check, X, Calendar, CreditCard, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import CancelSubscriptionModal from '@/components/CancelSubscriptionModal';

interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  plan: 'pro' | 'free';
}

const SubscriptionManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (user?.uid) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/getSubscription'
        : 'http://localhost:3000/getSubscription';

      const authToken = await user.getIdToken();
      
      const response = await fetch(`${apiUrl}?userId=${user.uid}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${authToken}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      setHasSubscription(data.hasSubscription);
      setSubscription(data.subscription);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get user's name from displayName or email
    if (user?.displayName) {
      const firstName = user.displayName.split(' ')[0];
      setUserName(firstName);
    } else if (user?.email) {
      const emailName = user.email.split('@')[0];
      setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
    }
  }, [user]);

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!user?.uid || !subscription) return;

    setCanceling(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/cancelSubscription'
        : 'http://localhost:3000/cancelSubscription';

      const authToken = await user.getIdToken();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          userId: user.uid
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      const data = await response.json();
      toast.success(data.message || 'Subscription will be canceled at the end of the billing period');
      
      // Refresh subscription data
      await fetchSubscription();
      setShowCancelModal(false);
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
      throw error; // Re-throw so modal can handle it
    } finally {
      setCanceling(false);
    }
  };

  const handleReactivate = async () => {
    if (!user?.uid || !subscription) return;

    setReactivating(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/reactivateSubscription'
        : 'http://localhost:3000/reactivateSubscription';

      const authToken = await user.getIdToken();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          userId: user.uid
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reactivate subscription');
      }

      const data = await response.json();
      toast.success(data.message || 'Subscription reactivated successfully');
      
      // Refresh subscription data
      await fetchSubscription();
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      toast.error(error.message || 'Failed to reactivate subscription');
    } finally {
      setReactivating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen w-full bg-white py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#7B3FE4]" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen w-full bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/profile')}
              className="mb-4 text-black/60 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            <h1 className="text-3xl font-semibold text-black mb-2">Subscription Management</h1>
            <p className="text-black/60">Manage your SmartFormAI Agents Pro subscription</p>
          </div>

          {!hasSubscription || !subscription ? (
            <Card className="border border-black/10">
              <CardHeader>
                <CardTitle className="text-black">No Active Subscription</CardTitle>
                <CardDescription>You don't have an active subscription.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-black/60 mb-4">
                  Upgrade to Pro to unlock unlimited AI agents and advanced features.
                </p>
                <Button
                  onClick={() => navigate('/pricing')}
                  className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Current Plan Card */}
              <Card className="border-2 border-[#7B3FE4] mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#7B3FE4]/10 p-2 rounded-lg">
                        <Sparkles className="h-6 w-6 text-[#7B3FE4]" />
                      </div>
                      <div>
                        <CardTitle className="text-black">SmartFormAI Agents Pro</CardTitle>
                        <CardDescription>
                          {subscription.status === 'active' ? 'Active Subscription' : subscription.status}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      className={
                        subscription.status === 'active' && !subscription.cancelAtPeriodEnd
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : subscription.cancelAtPeriodEnd
                          ? 'bg-orange-100 text-orange-700 border-orange-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }
                    >
                      {subscription.status === 'active' && !subscription.cancelAtPeriodEnd
                        ? 'Active'
                        : subscription.cancelAtPeriodEnd
                        ? 'Canceling'
                        : subscription.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-black/10">
                      <div className="flex items-center gap-2 text-black/60">
                        <Calendar className="h-4 w-4" />
                        <span>Current Period</span>
                      </div>
                      <span className="text-black font-medium">
                        {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-black/10">
                      <div className="flex items-center gap-2 text-black/60">
                        <CreditCard className="h-4 w-4" />
                        <span>Billing Amount</span>
                      </div>
                      <span className="text-black font-medium">€14.99 / month</span>
                    </div>
                    {subscription.cancelAtPeriodEnd && (
                      <Alert className="bg-orange-50 border-orange-200">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          Your subscription will be canceled on {formatDate(subscription.currentPeriodEnd)}. 
                          You'll continue to have access until then.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions Card */}
              <Card className="border border-black/10">
                <CardHeader>
                  <CardTitle className="text-black">Actions</CardTitle>
                  <CardDescription>Manage your subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription.cancelAtPeriodEnd ? (
                    <div>
                      <p className="text-black/60 mb-4">
                        Your subscription is scheduled to cancel. You can reactivate it to continue your Pro access.
                      </p>
                      <Button
                        onClick={handleReactivate}
                        disabled={reactivating}
                        className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white w-full sm:w-auto"
                      >
                        {reactivating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Reactivating...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Reactivate Subscription
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-black/60 mb-4">
                        Cancel your subscription. You'll continue to have access until the end of your billing period.
                      </p>
                      <Button
                        onClick={handleCancelClick}
                        disabled={canceling}
                        variant="destructive"
                        className="w-full sm:w-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="border border-black/10 mt-6">
                <CardHeader>
                  <CardTitle className="text-black">Subscription Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">
                        You can cancel anytime and continue using Pro features until the end of your billing period.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">
                        If you cancel, you can reactivate your subscription before the period ends to continue uninterrupted service.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">
                        After cancellation, you'll be moved to the Free plan and can upgrade again anytime.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Cancel Subscription Modal */}
          {subscription && (
            <CancelSubscriptionModal
              open={showCancelModal}
              onClose={() => setShowCancelModal(false)}
              onConfirm={handleCancelConfirm}
              userName={userName || 'there'}
              currentPeriodEnd={subscription.currentPeriodEnd}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionManagement;

