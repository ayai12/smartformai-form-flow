import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { blogPosts } from './blogData';

const BlogList: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <Helmet>
        <title>Blog | SmartFormAI by Rein Watashi</title>
        <meta name="description" content="Read the latest on AI forms, analytics, and product updates from SmartFormAI. By Rein Watashi." />
        <meta name="author" content="Rein Watashi" />
      </Helmet>
      {/* Trust Badges Row */}
      <div className="flex flex-wrap justify-center gap-4 mb-8 z-20 relative animate-fade-in-slow">
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-xl px-4 py-2 shadow border border-gray-100">
          <span className="inline-block w-4 h-4 bg-purple-400 rounded-full animate-pulse"></span>
          <span className="text-xs font-semibold text-gray-700">AI-Powered</span>
        </div>
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-xl px-4 py-2 shadow border border-gray-100">
          <span className="inline-block w-4 h-4 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-xs font-semibold text-gray-700">Secure & Private</span>
        </div>
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-xl px-4 py-2 shadow border border-gray-100">
          <span className="inline-block w-4 h-4 bg-blue-400 rounded-full animate-pulse"></span>
          <span className="text-xs font-semibold text-gray-700">Rated 5/5</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 font-poppins">SmartFormAI Blog</h1>
        <p className="text-center text-gray-600 mb-12 text-lg">Tips, guides, and updates on AI forms and analytics. <span className="font-semibold text-smartform-blue">By Rein Watashi</span></p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogPosts.map(post => (
            <Link to={`/blog/${post.slug}`} key={post.slug} className="group rounded-2xl bg-white/80 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all border border-gray-100 overflow-hidden flex flex-col hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-400">
              <img src={post.image} alt={post.title} className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-6 flex flex-col flex-grow">
                <span className="text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wide">{post.category}</span>
                <h2 className="text-2xl font-bold mb-2 group-hover:text-smartform-blue transition-colors font-poppins">{post.title}</h2>
                <p className="text-gray-600 mb-4 flex-grow text-base">{post.summary}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                  <span>by Rein Watashi</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {/* CTA at bottom */}
        <div className="mt-16 flex justify-center">
          <Link to="/signup" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold px-10 py-4 rounded-full shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400">
            Try SmartFormAI Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogList; 