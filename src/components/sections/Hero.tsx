
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Hero: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      setShowDemo(true);
    }, 1500);
  };

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-8 mb-10 md:mb-0">
            <div className="animate-slide-up">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="text-smartform-blue">Forms</span> that <span className="text-smartform-violet">think</span>.
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8">
                Create AI-powered forms that adapt, respond, and convert better than anything you've seen before.
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-10">
                <Button className="bg-smartform-blue hover:bg-blue-700 text-lg py-6 px-8" size="lg" asChild>
                  <Link to="/signup">Get Started Free</Link>
                </Button>
                <Button variant="outline" className="border-smartform-blue text-smartform-blue hover:bg-smartform-blue hover:text-white text-lg py-6 px-8" size="lg" asChild>
                  <Link to="/templates">See Templates</Link>
                </Button>
              </div>
              
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <svg className="w-5 h-5 text-smartform-green" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>No credit card required</span>
                <span className="mx-2">•</span>
                <svg className="w-5 h-5 text-smartform-green" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>Unlimited forms</span>
                <span className="mx-2">•</span>
                <svg className="w-5 h-5 text-smartform-green" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>Free forever plan</span>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 lg:pl-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in">
              <h3 className="text-xl font-semibold mb-4">See it in action</h3>
              <p className="text-gray-600 mb-6">Type what kind of form you need, and our AI will create it instantly.</p>
              
              <form onSubmit={handlePromptSubmit} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-4 pr-20 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-smartform-blue focus:border-transparent"
                    placeholder="E.g., Customer satisfaction survey for a coffee shop"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bg-smartform-blue text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </form>
              
              {showDemo && (
                <div className="animate-fade-in rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-smartform-blue text-white flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">SmartFormAI</p>
                      <p className="text-xs text-gray-500">Generated in 1.2s</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm">I've created a customer satisfaction survey for your coffee shop. Here's what it looks like:</p>
                    <div className="rounded bg-white p-3 border border-gray-200">
                      <p className="font-medium text-sm">☕ How would you rate your experience at our coffee shop today?</p>
                      <div className="flex space-x-2 mt-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button 
                            key={n} 
                            className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-300 hover:bg-gray-100"
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="text-smartform-blue text-sm font-medium hover:underline">
                      View full form →
                    </button>
                  </div>
                </div>
              )}
              
              {!showDemo && (
                <div className="flex items-center justify-center h-48 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <p className="text-gray-500">Your AI-generated form will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
