import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/logo';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [animatedText, setAnimatedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userPrompt, setUserPrompt] = useState('');
  const fullText = "Train AI agents that design, adapt, and analyze surveys automatically.";

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setAnimatedText(fullText.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 40);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-pink-100 via-orange-50 to-purple-100">
      {/* Top Announcement Banner */}
      <div className="relative z-20 flex items-center justify-center py-4 px-4">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm border border-gray-200/50">
          <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">New</span>
          <span className="text-sm text-gray-700 font-medium">
            AI Survey Agents: Build intelligent agents that work for you
          </span>
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </div>

      {/* Animated Gradient Orbs Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-30 animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400 to-violet-400 rounded-full blur-3xl opacity-30 animate-float-delay"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-orange-300 to-yellow-300 rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>
      </div>

      {/* 3D Floating Elements */}
      <div className="absolute inset-0 perspective-1000">
        {/* Purple card with icon */}
        <div className="absolute top-[20%] left-[15%] w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-2xl transform rotate-12 animate-float opacity-90">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
        </div>

        {/* Pink card with icon */}
        <div className="absolute top-[15%] right-[12%] w-24 h-24 md:w-36 md:h-36 bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl shadow-2xl transform -rotate-6 animate-float-delay opacity-90">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 md:w-20 md:h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
        </div>

        {/* Orange card with icon */}
        <div className="absolute bottom-[20%] left-[10%] w-16 h-16 md:w-28 md:h-28 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl shadow-2xl transform rotate-6 animate-bounce-slow opacity-90">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 md:w-14 md:h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
          </div>
        </div>

        {/* Blue card with icon */}
        <div className="absolute bottom-[25%] right-[15%] w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl transform -rotate-12 animate-float opacity-90">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
        </div>

        {/* Additional smaller floating elements */}
        <div className="absolute top-[40%] left-[5%] w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl shadow-xl transform rotate-45 animate-spin-slow opacity-80"></div>
        <div className="absolute top-[60%] right-[8%] w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full shadow-xl animate-pulse-slow opacity-80"></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center justify-center relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8 animate-slide-up">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-smartform-blue to-smartform-violet rounded-full blur opacity-30 animate-pulse-slow"></div>
              <Logo size={60} className="relative" />
            </div>
            <div className="flex flex-col ml-4 text-left">
              <span className="text-xl font-bold text-gray-800">SmartFormAI Agents</span>
              <span className="text-sm text-gray-600">AI-Powered Form Agents</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-slide-up text-gray-900">
            Build Your Own{' '}
            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">AI Survey Agents</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto animate-slide-up">
            {animatedText}
            <span className="animate-blink ml-1">|</span>
          </p>

          {/* Input Box and Build Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 animate-slide-up max-w-2xl mx-auto">
            <Input
              type="text"
              placeholder="e.g., Create a survey to understand customer satisfaction with our new product"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && userPrompt.trim()) {
                  navigate(`/train-agent?prompt=${encodeURIComponent(userPrompt.trim())}`);
                }
              }}
              className="w-full sm:flex-1 h-14 text-base border-2 border-gray-200 focus:border-purple-500 rounded-full px-6 shadow-lg bg-white/90 backdrop-blur-sm"
            />
            <Button 
              onClick={() => {
                if (userPrompt.trim()) {
                  // Save prompt to localStorage for onboarding flow
                  localStorage.setItem('onboarding_prompt', userPrompt.trim());
                  localStorage.setItem('onboarding_active', 'true');
                  // Smooth transition to train agent page
                  navigate(`/train-agent?prompt=${encodeURIComponent(userPrompt.trim())}`);
                }
              }}
              disabled={!userPrompt.trim()}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 font-bold text-lg px-8 py-6 rounded-full shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto"
              size="lg" 
            >
              Build AI Agent
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm animate-slide-up">
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200 transform transition-transform hover:scale-105">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span className="text-gray-700 font-medium">AI-powered questions</span>
            </div>
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200 transform transition-transform hover:scale-105">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span className="text-gray-700 font-medium">No coding required</span>
            </div>
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200 transform transition-transform hover:scale-105">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span className="text-gray-700 font-medium">Real-time analytics</span>
            </div>
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200 transform transition-transform hover:scale-105">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span className="text-gray-700 font-medium">Free to start</span>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-4 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">How It Works</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Create intelligent survey agents in three simple steps</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Train */}
            <div className="relative bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200 transform transition-all hover:scale-105">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                1
              </div>
              <div className="text-center mt-4">
                <div className="mb-4 flex justify-center">
                  <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Train</h3>
                <p className="text-gray-600">Describe your survey goals and let AI generate intelligent questions tailored to your needs</p>
              </div>
            </div>

            {/* Step 2: Deploy */}
            <div className="relative bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200 transform transition-all hover:scale-105">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-violet-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                2
              </div>
              <div className="text-center mt-4">
                <div className="mb-4 flex justify-center">
                  <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Deploy</h3>
                <p className="text-gray-600">Publish your agent with one click. Share via link or embed anywhere on your website</p>
              </div>
            </div>

            {/* Step 3: Analyze */}
            <div className="relative bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200 transform transition-all hover:scale-105">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-teal-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                3
              </div>
              <div className="text-center mt-4">
                <div className="mb-4 flex justify-center">
                  <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Analyze</h3>
                <p className="text-gray-600">Watch responses flow in real-time with powerful analytics and actionable insights</p>
              </div>
            </div>
          </div>

          {/* Connection Line for Desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-300 via-blue-300 to-green-300 opacity-30 -z-10" style={{ top: 'calc(50% + 2rem)' }}></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

