import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAlert } from '@/components/AlertProvider';
import { SUBSCRIPTION_PLANS } from '@/firebase/stripeConfig';
import Layout from '@/components/layout/Layout';

interface PricingSectionProps {
  isAuthenticated?: boolean;
}

const Pricing: React.FC<PricingSectionProps> = ({ isAuthenticated }) => {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();
  const { createSubscription } = useSubscription();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  
  // Calculate annual prices (10 months instead of 12)
  const getAnnualPrice = (monthlyPrice: number) => {
    return monthlyPrice * 10;
  };
  
  // Monthly prices
  const prices = {
    starter: SUBSCRIPTION_PLANS.starter.monthly.price,
    pro: SUBSCRIPTION_PLANS.pro.monthly.price
  };
  
  // Handle subscription button click
  const handleSubscribeClick = async (planId: string) => {
    // Set loading state for the specific plan
    setLoading(prev => ({ ...prev, [planId]: true }));
    
    try {
      // If user is not authenticated, redirect to signup with plan info
      if (!user) {
        navigate('/signup', { 
          state: { 
            selectedPlan: planId, 
            billingCycle: billing,
            // Generate a temporary token to validate this selection when they return
            subscriptionToken: `${planId}_${billing}_${Date.now()}`
          }
        });
        return;
      }
      
      // User is authenticated, create checkout session
      const result = await createSubscription(planId, billing);
      
      if (!result.success) {
        console.error('Error creating subscription:', result.error);
        showAlert('Error', result.error || 'Failed to create subscription. Please try again.', 'error');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      // Show more detailed error message
      const errorMessage = error.message || 'Failed to process subscription request.';
      showAlert('Error', `Subscription error: ${errorMessage}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, [planId]: false }));
    }
  };

  // Pricing content (extracted for conditional layout)
  const pricingContent = (
    <div className="py-12 md:py-20 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Pricing Plans</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Every plan gives you full access to all SmartFormAI features.<br />
          Just buy tokens as you need them. No feature gating, no upsells.<br />
          <span className="text-green-600 font-semibold">We offer 50% more responses than Typeform for less.</span>
        </p>
      </div>

      {/* Billing Toggle (optional, can keep or remove) */}
      <div className="flex justify-center items-center space-x-4 mb-12">
        <span className={`text-sm ${billing === 'monthly' ? 'font-medium text-[#0066CC]' : 'text-gray-500'}`}>Monthly</span>
        <Switch 
          checked={billing === 'annual'} 
          onCheckedChange={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
          className="data-[state=checked]:bg-[#0066CC]"
        />
        <div className="flex items-center">
          <span className={`text-sm ${billing === 'annual' ? 'font-medium text-[#0066CC]' : 'text-gray-500'}`}>Annual</span>
          <Badge className="ml-2 bg-[#00D084] text-white text-xs">2 months free</Badge>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto relative">
        {/* Free Plan */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full md:translate-y-8">
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-[#00D084]/20 flex items-center justify-center mr-3">
                <div className="w-3 h-3 rounded-full bg-[#00D084]"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Free Plan</h3>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-gray-500 ml-1 text-sm">/ month</span>
            </div>
            <p className="text-sm text-gray-600 mb-6">For creators just getting started with AI-powered forms.</p>
            <div className="bg-[#00D084]/10 rounded-lg p-3 mb-6 text-center">
              <span className="text-[#00D084] font-bold text-xl">10</span>
              <p className="text-sm text-gray-700 font-medium">Tokens included</p>
            </div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Everything included:</p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start"><Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">AI-powered form & survey generation</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Instant publishing & sharing</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Embed forms anywhere</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Live analytics & charts</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Export responses (JSON, CSV coming soon)</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">No feature gating — all features unlocked</span></li>
            </ul>
            <div className="mt-auto">
              <Button 
                className="w-full bg-[#00D084] hover:bg-[#00D084]/90 text-white rounded-md transform transition-transform hover:-translate-y-1"
                asChild
              >
                <Link to="/signup">Get Started Free</Link>
              </Button>
              <p className="text-center text-xs mt-3 text-gray-500">
                Need more? Buy tokens anytime.
              </p>
            </div>
          </div>
        </div>
        {/* Starter Plan */}
        <div className="bg-white rounded-xl border-2 border-[#FF9500] shadow-md overflow-hidden relative h-full md:translate-y-4">
          <div className="absolute top-0 inset-x-0 bg-[#FF9500] text-white text-xs font-medium py-1 text-center">
            New Plan
          </div>
          <div className="p-6 pt-8 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-[#FF9500]/20 flex items-center justify-center mr-3">
                <div className="w-3 h-3 rounded-full bg-[#FF9500]"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Starter Plan</h3>
            </div>
            <div className="mb-4">
              {billing === 'monthly' ? (
                <>
                  <span className="text-3xl font-bold">${prices.starter}</span>
                  <span className="text-gray-500 ml-1 text-sm">/ month</span>
                </>
              ) : (
                <div>
                  <div className="flex items-baseline">
                    <span className="text-gray-400 line-through mr-2">${prices.starter * 12}/yr</span>
                    <span className="text-3xl font-bold">${getAnnualPrice(prices.starter)}</span>
                    <span className="text-gray-500 ml-1 text-sm">/ year</span>
                  </div>
                  <p className="text-sm text-[#00D084] mt-1">
                    ${(getAnnualPrice(prices.starter) / 12).toFixed(2)}/mo · 2 months free
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-6">For light users who want a little more freedom without the full commitment.</p>
            <div className="bg-[#FF9500]/10 rounded-lg p-3 mb-6 text-center">
              <span className="text-[#FF9500] font-bold text-xl">30</span>
              <p className="text-sm text-gray-700 font-medium">Tokens included</p>
            </div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Everything included:</p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start"><Check className="h-4 w-4 text-[#FF9500] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">AI-powered form & survey generation</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#FF9500] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Instant publishing & sharing</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#FF9500] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Embed forms anywhere</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#FF9500] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Live analytics & charts</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#FF9500] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Export responses (JSON, CSV coming soon)</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#FF9500] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">No feature gating — all features unlocked</span></li>
            </ul>
            <div className="mt-auto">
              <Button 
                className="w-full bg-[#FF9500] hover:bg-[#FF9500]/90 text-white rounded-md transform transition-transform hover:-translate-y-1 hover:shadow-lg"
                onClick={() => handleSubscribeClick('starter')}
                disabled={loading['starter']}
              >
                {loading['starter'] ? 'Processing...' : 'Get Started'}
              </Button>
              <p className="text-center text-xs mt-3 text-gray-500">
                Need more? Buy tokens anytime.
              </p>
            </div>
          </div>
        </div>
        {/* Pro Plan */}
        <div className="bg-white rounded-xl border-2 border-[#0066CC] shadow-lg overflow-hidden relative md:scale-105 z-10 h-full">
          <div className="absolute top-0 inset-x-0 bg-[#0066CC] text-white text-xs font-medium py-1 text-center">
            Most Popular
          </div>
          <div className="p-6 pt-8 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-[#0066CC]/20 flex items-center justify-center mr-3">
                <div className="w-3 h-3 rounded-full bg-[#0066CC]"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Pro Plan</h3>
            </div>
            <div className="mb-4">
              {billing === 'monthly' ? (
                <>
                  <span className="text-3xl font-bold">${prices.pro}</span>
                  <span className="text-gray-500 ml-1 text-sm">/ month</span>
                </>
              ) : (
                <div>
                  <div className="flex items-baseline">
                    <span className="text-gray-400 line-through mr-2">${prices.pro * 12}/yr</span>
                    <span className="text-3xl font-bold">${getAnnualPrice(prices.pro)}</span>
                    <span className="text-gray-500 ml-1 text-sm">/ year</span>
                  </div>
                  <p className="text-sm text-[#00D084] mt-1">
                    ${(getAnnualPrice(prices.pro) / 12).toFixed(2)}/mo · 2 months free
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-6">For power users who want the best value and the most tokens.</p>
            <div className="bg-[#0066CC]/10 rounded-lg p-3 mb-6 text-center">
              <span className="text-[#0066CC] font-bold text-xl">150</span>
              <p className="text-sm text-gray-700 font-medium">Tokens included</p>
            </div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Everything included:</p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start"><Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">AI-powered form & survey generation</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Instant publishing & sharing</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Embed forms anywhere</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Live analytics & charts</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">Export responses (JSON, CSV coming soon)</span></li>
              <li className="flex items-start"><Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm text-gray-600">No feature gating — all features unlocked</span></li>
            </ul>
            <div className="mt-auto">
              <Button 
                className="w-full bg-[#0066CC] hover:bg-[#0066CC]/90 text-white rounded-md transform transition-transform hover:-translate-y-1 hover:shadow-xl"
                onClick={() => handleSubscribeClick('pro')}
                disabled={loading['pro']}
              >
                {loading['pro'] ? 'Processing...' : 'Get Started'}
              </Button>
              <p className="text-center text-xs mt-3 text-gray-500">
                Need more? Buy tokens anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="mt-20 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Compare features</h2>
        
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-4 px-6 text-gray-700 font-semibold border-b">Feature</th>
                <th className="text-center py-4 px-6 text-gray-700 font-semibold border-b">
                  <div className="flex flex-col items-center">
                    <span className="h-2 w-2 rounded-full bg-[#00D084] mb-2"></span>
                    <span>Free</span>
                  </div>
                </th>
                <th className="text-center py-4 px-6 text-gray-700 font-semibold border-b">
                  <div className="flex flex-col items-center">
                    <span className="h-2 w-2 rounded-full bg-[#FF9500] mb-2"></span>
                    <span>Starter</span>
                  </div>
                </th>
                <th className="text-center py-4 px-6 text-gray-700 font-semibold border-b">
                  <div className="flex flex-col items-center">
                    <span className="h-2 w-2 rounded-full bg-[#0066CC] mb-2"></span>
                    <span>Pro</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm border-b">AI Requests per month</td>
                <td className="py-4 px-6 text-sm text-center border-b">10</td>
                <td className="py-4 px-6 text-sm text-center border-b">30</td>
                <td className="py-4 px-6 text-sm text-center border-b font-medium text-[#0066CC]">150</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm border-b">Active forms</td>
                <td className="py-4 px-6 text-sm text-center border-b">Unlimited</td>
                <td className="py-4 px-6 text-sm text-center border-b">Unlimited</td>
                <td className="py-4 px-6 text-sm text-center border-b font-medium text-[#0066CC]">Unlimited</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm border-b">AI-generated forms</td>
                <td className="py-4 px-6 text-sm text-center border-b">10 per month</td>
                <td className="py-4 px-6 text-sm text-center border-b">30 per month</td>
                <td className="py-4 px-6 text-sm text-center border-b font-medium text-[#0066CC]">150 per month</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm border-b">Analytics</td>
                <td className="py-4 px-6 text-sm text-center border-b">Advanced with filters</td>
                <td className="py-4 px-6 text-sm text-center border-b">Advanced with filters</td>
                <td className="py-4 px-6 text-sm text-center border-b font-medium text-[#0066CC]">Advanced with filters</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm border-b">Data export</td>
                <td className="py-4 px-6 text-sm text-center border-b">JSON, CSV coming soon</td>
                <td className="py-4 px-6 text-sm text-center border-b">JSON, CSV coming soon</td>
                <td className="py-4 px-6 text-sm text-center border-b font-medium text-[#0066CC]">JSON, CSV coming soon</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm border-b">Remove branding</td>
                <td className="py-4 px-6 text-sm text-center border-b"></td>
                <td className="py-4 px-6 text-sm text-center border-b"></td>
                <td className="py-4 px-6 text-sm text-center border-b font-medium text-[#0066CC]">Coming soon</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm">Support</td>
                <td className="py-4 px-6 text-sm text-center">Priority</td>
                <td className="py-4 px-6 text-sm text-center">Priority</td>
                <td className="py-4 px-6 text-sm text-center font-medium text-[#0066CC]">Priority</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (user) {
    // User is signed in: show Back to Dashboard button, no Layout
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="w-full flex justify-start p-6">
          <Button asChild>
            <Link to="/dashboard">
              ← Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="flex-grow">
          {pricingContent}
        </div>
      </div>
    );
  }

  // Not signed in: show normal Layout
  return (
    <Layout>
      {pricingContent}
    </Layout>
  );
};

export default Pricing;
