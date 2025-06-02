import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { blogPosts } from './blogData';

const BlogPost: React.FC = () => {
  const { slug } = useParams();
  const post = blogPosts.find(p => p.slug === slug) || blogPosts[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-0 sm:py-8 px-0 sm:px-4">
      <Helmet>
        <title>{post.title} | SmartFormAI Blog by Rein Watashi</title>
        <meta name="description" content={post.summary} />
        <meta name="author" content="Rein Watashi" />
      </Helmet>
      {/* Trust Badges Row */}
      <div className="flex flex-wrap justify-center gap-4 mb-6 z-20 relative animate-fade-in-slow pt-8">
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
      {/* Hero Section */}
      <div className="relative max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-xl mb-8">
        <img src={post.image} alt={post.title} className="w-full h-64 sm:h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-blue-700/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 sm:p-10">
          <span className="text-xs font-semibold text-purple-200 mb-2 inline-block uppercase tracking-wide">{post.category}</span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200 font-poppins drop-shadow-lg">{post.title}</h1>
          <div className="flex items-center gap-4 text-xs text-gray-200 mb-2">
            <span>{new Date(post.date).toLocaleDateString()}</span>
            <span>by Rein Watashi</span>
          </div>
        </div>
      </div>
      {/* Content Card */}
      <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 sm:p-10 mb-10 animate-fade-in-slow">
        <Link to="/blog" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Back to Blog</Link>
        <div className="prose prose-lg max-w-none text-gray-900" dangerouslySetInnerHTML={{ __html: post.content }} />
        {/* CTA at end of post */}
        <div className="mt-10 flex justify-center">
          <Link to="/signup" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold px-10 py-4 rounded-full shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400">
            Try SmartFormAI Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost; 