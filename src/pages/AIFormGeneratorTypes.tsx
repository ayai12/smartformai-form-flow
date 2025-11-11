import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';

// All the different types of AI form generators we offer
const formGeneratorTypes = [
  {
    title: "AI Form Generator for Surveys",
    description: "Create professional survey forms that get better response rates with AI-optimized questions. Perfect for market research and data collection.",
    link: "/ai-form-generator-for-surveys",
    icon: "📊",
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-500",
    keywords: ["surveys", "market research", "data collection"]
  },
  {
    title: "AI Form Generator for Customer Feedback",
    description: "Build feedback forms that get actionable insights. Our AI creates questions designed to uncover customer opinions and improvement opportunities.",
    link: "/ai-form-generator-for-feedback",
    icon: "💬",
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-500",
    keywords: ["customer feedback", "product feedback", "service improvement"]
  },
  {
    title: "AI Form Generator for Lead Generation",
    description: "Create high-converting lead forms that capture qualified leads while maintaining high completion rates. Optimize your marketing forms with AI.",
    link: "/lead-generation",
    icon: "🎯",
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-500", 
    keywords: ["lead generation", "lead capture", "marketing forms"]
  },
  {
    title: "AI Form Generator with Templates",
    description: "Start with our pre-designed form templates and let AI customize them for your specific needs. The fastest way to create professional forms.",
    link: "/templates",
    icon: "📋",
    color: "bg-yellow-50 border-yellow-200",
    iconColor: "text-yellow-600",
    keywords: ["templates", "quick form creation", "pre-designed forms"]
  },
  {
    title: "AI Form Generator with Analytics",
    description: "Get real-time insights from your forms with our built-in analytics. Understand responses and make data-driven decisions based on form submissions.",
    link: "/analytics",
    icon: "📈",
    color: "bg-red-50 border-red-200",
    iconColor: "text-red-500",
    keywords: ["analytics", "data visualization", "insights dashboard"]
  },
  {
    title: "AI Form Generator for Market Research",
    description: "Conduct effective market research with our AI-generated forms. Get structured data that helps you understand your market and make better business decisions.",
    link: "/market-research",
    icon: "🔍",
    color: "bg-indigo-50 border-indigo-200",
    iconColor: "text-indigo-500",
    keywords: ["market research", "consumer insights", "market analysis"]
  }
];

const AIFormGeneratorTypes: React.FC = () => {
  return (
    <Layout>
      <Helmet>
        <title>Types of AI Form Generators | Free Form Building Tools | SurveyAgent</title>
        <meta name="description" content="Explore all types of AI form generators available from SurveyAgent. Find the perfect free AI form generator for your specific needs." />
        <meta name="keywords" content="ai form generator, types of form generators, free ai form generator, ai form generator tool, ai form generator software, ai form generator app" />
        <link rel="canonical" href="https://surveyagent.app/ai-form-generator-types" />
        <meta property="og:title" content="Types of AI Form Generators | SurveyAgent" />
        <meta property="og:description" content="Explore all types of AI form generators available from SurveyAgent. Find the perfect free AI form generator for your specific needs." />
        <meta property="og:url" content="https://surveyagent.app/ai-form-generator-types" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              AI Form Generator Tools
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Find the perfect AI form generator for your specific needs. 
              All tools are free to try, with no coding required.
            </p>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105" size="lg" asChild>
              <Link to="/signup">Try Any Form Generator Free</Link>
            </Button>
            <p className="text-sm text-gray-600 mt-3">No credit card needed • Free to get started</p>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Find Your Perfect Form Generator</h2>
          <p className="text-lg text-gray-700 text-center max-w-3xl mx-auto mb-10">
            Choose the right AI form generator based on your specific needs. All our tools use advanced AI to create professional forms in seconds.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {formGeneratorTypes.map((type, idx) => (
              <a 
                key={idx} 
                href={`#${type.title.toLowerCase().replace(/\s+/g, '-')}`}
                className={`${type.color} ${type.iconColor} px-4 py-3 rounded-full flex items-center hover:shadow-md transition-all border`}
              >
                <span className="mr-2">{type.icon}</span>
                <span className="font-medium">{type.title.replace('AI Form Generator for ', '').replace('AI Form Generator with ', '')}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Form Generator Types */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {formGeneratorTypes.map((type, idx) => (
              <Card 
                key={idx} 
                id={type.title.toLowerCase().replace(/\s+/g, '-')}
                className={`${type.color} border shadow-md hover:shadow-xl transition-all overflow-hidden`}
              >
                <CardHeader className="border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-4xl ${type.iconColor}`}>{type.icon}</span>
                    <CardTitle className="text-xl">{type.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 text-lg mb-6">{type.description}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {type.keywords.map((keyword, kidx) => (
                      <span key={kidx} className="bg-white/60 border border-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-bold text-lg mb-3">Perfect For:</h3>
                  <ul className="space-y-2 mb-6">
                    {idx === 0 && (
                      <>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Market researchers collecting data</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Event organizers gathering feedback</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Businesses conducting research</span>
                        </li>
                      </>
                    )}
                    {idx === 1 && (
                      <>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Product teams improving offerings</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Customer service departments</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>E-commerce sites collecting reviews</span>
                        </li>
                      </>
                    )}
                    {idx === 2 && (
                      <>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Marketing teams capturing leads</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Sales departments qualifying prospects</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Website conversion optimization</span>
                        </li>
                      </>
                    )}
                    {idx === 3 && (
                      <>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Quick form creation needs</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Common form types (contact, registration)</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Consistency across multiple forms</span>
                        </li>
                      </>
                    )}
                    {idx === 4 && (
                      <>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Data-driven decision making</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Performance tracking and reporting</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Conversion optimization efforts</span>
                        </li>
                      </>
                    )}
                    {idx === 5 && (
                      <>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Product development research</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Customer behavior analysis</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>Competitive market analysis</span>
                        </li>
                      </>
                    )}
                  </ul>
                </CardContent>
                <CardFooter className="border-t border-gray-200 pt-4">
                  <Button className={`w-full bg-white hover:bg-gray-50 border ${type.iconColor}`} asChild>
                    <Link to={type.link}>Explore {type.title.replace('AI Form Generator for ', '').replace('AI Form Generator with ', '')}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Choose Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10">How to Choose the Right AI Form Generator</h2>
          
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3">1</span>
                  Identify Your Main Goal
                </h3>
                <p className="text-gray-700 mb-2 ml-11">Start by determining what you're trying to accomplish:</p>
                <ul className="space-y-1 ml-11 text-gray-600">
                  <li>• Collecting customer feedback</li>
                  <li>• Generating qualified leads</li>
                  <li>• Conducting market research</li>
                  <li>• Creating quick forms with templates</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mr-3">2</span>
                  Consider Data Analysis Needs
                </h3>
                <p className="text-gray-700 mb-2 ml-11">Think about how you'll use the responses:</p>
                <ul className="space-y-1 ml-11 text-gray-600">
                  <li>• Basic response collection only</li>
                  <li>• Visual analytics and dashboards</li>
                  <li>• Detailed data export capabilities</li>
                  <li>• AI-powered insight generation</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" size="lg" asChild>
              <Link to="/signup">Try All AI Form Generators Free</Link>
            </Button>
            <p className="text-sm text-gray-500 mt-2">All our AI form generators are available with a free account</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl my-8 mx-4">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Create Your Form?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Try any of our AI form generator tools for free and start creating professional forms in seconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105" size="lg" asChild>
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button variant="outline" className="border-2 border-purple-600 text-purple-600 font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-purple-50 transition-all duration-200" size="lg" asChild>
              <Link to="/">Learn More</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-3">No credit card needed • Free AI form generator</p>
        </div>
      </section>

      {/* SEO Content - Simplified */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2>Understanding Different Types of AI Form Generators</h2>
            <p>
              AI form generators have revolutionized how businesses create and manage forms. Unlike traditional 
              form builders, our <strong>AI form generators</strong> use artificial intelligence to automatically 
              create relevant, effective forms based on a simple description of what you need.
            </p>
            
            <p>
              Each type of <strong>free AI form generator</strong> we offer is designed for specific use cases:
            </p>
            
            <ul>
              <li><strong>Survey form generators</strong> create questions that maximize response rates and gather valuable data</li>
              <li><strong>Feedback form generators</strong> help you collect actionable insights from customers</li>
              <li><strong>Lead generation form generators</strong> optimize for conversion while qualifying prospects</li>
              <li><strong>Template-based form generators</strong> provide pre-designed structures the AI can customize</li>
              <li><strong>Analytics-focused form generators</strong> include powerful tools for understanding responses</li>
            </ul>
            
            <p>
              By choosing the right <strong>AI form generator</strong> for your specific needs, you'll get better results 
              than using a generic tool. Each specialized generator is trained on thousands of successful forms in its 
              category, ensuring it creates the most effective questions and structure for your goals.
            </p>
            
            <p>
              Try any of our <strong>free AI form generator</strong> tools today and see the difference that specialized AI 
              can make in your form creation process.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AIFormGeneratorTypes; 