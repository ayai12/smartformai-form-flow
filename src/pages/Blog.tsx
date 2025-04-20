
import React from 'react';
import Layout from '@/components/layout/Layout';

const Blog: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        <p className="text-xl text-gray-600">
          Our blog is coming soon. Return to the <a href="/" className="text-smartform-blue hover:underline">homepage</a> to learn more about our product.
        </p>
      </div>
    </Layout>
  );
};

export default Blog;
