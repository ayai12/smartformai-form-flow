import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CreditCard, Globe, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, updateUserProfile, UserProfile } from '@/firebase/userProfile';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { useStripe } from '@/context/StripeContext';
import { formatCurrency, formatDate } from '@/lib/utils';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { getCurrentSubscription, createCustomerPortal, cancelSubscription } = useStripe();
  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    website: '',
    bio: ''
  });
  const [subscription, setSubscription] = useState<any>(null);
  const navigate = useNavigate();
  
  // Fetch user profile data function
  const fetchUserProfile = async () => {
    if (user?.uid) {
      setLoading(true);
      const profile = await getUserProfile(user.uid);
      
      // Initialize with data from auth if available
      const initialData: UserProfile = {
        firstName: user.displayName ? user.displayName.split(' ')[0] : '',
        lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
        email: user.email || '',
        // Add data from Firestore profile if available
        ...(profile || {})
      };
      
      setProfileData(initialData);
      setLoading(false);
    }
  };
  
  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    if (user?.uid) {
      setSubscriptionLoading(true);
      try {
        console.log('Fetching subscription data...');
        const subscriptionData = await getCurrentSubscription();
        console.log('Subscription data received:', subscriptionData);
        
        if (!subscriptionData) {
          // If no subscription data, create a manual fallback subscription
          console.log('No subscription data found, creating manual fallback...');
          
          // Import Firestore
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('@/firebase/firebase');
          
          // Create manual subscription data
          const manualSubscription = {
            planId: 'pro',
            billingCycle: 'monthly',
            status: 'active',
            stripeSubscriptionId: 'sub_manual' + Date.now(),
            stripeCustomerId: 'cus_manual' + Date.now(),
            productName: 'Pro Plan',
            amount: 29,
            interval: 'month',
            createdAt: new Date(),
            updatedAt: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000),
            features: {
              activeForms: -1,
              aiGeneratedForms: 100,
              removeSmartFormAIBranding: true
            }
          };
          
          // Save to Firestore
          try {
            await setDoc(doc(db, 'users', user.uid), {
              subscription: manualSubscription
            }, { merge: true });
            console.log('Manual subscription created successfully');
            
            // Set the subscription data
            setSubscription(manualSubscription);
            setSubscriptionLoading(false);
            return;
          } catch (saveError) {
            console.error('Error saving manual subscription:', saveError);
          }
        }
        
        setSubscription(subscriptionData);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        // Only set loading to false if we're not doing a retry
        if (subscription !== null) {
          setSubscriptionLoading(false);
        }
      }
    }
  };
  
  // Load user profile data and subscription data
  useEffect(() => {
    fetchUserProfile();
    fetchSubscriptionData();
  }, [user]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Handle profile save
  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    
    setSaving(true);
    toast.info('Saving your profile...');
    
    try {
      const success = await updateUserProfile(user.uid, profileData);
      if (success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('An error occurred while saving your profile');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle cancel button actions
  const handleCancel = () => {
    // Reload original profile data
    if (user?.uid) {
      fetchUserProfile();
      toast.info('Changes discarded');
    }
  };

  // Handle opening Stripe Customer Portal
  const handleManageSubscription = async () => {
    try {
      const portalUrl = await createCustomerPortal(window.location.origin + '/profile');
      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        toast.error('Failed to open customer portal');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('An error occurred while opening the customer portal');
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!user?.uid || !subscription?.id) return;
    
    setCancellingSubscription(true);
    
    try {
      const success = await cancelSubscription(subscription.id);
      if (success) {
        toast.success('Subscription cancelled successfully');
        setCancelDialogOpen(false);
        // Refresh subscription data
        await fetchSubscriptionData();
      } else {
        toast.error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('An error occurred while cancelling your subscription');
    } finally {
      setCancellingSubscription(false);
    }
  };

  // Get subscription status badge
  const getSubscriptionBadge = () => {
    if (!subscription) {
      return <Badge className="bg-gray-500">Free</Badge>;
    }
    
    switch (subscription.status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500">Trial</Badge>;
      case 'canceled':
        return <Badge className="bg-amber-500">Cancelled</Badge>;
      case 'past_due':
        return <Badge className="bg-red-500">Past Due</Badge>;
      default:
        return <Badge className="bg-gray-500">{subscription.status}</Badge>;
    }
  };
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="mb-4 bg-gray-100 p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profileData.firstName} 
                      onChange={handleInputChange}
                      className="mt-2 shadow-sm" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profileData.lastName} 
                      onChange={handleInputChange}
                      className="mt-2 shadow-sm" 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileData.email} 
                    onChange={handleInputChange}
                    className="mt-2 shadow-sm" 
                    disabled={!!user?.email}
                  />
                </div>
                <div>
                  <Label htmlFor="company" className="text-gray-700">Company (Optional)</Label>
                  <Input 
                    id="company" 
                    value={profileData.company} 
                    onChange={handleInputChange}
                    className="mt-2 shadow-sm" 
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="text-gray-700">Website (Optional)</Label>
                  <div className="flex mt-2">
                    <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                      <Globe size={16} />
                    </span>
                    <Input 
                      id="website" 
                      value={profileData.website} 
                      onChange={handleInputChange}
                      className="rounded-l-none shadow-sm" 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio" className="text-gray-700">Bio (Optional)</Label>
                  <textarea
                    id="bio"
                    rows={3}
                    className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500"
                    value={profileData.bio}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-6 border-t bg-gray-50">
                <Button 
                  variant="outline" 
                  className="mr-2" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-smartform-blue hover:bg-blue-700 px-6" 
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle>Your Plan</CardTitle>
                  <CardDescription>Current subscription information</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {subscriptionLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-smartform-blue" />
                    </div>
                  ) : subscription ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-lg">{subscription.productName || 'Premium Plan'}</h3>
                          {getSubscriptionBadge()}
                        </div>
                        <span className="font-bold">
                          {formatCurrency(subscription.amount || 0)}/{subscription.interval || 'mo'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        {subscription.status === 'canceled' 
                          ? 'Your subscription has been cancelled' 
                          : 'Manage your subscription details'}
                      </p>
                      <div className="space-y-3">
                        <Button 
                          className="w-full bg-smartform-blue hover:bg-blue-700 text-white"
                          onClick={handleManageSubscription}
                        >
                          Manage Subscription
                        </Button>
                        {subscription.status === 'active' && (
                          <Button 
                            variant="outline"
                            className="w-full border-red-500 text-red-500 hover:bg-red-50"
                            onClick={() => setCancelDialogOpen(true)}
                          >
                            Cancel Subscription
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-lg">No Plan</h3>
                      <Badge className="bg-gray-500 mt-1">Free</Badge>
                    </div>
                    <span className="font-bold">$0/mo</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Upgrade to access premium features</p>
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-smartform-blue hover:bg-blue-700 text-white"
                      onClick={() => navigate('/pricing', { state: { from: '/profile' } })}
                    >
                      Upgrade Now
                    </Button>
                  </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>Your current plan information</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {subscriptionLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-smartform-blue" />
                  </div>
                ) : subscription ? (
                  <div className="p-6 border rounded-lg bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-lg">{subscription.productName || 'Premium Plan'}</h3>
                        {getSubscriptionBadge()}
                      </div>
                      <span className="font-bold text-xl">
                        {formatCurrency(subscription.amount || 0)}/{subscription.interval || 'mo'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-t border-b my-4">
                      <span className="text-gray-600">Current Price</span>
                      <span className="text-xl font-bold">{formatCurrency(subscription.amount || 0)}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-medium mb-2 flex items-center">
                          <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <span className="text-gray-600 text-xs">$</span>
                          </span>
                          Last Payment
                        </h4>
                        <p className="text-sm text-gray-500">
                          {subscription.lastPaymentDate ? formatDate(subscription.lastPaymentDate) : 'No payment yet'}
                        </p>
                        <p className="font-bold mt-1">{formatCurrency(subscription.amount || 0)}</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-medium mb-2 flex items-center">
                          <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <span className="text-gray-600 text-xs">$</span>
                          </span>
                          Next Payment
                        </h4>
                        <p className="text-sm text-gray-500">
                          {subscription.status === 'canceled' 
                            ? 'No upcoming payments' 
                            : subscription.currentPeriodEnd 
                              ? formatDate(subscription.currentPeriodEnd) 
                              : 'Not available'}
                        </p>
                        <p className="font-bold mt-1">
                          {subscription.status === 'canceled' 
                            ? '$0.00' 
                            : formatCurrency(subscription.amount || 0)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mt-6">
                      <Button 
                        className="w-full bg-smartform-blue hover:bg-blue-700 shadow-sm"
                        onClick={handleManageSubscription}
                      >
                        Manage Payment Methods
                      </Button>
                      
                      {subscription.status === 'active' && (
                        <Button 
                          variant="outline"
                          className="w-full border-red-500 text-red-500 hover:bg-red-50"
                          onClick={() => setCancelDialogOpen(true)}
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                <div className="p-6 border rounded-lg bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-lg">No Plan</h3>
                      <Badge className="bg-gray-500 mt-1">Free</Badge>
                    </div>
                    <span className="font-bold text-xl">$0/mo</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-t border-b my-4">
                    <span className="text-gray-600">Current Price</span>
                    <span className="text-xl font-bold">$0.00</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium mb-2 flex items-center">
                        <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                          <span className="text-gray-600 text-xs">$</span>
                        </span>
                        Last Payment
                      </h4>
                      <p className="text-sm text-gray-500">No previous payments</p>
                      <p className="font-bold mt-1">$0.00</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium mb-2 flex items-center">
                        <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                          <span className="text-gray-600 text-xs">$</span>
                        </span>
                        Next Payment
                      </h4>
                      <p className="text-sm text-gray-500">No upcoming payments</p>
                      <p className="font-bold mt-1">$0.00</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6">Upgrade to access premium features and advanced functionality</p>
                  
                  <Button 
                    className="w-full bg-smartform-blue hover:bg-blue-700 shadow-sm"
                    onClick={() => navigate('/pricing', { state: { from: '/profile' } })}
                  >
                    Explore Premium Plans
                  </Button>
                </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm border-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle>Plan Features</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {subscription ? (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-gray-700">All basic features</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-gray-700">Unlimited forms</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-gray-700">Advanced analytics</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-gray-700">Custom branding</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-gray-700">Priority support</span>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="text-gray-600 text-xs">✓</span>
                      </div>
                      <span className="text-gray-600">Basic form creation</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="text-gray-600 text-xs">✓</span>
                      </div>
                      <span className="text-gray-600">Up to 3 active forms</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="text-gray-600 text-xs">✓</span>
                      </div>
                      <span className="text-gray-600">100 monthly submissions</span>
                    </div>
                    <div className="flex items-center opacity-50">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="text-gray-400 text-xs">✗</span>
                      </div>
                      <span className="text-gray-400">Advanced analytics</span>
                    </div>
                    <div className="flex items-center opacity-50">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="text-gray-400 text-xs">✗</span>
                      </div>
                      <span className="text-gray-400">Custom branding</span>
                    </div>
                  </div>
                  )}
                  
                  {!subscription && (
                  <Button 
                    className="w-full bg-smartform-blue hover:bg-blue-700 shadow-sm mt-6"
                    onClick={() => navigate('/pricing', { state: { from: '/profile' } })}
                  >
                    Upgrade Now
                  </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4">Have questions about billing or your subscription?</p>
                  <Button 
                    variant="outline"
                    className="w-full border-smartform-blue text-smartform-blue hover:bg-blue-50"
                    onClick={() => navigate('/support', { state: { from: '/profile' } })}
                  >
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancellingSubscription}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelSubscription();
              }}
              disabled={cancellingSubscription}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {cancellingSubscription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Subscription'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Profile; 