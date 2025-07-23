import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, FileText, PlusCircle, Users, TrendingUp, Eye, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
      <div className="relative flex flex-col md:flex-row justify-between items-center mb-8 md:mb-10 gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm animate-fade-in">Welcome back!</h1>
          <p className="text-gray-600 text-lg mt-1 animate-fade-in-slow">Here's what's happening with your forms</p>
        </div>
        <Button className="bg-gradient-to-r from-smartform-blue to-blue-400 hover:from-blue-700 hover:to-blue-500 shadow-lg px-6 py-3 text-lg rounded-xl transition-all duration-200 animate-bounce-in" asChild>
          <Link to="/builder">
            <PlusCircle className="mr-2 h-5 w-5" />
            New Form
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-smartform-blue" />
        </div>
      ) : (
        <>
      {/* Stats overview */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-10 animate-fade-in-slow">
        <Card className="bg-white/80 backdrop-blur-md shadow-xl hover:scale-[1.03] hover:shadow-2xl transition-all duration-200 border-0 w-full min-w-0 overflow-hidden px-3 py-4 sm:px-4 sm:py-4 mb-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-blue-700 truncate">Total Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 min-w-0">
              <span className="bg-blue-100 p-3 rounded-full shadow-sm flex-shrink-0"><FileText className="h-8 w-8 text-blue-500" /></span>
              <div className="min-w-0">
                <div className="text-3xl font-extrabold animate-countup truncate whitespace-nowrap overflow-hidden">{totalForms}</div>
                <p className="text-xs text-gray-500 break-words overflow-hidden">Forms created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-md shadow-xl hover:scale-[1.03] hover:shadow-2xl transition-all duration-200 border-0 w-full min-w-0 overflow-hidden px-3 py-4 sm:px-4 sm:py-4 mb-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-green-700 truncate">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 min-w-0">
              <span className="bg-green-100 p-3 rounded-full shadow-sm flex-shrink-0"><Users className="h-8 w-8 text-green-500" /></span>
              <div className="min-w-0">
                <div className="text-3xl font-extrabold animate-countup truncate whitespace-nowrap overflow-hidden">{totalResponses}</div>
                <p className="text-xs text-gray-500 break-words overflow-hidden">Form submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-md shadow-xl hover:scale-[1.03] hover:shadow-2xl transition-all duration-200 border-0 w-full min-w-0 overflow-hidden px-3 py-4 sm:px-4 sm:py-4 mb-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-purple-700 truncate">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 min-w-0">
              <span className="bg-purple-100 p-3 rounded-full shadow-sm flex-shrink-0"><TrendingUp className="h-8 w-8 text-purple-500" /></span>
              <div className="min-w-0">
                <div className="text-3xl font-extrabold animate-countup truncate whitespace-nowrap overflow-hidden">{completionRate.toFixed(1)}%</div>
                <p className="text-xs text-gray-500 break-words overflow-hidden">Form completion rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent forms */}
      <Card className="mb-6 sm:mb-10 bg-gradient-to-br from-blue-50/60 to-white/80 shadow-2xl border-0 animate-fade-in w-full px-2 py-2 sm:px-6 sm:py-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-900">Your Recent Forms</CardTitle>
          <CardDescription className="text-base">Quick overview of your recent forms and their performance</CardDescription>
        </CardHeader>
        <CardContent>
              {recentForms.length > 0 ? (
          <>
            {/* Table for sm+ screens, true vertical card list for xs screens */}
            <div className="hidden xs:block rounded-md border overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent w-full">
              <div className="grid grid-cols-5 bg-blue-50/60 p-4 text-xs xs:text-sm font-semibold text-blue-700 rounded-t-md w-full min-w-[600px]">
                <div className="text-left">Form Title</div>
                <div className="text-center">Responses</div>
                <div className="text-center">Views</div>
                <div className="text-center">Created</div>
                <div className="text-center">Actions</div>
              </div>
              {recentForms.map((form) => (
                <div key={form.id} className="grid grid-cols-5 p-4 text-xs xs:text-sm border-t items-center bg-white/70 hover:bg-blue-50/80 transition-all duration-150 w-full min-w-[600px]">
                  <div className="font-semibold text-gray-900 truncate text-left">{form.title}</div>
                  <div className="text-center text-blue-700 font-bold">{form.responses}</div>
                  <div className="text-center text-green-700 font-bold">{form.views}</div>
                  <div className="text-center text-gray-600">{form.created}</div>
                  <div className="flex justify-center space-x-2">
                    <Button variant="ghost" size="sm" className="hover:bg-blue-100" asChild>
                      <Link to={`/analytics/${form.id}`}>
                        <BarChart className="h-4 w-4 text-blue-600" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {/* True vertical card list for xs screens, no horizontal scroll, all info stacked */}
            <div className="block xs:hidden space-y-4">
              {recentForms.map((form) => (
                <div key={form.id} className="border rounded-xl bg-white/90 shadow-md p-4 flex flex-col gap-2 min-w-0 overflow-hidden">
                  <div className="font-semibold text-gray-900 text-base mb-1 break-words">{form.title}</div>
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2 text-blue-700 font-bold"><Users className="h-4 w-4" /> <span>{form.responses} Responses</span></div>
                    <div className="flex items-center gap-2 text-green-700 font-bold"><Eye className="h-4 w-4" /> <span>{form.views} Views</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><FileText className="h-4 w-4" /> <span>{form.created}</span></div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm" className="hover:bg-blue-100 px-3 py-2 text-sm" asChild>
                      <Link to={`/analytics/${form.id}`}>
                        <BarChart className="h-4 w-4 text-blue-600" />
                        <span className="ml-1">Analytics</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
              ) : (
                <div className="text-center py-12 text-gray-500 animate-fade-in-slow">
                  <FileText className="h-14 w-14 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">You don't have any forms yet</p>
                  <Button className="mt-6 bg-gradient-to-r from-smartform-blue to-blue-400 hover:from-blue-700 hover:to-blue-500 shadow-lg px-6 py-3 text-lg rounded-xl transition-all duration-200" asChild>
                    <Link to="/builder">Create Your First Form</Link>
                  </Button>
                </div>
              )}
              {recentForms.length > 0 && (
          <div className="mt-6 text-center animate-fade-in">
            <Button variant="outline" className="rounded-xl border-blue-200 hover:bg-blue-50 px-4 py-2 text-base" asChild>
              <Link to="/forms">View All Forms</Link>
            </Button>
          </div>
              )}
        </CardContent>
      </Card>

      {/* Activity & Getting Started */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 animate-fade-in-slow mb-16">
        {/* Recent Activity */}
        <Card className="bg-white/90 backdrop-blur-md shadow-xl border-0 px-2 py-4 sm:px-6 sm:py-6 w-full min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-blue-900">Recent Activity</CardTitle>
            <CardDescription className="text-base">Latest responses and form interactions</CardDescription>
          </CardHeader>
          <CardContent>
                {recentActivity.length > 0 ? (
            <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 text-sm animate-slide-in-up min-w-0 overflow-hidden" style={{ animationDelay: `${index * 60}ms` }}>
                        <div className={`p-2 rounded-full shadow-md ${
                          activity.type === 'response' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {activity.type === 'response' ? <Users size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-semibold truncate">
                            {activity.type === 'response' ? 'New response' : 'Form created'}
                          </p>
                    <p className="text-gray-500 truncate">{activity.form}</p>
                  </div>
                  <div className="text-gray-400 text-xs font-mono flex-shrink-0">{activity.time}</div>
                </div>
              ))}
            </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 animate-fade-in">
                    <p>No recent activity</p>
                  </div>
                )}
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card className="bg-gradient-to-br from-blue-50/60 to-white/90 shadow-xl border-0 px-2 py-4 sm:px-6 sm:py-6 w-full min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-blue-900">Getting Started</CardTitle>
            <CardDescription className="text-base">Quick tips to make the most of SmartFormAI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 border rounded-xl bg-white/95 shadow-sm hover:shadow-md transition-all duration-150 mb-2">
                <h3 className="font-semibold mb-1 text-blue-800 text-base">Create your first AI form</h3>
                <p className="text-sm text-gray-600 mb-2">Use natural language to generate a complete form.</p>
                <Button size="sm" className="bg-gradient-to-r from-smartform-blue to-blue-400 hover:from-blue-700 hover:to-blue-500 shadow px-4 py-2 rounded-lg text-base" asChild>
                  <Link to="/builder">Create Form</Link>
                </Button>
              </div>
              <div className="p-4 border rounded-xl bg-white/95 shadow-sm hover:shadow-md transition-all duration-150 mb-2">
                <h3 className="font-semibold mb-1 text-blue-800 text-base">Explore templates</h3>
                <p className="text-sm text-gray-600 mb-2">Start from a pre-built template to save time.</p>
                <Button size="sm" variant="outline" className="rounded-lg border-blue-200 hover:bg-blue-50 text-base px-4 py-2" asChild>
                  <Link to="/templates">View Templates</Link>
                </Button>
              </div>
              <div className="p-4 border rounded-xl bg-white/95 shadow-sm hover:shadow-md transition-all duration-150 mb-2">
                <h3 className="font-semibold mb-1 text-blue-800 text-base">Connect with integrations</h3>
                <p className="text-sm text-gray-600 mb-2">Connect your forms to other tools and services.</p>
                <Button size="sm" variant="outline" className="rounded-lg border-blue-200 hover:bg-blue-50 text-base px-4 py-2" asChild>
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