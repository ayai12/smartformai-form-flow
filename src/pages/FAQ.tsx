import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

const FAQ: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Categories
  const categories = [
    { id: 'all', name: 'All FAQs' },
    { id: 'general', name: 'General' },
    { id: 'features', name: 'Features' },
    { id: 'pricing', name: 'Pricing & Plans' },
    { id: 'security', name: 'Privacy & Security' },
    { id: 'tech', name: 'Technical' }
  ];

  // FAQ Questions and Answers
  const faqs = [
    {
      id: 'what-is-smartformai',
      question: 'What is SmartFormAI?',
      answer: 'SmartFormAI is an intelligent form-building platform that uses AI to help you create, optimize, and analyze forms. Our platform allows you to generate forms from simple prompts, customize the tone and style, and gain deep insights from form responses.',
      category: 'general'
    },
    {
      id: 'how-does-ai-generation-work',
      question: 'How does the AI form generation work?',
      answer: 'SmartFormAI uses advanced language models to understand your intent. Simply type a prompt like "Create a customer satisfaction survey for my coffee shop" and our AI will generate relevant questions, appropriate answer formats, and logical flow. You can then edit and customize as needed.',
      category: 'features'
    },
    {
      id: 'form-types',
      question: 'What types of forms can I create?',
      answer: 'You can create virtually any type of form: surveys, quizzes, registrations, contact forms, job applications, feedback forms, event registrations, and more. If you can describe it, our AI can help you build it.',
      category: 'features'
    },
    {
      id: 'do-i-need-coding',
      question: 'Do I need to know coding to use SmartFormAI?',
      answer: 'Absolutely not! That\'s the beauty of our platform. You can create sophisticated, professional forms without writing a single line of code. Simply describe what you need in plain language and our AI handles the technical aspects.',
      category: 'general'
    },
    {
      id: 'free-plan-limitations',
      question: 'What are the limitations of the free plan?',
      answer: 'The free plan includes up to 3 active forms, basic AI generation capabilities, and community support. It also includes SmartFormAI branding on your forms and basic analytics. For more forms, advanced features, or to remove branding, check out our paid plans.',
      category: 'pricing'
    },
    {
      id: 'payment-options',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and for annual business plans, we can also accommodate invoicing and bank transfers.',
      category: 'pricing'
    },
    {
      id: 'data-ownership',
      question: 'Who owns the data collected through my forms?',
      answer: 'You retain full ownership of all data collected through your forms. We do not sell or share your data with third parties. Our platform simply provides the tools for you to collect and analyze the data.',
      category: 'security'
    },
    {
      id: 'gdpr-compliance',
      question: 'Is SmartFormAI GDPR compliant?',
      answer: 'Yes, SmartFormAI is fully GDPR compliant. We provide built-in tools to help you maintain compliance, including consent checkboxes, data subject access request handling, and data export/deletion features.',
      category: 'security'
    },
    {
      id: 'data-storage',
      question: 'Where is my form data stored?',
      answer: 'Your data is stored securely in Google Cloud Platform data centers with industry-standard encryption both in transit and at rest. For enterprise customers, we offer region-specific data storage options.',
      category: 'security'
    },
    {
      id: 'browser-compatibility',
      question: 'What browsers does SmartFormAI support?',
      answer: 'SmartFormAI works on all modern browsers including Chrome, Firefox, Safari, Edge, and Opera. We recommend keeping your browser updated to the latest version for the best experience.',
      category: 'tech'
    },
    {
      id: 'form-submissions',
      question: 'Is there a limit to form submissions?',
      answer: 'On the free plan, you can receive up to 100 submissions per month. The Plus plan includes 1,000 submissions per month, and the Business plan includes 10,000. Enterprise plans have customizable limits based on your needs.',
      category: 'pricing'
    },
    {
      id: 'integrations',
      question: 'Can I integrate SmartFormAI with other tools?',
      answer: 'Yes! SmartFormAI integrates with popular tools like Google Sheets, Slack, Zapier, Mailchimp, HubSpot, Salesforce, and more. This allows you to automatically send form responses to your favorite tools and streamline your workflow.',
      category: 'features'
    },
    {
      id: 'offline-forms',
      question: 'Do forms work offline?',
      answer: 'By default, forms require an internet connection. However, for Plus and higher plans, we offer a Progressive Web App option that can collect responses offline and sync when a connection is restored.',
      category: 'tech'
    },
    {
      id: 'custom-domains',
      question: 'Can I use my own domain for forms?',
      answer: 'Yes, on Plus and higher plans, you can use your own custom domain (e.g., forms.yourbusiness.com) for a more professional and branded experience.',
      category: 'features'
    },
    {
      id: 'cancel-subscription',
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription at any time from your account settings. If you cancel, you\'ll continue to have access to your paid features until the end of your current billing period.',
      category: 'pricing'
    }
  ];

  // Filter FAQs by search query and category
  const filterFaqs = (category: string) => {
    let filtered = faqs;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query)
      );
    }
    
    if (category !== 'all') {
      filtered = filtered.filter(faq => faq.category === category);
    }
    
    return filtered;
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-smartform-blue/5 to-smartform-violet/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Find answers to common questions about SmartFormAI and how it can help you create intelligent forms.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="text"
                placeholder="Search questions..."
                className="pl-10 py-6 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="all" className="mb-8">
            <TabsList className="flex flex-wrap justify-center mb-10">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="px-6 py-2"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <div className="max-w-3xl mx-auto">
                  {filterFaqs(category.id).length > 0 ? (
                    <Accordion type="single" collapsible className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      {filterFaqs(category.id).map((faq, index) => (
                        <AccordionItem key={faq.id} value={faq.id} className={index !== 0 ? "border-t border-gray-100" : ""}>
                          <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 text-left">
                            <span className="font-medium text-gray-900">{faq.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4 pt-2 text-gray-600">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-xl font-bold mb-2">No questions found</h3>
                      <p className="text-gray-600 mb-6">
                        Try adjusting your search or filter to find what you're looking for
                      </p>
                      <Button 
                        onClick={() => setSearchQuery('')}
                        variant="outline"
                      >
                        Clear Search
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>
      
      {/* Still Have Questions */}
      <section className="py-16 bg-smartform-blue/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-md">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Still Have Questions?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We're here to help! Contact our support team and we'll get back to you as soon as possible.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-smartform-blue mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="font-bold mb-2">Email Support</h3>
                <p className="text-gray-600 mb-4">Get a response within 24 hours on business days</p>
                <a href="mailto:support@smartformai.com" className="text-smartform-blue font-medium hover:underline">
                  support@smartformai.com
                </a>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-smartform-violet mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="font-bold mb-2">Live Chat</h3>
                <p className="text-gray-600 mb-4">Available Monday-Friday, 9am-5pm EST</p>
                <Button variant="outline" className="border-smartform-violet text-smartform-violet hover:bg-violet-50">
                  Start Chat
                </Button>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-smartform-green mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="font-bold mb-2">Documentation</h3>
                <p className="text-gray-600 mb-4">Explore our detailed guides and tutorials</p>
                <Button variant="outline" className="border-smartform-green text-smartform-green hover:bg-green-50" asChild>
                  <Link to="/docs">View Docs</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FAQ; 