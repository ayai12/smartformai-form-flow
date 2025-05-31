import React from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/sections/Hero';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const features = [
  {
    icon: '✍️',
    title: 'AI-Generated Questions',
    description: 'Just describe your needs and SmartFormAI instantly builds a fully structured form with AI-generated questions tailored to your tone.'
  },
  {
    icon: '🚀',
    title: 'Instant Publishing',
    description: 'Publish instantly with a shareable link or embed forms directly on your website — no coding required.'
  },
  {
    icon: '📊',
    title: 'Live Analytics',
    description: 'Get real-time analytics and neat charts as responses come in, all in one dashboard.'
  },
  {
    icon: '🤖',
    title: 'Easy Editing',
    description: 'AI-powered question generation and easy editing, all in one place.'
  },
  {
    icon: '🔗',
    title: 'Embed Anywhere',
    description: 'Embed your forms anywhere with ease.'
  },
  {
    icon: '⚡',
    title: 'All-in-One Platform',
    description: 'Form creation, publishing, and analytics in one place.'
  },
];

const Index: React.FC = () => {
  return (
    <Layout>
      {/* Fazier Badge Overlay */}
      <div className="fixed top-20 left-4 z-40" style={{ pointerEvents: 'auto' }}>
        <a href="https://fazier.com/launches/smartformai.vercel.app" target="_blank" rel="noopener noreferrer">
          <img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=dark" width="250" alt="Fazier badge" />
        </a>
      </div>

      {/* Hero Section */}
      <Hero />

      {/* Divider */}
      <div className="my-12 w-full flex justify-center">
        <div className="h-1 w-24 bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 rounded-full opacity-40" />
</div>

      {/* Demo Video Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 drop-shadow-sm">See SmartFormAI in Action</h2>
             <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
               Watch this short video to see how quick and easy it is to build and analyze forms.
             </p>
        <div className="relative w-full max-w-4xl mx-auto h-[300px] md:h-[450px] rounded-lg overflow-hidden shadow-xl border border-white/20 mb-8">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/614L29Y-jO0?rel=0" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                title="SmartFormAI Demo Video"
              ></iframe>
            </div>
        <Button className="bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg px-8 py-3 rounded-full shadow-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105" asChild>
          <a href="https://smartformai.vercel.app/survey/0c1c6074-2241-43e4-a109-b35960f887ae" target="_blank" rel="noopener noreferrer">
                Try the Live Demo Survey
              </a>
            </Button>
      </section>
      
      {/* Divider */}
      <div className="my-12 w-full flex justify-center">
        <div className="h-1 w-24 bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 rounded-full opacity-40" />
              </div>

      {/* Features/Benefits Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center drop-shadow-sm">Why Choose SmartFormAI?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, idx) => (
            <Card key={idx} className="bg-white/80 border border-white/40 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <span className="text-3xl">{feature.icon}</span>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-base">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Divider */}
      <div className="my-12 w-full flex justify-center">
        <div className="h-1 w-24 bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 rounded-full opacity-40" />
        </div>

      {/* Call to Action Section */}
      <section className="text-center py-12">
             <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 leading-tight drop-shadow-sm">
               Ready to try SmartFormAI?
            </h2>
             <p className="text-xl mb-10 max-w-2xl mx-auto text-gray-700">
               It's free to get started. Create your first AI-powered form today!
             </p>
             <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105" size="lg" asChild>
               <Link to="/signup">Get Started Free</Link>
            </Button>
             <p className="text-sm text-gray-600 mt-3">No credit card needed</p>
           </section>

      {/* Divider */}
      <div className="my-12 w-full flex justify-center">
        <div className="h-1 w-24 bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 rounded-full opacity-40" />
      </div>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-12 max-w-2xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center drop-shadow-sm">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="q1">
            <AccordionTrigger>What is SmartFormAI?</AccordionTrigger>
            <AccordionContent>
              SmartFormAI is an AI-powered tool that helps you create, publish, and analyze forms instantly. Just describe what you need, and it generates smart, tailored questions for you.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>How does the AI generate questions?</AccordionTrigger>
            <AccordionContent>
              Our AI analyzes your prompt and context to generate relevant, clear, and effective questions, adapting the tone and structure to your needs.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>Can I embed forms on my own website?</AccordionTrigger>
            <AccordionContent>
              Yes! Every form you create can be shared via a link or embedded directly on your website with a simple embed code.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q4">
            <AccordionTrigger>Is SmartFormAI free to use?</AccordionTrigger>
            <AccordionContent>
              You can get started for free and create your first forms without a credit card. Paid plans unlock more advanced features and analytics.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q5">
            <AccordionTrigger>How do I see responses and analytics?</AccordionTrigger>
            <AccordionContent>
              All responses are collected in your dashboard, where you can view real-time analytics and charts for every form you publish.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Divider */}
      <div className="my-12 w-full flex justify-center">
        <div className="h-1 w-24 bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 rounded-full opacity-40" />
      </div>

      {/* Feedback/Contact Section */}
      <section className="mt-8 text-center text-gray-700 bg-white/60 p-8 rounded-2xl shadow-lg border border-white/20 max-w-2xl mx-auto mb-16">
        <h3 className="text-2xl font-bold mb-4 drop-shadow-sm">I'd love your feedback! ❤️</h3>
        <p className="text-lg max-w-2xl mx-auto mb-4">
          I'm a solo developer and always looking to improve SmartFormAI. Got ideas or feedback? Reach out!
        </p>
        <p className="text-md text-gray-600 mb-2">Connect with me:</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="https://x.com/ReinwatashiDev" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline hover:text-blue-800">@ReinwatashiDev</a>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
