
import React from 'react';
import Layout from '@/components/layout/Layout';
import PricingSection from '@/components/sections/Pricing';

const Pricing: React.FC = () => {
  return (
    <Layout>
      <div className="py-12">
        <div className="container mx-auto px-4 text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Pricing Plans</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. All plans include our core AI features.
          </p>
        </div>
        <PricingSection />
      </div>
    </Layout>
  );
};

export default Pricing;
