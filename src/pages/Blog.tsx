import React from 'react';
import Layout from '@/components/layout/Layout';

const Blog: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">Coming Soon</h1>
        <p className="text-xl text-gray-500">The SmartFormAI Blog is on its way. Stay tuned!</p>
        </div>
    </Layout>
  );
};

export default Blog;
