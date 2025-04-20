
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for individuals and small projects",
      features: [
        "Unlimited forms",
        "Unlimited responses",
        "Core AI features",
        "Basic templates",
        "Standard support",
      ],
      limitations: [
        "SmartFormAI branding",
        "Basic analytics only",
        "No custom domains",
      ],
      cta: "Sign Up Free",
      ctaLink: "/signup",
      popular: false,
    },
    {
      name: "Plus",
      price: "$29",
      period: "/mo",
      description: "Ideal for professionals and growing businesses",
      features: [
        "Everything in Free",
        "1,000 AI responses/mo",
        "Remove branding",
        "Advanced analytics",
        "Custom domains",
        "Priority support",
        "Advanced templates",
        "Team collaboration",
      ],
      cta: "Start 14-Day Trial",
      ctaLink: "/signup?plan=plus",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For organizations with advanced needs",
      features: [
        "Everything in Plus",
        "Unlimited AI responses",
        "Custom integrations",
        "Dedicated account manager",
        "SSO authentication",
        "SLA guarantee",
        "Advanced security",
        "Custom AI training",
      ],
      cta: "Contact Sales",
      ctaLink: "/contact",
      popular: false,
    }
  ];

  return (
    <section className="py-16 md:py-24" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that works for you, with no hidden fees or surprises.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative rounded-2xl overflow-hidden ${
                plan.popular 
                  ? 'border-2 border-smartform-blue shadow-lg transform md:-translate-y-4' 
                  : 'border border-gray-200 shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 bg-smartform-blue text-white text-xs font-semibold py-1 text-center">
                  MOST POPULAR
                </div>
              )}
              
              <div className={`p-6 ${plan.popular ? 'pt-8' : ''}`}>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-gray-600 ml-1">{plan.period}</span>}
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <Button 
                  className={`w-full mb-6 ${
                    plan.popular 
                      ? 'bg-smartform-blue hover:bg-blue-700' 
                      : index === 0 
                        ? 'bg-white border-2 border-smartform-blue text-smartform-blue hover:bg-blue-50' 
                        : 'bg-smartform-violet hover:bg-purple-700'
                  }`} 
                  variant={index === 0 ? "outline" : "default"}
                  asChild
                >
                  <Link to={plan.ctaLink}>{plan.cta}</Link>
                </Button>
                
                <div className="space-y-4">
                  <p className="font-medium">Features include:</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <svg className="w-5 h-5 text-smartform-green mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.limitations && (
                    <ul className="space-y-3 border-t border-gray-200 pt-4 mt-4">
                      {plan.limitations.map((limitation, i) => (
                        <li key={i} className="flex items-start">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                          <span className="text-gray-500">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-8 md:mb-0 md:pr-8">
                <h3 className="text-2xl font-bold mb-4">Need a custom solution?</h3>
                <p className="text-gray-600 mb-6">
                  We offer tailored plans for businesses with specific requirements. Our enterprise solutions include custom integrations, dedicated support, and advanced security features.
                </p>
                <Button className="bg-smartform-blue hover:bg-blue-700" asChild>
                  <Link to="/contact">Contact Our Sales Team</Link>
                </Button>
              </div>
              <div className="md:w-1/3">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center mb-4">
                    <svg className="w-10 h-10 text-smartform-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <div className="ml-4">
                      <h4 className="font-semibold">Email Us</h4>
                      <p className="text-gray-600 text-sm">sales@smartformai.com</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-10 h-10 text-smartform-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    <div className="ml-4">
                      <h4 className="font-semibold">Call Us</h4>
                      <p className="text-gray-600 text-sm">+1 (800) 123-4567</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
