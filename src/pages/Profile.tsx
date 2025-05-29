import React, { useState, useEffect, ErrorInfo, ReactNode } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, User, CreditCard, Calendar, BadgeAlert, Zap, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTokenUsage } from '@/context/TokenUsageContext';
import { getUserProfile, updateUserProfile, UserProfile } from '@/firebase/userProfile';
import { getUserSubscription, cancelSubscription, getNextBillingDate, SubscriptionData } from '@/firebase/subscriptionService';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDistanceToNow } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: ReactNode, fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode, fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error in Profile component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

const ProfileContent: React.FC = () => {
  const { user } = useAuth();
  const { tokenUsage, isLoading: isTokenLoading } = useTokenUsage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    website: '',
    bio: ''
  });
  const navigate = useNavigate();
  
  // Fetch user profile data function
  const fetchUserProfile = async () => {
    if (user?.uid) {
      setLoading(true);
      try {
        console.log("Fetching user profile for:", user.uid);
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
        console.log("Profile data loaded:", initialData);
        
        // Fetch subscription data with retry mechanism
        await fetchSubscriptionWithRetry(user.uid);
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading profile data:", error);
        setLoading(false);
      }
    }
  };
  
  // Retry function for subscription data
  const fetchSubscriptionWithRetry = async (userId: string, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Fetching subscription data, attempt ${attempt}`);
        const subscriptionData = await getUserSubscription(userId);
        console.log("Subscription data loaded:", subscriptionData);
        setSubscription(subscriptionData);
        return;
      } catch (error) {
        console.error(`Error fetching subscription (attempt ${attempt}):`, error);
        if (attempt === retries) {
          // Last attempt failed, set to null
          setSubscription(null);
        } else {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };
  
  // Load user profile data
  useEffect(() => {
    fetchUserProfile();
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
      // Only save editable fields
      const editableProfileData = {
        company: profileData.company,
        website: profileData.website,
        bio: profileData.bio
      };
      
      const success = await updateUserProfile(user.uid, editableProfileData);
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

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!user?.uid || !subscription) return;
    
    setCancelLoading(true);
    
    try {
      const success = await cancelSubscription(user.uid, subscription.stripeSubscriptionId);
      
      if (success) {
        toast.success('Your subscription has been canceled and will end at the end of the billing period');
        // Refresh subscription data
        const updatedSubscription = await getUserSubscription(user.uid);
        setSubscription(updatedSubscription);
      } else {
        toast.error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('An error occurred while canceling your subscription');
    } finally {
      setCancelLoading(false);
      setShowCancelDialog(false);
    }
  };
  
  // Safely get a date string from a subscription date field
  const safeFormatDate = (dateField: any): string => {
    if (!dateField) return 'Unknown';
    
    try {
      if (typeof dateField.toDate === 'function') {
        return formatDate(dateField.toDate());
      } else if (dateField instanceof Date) {
        return formatDate(dateField);
      } else {
        return formatDate(new Date(dateField));
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };
  
  // Format plan name
  const formatPlanName = (planId: string) => {
    if (planId === 'starter') return 'Starter Plan';
    if (planId === 'pro') return 'Pro Plan';
    return planId;
  };
  
  // Convert first letter to uppercase
  const capitalize = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Add a safe rendering function
  const safeRender = (renderFn: () => React.ReactNode): React.ReactNode => {
    try {
      return renderFn();
    } catch (error) {
      console.error('Error rendering component:', error);
      return <div className="p-4 text-red-500">Error rendering this section. Please refresh the page.</div>;
    }
  };

  // Get percentage of AI requests used
  const getAIRequestPercentage = () => {
    if (!tokenUsage) return 0;
    return Math.min(100, Math.round((tokenUsage.aiRequestsUsed / tokenUsage.aiRequestsLimit) * 100));
  };

  // Get color based on usage percentage
  const getUsageColor = () => {
    const percentage = getAIRequestPercentage();
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Format next reset date
  const getNextResetText = () => {
    if (!tokenUsage?.nextResetDate) return 'Unknown';
    
    try {
      return formatDistanceToNow(tokenUsage.nextResetDate, { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };

  return (
    <>
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
                      className="mt-2 shadow-sm bg-gray-50" 
                      disabled={true}
                    />
                    <p className="text-xs text-gray-500 mt-1">First name cannot be changed</p>
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profileData.lastName} 
                      onChange={handleInputChange}
                      className="mt-2 shadow-sm bg-gray-50" 
                      disabled={true}
                    />
                    <p className="text-xs text-gray-500 mt-1">Last name cannot be changed</p>
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
              <Card className="shadow-sm border-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4">Have questions about using SmartFormAI?</p>
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

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>Manage your plan and billing information</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="py-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading subscription information...</p>
                  </div>
                ) : subscription ? (
                  safeRender(() => (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div>
                          <h3 className="font-medium text-gray-900">Current Plan</h3>
                          <div className="flex items-center mt-1">
                            <span className="text-lg font-bold text-gray-900 mr-2">
                              {formatPlanName(subscription?.planId || '')}
                            </span>
                            <Badge className={`${
                              subscription?.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : subscription?.status === 'canceled'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {subscription?.status === 'canceled' ? 'Canceled' : capitalize(subscription?.status || '')}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600 text-sm">
                            {subscription?.billingCycle === 'monthly' ? 'Monthly' : 'Annual'} billing
                          </p>
                          <p className="font-bold text-lg">${subscription?.price || 0}{subscription?.billingCycle === 'monthly' ? '/month' : '/year'}</p>
                        </div>
                      </div>

                      {/* AI Request Usage Card */}
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Zap className="h-5 w-5 text-blue-500 mr-2" />
                            <h3 className="font-medium text-gray-900">AI Request Usage</h3>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            Resets {getNextResetText()}
                          </Badge>
                        </div>
                        
                        {isTokenLoading ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin w-6 h-6 border-3 border-gray-200 border-t-blue-500 rounded-full"></div>
                          </div>
                        ) : tokenUsage ? (
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">
                                {tokenUsage.aiRequestsUsed} of {tokenUsage.aiRequestsLimit} used
                              </span>
                              <span className={`font-medium ${getUsageColor()}`}>
                                {getAIRequestPercentage()}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  getAIRequestPercentage() >= 90 ? 'bg-red-500' : 
                                  getAIRequestPercentage() >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${getAIRequestPercentage()}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {tokenUsage.aiRequestsLimit - tokenUsage.aiRequestsUsed} requests remaining this billing period
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">No usage data available</p>
                        )}
                        
                        {tokenUsage && getAIRequestPercentage() >= 80 && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                            <div className="flex items-start">
                              <BadgeAlert className="h-4 w-4 mt-0.5 mr-2 text-yellow-500" />
                              <p>
                                You're approaching your AI request limit. Consider upgrading your plan for more requests.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {subscription.status === 'canceled' && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start">
                          <BadgeAlert className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-yellow-800 mb-1">Your subscription has been canceled</h4>
                            <p className="text-sm text-yellow-700">
                              Your access will continue until the end of the current billing period on {
                                subscription.endDate ? (
                                  typeof subscription.endDate.toDate === 'function' 
                                    ? formatDate(subscription.endDate.toDate()) 
                                    : formatDate(new Date(subscription.endDate))
                                ) : getNextBillingDate(subscription)
                              }.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <h3 className="font-medium text-gray-900">Billing Information</h3>
                        </div>

                        {subscription && subscription.planId !== 'free' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center mb-2">
                                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                <p className="text-sm text-gray-600 font-medium">Start Date</p>
                              </div>
                              <p className="font-medium text-gray-900">
                                {subscription.startDate 
                                  ? (typeof subscription.startDate.toDate === 'function' 
                                    ? formatDate(subscription.startDate.toDate()) 
                                    : formatDate(new Date(subscription.startDate))) 
                                  : 'Unknown'}
                              </p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center mb-2">
                                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                <p className="text-sm text-gray-600 font-medium">
                                  {subscription.status === 'canceled' ? 'End Date' : 'Next Billing Date'}
                                </p>
                              </div>
                              <p className="font-medium text-gray-900">
                                {getNextBillingDate(subscription)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm">
                            <div className="flex items-center mb-2">
                              <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                              <p className="text-sm text-gray-700 font-medium">Token Reset Date</p>
                            </div>
                            <p className="font-medium text-gray-900">
                              Your tokens will reset {getNextResetText()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  // Free plan display - when no paid subscription exists
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-medium text-gray-900">Current Plan</h3>
                        <div className="flex items-center mt-1">
                          <span className="text-lg font-bold text-gray-900 mr-2">
                            Free Plan
                          </span>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600 text-sm">Free forever</p>
                        <p className="font-bold text-lg">$0/month</p>
                      </div>
                    </div>

                    {/* AI Request Usage Card */}
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="bg-blue-500 p-1.5 rounded-full mr-2">
                            <Zap className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-medium text-gray-900">AI Request Usage</h3>
                        </div>
                        <Badge variant="outline" className="bg-white border-blue-200">
                          Resets {getNextResetText()}
                        </Badge>
                      </div>
                      
                      {isTokenLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin w-6 h-6 border-3 border-gray-200 border-t-blue-500 rounded-full"></div>
                        </div>
                      ) : tokenUsage ? (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600 font-medium">
                              {tokenUsage.aiRequestsUsed} of {tokenUsage.aiRequestsLimit} used
                            </span>
                            <span className={`font-medium ${getUsageColor()}`}>
                              {getAIRequestPercentage()}%
                            </span>
                          </div>
                          <div className="w-full bg-white rounded-full h-3 shadow-inner">
                            <div 
                              className={`h-3 rounded-full ${
                                getAIRequestPercentage() >= 90 ? 'bg-gradient-to-r from-red-400 to-red-500' : 
                                getAIRequestPercentage() >= 70 ? 'bg-gradient-to-r from-yellow-300 to-yellow-400' : 'bg-gradient-to-r from-green-400 to-emerald-500'
                              }`}
                              style={{ width: `${getAIRequestPercentage()}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            <span className="font-medium text-blue-600">{tokenUsage.aiRequestsLimit - tokenUsage.aiRequestsUsed}</span> requests remaining this month
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No usage data available</p>
                      )}
                      
                      {tokenUsage && getAIRequestPercentage() >= 80 && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                          <div className="flex items-start">
                            <BadgeAlert className="h-5 w-5 mt-0.5 mr-2 text-yellow-500 flex-shrink-0" />
                            <p>
                              You're approaching your AI request limit. Consider upgrading your plan for more requests.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Free Plan Benefits */}
                    <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-100 shadow-sm">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                        <div className="bg-emerald-500 p-1.5 rounded-full mr-2">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        Free Plan Benefits
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-start p-2 bg-white bg-opacity-60 rounded-lg">
                          <Check className="h-4 w-4 text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">10 AI-generated forms per month</span>
                        </div>
                        <div className="flex items-start p-2 bg-white bg-opacity-60 rounded-lg">
                          <Check className="h-4 w-4 text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">Up to 20 active forms</span>
                        </div>
                        <div className="flex items-start p-2 bg-white bg-opacity-60 rounded-lg">
                          <Check className="h-4 w-4 text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">Core AI features</span>
                        </div>
                        <div className="flex items-start p-2 bg-white bg-opacity-60 rounded-lg">
                          <Check className="h-4 w-4 text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">Basic question types</span>
                        </div>
                        <div className="flex items-start p-2 bg-white bg-opacity-60 rounded-lg">
                          <Check className="h-4 w-4 text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">Analytics dashboard access</span>
                        </div>
                      </div>
                    </div>

                    {/* Upgrade Call to Action */}
                    <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 shadow-sm text-center">
                      <h3 className="font-semibold text-gray-900 mb-2">Need more AI power?</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Upgrade to Starter for 30 AI requests/month or Pro for 150 AI requests/month
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md px-6 py-5 w-full transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1" 
                        onClick={() => navigate('/pricing')}
                      >
                        Upgrade Your Plan
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              
              {subscription && subscription.status === 'active' && subscription.planId !== 'free' && (
                <CardFooter className="flex justify-end pt-6 border-t bg-gray-50">
                  <Button 
                    variant="destructive" 
                    className="px-6" 
                    onClick={() => setShowCancelDialog(true)}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? 'Processing...' : 'Cancel Subscription'}
                  </Button>
                </CardFooter>
              )}
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm border-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4">Have questions about your subscription or billing?</p>
                  <Button 
                    variant="outline"
                    className="w-full border-smartform-blue text-smartform-blue hover:bg-blue-50"
                    onClick={() => navigate('/support', { state: { from: '/profile' } })}
                  >
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
              
              {/* Upgrade Card - Show for Free and Starter users */}
              {(!subscription || (subscription && (subscription.planId === 'free' || subscription.planId === 'starter'))) && (
                <Card className="shadow-sm border-indigo-200 overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-b">
                    <CardTitle>Upgrade Your Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {subscription && subscription.planId === 'free' ? (
                      <>
                        <h4 className="font-medium text-gray-900 mb-2">Ready for more AI power?</h4>
                        <ul className="space-y-2 mb-4">
                          <li className="flex items-start">
                            <Check className="h-4 w-4 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-600">Starter: 30 AI requests/month</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-4 w-4 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-600">Pro: 150 AI requests/month</span>
                          </li>
                        </ul>
                      </>
                    ) : subscription && subscription.planId === 'starter' ? (
                      <>
                        <h4 className="font-medium text-gray-900 mb-2">Upgrade to Pro for maximum power!</h4>
                        <ul className="space-y-2 mb-4">
                          <li className="flex items-start">
                            <Check className="h-4 w-4 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-600">150 AI requests/month (5x more!)</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-4 w-4 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-600">Advanced analytics features</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-4 w-4 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-600">Priority support</span>
                          </li>
                        </ul>
                      </>
                    ) : null}
                    <Button 
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                      onClick={() => navigate('/pricing')}
                    >
                      {subscription && subscription.planId === 'starter' ? 'Upgrade to Pro' : 'View Pricing Plans'}
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {subscription && subscription.status === 'active' && subscription.planId !== 'free' && (
                <Card className="shadow-sm border-gray-200 overflow-hidden">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle>Upgrade Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-600 mb-4">Want to explore other plan options?</p>
                    <Button 
                      variant="outline"
                      className="w-full border-smartform-blue text-smartform-blue hover:bg-blue-50"
                      onClick={() => navigate('/pricing')}
                    >
                      View Available Plans
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              {safeRender(() => (
                <>Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period on {subscription ? getNextBillingDate(subscription) : 'Unknown'}.</>
              ))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>Nevermind</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={(e) => {
                e.preventDefault();
                handleCancelSubscription();
              }}
              disabled={cancelLoading}
            >
              {cancelLoading ? 'Processing...' : 'Yes, Cancel Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const Profile: React.FC = () => {
  const ErrorFallback = (
    <DashboardLayout>
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="mb-4">We encountered an error while displaying your profile.</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="bg-smartform-blue hover:bg-blue-700"
        >
          Refresh the page
        </Button>
      </div>
    </DashboardLayout>
  );

  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <DashboardLayout>
        <ProfileContent />
      </DashboardLayout>
    </ErrorBoundary>
  );
};

export default Profile; 