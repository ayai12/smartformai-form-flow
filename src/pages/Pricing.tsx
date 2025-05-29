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

  return (
    <div className="py-12 md:py-20 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Pricing Plans</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Find the plan that best suits your needs.
        </p>
      </div>

      {/* Billing Toggle */}
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
            
            {/* AI Requests Badge */}
            <div className="bg-[#00D084]/10 rounded-lg p-3 mb-6 text-center">
              <span className="text-[#00D084] font-bold text-xl">{SUBSCRIPTION_PLANS.free.aiRequestsLimit}</span>
              <p className="text-sm text-gray-700 font-medium">AI Requests / month</p>
            </div>
            
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Included Features:</p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Up to 20 active forms</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">{SUBSCRIPTION_PLANS.free.aiRequestsLimit} AI-generated forms / month</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Core AI features</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Basic question types</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Access to analytics dashboard</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#00D084] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Community support</span>
              </li>
            </ul>
            
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">What You're Missing:</p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <X className="h-4 w-4 text-gray-300 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-500">Unlimited forms</span>
              </li>
              <li className="flex items-start">
                <X className="h-4 w-4 text-gray-300 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-500">More than {SUBSCRIPTION_PLANS.free.aiRequestsLimit} AI requests/month</span>
              </li>
              <li className="flex items-start">
                <X className="h-4 w-4 text-gray-300 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-500">Advanced analytics (graphs, filters)</span>
              </li>
              <li className="flex items-start">
                <X className="h-4 w-4 text-gray-300 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-500">Exporting responses (JSON)</span>
              </li>
            </ul>
            
            <div className="mt-auto">
              <Button 
                className="w-full bg-[#00D084] hover:bg-[#00D084]/90 text-white rounded-md transform transition-transform hover:-translate-y-1"
                asChild
              >
                <Link to="/signup">Get Started Free</Link>
              </Button>
              
              <p className="text-center text-xs mt-3 text-gray-500">
                Ready for more power? Upgrade to Starter or Pro for extra features.
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
            
            {/* AI Requests Badge */}
            <div className="bg-[#FF9500]/10 rounded-lg p-3 mb-6 text-center">
              <span className="text-[#FF9500] font-bold text-xl">{SUBSCRIPTION_PLANS.starter.monthly.aiRequestsLimit}</span>
              <p className="text-sm text-gray-700 font-medium">AI Requests / month</p>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">Everything in Free, plus:</p>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#FF9500] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">50 active forms</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#FF9500] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">{SUBSCRIPTION_PLANS.starter.monthly.aiRequestsLimit} AI-generated forms / month</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#FF9500] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Basic data export (JSON only)</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#FF9500] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Basic analytics with charts</span>
              </li>
            </ul>
            
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">What You're Missing:</p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <X className="h-4 w-4 text-gray-300 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-500">Unlimited forms</span>
              </li>
              <li className="flex items-start">
                <X className="h-4 w-4 text-gray-300 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-500">Advanced analytics (filters, trends)</span>
              </li>
              <li className="flex items-start">
                <X className="h-4 w-4 text-gray-300 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-500">SmartFormAI branding removal</span>
              </li>
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
                Great for casual users and testers who outgrow the Free Plan.
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
            
            <p className="text-sm text-gray-600 mb-6">For serious form builders who want full control, better insights, and zero limits.</p>
            
            {/* AI Requests Badge */}
            <div className="bg-[#0066CC]/10 rounded-lg p-3 mb-6 text-center">
              <span className="text-[#0066CC] font-bold text-xl">{SUBSCRIPTION_PLANS.pro.monthly.aiRequestsLimit}</span>
              <p className="text-sm text-gray-700 font-medium">AI Requests / month</p>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">Everything in Starter, plus:</p>
            
            <ul className="space-y-2 mb-10">
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Unlimited active forms</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">{SUBSCRIPTION_PLANS.pro.monthly.aiRequestsLimit} AI-generated forms / month</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Remove SmartFormAI branding</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Advanced analytics & filters</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Export data (JSON, CSV coming soon)</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-[#0066CC] mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Priority support (faster replies)</span>
              </li>
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
                Perfect for creators, educators, and solo professionals.
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
                <td className="py-4 px-6 text-sm border-b font-medium">AI Requests per month</td>
                <td className="py-4 px-6 text-sm text-center border-b">{SUBSCRIPTION_PLANS.free.aiRequestsLimit}</td>
                <td className="py-4 px-6 text-sm text-center border-b">{SUBSCRIPTION_PLANS.starter.monthly.aiRequestsLimit}</td>
                <td className="py-4 px-6 text-sm text-center border-b font-medium text-[#0066CC]">{SUBSCRIPTION_PLANS.pro.monthly.aiRequestsLimit}</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm border-b">Active forms</td>
                <td className="py-4 px-6 text-sm text-center border-b">Up to 20</td>
                <td className="py-4 px-6 text-sm text-center border-b">Up to 50</td>
                <td className="py-4 px-6 text-sm text-center border-b font-medium text-[#0066CC]">Unlimited</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm border-b">AI-generated forms</td>
                <td className="py-4 px-6 text-sm text-center border-b">{SUBSCRIPTION_PLANS.free.aiRequestsLimit} per month</td>
                <td className="py-4 px-6 text-sm text-center border-b">{SUBSCRIPTION_PLANS.starter.monthly.aiRequestsLimit} per month</td>
                <td className="py-4 px-6 text-sm text-center border-b font-medium text-[#0066CC]">{SUBSCRIPTION_PLANS.pro.monthly.aiRequestsLimit} per month</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm border-b">Analytics</td>
                <td className="py-4 px-6 text-sm text-center border-b">Basic</td>
                <td className="py-4 px-6 text-sm text-center border-b">With charts</td>
                <td className="py-4 px-6 text-sm text-center border-b font-medium text-[#0066CC]">Advanced with filters</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm border-b">Data export</td>
                <td className="py-4 px-6 text-center border-b">
                  <X className="h-5 w-5 text-gray-300 mx-auto" />
                </td>
                <td className="py-4 px-6 text-sm text-center border-b">JSON only</td>
                <td className="py-4 px-6 text-sm text-center border-b font-medium text-[#0066CC]">JSON, CSV coming soon</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm border-b">Remove branding</td>
                <td className="py-4 px-6 text-center border-b">
                  <X className="h-5 w-5 text-gray-300 mx-auto" />
                </td>
                <td className="py-4 px-6 text-center border-b">
                  <X className="h-5 w-5 text-gray-300 mx-auto" />
                </td>
                <td className="py-4 px-6 text-center border-b">
                  <Check className="h-5 w-5 text-[#0066CC] mx-auto" />
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-sm">Support</td>
                <td className="py-4 px-6 text-sm text-center">Community</td>
                <td className="py-4 px-6 text-sm text-center">Community</td>
                <td className="py-4 px-6 text-sm text-center font-medium text-[#0066CC]">Priority</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
