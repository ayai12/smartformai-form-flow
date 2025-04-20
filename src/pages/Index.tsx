
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
      
      {/* Trusted By Section */}
      <section className="py-10 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500 mb-8">Trusted by innovative teams worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {['Acme Inc', 'GlobalTech', 'Startup Labs', 'Enterprise Co', 'InnovateCorp'].map((company, index) => (
              <div key={index} className="text-gray-400 font-medium opacity-70">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <Features />
      
      {/* Demo Form Section */}
      <DemoForm />
      
      {/* Pricing Section */}
      <Pricing />
      
      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied customers who've transformed their form experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote: "SmartFormAI has completely transformed our customer onboarding process. We've seen a 40% increase in form completion rates since switching.",
                author: "Sarah Johnson",
                role: "Head of Customer Success",
                company: "TechCorp",
              },
              {
                quote: "The AI-powered form builder saved us countless hours of development time. What used to take days now takes minutes.",
                author: "Michael Chen",
                role: "Product Manager",
                company: "StartupX",
              },
              {
                quote: "The analytics dashboard gives us insights we never had before. We can now pinpoint exactly where users drop off and optimize accordingly.",
                author: "Jessica Miller",
                role: "Marketing Director",
                company: "Growth Innovations",
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 shadow-sm">
                <svg className="w-10 h-10 text-smartform-blue/30 mb-4" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.722 6.065c-5.898 2.145-9.523 6.815-9.523 12.387 0 4.003 2.455 6.815 5.898 6.815 3.146 0 5.599-2.618 5.599-5.729 0-3.021-2.155-5.206-5.002-5.206-.599 0-1.197.087-1.795.26.599-3.455 3.744-6.991 7.487-8.616l-2.664-2.233v2.322zm16.718 0c-5.898 2.145-9.523 6.815-9.523 12.387 0 4.003 2.455 6.815 5.898 6.815 3.146 0 5.599-2.618 5.599-5.729 0-3.021-2.155-5.206-5.002-5.206-.599 0-1.197.087-1.795.26.599-3.455 3.744-6.991 7.487-8.616l-2.664-2.233v2.322z"></path>
                </svg>
                <p className="mb-6 text-gray-700 italic">{testimonial.quote}</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-smartform-blue to-smartform-violet text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your forms?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of companies using SmartFormAI to create intelligent, conversational forms that drive results.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button className="bg-white text-smartform-blue hover:bg-gray-100 text-lg" size="lg" asChild>
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10 text-lg" size="lg" asChild>
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
