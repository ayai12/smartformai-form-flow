import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { FileText, PlusCircle, Search, Star, Sparkles } from 'lucide-react';

// Mock template categories and data
const categories = [
  { id: 'all', name: 'All Templates' },
  { id: 'business', name: 'Business' },
  { id: 'education', name: 'Education' },
  { id: 'feedback', name: 'Feedback' },
  { id: 'events', name: 'Events' },
  { id: 'research', name: 'Research' },
  { id: 'personal', name: 'Personal' },
];

const templates = [
  {
    id: '1',
    title: 'Customer Feedback Survey',
    description: 'Collect valuable feedback about your products or services',
    category: 'feedback',
    questions: 12,
    popular: true,
    new: false,
    previewImage: '/placeholder-template-1.jpg'
  },
  {
    id: '2',
    title: 'Event Registration Form',
    description: 'Register attendees for your next event or conference',
    category: 'events',
    questions: 8,
    popular: true,
    new: false,
    previewImage: '/placeholder-template-2.jpg'
  },
  {
    id: '3',
    title: 'Employee Satisfaction Survey',
    description: 'Measure employee engagement and job satisfaction',
    category: 'business',
    questions: 15,
    popular: false,
    new: true,
    previewImage: '/placeholder-template-3.jpg'
  },
  {
    id: '4',
    title: 'Market Research Survey',
    description: 'Gather insights about market trends and consumer preferences',
    category: 'research',
    questions: 18,
    popular: false,
    new: false,
    previewImage: '/placeholder-template-4.jpg'
  },
  {
    id: '5',
    title: 'Course Evaluation',
    description: 'Get feedback from students about course content and teaching',
    category: 'education',
    questions: 10,
    popular: false,
    new: false,
    previewImage: '/placeholder-template-5.jpg'
  },
  {
    id: '6',
    title: 'Product Feedback Form',
    description: 'Collect feedback about your product features and usability',
    category: 'feedback',
    questions: 8,
    popular: true,
    new: false,
    previewImage: '/placeholder-template-6.jpg'
  },
  {
    id: '7',
    title: 'Conference Feedback',
    description: 'Gather attendee feedback about your conference or event',
    category: 'events',
    questions: 12,
    popular: false,
    new: true,
    previewImage: '/placeholder-template-7.jpg'
  },
  {
    id: '8',
    title: 'Website Usability Survey',
    description: 'Evaluate user experience and website functionality',
    category: 'feedback',
    questions: 14,
    popular: false,
    new: false,
    previewImage: '/placeholder-template-8.jpg'
  },
  {
    id: '9',
    title: 'Personal Goals Tracker',
    description: 'Track progress towards your personal or professional goals',
    category: 'personal',
    questions: 6,
    popular: false,
    new: true,
    previewImage: '/placeholder-template-9.jpg'
  },
];

const Templates: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Filter templates based on search query and active category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && template.category === activeCategory;
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-gray-600">Start with a pre-built template to save time</p>
        </div>
        <Button className="bg-smartform-blue hover:bg-blue-700" asChild>
          <Link to="/builder">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create from Scratch
          </Link>
        </Button>
      </div>

      {/* Search and filters */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search templates..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories tabs */}
      <Tabs 
        defaultValue="all" 
        value={activeCategory} 
        onValueChange={setActiveCategory} 
        className="space-y-8"
      >
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex h-9 min-w-max">
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        <TabsContent value={activeCategory} className="mt-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No templates found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? `No templates matching "${searchQuery}"` 
                  : "No templates in this category yet"}
              </p>
              <Button className="bg-smartform-blue hover:bg-blue-700" asChild>
                <Link to="/builder">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create a Custom Form
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Featured templates section */}
              {activeCategory === 'all' && searchQuery === '' && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold mb-4">Popular Templates</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {templates
                      .filter(t => t.popular)
                      .slice(0, 3)
                      .map(template => (
                        <Card key={template.id} className="overflow-hidden">
                          <div 
                            className="h-40 bg-gray-200 bg-cover bg-center" 
                            style={{ 
                              backgroundImage: `url(${template.previewImage})`,
                              backgroundColor: '#f3f4f6' // Fallback color
                            }}
                          ></div>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{template.title}</CardTitle>
                              <Badge className="bg-smartform-blue">Popular</Badge>
                            </div>
                            <CardDescription>{template.description}</CardDescription>
                          </CardHeader>
                          <CardFooter className="pt-0 flex justify-between items-center">
                            <div className="text-xs text-gray-500">{template.questions} questions</div>
                            <Button className="bg-smartform-blue hover:bg-blue-700">Use Template</Button>
                          </CardFooter>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {/* All filtered templates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="overflow-hidden">
                    <div 
                      className="h-40 bg-gray-200 bg-cover bg-center" 
                      style={{ 
                        backgroundImage: `url(${template.previewImage})`,
                        backgroundColor: '#f3f4f6' // Fallback color
                      }}
                    ></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        {template.new && (
                          <Badge className="bg-smartform-violet">
                            <Sparkles className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                        {template.popular && activeCategory !== 'all' && (
                          <Badge className="bg-smartform-blue">Popular</Badge>
                        )}
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2 font-normal">
                          {categories.find(c => c.id === template.category)?.name}
                        </Badge>
                        <span className="text-xs text-gray-500">{template.questions} questions</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Star className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                      <Button className="bg-smartform-blue hover:bg-blue-700" size="sm">
                        Use Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Templates;
