
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Features: React.FC = () => {
  const features = [
    {
      title: "AI-Powered Form Creation",
      description: "Generate entire conversational forms from simple text prompts in seconds.",
      icon: (
        <svg className="w-10 h-10 text-smartform-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      ),
    },
    {
      title: "Dynamic Question Flow",
      description: "Advanced NLP-based branching that adapts questions based on previous answers.",
      icon: (
        <svg className="w-10 h-10 text-smartform-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
        </svg>
      ),
    },
    {
      title: "Unlimited Forms & Responses",
      description: "Free tier includes unlimited responses, forms, and questions forever.",
      icon: (
        <svg className="w-10 h-10 text-smartform-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
        </svg>
      ),
    },
    {
      title: "High Completion Rates",
      description: "Conversational UI drives average completion rates above 85%.",
      icon: (
        <svg className="w-10 h-10 text-smartform-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
    },
    {
      title: "Smart Templates",
      description: "Ready-to-use, industry-tuned templates for HR, education, marketing, and surveys.",
      icon: (
        <svg className="w-10 h-10 text-smartform-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
        </svg>
      ),
    },
    {
      title: "Real-Time AI Suggestions",
      description: "Contextual prompts during form build to optimize questions and flow.",
      icon: (
        <svg className="w-10 h-10 text-smartform-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            SmartFormAI combines advanced AI with intuitive design to revolutionize how you create and manage forms.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-20">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-12 flex items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">Analytics Dashboard</h3>
                  <p className="text-gray-600 mb-6">
                    Gain valuable insights with our comprehensive analytics. Track completion rates, identify drop-off points, and optimize your forms with AI-driven recommendations.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Completion metrics and drop-off analysis",
                      "User behavior patterns and insights",
                      "AI-powered optimization suggestions",
                      "Response time analytics and comparisons"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <svg className="w-5 h-5 text-smartform-green mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-gradient-to-br from-smartform-blue to-smartform-violet p-6 md:p-8 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 w-full max-w-md">
                  <div className="mb-6">
                    <div className="h-6 w-36 bg-white/20 rounded mb-2"></div>
                    <div className="h-4 w-24 bg-white/20 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-20 w-full bg-white/20 rounded-lg"></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-16 bg-white/20 rounded-lg"></div>
                      <div className="h-16 bg-white/20 rounded-lg"></div>
                    </div>
                    <div className="h-32 w-full bg-white/20 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-20 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Multi-Language & Tone Customization</h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Switch between formal/casual tones and localize questions on the fly.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="h-12 w-12 rounded-full bg-smartform-blue/10 text-smartform-blue flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                </svg>
              </div>
              <h4 className="font-bold text-lg mb-2">Multiple Languages</h4>
              <p className="text-gray-600 text-sm">Automatically translate your forms into 50+ languages with a single click.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="h-12 w-12 rounded-full bg-smartform-green/10 text-smartform-green flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
              </div>
              <h4 className="font-bold text-lg mb-2">Tone Adjustment</h4>
              <p className="text-gray-600 text-sm">Easily switch between formal, casual, friendly, or professional tones.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="h-12 w-12 rounded-full bg-smartform-violet/10 text-smartform-violet flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                </svg>
              </div>
              <h4 className="font-bold text-lg mb-2">Cultural Adaptation</h4>
              <p className="text-gray-600 text-sm">Automatically adjust questions to be culturally appropriate for your audience.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
