import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

const About: React.FC = () => {
  return (
    <Layout>
      {/* Background gradient and playful shapes */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-blue-50 to-purple-100 opacity-80 -z-10" />
        <div className="absolute top-10 left-10 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl animate-pulse-slow -z-10" />
        <div className="absolute bottom-10 right-10 w-56 h-56 bg-blue-300/20 rounded-full blur-3xl animate-pulse-slow -z-10" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-yellow-200/60 rounded-full blur-xl animate-bounce-slow -z-10" />
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-purple-200/40 rounded-full blur-2xl animate-float -z-10" />

      {/* Hero Section */}
        <section className="py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-lg mb-6">
            About SurveyAgent
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            SurveyAgent (previously known as SmartFormAI) started with a simple frustration: building surveys and analyzing responses takes too much time. After every campaign or user test, teams rebuild questions, export spreadsheets, and spend hours trying to understand what people were really saying. It felt repetitive, manual, and outdated — so we decided to fix it.
          </p>
      </section>
      
        {/* Why Section */}
        <section className="max-w-3xl mx-auto mb-16 px-4">
          <div className="rounded-3xl bg-white/80 shadow-xl p-8 md:p-12 border border-pink-100 flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-blue-600 flex items-center gap-2 mb-2">
              <span role="img" aria-label="lightbulb">💡</span> The Idea
            </h2>
            <p className="text-lg text-gray-700">
              What if surveys could learn on their own? Instead of you rebuilding questions and guessing what to ask next, your survey could adapt automatically based on real responses. That question led to SurveyAgent — autonomous AI survey systems that build, analyze, and evolve themselves.
            </p>
          </div>
        </section>

        {/* Who Section */}
        <section className="max-w-3xl mx-auto mb-16 px-4">
          <div className="rounded-3xl bg-gradient-to-r from-blue-100 via-pink-100 to-purple-100 shadow-xl p-8 md:p-12 border border-blue-100 flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-pink-600 flex items-center gap-2 mb-2">
              <span role="img" aria-label="rocket">🚀</span> Who It’s For
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-lg text-gray-700">
              <li className="flex items-center gap-2">👩‍💼 <span className="font-semibold">Founders</span> who want to validate ideas faster</li>
              <li className="flex items-center gap-2">📈 <span className="font-semibold">Marketers</span> who want sharper insights</li>
              <li className="flex items-center gap-2">🔬 <span className="font-semibold">Researchers</span> who want automation without losing depth</li>
              <li className="flex items-center gap-2">🏢 <span className="font-semibold">Agencies</span> who want scalable, adaptive client surveys</li>
            </ul>
        </div>
      </section>

        {/* What You Can Do Section */}
        <section className="max-w-3xl mx-auto mb-16 px-4">
          <div className="rounded-3xl bg-white/90 shadow-xl p-8 md:p-12 border border-purple-100 flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-purple-600 flex items-center gap-2 mb-2">
              <span role="img" aria-label="sparkles">✨</span> What SmartFormAI Does
            </h2>
            <ul className="space-y-3 text-lg text-gray-700">
              <li>🧠 Build complete surveys from a simple prompt</li>
              <li>📊 Collect responses and analyze the data in real time</li>
              <li>📝 Summarize results using AI</li>
              <li>🔄 Automatically rebuild to ask smarter questions next time</li>
            </ul>
        </div>
      </section>
      
        {/* What Makes It Different Section */}
        <section className="max-w-3xl mx-auto mb-20 px-4">
          <div className="rounded-3xl bg-gradient-to-r from-pink-100 via-blue-100 to-purple-100 shadow-xl p-8 md:p-12 border border-blue-100 flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-blue-600 flex items-center gap-2 mb-2">
              <span role="img" aria-label="zap">⚡</span> Why It’s Different
            </h2>
            <ul className="space-y-3 text-lg text-gray-700">
              <li>🧩 <span className="font-semibold">Self-learning survey agents</span> that rebuild based on real feedback</li>
              <li>🧠 <span className="font-semibold">An AI analytics dashboard</span> that explains your data in plain language</li>
              <li>🔁 <span className="font-semibold">A feedback loop</span> that keeps getting smarter with every response</li>
            </ul>
          </div>
        </section>
      
        {/* Call to Action & Socials */}
        <section className="text-center pb-24">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6 bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow">Ready to try it?</h2>
          <Button className="bg-gradient-to-r from-pink-500 to-blue-500 text-white text-xl px-10 py-5 rounded-full shadow-xl hover:from-pink-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 font-bold mb-8" asChild>
            <a href="https://surveyagent.app/signup" target="_blank" rel="noopener noreferrer">Sign up free — no credit card needed</a>
            </Button>
          <div className="flex flex-col items-center gap-4 mt-8">
            <span className="text-lg text-gray-600">Let's connect on X (Twitter):</span>
            <a href="https://x.com/ReinwatashiDev" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-black hover:bg-gray-900 text-white text-lg font-bold shadow-lg transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M20.893 3.104a2.5 2.5 0 0 0-3.535 0l-4.36 4.36-4.36-4.36a2.5 2.5 0 0 0-3.535 3.535l4.36 4.36-4.36 4.36a2.5 2.5 0 1 0 3.535 3.535l4.36-4.36 4.36 4.36a2.5 2.5 0 1 0 3.535-3.535l-4.36-4.36 4.36-4.36a2.5 2.5 0 0 0 0-3.535z"/></svg>
              @ReinwatashiDev
            </a>
          </div>
          <p className="text-center text-gray-400 text-base mt-10">Thanks so much for checking out SurveyAgent ❤️</p>
        </section>
        </div>
    </Layout>
  );
};

export default About;

