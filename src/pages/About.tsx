import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Co-Founder',
      bio: 'Former Head of Product at TechForm. Passionate about using AI to solve real-world problems.',
      imageUrl: 'https://placehold.co/200x200/0066CC/FFFFFF/png?text=SJ'
    },
    {
      name: 'Michael Chen',
      role: 'CTO & Co-Founder',
      bio: 'AI researcher with 10+ years of experience. Previously led engineering teams at Google and Amazon.',
      imageUrl: 'https://placehold.co/200x200/8F00FF/FFFFFF/png?text=MC'
    },
    {
      name: 'Jessica Miller',
      role: 'Head of Design',
      bio: 'Award-winning UX designer with a focus on creating intuitive, accessible interfaces.',
      imageUrl: 'https://placehold.co/200x200/00D084/FFFFFF/png?text=JM'
    },
    {
      name: 'David Wilson',
      role: 'VP of Marketing',
      bio: 'Digital marketing expert who previously helped scale two successful SaaS startups.',
      imageUrl: 'https://placehold.co/200x200/0066CC/FFFFFF/png?text=DW'
    },
    {
      name: 'Emma Roberts',
      role: 'Customer Success Lead',
      bio: 'Dedicated to helping customers get the most value from our platform through education and support.',
      imageUrl: 'https://placehold.co/200x200/8F00FF/FFFFFF/png?text=ER'
    },
    {
      name: 'Alex Zhang',
      role: 'Lead AI Engineer',
      bio: 'PhD in Machine Learning with expertise in natural language processing and conversational AI.',
      imageUrl: 'https://placehold.co/200x200/00D084/FFFFFF/png?text=AZ'
    }
  ];

  const values = [
    {
      title: 'Innovation',
      description: 'We push the boundaries of what\'s possible with AI to create solutions that solve real problems.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: 'User-Centric',
      description: 'Everything we build starts with understanding our users\' needs and challenges.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: 'Quality',
      description: 'We hold ourselves to the highest standards in everything we do, from code to customer service.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      title: 'Transparency',
      description: 'We believe in being open and honest with our customers, partners, and each other.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-smartform-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-smartform-blue/5 to-smartform-violet/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About SmartFormAI</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're on a mission to revolutionize form creation through the power of artificial intelligence.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    SmartFormAI was founded in 2022 by Sarah Johnson and Michael Chen, who met while working at a major tech company. They shared a frustration with the tedious, time-consuming process of creating effective forms and surveys.
                  </p>
                  <p>
                    Coming from backgrounds in product management and AI engineering, they saw an opportunity to apply the latest advancements in artificial intelligence to transform how businesses collect and analyze data through forms.
                  </p>
                  <p>
                    What started as a passion project soon evolved into a full-fledged platform when early users reported significant improvements in form completion rates and data quality. The team has since grown to include experts in design, marketing, and customer success, all united by a shared vision of making intelligent forms accessible to everyone.
                  </p>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img 
                    src="https://placehold.co/600x400/0066CC/FFFFFF/png?text=Our+Story" 
                    alt="SmartFormAI founding team" 
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              To empower organizations of all sizes to create intelligent, conversational forms that engage users and yield valuable insights.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {values.map((value, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm flex">
                  <div className="mr-4 flex-shrink-0">
                    {value.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're a diverse group of passionate individuals committed to building the future of form technology.
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-smartform-blue font-medium mb-4">{member.role}</p>
                    <p className="text-gray-600">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-smartform-blue to-smartform-violet text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
              <div>
                <div className="text-5xl font-bold mb-2">30k+</div>
                <p className="text-xl opacity-90">Active Users</p>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">1M+</div>
                <p className="text-xl opacity-90">Forms Created</p>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">98%</div>
                <p className="text-xl opacity-90">Customer Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Join Us on Our Journey</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Experience the future of forms with SmartFormAI. Create your first intelligent form today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button className="bg-smartform-blue hover:bg-blue-700 text-lg" size="lg" asChild>
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button variant="outline" className="border-smartform-blue text-smartform-blue hover:bg-blue-50 text-lg" size="lg" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
