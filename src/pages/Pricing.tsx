import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, BrainCircuit, BarChart3, Zap, Shield, Infinity, CreditCard } from 'lucide-react';
import { useAlert } from '@/components/AlertProvider';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchaseCreditPack = async () => {
    // Require authentication
    if (!user) {
      navigate('/signup', { state: { from: '/pricing', returnTo: '/pricing' } });
      return;
    }

    if (!user.uid || !user.email) {
      showAlert('Authentication Error', 'Please sign in again to continue', 'error');
      navigate('/signin');
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/createCheckoutSession'
        : 'http://localhost:3000/createCheckoutSession';

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
          productId: 'credit_pack_9_99'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to create checkout session (${response.status})`);
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      showAlert('Error', error.message || 'Failed to start checkout. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    // Require authentication - redirect to signup (which has sign-in link)
    if (!user) {
      navigate('/signup', { state: { from: '/pricing', returnTo: '/pricing' } });
      return;
    }

    // Validate user has required data
    if (!user.uid || !user.email) {
      showAlert('Authentication Error', 'Please sign in again to continue', 'error');
      navigate('/signin');
      return;
    }

    setIsLoading(true);
    try {
      // Get API URL - use production URL in production, localhost in development
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

      // Get error details from response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Checkout session error:', errorData);
        throw new Error(errorData.error || `Failed to create checkout session (${response.status})`);
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      const errorMessage = error.message || 'Failed to start checkout. Please try again.';
      showAlert('Error', errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: BrainCircuit, text: 'Unlimited AI Agents' },
    { icon: BarChart3, text: 'Full Analytics Access' },
    { icon: Zap, text: 'Priority Processing' },
    { icon: Shield, text: 'Advanced Security' },
    { icon: Infinity, text: 'Unlimited Responses' },
  ];

  return (
    <Layout
      metaTitle="Pricing - SmartFormAI Agents"
                  metaDescription="Choose the perfect plan for your AI agent needs. Credit packs from €9.99 or Pro plan at €14.99/month."
    >
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-semibold text-black mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-base text-black/60 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Upgrade anytime.
            </p>
          </div>

          {/* Credit Pack Card */}
          <div className="max-w-md mx-auto mb-12">
            <Card className="bg-gradient-to-br from-[#7B3FE4]/5 to-white border-2 border-[#7B3FE4]/30">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-black flex items-center justify-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#7B3FE4]" />
                  Credit Pack
                </CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-semibold text-black">€9.99</span>
                </div>
                <CardDescription className="mt-2 text-black/60">
                  One-time purchase • Get 40 credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-black/60 text-sm">40 credits to use for AI actions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-black/60 text-sm">Train Agent: 3 credits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-black/60 text-sm">Regenerate Questions: 1 credit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-black/60 text-sm">Other AI actions: 1-2 credits each</span>
                  </li>
                </ul>
                {!user ? (
                  <Button 
                    className="w-full mt-6 bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
                    onClick={() => navigate('/signin', { state: { from: '/pricing' } })}
                  >
                    Sign In to Purchase
                  </Button>
                ) : (
                  <Button 
                    className="w-full mt-6 bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
                    onClick={handlePurchaseCreditPack}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Purchase Credit Pack'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-white border border-black/10 hover:border-black/20 transition-colors">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-black">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-semibold text-black">€0</span>
                  <span className="text-black/60">/month</span>
                </div>
                <CardDescription className="mt-2 text-black/60">
                  Perfect for exploring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-black/60 text-sm">8 free credits on signup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-black/60 text-sm">View existing agents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-black/60 text-sm">Basic features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-black/60 text-sm">Community support</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full mt-6 border-black/10 hover:bg-black/5"
                  onClick={() => navigate('/signup')}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-white border-2 border-[#7B3FE4] relative hover:shadow-lg transition-shadow">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7B3FE4] text-white px-3 py-1 text-xs">
                Most Popular
              </Badge>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-black flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#7B3FE4]" />
                  Pro
                </CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-semibold text-black">€14.99</span>
                  <span className="text-black/60">/month</span>
                </div>
                <CardDescription className="mt-2 text-black/60">
                  Full access to all features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <feature.icon className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                      <span className="text-black font-medium text-sm">{feature.text}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-black font-medium text-sm">Create and train AI agents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-black font-medium text-sm">Full analytics dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span className="text-black font-medium text-sm">Priority customer support</span>
                  </li>
                </ul>
                {!user ? (
                  <Button 
                    className="w-full mt-6 bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
                    onClick={() => navigate('/signin', { state: { from: '/pricing' } })}
                  >
                    Sign In to Upgrade
                  </Button>
                ) : (
                  <Button 
                    className="w-full mt-6 bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
                    onClick={handleUpgrade}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Upgrade to Pro'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-black text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-black mb-2">
                  Can I change plans later?
                </h3>
                <p className="text-black/60 text-sm">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-black mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-black/60 text-sm">
                  We accept all major credit cards and debit cards through our secure Stripe payment processor.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-black mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-black/60 text-sm">
                  Yes! Start with our free plan to explore the platform. You can upgrade to Pro anytime.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-black mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-black/60 text-sm">
                  Absolutely. You can cancel your subscription at any time from your profile page. No questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;
