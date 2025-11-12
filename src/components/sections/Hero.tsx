import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/logo';
import { Brain, Infinity, Shield, CheckCircle, ArrowRight, Zap, BarChart3 } from 'lucide-react';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [userPrompt, setUserPrompt] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const placeholders = [
    "Launch an autonomous market research agent",
    "Let AI rebuild our pricing research survey",
    "Turn customer feedback into self-improving studies",
    "Automate our user research loop"
  ];
  
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholders[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    setCurrentPlaceholder(placeholders[placeholderIndex]);
  }, [placeholderIndex]);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden hero-gradient">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 hero-bg"></div>
      
      {/* Enhanced Glow Layers */}
      <div className="hero-glow absolute top-1/2 left-1/2 w-[1000px] h-[1000px] transform -translate-x-1/2 -translate-y-1/2 z-0 animate-pulse-glow"></div>
      
      {/* Floating AI Elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Neural Network Nodes */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-purple-400 rounded-full opacity-60 animate-float-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-pink-400 rounded-full opacity-40 animate-float-delay"></div>
        <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-violet-400 rounded-full opacity-50 animate-float"></div>
        
        {/* Connecting Lines */}
        <div className="absolute top-1/4 left-1/4 w-32 h-px bg-gradient-to-r from-purple-300 to-transparent opacity-30 animate-pulse-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-px bg-gradient-to-l from-pink-300 to-transparent opacity-20 animate-pulse-slow" style={{transform: 'rotate(45deg)'}}></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-br from-violet-200/20 to-blue-200/15 rounded-full blur-3xl animate-float-delay"></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center relative z-10 py-8 sm:py-16" style={{padding: '60px 0 40px'}}>
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo with Enhanced Glow */}
          <div className="flex flex-col sm:flex-row items-center justify-center mb-8 sm:mb-12 fade-in">
            <div className="relative group mb-4 sm:mb-0">
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse-glow"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-xl">
                <Logo size={48} className="relative sm:w-16 sm:h-16" />
              </div>
            </div>
            <div className="flex flex-col sm:ml-6 text-center sm:text-left">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">SmartFormAI</span>
              <span className="text-xs sm:text-sm text-gray-600 font-medium tracking-wide">Fully autonomous market research, end-to-end</span>
            </div>
          </div>

          {/* Main Heading with Better Typography */}
          <div className="mb-8 fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] text-gray-900 mb-4 px-2" 
                style={{
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                  fontWeight: 800, 
                  letterSpacing: '-0.03em'
                }}>
              <span className="block">The world&rsquo;s first fully autonomous</span>
              <span className="block bg-gradient-to-r from-purple-600 via-pink-500 to-violet-600 bg-clip-text text-transparent animate-gradient-x">
                survey-based market research tool
              </span>
              <span className="block">is here.</span>
            </h1>
            {/* Subtle divider line */}
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full opacity-60"></div>
          </div>

          {/* Enhanced Subheading */}
          <div className="mb-12 sm:mb-16 fade-in px-4">
            <p className="text-lg sm:text-xl md:text-2xl font-light text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed" 
               style={{
                 fontWeight: 400, 
                 letterSpacing: '0.01em',
                 color: 'rgba(0,0,0,0.75)'
               }}>
              Cut market research time by 90%. SmartFormAI is the AI agent that handles creation, analysis, and iteration&mdash;delivering trusted insights without the usual bottlenecks.
            </p>
          </div>

          {/* Enhanced Input Section */}
          <div className="fade-in mb-12">
            
            {/* Glass-style Input Container */}
            <div className="max-w-3xl mx-auto mb-8 px-4">
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl sm:rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                
                <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-3 sm:p-2 bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-full border border-white/50 shadow-2xl">
                  <Input
                    type="text"
                    placeholder={currentPlaceholder}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && userPrompt.trim()) {
                        navigate(`/train-agent?prompt=${encodeURIComponent(userPrompt.trim())}`);
                      }
                    }}
                    aria-label="Describe your goal"
                    className="flex-1 h-12 sm:h-12 text-base bg-transparent border-none outline-none px-4 sm:px-6 placeholder:text-gray-500 text-gray-900 font-medium w-full"
                    style={{
                      fontSize: '1rem',
                      minWidth: 'auto'
                    }}
                  />
                  
                  {/* Primary CTA Button */}
                  <Button 
                    onClick={() => {
                      if (userPrompt.trim()) {
                        localStorage.setItem('onboarding_prompt', userPrompt.trim());
                        localStorage.setItem('onboarding_active', 'true');
                        navigate(`/train-agent?prompt=${encodeURIComponent(userPrompt.trim())}`);
                      }
                    }}
                    disabled={!userPrompt.trim()}
                    className="group relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-violet-600 hover:from-purple-700 hover:via-pink-600 hover:to-violet-700 text-white font-bold px-6 sm:px-8 py-3 rounded-xl sm:rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-gradient-x w-full sm:w-auto"
                    size="lg"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Infinity className="w-4 h-4" />
                      <span className="hidden sm:inline">Build My Agent</span>
                      <span className="sm:hidden">Launch Now</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Secondary Action */}
            {/* <div className="text-center">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-purple-600 font-medium px-6 py-2 rounded-full hover:bg-white/50 backdrop-blur-sm transition-all duration-300"
                onClick={() => navigate('/examples')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Watch the Insight Engine
              </Button>
            </div> */}
          </div>

          {/* Reassurance Line */}
          <div className="text-center mb-16 fade-in">
            <p className="text-sm text-gray-500 mb-6">
              No login required • Try free • No credit card needed
            </p>
            
            {/* Enhanced Trust Row */}
            <div className="max-w-5xl mx-auto px-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="group flex flex-col items-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300 transform hover:scale-105">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-gray-800 font-semibold text-xs sm:text-sm text-center">AI-powered questions</span>
                </div>
                
                <div className="group flex flex-col items-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300 transform hover:scale-105">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-gray-800 font-semibold text-xs sm:text-sm text-center">Real-time analytics</span>
                </div>
                
                <div className="group flex flex-col items-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300 transform hover:scale-105">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-gray-800 font-semibold text-xs sm:text-sm text-center">Secure & private</span>
                </div>
                
                <div className="group flex flex-col items-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300 transform hover:scale-105">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-gray-800 font-semibold text-xs sm:text-sm text-center">Free to start</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CSS Animations */}
      <style>{`
        /* Background Animations */
        .hero-gradient {
          background: radial-gradient(circle at 50% 30%, #f4e0ff, #ffe6f0, #ffffff);
          background-size: 200% 200%;
          animation: gradientMove 12s ease infinite alternate;
        }
        
        .hero-bg {
          background: radial-gradient(circle at 60% 40%, rgba(143,0,255,0.08) 0%, rgba(255,192,203,0.05) 40%, transparent 70%);
          background-size: 300% 300%;
          animation: gradientShift 15s ease infinite;
        }
        
        .hero-glow {
          background: radial-gradient(circle, rgba(143,0,255,0.15) 0%, rgba(255,192,203,0.08) 50%, transparent 80%);
          filter: blur(120px);
        }
        
        @keyframes gradientMove {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 100%; }
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        /* Text Animations */
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradientX 3s ease infinite;
        }
        
        @keyframes gradientX {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        /* Floating Animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(1deg); }
          66% { transform: translateY(-5px) rotate(-1deg); }
        }
        
        @keyframes float-delay {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(-1deg); }
          66% { transform: translateY(-8px) rotate(1deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-25px) scale(1.02); }
        }
        
        /* Pulse Animations */
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        /* Fade In Animation */
        @keyframes fadeUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .fade-in {
          animation: fadeUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .fade-in:nth-child(1) { animation-delay: 0.1s; }
        .fade-in:nth-child(2) { animation-delay: 0.3s; }
        .fade-in:nth-child(3) { animation-delay: 0.5s; }
        .fade-in:nth-child(4) { animation-delay: 0.7s; }
        .fade-in:nth-child(5) { animation-delay: 0.9s; }
        
        /* Animation Classes */
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delay { animation: float-delay 10s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .hero-glow {
            width: 400px;
            height: 400px;
          }
          
          .hero-gradient {
            background-size: 150% 150%;
          }
          
          .min-h-screen {
            min-height: 100vh;
            min-height: 100dvh;
          }
        }
        
        @media (max-width: 640px) {
          .hero-glow {
            width: 300px;
            height: 300px;
          }
          
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        
        /* Glass Morphism Effects */
        .backdrop-blur-md {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        
        .backdrop-blur-sm {
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
      `}</style>
    </section>
  );
};

export default Hero;

