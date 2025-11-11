import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Zap, BarChart3, Shield, Infinity, CreditCard, ArrowRight, X, Crown, Brain, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useAlert } from '../components/AlertProvider';
import { db } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  useEffect(() => {
    // Check for canceled payment
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('canceled') === 'true') {
      showAlert("Payment Canceled", "Your payment was canceled. You can try again anytime.", "warning");
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

  const handleCheckout = async (productId: 'credit_pack_9_99' | 'pro_subscription_14_99') => {
    if (!user) {
      showAlert("Sign In Required", "Please sign in to purchase a plan or credits.", "warning");
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
      showAlert("Sign In Required", "Please sign in to manage your subscription.", "warning");
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
    <Layout metaTitle="Pricing - SmartFormAI Agents" metaDescription="AI-powered surveys 10x cheaper than Typeform. Choose credits or Pro subscription for unlimited access.">
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Fair Pricing
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that works for you. Start free, upgrade when you're ready.
          </p>
          
          {user && currentPlan && (
            <div className="mt-6 inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border">
              <div className={`w-2 h-2 rounded-full ${currentPlan === 'pro' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                Current plan: {currentPlan === 'pro' ? 'Pro' : 'Pay-as-you-go'}
                {userCredits !== null && currentPlan !== 'pro' && (
                  <span className="ml-2 text-blue-600 font-semibold">{userCredits} credits</span>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-10 relative z-10">

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
            {/* Credit Pack */}
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors rounded-xl">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl font-semibold text-gray-900">Credit Pack</CardTitle>
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                    Pay-as-you-go
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-gray-900">$9.99</span>
                  <span className="text-gray-500">for 40 credits</span>
                </div>
                <p className="text-gray-600 text-sm">Perfect for occasional use. Credits never expire.</p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Build AI agents (8 credits each)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Rebuild & improve (6 credits each)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">AI insights (10 credits each)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Credits never expire</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleCheckout('credit_pack_9_99')}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg"
                >
                  {isLoading ? 'Processing...' : 'Buy Credits'}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="absolute top-4 right-4">
                <Badge className="bg-purple-600 text-white font-medium px-3 py-1">
                  Most Popular
                </Badge>
              </div>
              
              <CardHeader className="pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-xl font-semibold text-gray-900">Pro Plan</CardTitle>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-gray-900">$14.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-gray-600 text-sm">Unlimited access to everything. 70% cheaper than Typeform.</p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Unlimited AI agents & rebuilds</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">AI Insight Engine access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">20 AI summaries per month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Auto-Rebuild feature</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Priority support</span>
                  </div>
                </div>
                
                {user ? (
                  currentPlan === 'pro' ? (
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg"
                      onClick={handleManageSubscription}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Loading...' : 'Manage Subscription'}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg"
                      onClick={() => handleCheckout('pro_subscription_14_99')}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Upgrade to Pro'}
                    </Button>
                  )
                ) : (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg"
                    onClick={() => navigate('/signup', { state: { from: '/pricing', returnTo: '/pricing' } })}
                  >
                    Get Started
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Price Comparison Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Why SmartFormAI Wins 💡</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Why pay $59/month for old tools when you can have self-learning survey agents for $14.99?
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-50 to-pink-50">
                        <th className="text-left p-6 font-semibold text-gray-900">Feature</th>
                        <th className="text-center p-6 font-bold text-purple-600 bg-purple-100">
                          <div className="flex items-center justify-center gap-2">
                            <Crown className="h-5 w-5" />
                            SmartFormAI
                          </div>
                        </th>
                        <th className="text-center p-6 font-semibold text-gray-600">Typeform</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50">
                        <td className="p-6 font-medium text-gray-900">AI-Generated Surveys</td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                            <Check className="h-5 w-5" />
                            Included
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-red-500 font-semibold">
                            <X className="h-5 w-5" />
                            Manual only
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-6 font-medium text-gray-900">Auto-Rebuild Surveys</td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                            <Check className="h-5 w-5" />
                            Yes
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-red-500 font-semibold">
                            <X className="h-5 w-5" />
                            No
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-6 font-medium text-gray-900">AI Insights + Summary</td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                            <Check className="h-5 w-5" />
                            Included
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-red-500 font-semibold">
                            <X className="h-5 w-5" />
                            Limited
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 bg-purple-50">
                        <td className="p-6 font-bold text-gray-900">Monthly Price</td>
                        <td className="p-6 text-center">
                          <div className="text-2xl font-bold text-purple-600">$14.99</div>
                          <div className="text-sm text-purple-600">70% cheaper</div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="text-2xl font-bold text-red-500">$59+</div>
                          <div className="text-sm text-gray-500">Enterprise pricing</div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-6 font-medium text-gray-900">One-Time Credits Option</td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                            <Check className="h-5 w-5" />
                            Flexible
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-red-500 font-semibold">
                            <X className="h-5 w-5" />
                            None
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-6 font-medium text-gray-900">Data Privacy</td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                            <Check className="h-5 w-5" />
                            100% User-Owned
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-red-500 font-semibold">
                            <X className="h-5 w-5" />
                            Vendor-Tracked
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-6 font-medium text-gray-900">True AI Agents</td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                            <Check className="h-5 w-5" />
                            Yes
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-red-500 font-semibold">
                            <X className="h-5 w-5" />
                            No
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-lg text-gray-600 mb-6">
                Join 1,000+ creators automating their research with SmartFormAI Agents.
              </p>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => navigate('/signup')}
              >
                Start Building Smarter Surveys →
              </Button>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Quick Questions</h2>
              <p className="text-xl text-gray-600">Everything you need to know about SmartFormAI pricing</p>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  id: 'credits',
                  question: 'What are credits?',
                  answer: 'Credits are our pay-as-you-go currency. Use 8 credits to build an agent, 6 to rebuild, or 10 for an AI summary. Perfect for occasional users who want flexibility without monthly commitments.'
                },
                {
                  id: 'pro-plan',
                  question: "What's included in the Pro plan?",
                  answer: 'Pro gives you unlimited agent builds, rebuilds, and access to the AI Insight Engine. You also get 20 AI summaries per month, Auto-Rebuild features, and priority support. No credit deductions ever.'
                },
                {
                  id: 'switch',
                  question: 'Can I switch between plans later?',
                  answer: 'Absolutely! You can upgrade from credits to Pro anytime, or downgrade when your subscription ends. Your credits never expire, so you can always fall back to pay-as-you-go.'
                },
                {
                  id: 'cancel',
                  question: 'Can I cancel anytime?',
                  answer: 'Yes! Pro subscriptions can be canceled anytime with no questions asked. You keep access until your billing period ends, then you can continue using credits if you have any.'
                },
                {
                  id: 'refunds',
                  question: 'Do you offer refunds?',
                  answer: 'We offer a 14-day money-back guarantee for Pro subscriptions. Credit packs are non-refundable since they never expire, but we stand behind our service quality.'
                }
              ].map((faq) => (
                <Collapsible key={faq.id} open={openFaq === faq.id} onOpenChange={(isOpen) => setOpenFaq(isOpen ? faq.id : null)}>
                  <CollapsibleTrigger asChild>
                    <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-purple-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                          {openFaq === faq.id ? (
                            <ChevronUp className="h-5 w-5 text-purple-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-6 pb-6 -mt-2">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="text-center">
            <Card className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white border-0 rounded-2xl overflow-hidden shadow-2xl">
              <CardContent className="p-12">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-3xl font-bold mb-4">Ready to build smarter surveys?</h2>
                  <p className="text-purple-100 text-lg mb-8 leading-relaxed">
                    Join thousands of creators who've ditched expensive survey tools for AI agents that actually think.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button 
                      className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={() => navigate('/signup')}
                    >
                      Start Free Trial
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl"
                      onClick={() => navigate('/contact')}
                    >
                      Talk to Sales
                    </Button>
                  </div>
                  
                  <div className="mt-8 flex items-center justify-center gap-6 text-sm text-purple-200">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <span>No hidden fees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <span>Cancel anytime</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <span>14-day guarantee</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;

