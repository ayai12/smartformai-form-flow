import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, FileText, PlusCircle, Users, TrendingUp, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  // Mock data for UI demonstration
  const recentForms = [
    { id: '1', title: 'Customer Feedback Survey', responses: 128, views: 245, created: '2023-10-15' },
    { id: '2', title: 'Event Registration Form', responses: 75, views: 120, created: '2023-11-02' },
    { id: '3', title: 'Product Preferences Survey', responses: 42, views: 89, created: '2023-11-10' },
  ];

  return (
    <DashboardLayout>
      {/* Welcome section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">Here's what's happening with your forms</p>
        </div>
        <Button className="bg-smartform-blue hover:bg-blue-700" asChild>
          <Link to="/builder">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Form
          </Link>
        </Button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-smartform-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-gray-500 mt-1">3 created this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-smartform-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,234</div>
            <p className="text-xs text-gray-500 mt-1">245 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-smartform-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">76%</div>
            <p className="text-xs text-gray-500 mt-1">↑ 12% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent forms */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Recent Forms</CardTitle>
          <CardDescription>Quick overview of your recent forms and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 bg-gray-50 p-4 text-sm font-medium text-gray-500">
              <div className="col-span-4">Form Title</div>
              <div className="col-span-2 text-center">Responses</div>
              <div className="col-span-2 text-center">Views</div>
              <div className="col-span-2 text-center">Created</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {recentForms.map((form) => (
              <div key={form.id} className="grid grid-cols-12 p-4 text-sm border-t items-center">
                <div className="col-span-4 font-medium">{form.title}</div>
                <div className="col-span-2 text-center">{form.responses}</div>
                <div className="col-span-2 text-center">{form.views}</div>
                <div className="col-span-2 text-center">{form.created}</div>
                <div className="col-span-2 flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/analytics/${form.id}`}>
                      <BarChart className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/forms/${form.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link to="/forms">View All Forms</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity & Getting Started */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest responses and form interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'response', form: 'Customer Feedback Survey', time: '2 hours ago' },
                { type: 'view', form: 'Event Registration Form', time: '5 hours ago' },
                { type: 'response', form: 'Product Preferences Survey', time: '1 day ago' },
                { type: 'response', form: 'Customer Feedback Survey', time: '1 day ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className={`p-2 rounded-full ${activity.type === 'response' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {activity.type === 'response' ? <Users size={14} /> : <Eye size={14} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New {activity.type}</p>
                    <p className="text-gray-500">{activity.form}</p>
                  </div>
                  <div className="text-gray-400 text-xs">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Quick tips to make the most of SmartFormAI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-md bg-gray-50">
                <h3 className="font-medium mb-1">Create your first AI form</h3>
                <p className="text-sm text-gray-600 mb-2">Use natural language to generate a complete form.</p>
                <Button size="sm" className="bg-smartform-blue hover:bg-blue-700" asChild>
                  <Link to="/builder">Create Form</Link>
                </Button>
              </div>
              <div className="p-3 border rounded-md">
                <h3 className="font-medium mb-1">Explore templates</h3>
                <p className="text-sm text-gray-600 mb-2">Start from a pre-built template to save time.</p>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/templates">View Templates</Link>
                </Button>
              </div>
              <div className="p-3 border rounded-md">
                <h3 className="font-medium mb-1">Connect with integrations</h3>
                <p className="text-sm text-gray-600 mb-2">Connect your forms to other tools and services.</p>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/settings/integrations">Explore Integrations</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard; 