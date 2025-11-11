import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const AIFormGeneratorForSurveys: React.FC = () => {
  return (
    <Layout>
      <Helmet>
        <title>AI Form Generator for Surveys | Create Survey Forms | SurveyAgent</title>
        <meta name="description" content="Create professional survey forms in seconds with SurveyAgent's free AI form generator for surveys. Get better response rates with AI-optimized questions." />
        <meta name="keywords" content="ai form generator for surveys, free ai form generator for surveys, survey form generator, ai survey maker, ai survey creator" />
        <link rel="canonical" href="https://surveyagent.app/ai-form-generator-for-surveys" />
        <meta property="og:title" content="AI Form Generator for Surveys | SurveyAgent" />
        <meta property="og:description" content="Create professional survey forms in seconds with SurveyAgent's free AI form generator for surveys." />
        <meta property="og:url" content="https://surveyagent.app/ai-form-generator-for-surveys" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section with animated background */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-blue-500/10"
              style={{
                width: `${Math.random() * 50 + 10}px`,
                height: `${Math.random() * 50 + 10}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 20 + 10}s`,
                animationDelay: `${Math.random() * 2}s`,
                animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-6 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full blur opacity-30 animate-pulse"></div>
              <div className="relative bg-white/30 backdrop-blur-sm px-6 py-2 rounded-full border border-white/50">
                <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                  #1 RATED AI SURVEY TOOL
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-sm">
              AI Form Generator for Surveys
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Create professional survey forms in seconds with our AI-powered tool.
              No coding required, just describe what you need.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 group" size="lg" asChild>
                <Link to="/signup">
                  Create Free Survey Form Now
                  <svg className="w-5 h-5 ml-2 inline-block transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </Link>
              </Button>
              <Button variant="outline" className="border-2 border-purple-600 text-purple-600 font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-purple-50 transition-all duration-200" size="lg" asChild>
                <a href="#demo">Watch Demo</a>
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-3">No credit card needed • Free to get started</p>
          </div>
        </div>
      </section>

      {/* Simple 3-step process with animated counters */}
      <section className="py-16 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -right-20 top-10 w-64 h-64 bg-purple-100 rounded-full opacity-70 blur-3xl"></div>
        <div className="absolute -left-20 bottom-10 w-80 h-80 bg-blue-100 rounded-full opacity-70 blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative">
          <h2 className="text-3xl font-bold text-center mb-4 drop-shadow-sm">Create Surveys in 3 Simple Steps</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Our AI form generator makes creating professional surveys faster and easier than ever before.</p>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-100/0 to-purple-100/50 rounded-2xl transform group-hover:scale-105 transition-all duration-300 -z-10"></div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-purple-200 transform group-hover:scale-110 transition-transform duration-300">1</div>
                <h3 className="text-xl font-bold mb-2 text-purple-700">Describe Your Survey</h3>
                <p className="text-gray-600 px-4">Tell our AI what information you want to collect and who your audience is.</p>
              </div>
              
              <div className="text-center relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-100/0 to-blue-100/50 rounded-2xl transform group-hover:scale-105 transition-all duration-300 -z-10"></div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-200 transform group-hover:scale-110 transition-transform duration-300">2</div>
                <h3 className="text-xl font-bold mb-2 text-blue-700">AI Creates Your Form</h3>
                <p className="text-gray-600 px-4">Our AI instantly generates professional survey questions optimized for responses.</p>
              </div>
              
              <div className="text-center relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-green-100/0 to-green-100/50 rounded-2xl transform group-hover:scale-105 transition-all duration-300 -z-10"></div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-green-200 transform group-hover:scale-110 transition-transform duration-300">3</div>
                <h3 className="text-xl font-bold mb-2 text-green-700">Share & Analyze</h3>
                <p className="text-gray-600 px-4">Publish your survey with one click and watch responses come in with real-time analytics.</p>
              </div>
            </div>
            
            {/* Animated process line */}
            <div className="hidden md:block absolute top-[45%] left-[25%] w-[50%] h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 transform -translate-y-1/2 rounded-full">
              <div className="absolute top-0 left-0 w-full h-full bg-white/80 animate-pulse-slow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Why SmartFormAI for Surveys - with hover effects */}
      <section className="py-16 bg-gray-50 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 drop-shadow-sm">Why Use SmartFormAI for Survey Forms?</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Our AI form generator creates better surveys with less effort.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 transform origin-left group-hover:scale-y-100 scale-y-0 transition-transform duration-300"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-3xl mr-3 bg-blue-100 text-blue-600 w-12 h-12 flex items-center justify-center rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">🧠</span>
                  <span className="group-hover:text-blue-700 transition-colors duration-300">AI-Powered Questions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">Our AI creates questions that get better responses. It understands what makes a good survey and applies proven techniques automatically.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-purple-500 transform origin-left group-hover:scale-y-100 scale-y-0 transition-transform duration-300"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-3xl mr-3 bg-purple-100 text-purple-600 w-12 h-12 flex items-center justify-center rounded-full group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">⚡</span>
                  <span className="group-hover:text-purple-700 transition-colors duration-300">Save Hours of Work</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">Create professional surveys in seconds instead of hours. No more searching for the right questions or struggling with survey design.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-green-500 transform origin-left group-hover:scale-y-100 scale-y-0 transition-transform duration-300"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-3xl mr-3 bg-green-100 text-green-600 w-12 h-12 flex items-center justify-center rounded-full group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">📊</span>
                  <span className="group-hover:text-green-700 transition-colors duration-300">Built-in Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">Get instant insights as responses come in. Visual charts and summaries help you understand the data without being a statistics expert.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-500 transform origin-left group-hover:scale-y-100 scale-y-0 transition-transform duration-300"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-3xl mr-3 bg-red-100 text-red-600 w-12 h-12 flex items-center justify-center rounded-full group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">📱</span>
                  <span className="group-hover:text-red-700 transition-colors duration-300">Works Everywhere</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">Your surveys work perfectly on any device - mobile, tablet, or desktop. Embed them on your website or share with a simple link.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Survey Types with Visual Icons and animations */}
      <section className="py-16 bg-white relative overflow-hidden" id="demo">
        {/* Background decoration */}
        <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-br from-blue-50/50 to-purple-50/50 -z-10"></div>
        <div className="absolute -left-20 top-20 w-40 h-40 bg-blue-100 rounded-full mix-blend-multiply blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -right-20 top-40 w-40 h-40 bg-purple-100 rounded-full mix-blend-multiply blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute left-40 bottom-20 w-40 h-40 bg-pink-100 rounded-full mix-blend-multiply blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        
        <div className="container mx-auto px-4 relative">
          <h2 className="text-3xl font-bold text-center mb-4 drop-shadow-sm">Popular Survey Types You Can Create</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Our AI form generator helps you create any type of survey with professional results.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { title: "Customer Satisfaction", icon: "😊", color: "bg-blue-50 text-blue-600", hoverColor: "hover:bg-blue-100" },
              { title: "Market Research", icon: "🔍", color: "bg-purple-50 text-purple-600", hoverColor: "hover:bg-purple-100" },
              { title: "Employee Feedback", icon: "👥", color: "bg-green-50 text-green-600", hoverColor: "hover:bg-green-100" },
              { title: "Event Feedback", icon: "🎪", color: "bg-yellow-50 text-yellow-600", hoverColor: "hover:bg-yellow-100" },
              { title: "Product Feedback", icon: "📦", color: "bg-red-50 text-red-600", hoverColor: "hover:bg-red-100" },
              { title: "Website Feedback", icon: "🖥️", color: "bg-indigo-50 text-indigo-600", hoverColor: "hover:bg-indigo-100" },
            ].map((survey, idx) => (
              <div key={idx} className={`flex flex-col items-center text-center p-6 rounded-lg ${survey.hoverColor} transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-gray-100/50 backdrop-blur-sm`}>
                <div className={`w-16 h-16 ${survey.color} rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm`}>
                  {survey.icon}
                </div>
                <h3 className="font-bold text-lg mb-1">{survey.title}</h3>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-200/50" size="lg" asChild>
              <Link to="/signup">Create Your Survey Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features with Visual Example and animated checkmarks */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">What Makes Our AI Survey Tool Different</h2>
                <ul className="space-y-6">
                  <li className="flex items-start transform transition-transform hover:translate-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white mt-1 mr-3 shadow-md shadow-green-200/50">✓</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Smart Question Logic</h3>
                      <p className="text-gray-600">Questions adapt based on previous answers for a personalized experience</p>
                    </div>
                  </li>
                  <li className="flex items-start transform transition-transform hover:translate-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white mt-1 mr-3 shadow-md shadow-green-200/50">✓</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Bias-Free Questions</h3>
                      <p className="text-gray-600">AI creates neutral questions that don't influence responses</p>
                    </div>
                  </li>
                  <li className="flex items-start transform transition-transform hover:translate-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white mt-1 mr-3 shadow-md shadow-green-200/50">✓</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">One-Click Templates</h3>
                      <p className="text-gray-600">Start with proven survey templates that the AI customizes for you</p>
                    </div>
                  </li>
                  <li className="flex items-start transform transition-transform hover:translate-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white mt-1 mr-3 shadow-md shadow-green-200/50">✓</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Response Insights</h3>
                      <p className="text-gray-600">AI helps analyze responses and identify important trends</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-200 transform transition-all duration-500 hover:scale-105 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img 
                  src="/survey-demo.jpg" 
                  alt="AI Form Generator for Surveys Demo" 
                  className="w-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/600x400/e9ecef/6c757d?text=AI+Survey+Generator";
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-sm">See how our AI form generator creates professional surveys in seconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 drop-shadow-sm">Real Results from Our AI Survey Tool</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">See the difference our AI form generator makes for businesses like yours.</p>
          
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 mb-2">89%</div>
              <p className="text-lg text-gray-700">Higher completion rate compared to traditional surveys</p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 mb-2">4.2×</div>
              <p className="text-lg text-gray-700">More actionable insights from AI-generated questions</p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500 mb-2">97%</div>
              <p className="text-lg text-gray-700">Of users create better surveys with our AI form generator</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with animated gradient */}
      <section className="py-16 relative overflow-hidden my-8 mx-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-90 rounded-3xl"></div>
        
        {/* Animated background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl">
          <div className="absolute top-0 -left-10 w-40 h-40 bg-white/10 rounded-full mix-blend-overlay blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-10 w-40 h-40 bg-pink-500/10 rounded-full mix-blend-overlay blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-10 left-20 w-40 h-40 bg-blue-500/10 rounded-full mix-blend-overlay blur-xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow-md">Ready to Create Your First AI Survey?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
            Start building professional surveys in seconds with our free AI form generator.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105" size="lg" asChild>
              <Link to="/signup">Create Free Survey Now</Link>
            </Button>
            <Button variant="outline" className="border-2 border-white text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-white/10 transition-all duration-200" size="lg" asChild>
              <a href="#demo">See Demo</a>
            </Button>
          </div>
          <p className="text-sm text-white/80 mt-3">No credit card needed • Free AI form generator for surveys</p>
        </div>
      </section>

      {/* SEO Footer - Simplified and More Readable */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 inline-block">Create Better Surveys with AI</h2>
            <p>
              Creating effective surveys used to be challenging. You needed expertise in question design, 
              survey flow, and data analysis. Our <strong>AI form generator for surveys</strong> changes that by making 
              professional survey creation available to everyone.
            </p>
            
            <p>
              SmartFormAI's <strong>free AI form generator for surveys</strong> helps you:
            </p>
            
            <ul>
              <li><strong>Create unbiased questions</strong> that get honest, accurate responses</li>
              <li><strong>Design surveys that people complete</strong> instead of abandoning halfway</li>
              <li><strong>Analyze results automatically</strong> to find actionable insights</li>
              <li><strong>Save hours of work</strong> with instant survey generation</li>
            </ul>
            
            <p>
              Whether you're researching your market, collecting customer feedback, or gathering employee opinions, 
              our AI form generator gives you professional-quality surveys in seconds.
            </p>
            
            <p>
              Try our <strong>free AI form generator for surveys</strong> today and see why thousands of businesses
              are switching to AI-powered survey creation.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AIFormGeneratorForSurveys; 