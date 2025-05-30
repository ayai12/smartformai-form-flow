import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/logo';

const Hero: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [animatedText, setAnimatedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const fullText = "Transform simple ideas into powerful forms with AI that understands your needs and creates perfect questions.";

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setAnimatedText(fullText.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 40);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);

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
    <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-smartform-blue/5 rounded-full blur-2xl animate-pulse-slow"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-smartform-violet/5 rounded-full blur-2xl animate-pulse-slow"></div>
      <div className="absolute top-1/4 right-1/4 w-6 h-6 bg-yellow-300 rounded-full animate-ping opacity-70"></div>
      <div className="absolute bottom-1/3 left-1/3 w-8 h-8 bg-smartform-green rounded-full animate-pulse opacity-30"></div>
      
      {/* Floating shapes */}
      <div className="hidden md:block absolute top-20 right-20 w-16 h-16 bg-smartform-blue/10 rounded-xl rotate-12 animate-float"></div>
      <div className="hidden md:block absolute bottom-40 left-20 w-12 h-12 bg-smartform-violet/10 rounded-full animate-float-delay"></div>
      <div className="hidden md:block absolute top-40 left-1/3 w-8 h-8 border-4 border-smartform-green/20 rounded-full animate-spin-slow"></div>
      <div className="hidden md:block absolute bottom-20 right-1/3 w-10 h-10 border-4 border-yellow-300/20 rotate-45 animate-bounce-slow"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-8 mb-10 md:mb-0">
            <div className="animate-slide-up">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-smartform-blue to-smartform-violet rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
                  <Logo size={60} className="relative" />
                </div>
                <div className="flex flex-col ml-4">
                  <span className="text-xl font-bold text-smartform-charcoal">SmartFormAI</span>
                  <span className="text-sm text-gray-500">AI-Powered Form Builder</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-smartform-blue to-blue-600">Forms</span> that 
                <span className="relative mx-2">
                  <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-smartform-violet to-purple-600">think</span>
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-yellow-300/30 -rotate-1 animate-pulse-slow"></span>
                </span>
                <span className="text-smartform-charcoal">.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 min-h-[4rem]">
                {animatedText}
                <span className="animate-blink ml-1">|</span>
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-10">
                <Button className="bg-gradient-to-r from-smartform-blue to-blue-600 hover:from-blue-600 hover:to-smartform-blue text-lg py-6 px-8 rounded-xl shadow-lg shadow-blue-500/20 transform transition-all hover:scale-105 hover:-translate-y-1 group" size="lg" asChild>
                  <Link to="/signup" className="flex items-center justify-center">
                    Get Early Access
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </Link>
                </Button>
                <Button variant="outline" className="border-2 border-smartform-blue text-smartform-blue hover:bg-smartform-blue hover:text-white text-lg py-6 px-8 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1" size="lg" asChild>
                  <Link to="/templates">See Examples</Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center bg-white/80 px-3 py-1 rounded-full shadow-sm border border-gray-100 transform transition-transform hover:scale-105">
                  <svg className="w-5 h-5 text-smartform-green mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                  <span>AI-powered questions</span>
                </div>
                <div className="flex items-center bg-white/80 px-3 py-1 rounded-full shadow-sm border border-gray-100 transform transition-transform hover:scale-105">
                  <svg className="w-5 h-5 text-smartform-green mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                  <span>Custom tone settings</span>
                </div>
                <div className="flex items-center bg-white/80 px-3 py-1 rounded-full shadow-sm border border-gray-100 transform transition-transform hover:scale-105">
                  <svg className="w-5 h-5 text-smartform-green mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                  <span>Visual analytics</span>
                </div>
              </div>
              
              {/* Coming Soon Tag */}
              <div className="mt-8 inline-block">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 flex items-center">
                  <div className="bg-yellow-400 rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.258a32.187 32.187 0 017.858 1.76.75.75 0 01-.528 1.41 30.617 30.617 0 00-7.33-1.637v10.051c2.925.223 5.637.942 7.33 1.637a.75.75 0 01-.528 1.41 32.2 32.2 0 01-7.858-1.76.75.75 0 01-.493-.702V2.75A.75.75 0 0110 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Coming Soon: Beta Launch</p>
                    <p className="text-xs text-gray-600">Join our early access program</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 lg:pl-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 animate-fade-in relative overflow-hidden transform transition-all hover:shadow-2xl hover:-translate-y-1">
              {/* Decorative corner elements */}
              <div className="absolute top-0 right-0 w-16 h-16">
                <div className="absolute top-0 right-0 w-full h-full bg-smartform-violet/10 rounded-bl-3xl"></div>
                <div className="absolute top-2 right-2 w-3 h-3 bg-smartform-violet rounded-full animate-ping opacity-70"></div>
              </div>
              <div className="absolute bottom-0 left-0 w-12 h-12">
                <div className="absolute bottom-0 left-0 w-full h-full bg-smartform-blue/10 rounded-tr-3xl"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-smartform-blue rounded-full animate-ping opacity-70"></div>
              </div>
              
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-br from-smartform-blue to-smartform-violet rounded-lg flex items-center justify-center text-white mr-2 animate-pulse-slow">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </span>
                See it in action
              </h3>
              <p className="text-gray-600 mb-6">Type what kind of form you need, and our AI will create it instantly.</p>
              
              <form onSubmit={handlePromptSubmit} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-4 pr-20 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-smartform-blue focus:border-transparent shadow-sm transition-all hover:shadow-md"
                    placeholder="E.g., Customer satisfaction survey for a coffee shop"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bg-gradient-to-r from-smartform-blue to-smartform-violet text-white p-2 rounded-lg hover:shadow-md transition-all transform hover:scale-105"
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
                <div className="animate-fade-in rounded-lg border border-gray-200 p-4 bg-gradient-to-br from-gray-50 to-white">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-smartform-blue to-smartform-violet text-white flex items-center justify-center">
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
                    <div className="rounded-lg bg-white p-4 border border-gray-200 shadow-sm transform transition-all hover:shadow-md hover:-translate-y-1">
                      <p className="font-medium text-sm flex items-center">
                        <span className="text-lg mr-2">☕</span>
                        How would you rate your experience at our coffee shop today?
                      </p>
                      <div className="flex space-x-2 mt-3">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button 
                            key={n} 
                            className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-300 hover:bg-smartform-blue hover:text-white hover:border-transparent transition-all transform hover:scale-110"
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="text-smartform-blue text-sm font-medium hover:underline flex items-center group">
                      View full form
                      <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              {!showDemo && (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 transition-all hover:border-smartform-blue/50 hover:bg-blue-50/30">
                  <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p className="text-gray-500">Your AI-generated form will appear here</p>
                </div>
              )}
              
              {/* Feature highlight */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center">
                <div className="bg-smartform-blue rounded-full p-1 mr-3">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Choose from multiple question types</p>
                  <p className="text-xs text-gray-600">Multiple choice, text, rating scales, and more</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

