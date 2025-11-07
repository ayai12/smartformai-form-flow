import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Zap, BarChart3, Shield, Infinity, CreditCard, ArrowRight, X } from 'lucide-react';
import { useAlert } from '../components/AlertProvider';
import { db } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);

  useEffect(() => {
    // Check for canceled payment
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('canceled') === 'true') {
      showAlert("Payment Canceled", "Your payment was canceled. You can try again anytime.", "info");
      // Clean up URL
      window.history.replaceState({}, document.title, '/pricing');
    }

    // Fetch user plan and credits if logged in
    if (user?.uid) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user?.uid) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentPlan(userData.plan || 'free');
        setUserCredits(userData.credits ?? null);
      } else {
        setCurrentPlan('free');
        setUserCredits(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setCurrentPlan('free');
    }
  };

  const handleCheckout = async (productId: 'credit_pack_9_99' | 'pro_subscription_29_99') => {
    if (!user) {
      showAlert("Sign In Required", "Please sign in to purchase a plan or credits.", "info");
      navigate('/signin', { state: { from: '/pricing', returnTo: '/pricing' } });
      return;
    }

    if (!user.email || !user.uid) {
      showAlert("Error", "User information not available. Please try again.", "error");
      return;
    }

    setIsLoading(true);
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
          productId: productId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      showAlert("Error", error.message || 'Failed to start checkout. Please try again.', "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.uid) {
      showAlert("Sign In Required", "Please sign in to manage your subscription.", "info");
      navigate('/signin', { state: { from: '/pricing', returnTo: '/pricing' } });
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/createCustomerPortalSession'
        : 'http://localhost:3000/createCustomerPortalSession';
      
      const returnUrl = window.location.origin + '/pricing';
      
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
      showAlert("Error", "Failed to open subscription management. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout metaTitle="Pricing - SmartFormAI Agents" metaDescription="Choose the perfect plan for your needs. Free plan available. Upgrade to Pro for unlimited AI agents and advanced features.">
      <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-semibold text-black mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-black/60 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start free, upgrade anytime.
            </p>
            {user && currentPlan && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#7B3FE4]/5 border border-[#7B3FE4]/20 rounded-lg">
                <span className="text-sm text-black">
                  Current Plan: <span className="font-medium text-[#7B3FE4] capitalize">{currentPlan}</span>
                  {userCredits !== null && currentPlan === 'free' && (
                    <span className="ml-2">• {userCredits} credits</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Free Plan */}
            <Card className="border border-black/10 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-semibold text-black mb-2">Free</CardTitle>
                <div className="mb-2">
                  <span className="text-4xl font-semibold text-black">$0</span>
                  <span className="text-black/60 text-sm ml-1">/month</span>
                </div>
                <p className="text-sm text-black/60">Perfect for exploring</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-black/70">View existing agents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-black/70">Basic AI features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-black/70">Community support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-black/70">Limited credits</span>
                  </li>
                </ul>
                
                {user ? (
                  currentPlan === 'free' ? (
                    <Button 
                      variant="outline" 
                      className="w-full border-black/10 hover:bg-black/5"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full border-black/10 hover:bg-black/5"
                      onClick={() => navigate('/signup')}
                    >
                      Get Started
                    </Button>
                  )
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full border-black/10 hover:bg-black/5"
                    onClick={() => navigate('/signup')}
                  >
                    Get Started
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-[#7B3FE4] relative hover:shadow-xl transition-shadow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#7B3FE4] text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-[#7B3FE4]" />
                  <CardTitle className="text-2xl font-semibold text-black">Pro</CardTitle>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-semibold text-black">€14.99</span>
                  <span className="text-black/60 text-sm ml-1">/month</span>
                </div>
                <p className="text-sm text-black/60">Full access to all features</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-black">Unlimited AI Agents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BarChart3 className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-black">Full Analytics Access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-black">Advanced Security</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Infinity className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-black">Unlimited Responses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-black">Priority Support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-black">No credit deductions</span>
                  </li>
                </ul>
                
                {user ? (
                  currentPlan === 'pro' ? (
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
                        onClick={handleManageSubscription}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Loading...' : 'Manage Subscription'}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-[#7B3FE4] hover:bg-[#6B35D0] text-white shadow-sm hover:shadow-md transition-shadow"
                      onClick={() => handleCheckout('pro_subscription_29_99')}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Upgrade to Pro'}
                    </Button>
                  )
                ) : (
                  <Button 
                    className="w-full bg-[#7B3FE4] hover:bg-[#6B35D0] text-white shadow-sm hover:shadow-md transition-shadow"
                    onClick={() => navigate('/signup', { state: { from: '/pricing', returnTo: '/pricing' } })}
                  >
                    Get Started
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Credit Pack */}
            <Card className="border border-black/10 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CreditCard className="h-6 w-6 text-[#7B3FE4]" />
                  <CardTitle className="text-2xl font-semibold text-black">Credit Pack</CardTitle>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-semibold text-black">€9.99</span>
                </div>
                <p className="text-sm text-black/60">One-time purchase</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-black/70">40 credits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-black/70">Use for AI features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-black/70">Never expires</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-black/70">Perfect for occasional use</span>
                  </li>
                </ul>
                
                {user ? (
                  <Button 
                    className="w-full bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
                    onClick={() => handleCheckout('credit_pack_9_99')}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Buy Credits'}
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
                    onClick={() => navigate('/signin', { state: { from: '/pricing', returnTo: '/pricing' } })}
                  >
                    Sign In to Purchase
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-black text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="bg-white border border-black/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-2">What's included in the Free plan?</h3>
                <p className="text-sm text-black/60">
                  The free plan includes basic features to explore SmartFormAI Agents. You can view existing agents, use basic AI features, and get community support. Credits are limited and can be purchased separately.
                </p>
              </div>
              
              <div className="bg-white border border-black/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-2">What's the difference between Credit Pack and Pro?</h3>
                <p className="text-sm text-black/60">
                  Credit Pack is a one-time purchase of 40 credits that never expire. Perfect for occasional use. Pro is a monthly subscription that gives you unlimited access to all features without any credit deductions.
                </p>
              </div>
              
              <div className="bg-white border border-black/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-2">Can I cancel my Pro subscription anytime?</h3>
                <p className="text-sm text-black/60">
                  Yes! You can cancel your Pro subscription at any time. You'll continue to have access until the end of your billing period. No questions asked.
                </p>
              </div>
              
              <div className="bg-white border border-black/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-2">What payment methods do you accept?</h3>
                <p className="text-sm text-black/60">
                  We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor.
                </p>
              </div>
              
              <div className="bg-white border border-black/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-2">Do you offer refunds?</h3>
                <p className="text-sm text-black/60">
                  We offer a 14-day money-back guarantee for Pro subscriptions. If you're not satisfied, contact us within 14 days for a full refund. Credit packs are non-refundable but never expire.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-br from-[#7B3FE4]/10 to-white border border-[#7B3FE4]/20 rounded-xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-black mb-3">Still have questions?</h2>
              <p className="text-black/60 mb-6">
                Our team is here to help. Contact us anytime.
              </p>
              <Button 
                variant="outline"
                className="border-[#7B3FE4] text-[#7B3FE4] hover:bg-[#7B3FE4] hover:text-white"
                onClick={() => navigate('/contact')}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;

