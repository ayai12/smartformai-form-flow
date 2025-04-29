import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Features: React.FC = () => {
  const featureGroups = [
    {
      title: 'Form Creation',
      features: [
        {
          title: 'Prompt-Based Generation',
          description: 'Simply describe your form in natural language, and our AI will generate a complete form for you.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )
        },
        {
          title: 'Tone Customization',
          description: 'Choose from Educational, Business, or Personal tones to match your audience and purpose.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          )
        },
        {
          title: 'AI Question Generation',
          description: 'Our AI generates clear, relevant questions optimized for user engagement and completion rates.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      ]
    },
    {
      title: 'Customization & Editing',
      features: [
        {
          title: 'Editable Form Canvas',
          description: 'Add, remove, edit, and rearrange questions with our intuitive drag-and-drop interface.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          )
        },
        {
          title: 'AI-Powered Edits',
          description: 'Ask the AI to rewrite, simplify, or elaborate on any question or instruction.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          )
        },
        {
          title: 'Design Templates',
          description: 'Choose from beautiful, ready-made designs to give your forms a professional look.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          )
        }
      ]
    },
    {
      title: 'Publishing & Sharing',
      features: [
        {
          title: 'One-Click Publishing',
          description: 'Publish your form with a single click and get a unique, shareable link instantly.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )
        },
        {
          title: 'Embedding Options',
          description: 'Easily embed your forms on your website or share via email, social media, or message.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )
        },
        {
          title: 'Secure Access Controls',
          description: 'Control who can view and submit your forms with password protection or email verification.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )
        }
      ]
    },
    {
      title: 'Analytics & Insights',
      features: [
        {
          title: 'Real-Time Analytics',
          description: 'Track form views, completion rates, and user behavior in real-time.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )
        },
        {
          title: 'Response Visualization',
          description: 'Visualize responses with beautiful charts and graphs to extract meaningful insights.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          )
        },
        {
          title: 'Export Capabilities',
          description: 'Export your data in multiple formats (CSV, Excel, PDF) for further analysis.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        }
      ]
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-smartform-blue/5 to-smartform-violet/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Powerful Features</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Discover the tools that make SmartFormAI the most intelligent and efficient form solution available.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button className="bg-smartform-blue hover:bg-blue-700 text-lg" size="lg" asChild>
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button variant="outline" className="border-smartform-blue text-smartform-blue hover:bg-blue-50 text-lg" size="lg" asChild>
              <Link to="/templates">Browse Templates</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Sections */}
      {featureGroups.map((group, groupIndex) => (
        <section key={groupIndex} className={`py-20 ${groupIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">{group.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {group.features.map((feature, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="mb-6">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Call to Action */}
      <section className="py-16 bg-smartform-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to experience SmartFormAI?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Create your first AI-powered form in minutes, no credit card required.
          </p>
          <Button className="bg-white text-smartform-blue hover:bg-gray-100 text-lg" size="lg" asChild>
            <Link to="/signup">Start Creating</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Features;
