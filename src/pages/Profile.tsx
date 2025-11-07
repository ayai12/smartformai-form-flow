// Force TypeScript rebuild
import React, { useState, useEffect, ErrorInfo, ReactNode } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, User, LogOut, BrainCircuit, Mail, Calendar, CreditCard, Sparkles, ExternalLink, Loader2, History, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, updateUserProfile, UserProfile } from '@/firebase/userProfile';
import { getCreditHistory } from '@/firebase/credits';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

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
  const { user, signOut: signOutUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalAgents, setTotalAgents] = useState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'pro'>('free');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<Date | null>(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [creditHistory, setCreditHistory] = useState<Array<{
    id: string;
    action: string;
    creditsUsed: number;
    creditsBefore: number;
    creditsAfter: number;
    timestamp: Date;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
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
        
        // Fetch total agents count
        const db = getFirestore();
        const agentsQuery = query(
          collection(db, 'agents'),
          where('ownerId', '==', user.uid)
        );
        const agentsSnap = await getDocs(agentsQuery);
        setTotalAgents(agentsSnap.size);
        
        // Fetch subscription data using Firestore v9 API
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSubscriptionPlan(userData.plan || 'free');
          setUserCredits(userData.credits ?? 0);
          if (userData.current_period_end) {
            const endDate = userData.current_period_end.toDate();
            setCurrentPeriodEnd(endDate);
          }
        } else {
          // Create user document with free plan if doesn't exist
          await setDoc(userDocRef, {
            plan: 'free',
            credits: 8, // 8 free credits on signup
            email: user.email
          }, { merge: true });
          setSubscriptionPlan('free');
          setUserCredits(8);
        }
        
        // Fetch credit history
        setLoadingHistory(true);
        try {
          const history = await getCreditHistory(user.uid, 20);
          setCreditHistory(history);
        } catch (error) {
          console.error('Error fetching credit history:', error);
        } finally {
          setLoadingHistory(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading profile data:", error);
        setLoading(false);
      }
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOutUser();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  // Handle upgrade to Pro
  const handleUpgrade = async () => {
    if (!user?.email || !user?.uid) {
      toast.error('User information not available');
      return;
    }

    setIsUpgrading(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/createCheckoutSession'
        : 'http://localhost:3000/createCheckoutSession';

      // Get Firebase auth token
      const authToken = await user.getIdToken();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          productId: 'pro_subscription_29_99'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Handle manage subscription
  const handleManageSubscription = async () => {
    if (!user?.uid) {
      toast.error('User information not available');
      return;
    }

    setIsManagingSubscription(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/createCustomerPortalSession'
        : 'http://localhost:3000/createCustomerPortalSession';
      
      const returnUrl = window.location.origin + '/profile';
      
      // Get Firebase auth token
      const authToken = await user.getIdToken();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          userId: user.uid,
          returnUrl: returnUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast.error('Failed to open subscription management. Please try again.');
    } finally {
      setIsManagingSubscription(false);
    }
  };
  
  // Load user profile data
  useEffect(() => {
    fetchUserProfile();
  }, [user]);
  
  // Check for Stripe session_id in URL after checkout redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    
    if (sessionId && success === 'true' && user?.uid) {
      // Payment completed - immediately sync subscription from Stripe as fallback
      console.log('✅ Checkout session completed, syncing subscription immediately...');
      toast.success('Payment successful! Activating your subscription...');
      
      // Capture initial credits BEFORE polling starts
      const initialCredits = userCredits;
      console.log(`💰 Starting credit update check. Initial credits: ${initialCredits}`);

      const syncSubscription = async () => {
        try {
          const apiUrl = import.meta.env.PROD 
            ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/syncSubscription'
            : 'http://localhost:3000/syncSubscription';
          
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

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.plan === 'pro') {
              toast.success('Subscription activated! You now have Pro access.');
              await fetchUserProfile();
              window.history.replaceState({}, '', '/profile');
              return;
            }
          }
        } catch (error) {
          console.error('Error syncing subscription:', error);
        }
        
        // Fallback: Poll for subscription/credits update (webhook might still be processing)
        let attempts = 0;
        const maxAttempts = 20; // 20 seconds total - increased timeout
        
        const checkUpdate = setInterval(async () => {
          attempts++;
          console.log(`🔄 Checking for credit update (attempt ${attempts}/${maxAttempts})`);

          try {
            if (user?.uid) {
              // Always fetch fresh data from database
              const dbInstance = getFirestore();
              const userDocRef = doc(dbInstance, 'users', user.uid);
              const userDoc = await getDoc(userDocRef);

              if (userDoc.exists()) {
                const userData = userDoc.data();
                const newCredits = userData.credits ?? 0;

                console.log(`📊 Current credits in database: ${newCredits} (was ${initialCredits})`);

                // Check if credits increased significantly (webhook processed)
                // For credit packs, we expect at least +40 credits
                const creditIncrease = newCredits - initialCredits;

                if (userData.plan === 'pro' || creditIncrease >= 40) {
                  clearInterval(checkUpdate);
                  console.log(`✅ Credit update detected! Increase: ${creditIncrease} credits`);

                  // Refresh profile to update all state
                  await fetchUserProfile();

                if (userData.plan === 'pro') {
                  toast.success('Subscription activated! You now have Pro access.');
                    setSubscriptionPlan('pro');
                  } else if (creditIncrease >= 40) {
                    console.log(`🎉 SHOWING SUCCESS TOAST: Credits added! You now have ${newCredits} credits.`);
                    toast.success(`🎉 Credits added! You now have ${newCredits} credits.`);
                    setUserCredits(newCredits); // Update state immediately
                  }

                  window.history.replaceState({}, '', '/profile');
                  return;
                } else if (creditIncrease > 0 && creditIncrease < 40) {
                  console.log(`⚠️ Small credit increase detected (${creditIncrease}), might be processing...`);
                }
              } else {
                console.log(`⚠️ User document not found`);
              }
            }
            
            if (attempts >= maxAttempts) {
              clearInterval(checkUpdate);
              console.log(`⏰ Max attempts reached. Stopping check.`);
              toast.warning('Payment is processing. Please refresh the page in a moment.');
              window.history.replaceState({}, '', '/profile');
            }
          } catch (error) {
            console.error('Error checking update:', error);
          }
        }, 1000); // Check every second
        
        setTimeout(() => {
          clearInterval(checkUpdate);
        }, maxAttempts * 1000);
      };
      
      syncSubscription();
      
      // Clean up URL
      window.history.replaceState({}, '', '/profile');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);
  
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
      // Create a clean object with only defined values
      const cleanProfileData = Object.fromEntries(
        Object.entries({
          company: profileData.company,
          website: profileData.website,
          bio: profileData.bio
        }).filter(([_, value]) => value !== undefined)
      );
      
      const success = await updateUserProfile(user.uid, cleanProfileData);
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

  // Add a safe rendering function
  const safeRender = (renderFn: () => React.ReactNode): React.ReactNode => {
    try {
      return renderFn();
    } catch (error) {
      console.error('Error rendering component:', error);
      return <div className="p-4 text-red-500">Error rendering this section. Please refresh the page.</div>;
    }
  };

  // Add avatar/initials logic
  const getUserInitials = () => {
    if (profileData.firstName || profileData.lastName) {
      return `${profileData.firstName.charAt(0) || ''}${profileData.lastName.charAt(0) || ''}`.toUpperCase();
    }
    if (profileData.email) {
      return profileData.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <>
      <div className="min-h-screen w-full bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header with User Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div className="flex items-center gap-4">
              {/* User Avatar */}
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#7B3FE4]/10 flex items-center justify-center text-[#7B3FE4] text-xl font-semibold border border-black/10">
                {getUserInitials()}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-black mb-1">
                  {profileData.firstName || profileData.email?.split('@')[0] || 'User'}
                </h1>
                <p className="text-black/60 text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profileData.email}
                </p>
              </div>
            </div>
            
            {/* Logout Button */}
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-black/10 text-black/60 hover:bg-black/5 hover:text-black transition-colors gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Divider */}
          <div className="h-px bg-black/10 mb-8"></div>

          {/* Credits Section */}
          {subscriptionPlan !== 'pro' && (
            <Card className="bg-gradient-to-br from-[#7B3FE4]/5 to-white border border-[#7B3FE4]/20 mb-8">
              <CardHeader>
                <CardTitle className="text-lg text-black flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#7B3FE4]" />
                  Credits
                </CardTitle>
                <CardDescription className="text-black/60 mt-1">
                  Use credits to train agents and access AI features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-semibold text-black mb-1">{userCredits}</p>
                    <p className="text-black/60 text-sm">Available credits</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        if (!user?.uid) return;

                        // Test webhook endpoint (now works with dev bypass)
                        try {
                          const apiUrl = import.meta.env.PROD
                            ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/stripeWebhook'
                            : 'http://localhost:3000/stripeWebhook';

                          // Create fake Stripe webhook payload
                          const fakeWebhookPayload = {
                            id: `evt_test_${Date.now()}`,
                            object: 'event',
                            api_version: '2020-08-27',
                            created: Math.floor(Date.now() / 1000),
                            data: {
                              object: {
                                id: `cs_test_${Date.now()}`,
                                object: 'checkout.session',
                                amount_total: 999,
                                currency: 'eur',
                                customer: 'cus_fake_test',
                                metadata: {
                                  userId: user.uid,
                                  productId: 'credit_pack_9_99',
                                  creditsAmount: '40'
                                },
                                mode: 'payment',
                                payment_status: 'paid'
                              }
                            },
                            livemode: false,
                            pending_webhooks: 1,
                            request: {
                              id: `req_test_${Date.now()}`,
                              idempotency_key: null
                            },
                            type: 'checkout.session.completed'
                          };

                          console.log('🧪 Testing webhook with payload:', fakeWebhookPayload);

                          const response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(fakeWebhookPayload),
                          });

                          console.log('📡 Webhook test response:', response.status, response.statusText);

                          if (response.ok) {
                            const data = await response.json();
                            toast.success(`✅ Webhook test successful! ${JSON.stringify(data)}`);
                          } else {
                            const errorText = await response.text();
                            toast.error(`❌ Webhook test failed: ${response.status} - ${errorText}`);
                          }
                        } catch (error: any) {
                          console.error('Error testing webhook:', error);
                          toast.error(`❌ Webhook test failed: ${error.message}`);
                        }
                      }}
                      variant="outline"
                      className="border-orange-400 text-orange-600 hover:bg-orange-50 gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Test Webhook
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!user?.uid) return;

                        // Test credit addition (working simulation)
                        try {
                          const apiUrl = import.meta.env.PROD 
                            ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/simulateWebhook'
                            : 'http://localhost:3000/simulateWebhook';
                          
                          const authToken = await user.getIdToken();
                          const response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${authToken}`
                            },
                            body: JSON.stringify({
                              userId: user.uid,
                              productId: 'credit_pack_9_99'
                            }),
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            toast.success(`✅ Test successful! ${data.message}`);
                            await fetchUserProfile(); // Refresh credits
                          } else {
                            const error = await response.json();
                            toast.error(`❌ Test failed: ${error.error}`);
                          }
                        } catch (error: any) {
                          console.error('Error testing credits:', error);
                          toast.error(`❌ Test failed: ${error.message}`);
                        }
                      }}
                      variant="outline"
                      className="border-green-400 text-green-600 hover:bg-green-50 gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Add Credits
                    </Button>
                    <Button
                      onClick={() => navigate('/pricing')}
                      className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Buy Credits
                    </Button>
                  </div>
                </div>
                <div className="border-t border-black/10 pt-4">
                  <p className="text-sm text-black/60 mb-2">Credit costs:</p>
                  <ul className="text-xs text-black/60 space-y-1">
                    <li>• Train Agent: 3 credits</li>
                    <li>• Regenerate Questions: 1 credit</li>
                    <li>• Analyze Responses: 1 credit</li>
                    <li>• Clone Agent: 2 credits</li>
                    <li>• Export Results: 1 credit</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Section */}
          <Card className="bg-white border border-black/10 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-black flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#7B3FE4]" />
                    Subscription Plan
                  </CardTitle>
                  <CardDescription className="text-black/60 mt-1">
                    Manage your subscription and billing
                  </CardDescription>
                </div>
                <Badge 
                  className={subscriptionPlan === 'pro' 
                    ? 'bg-[#7B3FE4]/10 text-[#7B3FE4] border-[#7B3FE4]/20' 
                    : 'bg-black/5 text-black/60 border-black/10'
                  }
                >
                  {subscriptionPlan === 'pro' ? (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Pro
                    </>
                  ) : (
                    'Free'
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black font-medium text-base">
                    {subscriptionPlan === 'pro' ? 'SmartFormAI Agents Pro' : 'Free Plan'}
                  </p>
                  {subscriptionPlan === 'pro' && currentPeriodEnd && (
                    <p className="text-black/60 text-sm mt-1">
                      Next billing date: {currentPeriodEnd.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  )}
                  {subscriptionPlan === 'free' && (
                    <p className="text-black/60 text-sm mt-1">
                      Upgrade to unlock all features
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  {subscriptionPlan === 'pro' ? (
                    <Button
                      onClick={handleManageSubscription}
                      disabled={isManagingSubscription}
                      className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white gap-2"
                    >
                      {isManagingSubscription ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4" />
                          Manage Subscription
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white gap-2"
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Upgrade to Pro €14.99/mo
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Usage History */}
          {subscriptionPlan !== 'pro' && (
            <Card className="bg-white border border-black/10 mb-8">
              <CardHeader>
                <CardTitle className="text-lg text-black flex items-center gap-2">
                  <History className="h-5 w-5 text-[#7B3FE4]" />
                  Credit Usage History
                </CardTitle>
                <CardDescription className="text-black/60 mt-1">
                  Track your credit purchases and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-[#7B3FE4]" />
                  </div>
                ) : creditHistory.length > 0 ? (
                  <div className="space-y-3">
                    {creditHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 border border-black/10 rounded-lg hover:bg-black/5 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black">{entry.action}</p>
                          <p className="text-xs text-black/50 mt-0.5">
                            {entry.timestamp.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${
                              entry.creditsUsed < 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {entry.creditsUsed < 0
                              ? `+${Math.abs(entry.creditsUsed)}`
                              : `-${entry.creditsUsed}`}
                          </p>
                          <p className="text-xs text-black/50">
                            Balance: {entry.creditsAfter}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-black/40">
                    <History className="h-8 w-8 mx-auto mb-2 text-black/20" />
                    <p className="text-sm">No credit history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Agent Stats Card */}
            <Card className="bg-white border border-black/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-[#7B3FE4]/10 p-3 rounded-lg">
                    <BrainCircuit className="h-6 w-6 text-[#7B3FE4]" />
                  </div>
                  <div>
                    <p className="text-black/60 text-sm mb-1">Total Agents Created</p>
                    <p className="text-2xl font-semibold text-black">{totalAgents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Info Card */}
            <Card className="bg-white border border-black/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-[#7B3FE4]/10 p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-[#7B3FE4]" />
                  </div>
                  <div>
                    <p className="text-black/60 text-sm mb-1">Member Since</p>
                    <p className="text-xl font-semibold text-black">
                      {user?.metadata?.creationTime 
                        ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Divider */}
          <div className="h-px bg-black/10 mb-8"></div>

          {/* Account Details */}
          <Card className="bg-white border border-black/10">
            <CardHeader>
              <CardTitle className="text-lg text-black flex items-center gap-2">
                <User className="h-5 w-5 text-[#7B3FE4]" />
                Account Details
              </CardTitle>
              <CardDescription className="text-black/60">
                Your authentication information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label className="text-black/60 text-sm">Email</Label>
                  <p className="text-black font-medium mt-1">{profileData.email}</p>
                </div>
                <div>
                  <Label className="text-black/60 text-sm">User ID</Label>
                  <p className="text-black font-mono text-sm mt-1 break-all">{user?.uid || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-black/60 text-sm">Account Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block w-2 h-2 bg-[#7B3FE4] rounded-full"></span>
                    <p className="text-black font-medium">Active</p>
                  </div>
                </div>
                <div>
                  <Label className="text-black/60 text-sm">Email Verified</Label>
                  <p className="text-black font-medium mt-1">
                    {user?.emailVerified ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

const ProfilePage: React.FC = () => {
  return (
    <ErrorBoundary fallback={<div className="p-4 text-red-500">Something went wrong. Please refresh the page.</div>}>
      <DashboardLayout>
        <ProfileContent />
      </DashboardLayout>
    </ErrorBoundary>
  );
};

export default ProfilePage; 