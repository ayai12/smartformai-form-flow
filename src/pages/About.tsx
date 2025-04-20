
import React from 'react';
import Layout from '@/components/layout/Layout';

const About: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">About SmartFormAI</h1>
          
          <p className="text-lg text-gray-700 mb-6">
            SmartFormAI was founded in 2023 with a simple mission: to make forms smarter, more intuitive, and more effective.
          </p>
          
          <p className="text-lg text-gray-700 mb-6">
            We believe that forms shouldn't be a barrier between businesses and their customers. Instead, they should facilitate meaningful conversations and insights.
          </p>
          
          <p className="text-lg text-gray-700 mb-6">
            Our team of AI experts and UX designers have created a platform that transforms the traditional form experience into an intelligent, adaptive conversation that drives higher completion rates and better data quality.
          </p>
          
          <h2 className="text-2xl font-bold mt-12 mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700 mb-6">
            To revolutionize how businesses collect information by making forms that think like humans and respond like experts.
          </p>
          
          <h2 className="text-2xl font-bold mt-12 mb-4">Our Vision</h2>
          <p className="text-lg text-gray-700 mb-6">
            A world where every form is a meaningful conversation, where questions adapt to the person answering them, and where insights flow naturally from human-AI interaction.
          </p>
          
          <h2 className="text-2xl font-bold mt-12 mb-4">Our Values</h2>
          <ul className="list-disc pl-6 text-lg text-gray-700 mb-6 space-y-3">
            <li><strong>Innovation:</strong> We're constantly pushing the boundaries of what's possible with AI and form technology.</li>
            <li><strong>Simplicity:</strong> We believe in making complex technology simple and accessible to everyone.</li>
            <li><strong>User-Centricity:</strong> We design everything with the end user in mind, creating experiences that people enjoy.</li>
            <li><strong>Data Responsibility:</strong> We respect privacy and handle data with the utmost care and transparency.</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default About;
