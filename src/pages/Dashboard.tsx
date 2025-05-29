import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, FileText, PlusCircle, Users, TrendingUp, Eye, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { TokenUsageDisplay } from '@/components/TokenUsageDisplay';

interface Form {
  id: string;
  title: string;
  responses: number;
  views: number;
  created: string;
}

interface SurveyResponse {
  id: string;
  formId: string;
  completedAt: string;
  completionStatus?: string;
  [key: string]: any; // For other potential response properties
}

const Dashboard: React.FC = () => {
  const [recentForms, setRecentForms] = useState<Form[]>([]);
  const [totalForms, setTotalForms] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;
          
        if (!user) {
          setLoading(false);
          return;
        }
  
        const db = getFirestore();
        
        // For total forms count, we don't need ordering
        const totalFormsQuery = query(
          collection(db, 'forms'),
          where('ownerId', '==', user.uid)
        );
        const totalFormsSnap = await getDocs(totalFormsQuery);
        setTotalForms(totalFormsSnap.docs.length);

        // Get all forms for the user (without ordering)
        const formsSnap = await getDocs(totalFormsQuery);
        
        // Process each form
        let formData: Form[] = [];
        let totalResponsesCount = 0;
        let completedResponsesCount = 0;
        
        // Process forms and sort manually (to avoid needing the index)
        const allForms = formsSnap.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));

        // Sort by createdAt manually (newest first)
        allForms.sort((a, b) => {
          const dateA = a.data.createdAt ? a.data.createdAt.toDate().getTime() : 0;
          const dateB = b.data.createdAt ? b.data.createdAt.toDate().getTime() : 0;
          return dateB - dateA;
        });
        
        // Take the first 3 forms for recent forms display
        const recentFormDocs = allForms.slice(0, 3);
        
        // First calculate total responses from all forms
        for (const formDoc of allForms) {
          // Get response count for this form
          const responsesQuery = query(
            collection(db, 'survey_responses'),
            where('formId', '==', formDoc.id)
          );
          
          try {
            const responsesSnap = await getDocs(responsesQuery);
            const responseCount = responsesSnap.docs.length;
            
            // Count completed responses
            const completedResponses = responsesSnap.docs.filter(
              doc => doc.data().completionStatus === 'complete'
            ).length;
            
            totalResponsesCount += responseCount;
            completedResponsesCount += completedResponses;
          } catch (error) {
            console.error(`Error fetching responses for form ${formDoc.id}:`, error);
          }
        }
        
        // Now process recent forms for display
        for (const formDoc of recentFormDocs) {
          const form = formDoc.data;
          
          // Get response count for this form
          const responsesQuery = query(
            collection(db, 'survey_responses'),
            where('formId', '==', formDoc.id)
          );
          
          try {
            const responsesSnap = await getDocs(responsesQuery);
            const responseCount = responsesSnap.docs.length;
            
            // Add to form data
            formData.push({
              id: formDoc.id,
              title: form.title || 'Untitled Form',
              responses: responseCount,
              views: form.views || 0,
              created: form.createdAt ? new Date(form.createdAt.toDate()).toISOString().split('T')[0] : 'N/A'
            });
          } catch (error) {
            console.error(`Error fetching responses for form ${formDoc.id}:`, error);
          }
        }
        
        setRecentForms(formData);
        setTotalResponses(totalResponsesCount);
        
        // Calculate completion rate
        if (totalResponsesCount > 0) {
          setCompletionRate((completedResponsesCount / totalResponsesCount) * 100);
        }
        
        // For recent activities, show form creation times
        try {
          // Use the allForms array we already have, sorted by creation date
          const recentFormsActivity = allForms
            .slice(0, 5) // Get 5 most recent forms
            .map(form => {
              const createdAt = form.data.createdAt ? new Date(form.data.createdAt.toDate()) : new Date();
              return {
                type: 'form',
                id: form.id,
                form: form.data.title || 'Untitled Form',
                time: getTimeAgo(createdAt),
                views: form.data.views || 0
              };
            });

          // Fetch responses separately for each form to respect security rules
          const recentResponses = [];
          
          // Process only 3 forms to limit number of queries
          for (const form of allForms.slice(0, 3)) {
            // Query responses for this specific form
            const formResponsesQuery = query(
              collection(db, 'survey_responses'),
              where('formId', '==', form.id)
            );
            
            const formResponsesSnap = await getDocs(formResponsesQuery);
            
            // Get all responses for this form
            const formResponses = formResponsesSnap.docs.map(doc => {
              const data = doc.data();
              return {
                type: 'response',
                id: doc.id,
                form: form.data.title || 'Untitled Form',
                time: getTimeAgo(new Date(data.completedAt || Date.now()))
              };
            });
            
            // Add them to our collection
            recentResponses.push(...formResponses);
          }
          
          // Combine both types of activities
          const combinedActivity = [...recentFormsActivity, ...recentResponses]
            // Sort by recent first
            .sort((a, b) => {
              // Helper function to convert relative time to seconds
              const timeToSeconds = (timeStr) => {
                const [value, unit] = timeStr.split(' ');
                const num = parseInt(value);
                
                switch(unit) {
                  case 'seconds': return num;
                  case 'minutes': case 'minute': return num * 60;
                  case 'hours': case 'hour': return num * 3600;
                  case 'days': case 'day': return num * 86400;
                  case 'months': case 'month': return num * 2592000;
                  case 'years': case 'year': return num * 31536000;
                  default: return 0;
                }
              };
              
              return timeToSeconds(a.time) - timeToSeconds(b.time);
            })
            .slice(0, 5);
          
          setRecentActivity(combinedActivity);
        } catch (error) {
          console.error('Error fetching recent activity:', error);
          setRecentActivity([]);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Helper function to format time ago
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  };

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

      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-smartform-blue" />
        </div>
      ) : (
        <>
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">{totalForms}</div>
                <p className="text-xs text-gray-500">Forms created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">{totalResponses}</div>
                <p className="text-xs text-gray-500">Form submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
                <p className="text-xs text-gray-500">Form completion rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <TokenUsageDisplay />
      </div>

      {/* Recent forms */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Recent Forms</CardTitle>
          <CardDescription>Quick overview of your recent forms and their performance</CardDescription>
        </CardHeader>
        <CardContent>
              {recentForms.length > 0 ? (
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
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>You don't have any forms yet</p>
                  <Button className="mt-4 bg-smartform-blue hover:bg-blue-700" asChild>
                    <Link to="/builder">Create Your First Form</Link>
                  </Button>
                </div>
              )}
              {recentForms.length > 0 && (
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link to="/forms">View All Forms</Link>
            </Button>
          </div>
              )}
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
                {recentActivity.length > 0 ? (
            <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'response' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {activity.type === 'response' ? <Users size={14} /> : <FileText size={14} />}
                  </div>
                  <div className="flex-1">
                          <p className="font-medium">
                            {activity.type === 'response' ? 'New response' : 'Form created'}
                          </p>
                    <p className="text-gray-500">{activity.form}</p>
                  </div>
                  <div className="text-gray-400 text-xs">{activity.time}</div>
                </div>
              ))}
            </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>No recent activity</p>
                  </div>
                )}
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
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard; 