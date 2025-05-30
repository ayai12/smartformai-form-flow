import React from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Pricing from '@/components/sections/Pricing';
import DemoForm from '@/components/demo/DemoForm';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index: React.FC = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <Hero />
      
      {/* Product Vision Section */}
      <section className="py-12 border-y border-gray-100 bg-gradient-to-r from-blue-50 via-white to-purple-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-20 h-20 bg-smartform-blue/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-smartform-violet/5 rounded-full blur-xl"></div>
        
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-block relative">
              <h2 className="text-2xl font-bold text-smartform-charcoal">Reimagining form creation with AI</h2>
              <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 100 6" preserveAspectRatio="none">
                <path d="M0,5 Q50,0 100,5" stroke="#00D084" strokeWidth="3" fill="none" />
              </svg>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-gray-600 mb-8">
              SmartFormAI is your personal AI form builder that transforms simple ideas into fully customized surveys and forms in seconds. Just tell the AI what you need, and it instantly generates smart, structured questions in the tone you choose.
            </p>
            
            <div className="grid grid-cols-3 gap-6 mt-10">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-smartform-blue/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-smartform-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h3 className="font-medium">Fast Creation</h3>
                <p className="text-sm text-gray-500 mt-2">From idea to form in seconds</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-smartform-violet/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-smartform-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
                  </svg>
                </div>
                <h3 className="font-medium">Smart Design</h3>
                <p className="text-sm text-gray-500 mt-2">AI-crafted questions</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-smartform-green/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-smartform-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="font-medium">Insightful Results</h3>
                <p className="text-sm text-gray-500 mt-2">Clear analytics dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <Features />
      
      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-white via-blue-50/50 to-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-smartform-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-smartform-violet/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-3">
              <span className="bg-smartform-blue/10 text-smartform-blue text-sm font-medium py-1 px-3 rounded-full">
                How It Works
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Create <span className="text-smartform-blue">Smart</span> Forms in Three Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform makes form creation simple and intuitive
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-smartform-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                ),
                title: "1. Describe Your Form",
                description: "Simply type what you need — 'Create a survey for my Shrek business' or 'Build a job application form' — and select your preferred tone.",
                color: "blue"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-smartform-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                  </svg>
                ),
                title: "2. Customize & Refine",
                description: "Edit generated questions, add your own, or ask the AI to rewrite them. Arrange your form exactly how you want it.",
                color: "violet"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-smartform-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                ),
                title: "3. Publish & Analyze",
                description: "Share your form with a unique link and collect responses. View analytics and insights in your dashboard.",
                color: "green"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 transform transition-all hover:-translate-y-2 hover:shadow-2xl group">
                <div className={`w-16 h-16 rounded-2xl bg-${item.color === 'blue' ? 'smartform-blue' : item.color === 'violet' ? 'smartform-violet' : 'smartform-green'}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
          
          {/* Feature Highlight */}
          <div className="mt-16 bg-gradient-to-r from-smartform-blue to-smartform-violet rounded-2xl p-8 text-white max-w-4xl mx-auto shadow-xl">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
                <h3 className="text-2xl font-bold mb-4">Coming Soon: Advanced Features</h3>
                <p className="mb-4">We're working on adding conditional logic, advanced question types, and more integrations to make your forms even smarter.</p>
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-xs font-bold">
                      🚀
                    </div>
                  </div>
                  <div className="ml-3 text-sm">
                    <span className="font-medium">Be among the first</span> to try these features
                  </div>
                </div>
              </div>
              <div className="md:w-1/3 flex justify-center">
                <Button className="bg-white text-smartform-blue hover:bg-gray-100 font-medium py-3 px-6 rounded-xl transform transition-all hover:scale-105 group" asChild>
                  <Link to="/signup" className="flex items-center">
                    Join the Waitlist
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Feature List */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: "AI-Generated", label: "Questions" },
              { value: "Multiple", label: "Question Types" },
              { value: "Custom", label: "Tone Settings" },
              { value: "Visual", label: "Analytics" }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-smartform-blue mb-2">{feature.value}</div>
                <div className="text-gray-600">{feature.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Demo Form Section */}
      <DemoForm />
      
      {/* Pricing Section */}
      <Pricing />
      
      {/* Use Cases Section */}
      <section className="py-20 bg-gradient-to-br from-white via-blue-50 to-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-smartform-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-smartform-violet/5 rounded-full blur-3xl"></div>
        <div className="absolute -top-5 right-1/4 w-20 h-20 border-4 border-smartform-green/10 rounded-full"></div>
        <div className="absolute -bottom-5 left-1/4 w-16 h-16 border-4 border-yellow-300/10 rounded-xl rotate-12"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-3">
              <span className="bg-smartform-blue/10 text-smartform-blue text-sm font-medium py-1 px-3 rounded-full">
                Use Cases
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 relative inline-block">
              Perfect For Any Scenario
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-smartform-green/30 rounded-full"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              SmartFormAI adapts to your specific needs, whatever they may be.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote: "Create customer feedback forms that ask the right questions to improve your products and services.",
                title: "Business Surveys",
                icon: "💼",
                color: "blue"
              },
              {
                quote: "Build educational assessments and quizzes that engage students and measure learning outcomes.",
                title: "Educational Forms",
                icon: "🎓",
                color: "violet"
              },
              {
                quote: "Design event registration forms, RSVPs, and personal questionnaires with a friendly tone.",
                title: "Personal Forms",
                icon: "🏠",
                color: "green"
              }
            ].map((useCase, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-xl relative transform transition-all hover:-translate-y-1 hover:shadow-2xl border border-gray-100">
                {/* Top corner decoration */}
                <div className={`absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-bl-3xl`}>
                  <div className={`absolute top-0 right-0 w-full h-full bg-smartform-${useCase.color}/10 rounded-bl-3xl`}></div>
                  <div className={`absolute top-3 right-3 w-3 h-3 bg-smartform-${useCase.color} rounded-full`}></div>
                </div>
                
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-smartform-${useCase.color}/10 flex items-center justify-center mb-6 text-2xl`}>
                  {useCase.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold mb-4">{useCase.title}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {useCase.quote}
                </p>
                
                {/* Bottom decoration */}
                <div className="absolute bottom-4 right-4">
                  <svg className={`w-6 h-6 text-smartform-${useCase.color}/20`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                </div>
              </div>
            ))}
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
            {[
              { value: 'Business', label: 'Professional Tone' },
              { value: 'Educational', label: 'Learning-Focused' },
              { value: 'Personal', label: 'Friendly Approach' }
            ].map((tone, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
                <div className="text-xl font-bold text-smartform-blue mb-2">{tone.value}</div>
                <div className="text-gray-600">{tone.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-smartform-blue via-smartform-violet to-smartform-blue text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMwLTIuMiAxLjgtNCA0LTRzNCAxLjggNCA0LTEuOCA0LTQgNC00LTEuOC00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="absolute -top-5 -left-5 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        
        {/* Floating shapes */}
        <div className="absolute top-10 left-1/4 w-8 h-8 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute bottom-10 right-1/4 w-6 h-6 bg-white/10 rounded-lg rotate-12 animate-float-delay"></div>
        <div className="absolute top-1/2 left-10 w-4 h-4 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-1/3 right-10 w-5 h-5 bg-white/10 rounded-full"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4 animate-bounce-slow">
              <span className="bg-white/20 text-white text-sm font-medium py-1 px-3 rounded-full">
                Early Access
              </span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to transform your 
              <span className="relative inline-block mx-2">
                <span className="relative z-10">forms</span>
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 100 6" preserveAspectRatio="none">
                  <path d="M0,5 Q50,0 100,5" stroke="#FFFFFF" strokeWidth="3" fill="none" />
                </svg>
              </span>
              ?
            </h2>
            
            <p className="text-xl mb-10 max-w-2xl mx-auto text-white/90">
              Join our early access program and be among the first to experience 
              the future of intelligent form creation.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button className="bg-white text-smartform-blue hover:bg-gray-100 text-lg py-6 px-10 rounded-xl shadow-lg shadow-black/10 transform transition-all hover:scale-105 group" size="lg" asChild>
                <Link to="/signup" className="flex items-center justify-center">
                  Get Early Access
                  <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </Link>
            </Button>
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg py-6 px-10 rounded-xl transition-all" size="lg" asChild>
                <Link to="/contact">Contact Us</Link>
            </Button>
            </div>
            
            {/* About the developer */}
            <div className="mt-16 pt-8 border-t border-white/20">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">👨‍💻</span>
                </div>
                <h3 className="text-xl font-medium mb-2">Built by an Independent Developer</h3>
                <p className="text-white/80 max-w-2xl">
                  SmartFormAI is a passion project created by a solo developer who believes in the power of AI 
                  to simplify everyday tasks. Join me on this journey to revolutionize form creation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
