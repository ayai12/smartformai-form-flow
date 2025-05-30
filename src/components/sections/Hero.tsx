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
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105" size="lg" asChild>
                  <Link to="/signup" className="flex items-center justify-center">
                    Get Started Free
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </Link>
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
            </div>
          </div>
          
          <div className="md:w-1/2 lg:pl-8 flex flex-col items-center justify-center">
            <div className="w-full">
              <iframe src="https://smartformai.vercel.app/survey/0c1c6074-2241-43e4-a109-b35960f887ae" width="100%" height="600px" frameBorder="0" className="rounded-lg w-full"></iframe>
              <div className="flex flex-col items-center mt-2">
                <span className="text-2xl text-gray-400">↓</span>
                <p className="text-center text-gray-500 text-xs mt-1">Created with SmartFormAI.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

