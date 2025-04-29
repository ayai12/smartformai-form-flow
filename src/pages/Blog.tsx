import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

const Blog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Blog categories
  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'ai', name: 'AI & Machine Learning' },
    { id: 'forms', name: 'Form Design' },
    { id: 'ux', name: 'UX & Conversion' },
    { id: 'analytics', name: 'Analytics & Insights' },
    { id: 'business', name: 'Business' }
  ];

  // Featured post
  const featuredPost = {
    id: 'ai-revolution-form-design',
    title: 'How AI is Revolutionizing Form Design and User Experience',
    excerpt: 'Discover how artificial intelligence is transforming the way businesses create and optimize forms, leading to higher conversion rates and better user experiences.',
    author: 'Sarah Johnson',
    authorRole: 'Head of Product',
    date: 'May 15, 2023',
    category: 'ai',
    readTime: '7 min read',
    imageUrl: 'https://placehold.co/800x500/0066CC/FFFFFF/png?text=AI+Form+Design',
    featured: true
  };

  // Blog posts data
  const blogPosts = [
    {
      id: 'form-abandonment-solutions',
      title: '5 Proven Solutions to Reduce Form Abandonment',
      excerpt: 'Learn effective strategies to keep users engaged and increase form completion rates with these proven techniques.',
      author: 'Michael Chen',
      authorRole: 'UX Specialist',
      date: 'April 28, 2023',
      category: 'ux',
      readTime: '5 min read',
      imageUrl: 'https://placehold.co/800x500/00D084/FFFFFF/png?text=Form+Abandonment'
    },
    {
      id: 'analytics-insights',
      title: 'Unlocking Insights from Form Analytics: A Complete Guide',
      excerpt: 'Dive deep into form analytics to understand user behavior and optimize your conversion funnel.',
      author: 'Jessica Miller',
      authorRole: 'Data Analyst',
      date: 'April 15, 2023',
      category: 'analytics',
      readTime: '9 min read',
      imageUrl: 'https://placehold.co/800x500/8F00FF/FFFFFF/png?text=Form+Analytics'
    },
    {
      id: 'conversational-forms',
      title: 'Conversational Forms: The Future of Data Collection',
      excerpt: 'Why traditional forms are being replaced by conversational interfaces and how you can implement them for your business.',
      author: 'David Wilson',
      authorRole: 'Content Strategist',
      date: 'March 30, 2023',
      category: 'forms',
      readTime: '6 min read',
      imageUrl: 'https://placehold.co/800x500/0066CC/FFFFFF/png?text=Conversational+Forms'
    },
    {
      id: 'machine-learning-personalization',
      title: 'Using Machine Learning for Form Personalization',
      excerpt: 'Explore how ML algorithms can create personalized form experiences that boost engagement and conversion.',
      author: 'Alex Zhang',
      authorRole: 'AI Engineer',
      date: 'March 22, 2023',
      category: 'ai',
      readTime: '8 min read',
      imageUrl: 'https://placehold.co/800x500/00D084/FFFFFF/png?text=ML+Personalization'
    },
    {
      id: 'gdpr-compliance',
      title: 'GDPR and Data Collection: Keeping Your Forms Compliant',
      excerpt: 'A comprehensive guide to ensuring your forms meet GDPR requirements while still collecting valuable data.',
      author: 'Emma Roberts',
      authorRole: 'Legal Consultant',
      date: 'March 10, 2023',
      category: 'business',
      readTime: '7 min read',
      imageUrl: 'https://placehold.co/800x500/8F00FF/FFFFFF/png?text=GDPR+Compliance'
    },
    {
      id: 'mobile-form-design',
      title: 'Mobile-First Form Design: Best Practices for 2023',
      excerpt: 'With mobile usage continuing to rise, learn how to design forms that provide an excellent experience on smaller screens.',
      author: 'Ryan Thompson',
      authorRole: 'Mobile UX Designer',
      date: 'February 28, 2023',
      category: 'ux',
      readTime: '6 min read',
      imageUrl: 'https://placehold.co/800x500/0066CC/FFFFFF/png?text=Mobile+Forms'
    },
    {
      id: 'accessible-forms',
      title: 'Creating Accessible Forms for All Users',
      excerpt: "Accessibility isn't just good practice—it's essential. Learn how to make your forms accessible to everyone.",
      author: 'Sophia Garcia',
      authorRole: 'Accessibility Specialist',
      date: 'February 15, 2023',
      category: 'forms',
      readTime: '7 min read',
      imageUrl: 'https://placehold.co/800x500/00D084/FFFFFF/png?text=Accessible+Forms'
    },
    {
      id: 'roi-smart-forms',
      title: 'Calculating ROI: The Business Case for Smart Forms',
      excerpt: 'Dive into the numbers behind intelligent forms and learn how to measure their impact on your bottom line.',
      author: 'Chris Mitchell',
      authorRole: 'Business Analyst',
      date: 'February 5, 2023',
      category: 'business',
      readTime: '8 min read',
      imageUrl: 'https://placehold.co/800x500/8F00FF/FFFFFF/png?text=Forms+ROI'
    }
  ];

  // Filter posts by search query and category
  const filterPosts = (category: string) => {
    let filtered = blogPosts;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.excerpt.toLowerCase().includes(query)
      );
    }
    
    if (category !== 'all') {
      filtered = filtered.filter(post => post.category === category);
    }
    
    return filtered;
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-smartform-blue/5 to-smartform-violet/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">SmartFormAI Blog</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Insights, tips, and best practices for creating intelligent forms
            that drive conversions and improve user experience.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="text"
                placeholder="Search articles..."
                className="pl-10 py-6 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Featured Article</h2>
          <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img
                  src={featuredPost.imageUrl}
                  alt={featuredPost.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-8">
                <Badge className="mb-4 bg-smartform-blue">{categories.find(c => c.id === featuredPost.category)?.name}</Badge>
                <h3 className="text-2xl font-bold mb-4">{featuredPost.title}</h3>
                <p className="text-gray-600 mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">{featuredPost.author}</p>
                    <p className="text-sm text-gray-600">{featuredPost.authorRole}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-6">
                  <span>{featuredPost.date}</span>
                  <span className="mx-2">•</span>
                  <span>{featuredPost.readTime}</span>
                </div>
                <Button asChild>
                  <Link to={`/blog/${featuredPost.id}`}>Read Article</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filterPosts(category.id).map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col"
                    >
                      <div className="h-48 overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="p-6 flex-grow flex flex-col">
                        <Badge variant="outline" className="w-fit mb-3 bg-gray-50">
                          {categories.find(c => c.id === post.category)?.name}
                        </Badge>
                        <h3 className="text-xl font-bold mb-3">{post.title}</h3>
                        <p className="text-gray-600 mb-4 flex-grow">{post.excerpt}</p>
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <span>{post.date}</span>
                          <span className="mx-2">•</span>
                          <span>{post.readTime}</span>
                        </div>
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                          <div>
                            <p className="text-sm font-medium">{post.author}</p>
                          </div>
                        </div>
                        <Button variant="outline" asChild className="w-full">
                          <Link to={`/blog/${post.id}`}>Read More</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filterPosts(category.id).length === 0 && (
                  <div className="text-center py-20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-bold mb-2">No articles found</h3>
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
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>
      
      {/* Newsletter Signup */}
      <section className="py-16 bg-smartform-blue/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-md">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
              <p className="text-gray-600">
                Get the latest articles, tips, and insights on form design, AI, and user experience delivered straight to your inbox.
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-grow py-6"
                />
                <Button className="bg-smartform-blue hover:bg-blue-700">
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
