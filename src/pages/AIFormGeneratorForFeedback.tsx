import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const AIFormGeneratorForFeedback: React.FC = () => {
  return (
    <Layout>
      <Helmet>
        <title>AI Form Generator for Customer Feedback | SmartFormAI</title>
        <meta name="description" content="Create professional customer feedback forms in seconds with SmartFormAI's free AI form generator. Get more valuable insights with AI-optimized questions." />
        <meta name="keywords" content="ai form generator for customer feedback, free ai form generator for feedback, customer feedback form generator, ai feedback form creator" />
        <link rel="canonical" href="https://smartformai.vercel.app/ai-form-generator-for-feedback" />
        <meta property="og:title" content="AI Form Generator for Customer Feedback | SmartFormAI" />
        <meta property="og:description" content="Create professional customer feedback forms in seconds with SmartFormAI's free AI form generator." />
        <meta property="og:url" content="https://smartformai.vercel.app/ai-form-generator-for-feedback" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              AI Form Generator for Customer Feedback
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Create professional feedback forms in seconds.
              Get actionable insights that help improve your business.
            </p>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105" size="lg" asChild>
              <Link to="/signup">Create Free Feedback Form Now</Link>
            </Button>
            <p className="text-sm text-gray-600 mt-3">No credit card needed • Free to get started</p>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="bg-red-50 p-8 rounded-lg border border-red-100">
                <h2 className="text-2xl font-bold mb-6 text-red-700">The Problem with Traditional Feedback Forms</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-red-500 text-xl mr-3">✗</span>
                    <p className="text-gray-700">Generic questions that don't get useful answers</p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 text-xl mr-3">✗</span>
                    <p className="text-gray-700">Too long, causing customers to abandon them</p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 text-xl mr-3">✗</span>
                    <p className="text-gray-700">Hard to analyze and extract actionable insights</p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 text-xl mr-3">✗</span>
                    <p className="text-gray-700">Time-consuming to create and maintain</p>
                  </li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-8 rounded-lg border border-green-100">
                <h2 className="text-2xl font-bold mb-6 text-green-700">Our AI Form Generator Solution</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-green-500 text-xl mr-3">✓</span>
                    <p className="text-gray-700">Targeted questions that get specific, useful feedback</p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 text-xl mr-3">✓</span>
                    <p className="text-gray-700">Optimized length to maximize completion rates</p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 text-xl mr-3">✓</span>
                    <p className="text-gray-700">Built-in analytics that highlight key insights</p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 text-xl mr-3">✓</span>
                    <p className="text-gray-700">Create in seconds instead of hours</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Visual Steps */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How to Create Feedback Forms with AI</h2>
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-24 left-[50%] w-[1px] h-[calc(100%-130px)] bg-blue-200 z-0"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-16 gap-x-8 relative z-10">
                <div className="bg-white p-6 rounded-lg shadow-md md:text-right">
                  <div className="flex md:flex-row-reverse items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl md:ml-4">1</div>
                    <h3 className="text-xl font-bold">Tell Us What You Need</h3>
                  </div>
                  <p className="text-gray-600">Describe your product or service and what kind of feedback you want to collect.</p>
                </div>
                
                <div className="md:mt-32 bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl mr-4">2</div>
                    <h3 className="text-xl font-bold">AI Creates Your Form</h3>
                  </div>
                  <p className="text-gray-600">Our AI builds a complete feedback form with questions designed to get useful responses.</p>
                </div>
                
                <div className="md:mt-32 bg-white p-6 rounded-lg shadow-md md:text-right">
                  <div className="flex md:flex-row-reverse items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl md:ml-4">3</div>
                    <h3 className="text-xl font-bold">Share With Customers</h3>
                  </div>
                  <p className="text-gray-600">Publish your form instantly with a link or embed it on your website or email.</p>
                </div>
                
                <div className="md:mt-32 bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl mr-4">4</div>
                    <h3 className="text-xl font-bold">Get Actionable Insights</h3>
                  </div>
                  <p className="text-gray-600">View real-time analytics and AI-powered summaries of what your customers are saying.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg" asChild>
                <Link to="/signup">Try It Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Types with Visual Icons */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Feedback Forms You Can Create</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { title: "Product Feedback", icon: "📦", color: "bg-blue-100 text-blue-600", desc: "Improve your products based on customer opinions" },
              { title: "Service Experience", icon: "👩‍💼", color: "bg-green-100 text-green-600", desc: "Enhance your customer service and support" },
              { title: "Website Usability", icon: "🖥️", color: "bg-purple-100 text-purple-600", desc: "Make your website more user-friendly" },
              { title: "Post-Purchase", icon: "🛍️", color: "bg-red-100 text-red-600", desc: "Understand the buying experience" },
              { title: "NPS Surveys", icon: "📊", color: "bg-yellow-100 text-yellow-600", desc: "Measure customer loyalty and satisfaction" },
              { title: "Exit Feedback", icon: "🚪", color: "bg-indigo-100 text-indigo-600", desc: "Learn why customers leave" },
            ].map((type, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all">
                <div className={`w-14 h-14 ${type.color} rounded-full flex items-center justify-center text-2xl mb-4`}>
                  {type.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{type.title}</h3>
                <p className="text-gray-600">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Real Results from Our AI Feedback Forms</h2>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-4xl font-bold text-blue-600 mb-2">78%</div>
              <p className="text-lg text-gray-700">Higher completion rate compared to traditional forms</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-4xl font-bold text-blue-600 mb-2">3x</div>
              <p className="text-lg text-gray-700">More detailed and useful feedback from customers</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-4xl font-bold text-blue-600 mb-2">94%</div>
              <p className="text-lg text-gray-700">Of businesses find actionable insights in AI-analyzed feedback</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="flex text-yellow-400 mb-4">
                  {'★★★★★'.split('').map((star, i) => (
                    <span key={i}>{star}</span>
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">"SmartFormAI's free AI form generator for customer feedback has transformed how we understand our customers. The questions it creates get us much more detailed responses."</p>
                <div className="border-t pt-4">
                  <p className="font-semibold">Sarah T.</p>
                  <p className="text-sm text-gray-600">Customer Experience Director</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="flex text-yellow-400 mb-4">
                  {'★★★★★'.split('').map((star, i) => (
                    <span key={i}>{star}</span>
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">"We used to spend hours creating customer feedback forms. With this AI form generator, we create better forms in seconds, and the insights we get are much more actionable."</p>
                <div className="border-t pt-4">
                  <p className="font-semibold">Michael R.</p>
                  <p className="text-sm text-gray-600">Product Manager</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl my-8 mx-4">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Improve Your Customer Feedback?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Start creating professional feedback forms in seconds with our free AI form generator.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105" size="lg" asChild>
              <Link to="/signup">Create Free Feedback Form Now</Link>
            </Button>
            <Button variant="outline" className="border-2 border-purple-600 text-purple-600 font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-purple-50 transition-all duration-200" size="lg" asChild>
              <Link to="/">Learn More</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-3">No credit card needed • Free AI form generator for customer feedback</p>
        </div>
      </section>

      {/* SEO Content - Simplified */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2>How AI Makes Customer Feedback Forms Better</h2>
            <p>
              Getting quality customer feedback is essential for business growth, but traditional feedback 
              forms often fail to deliver useful insights. Our <strong>AI form generator for customer feedback</strong> 
              solves this problem by creating smarter, more effective feedback forms.
            </p>
            
            <p>
              Our <strong>free AI form generator for feedback</strong> helps businesses:
            </p>
            
            <ul>
              <li><strong>Get more specific feedback</strong> with intelligently designed questions</li>
              <li><strong>Increase completion rates</strong> with optimized form length and structure</li>
              <li><strong>Understand customer sentiment</strong> through AI-powered analytics</li>
              <li><strong>Save time</strong> by creating professional forms in seconds, not hours</li>
            </ul>
            
            <p>
              By using AI to create your feedback forms, you'll get deeper insights into what your customers 
              really think - helping you make better business decisions and improve customer satisfaction.
            </p>
            
            <p>
              Try our <strong>free AI form generator for customer feedback</strong> today and see the difference
              that AI-optimized forms can make for your business.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AIFormGeneratorForFeedback; 