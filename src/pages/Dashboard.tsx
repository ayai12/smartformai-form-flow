import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, FileText, PlusCircle, Users, TrendingUp, Eye, Loader2, BrainCircuit, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface Agent {
  id: string;
  name: string;
  personality: string;
  goal: string;
  responses: number;
  created: string;
  surveyId?: string | null;
}

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
  const [recentAgents, setRecentAgents] = useState<Agent[]>([]);
  const [recentForms, setRecentForms] = useState<Form[]>([]);
  const [totalAgents, setTotalAgents] = useState(0);
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
        
        // Fetch agents data - try userId first, fallback to ownerId for backward compatibility
        let agentsSnap;
        const agentsQuery = query(
          collection(db, 'agents'),
          where('userId', '==', user.uid)
        );
        agentsSnap = await getDocs(agentsQuery);
        
        // If no results with userId, try with ownerId for backward compatibility
        if (agentsSnap.docs.length === 0) {
          const agentsQueryLegacy = query(
            collection(db, 'agents'),
          where('ownerId', '==', user.uid)
        );
          agentsSnap = await getDocs(agentsQueryLegacy);
        }
        
        setTotalAgents(agentsSnap.docs.length);
        
        // Process agents
        const allAgents = agentsSnap.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));

        // Sort agents by creation date manually
        allAgents.sort((a, b) => {
          const dateA = a.data.createdAt ? a.data.createdAt.toDate().getTime() : 0;
          const dateB = b.data.createdAt ? b.data.createdAt.toDate().getTime() : 0;
          return dateB - dateA;
        });

        // Process recent agents for display
        const recentAgentDocs = allAgents.slice(0, 6);
        const agentData: Agent[] = [];
        
        for (const agentDoc of recentAgentDocs) {
          const agent = agentDoc.data;
          
          // Get response count from linked survey using surveyId
          let responseCount = 0;
          if (agent.surveyId) {
            try {
              const responsesQuery = query(
                collection(db, 'survey_responses'),
                where('formId', '==', agent.surveyId)
              );
              const responsesSnap = await getDocs(responsesQuery);
              responseCount = responsesSnap.docs.length;
            } catch (error) {
              console.error(`Error fetching responses for agent ${agentDoc.id}:`, error);
              // Fallback to agent's totalResponses if available
              responseCount = agent.totalResponses || 0;
            }
          } else {
            // Fallback to agent's totalResponses if surveyId not available
            responseCount = agent.totalResponses || 0;
          }
          
          agentData.push({
            id: agentDoc.id,
            name: agent.name || 'Untitled Agent',
            personality: agent.personality || 'Professional',
            goal: agent.goal || 'No goal specified',
            responses: responseCount,
            created: agent.createdAt ? new Date(agent.createdAt.toDate()).toISOString().split('T')[0] : 'N/A',
            surveyId: agent.surveyId || null
          });
        }
        
        setRecentAgents(agentData);
        
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
      <div className="relative flex flex-col md:flex-row justify-between items-center mb-8 gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-black tracking-tight">Your Agents</h1>
          <p className="text-black/60 text-base mt-1.5">Manage your AI survey agents</p>
        </div>
        <Button className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white px-5 py-2.5 text-sm font-medium rounded-lg transition-colors" asChild>
          <Link to="/train-agent">
            <PlusCircle className="mr-2 h-4 w-4" />
            + New Agent
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-[#7B3FE4]" />
        </div>
      ) : (
        <>
      {/* Stats overview */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white border border-black/10 hover:border-black/20 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-black/60">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-[#7B3FE4]/10 p-3 rounded-lg">
                <BrainCircuit className="h-6 w-6 text-[#7B3FE4]" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-black">{totalAgents}</div>
                <p className="text-xs text-black/50 mt-0.5">AI Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-black/10 hover:border-black/20 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-black/60">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-[#7B3FE4]/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-[#7B3FE4]" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-black">{totalResponses}</div>
                <p className="text-xs text-black/50 mt-0.5">Agent responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-black/10 hover:border-black/20 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-black/60">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-[#7B3FE4]/10 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-[#7B3FE4]" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-black">{completionRate.toFixed(1)}%</div>
                <p className="text-xs text-black/50 mt-0.5">Success rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Cards Grid */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-black">Your Survey Agents</h2>
            <p className="text-black/60 text-sm mt-0.5">AI survey agents working for you</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* New Agent Card */}
          <Link to="/train-agent">
            <Card className="relative h-full bg-white border-2 border-dashed border-black/20 hover:border-[#7B3FE4] transition-colors cursor-pointer group">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] p-6">
                <div className="bg-[#7B3FE4]/10 p-4 rounded-lg mb-4 group-hover:bg-[#7B3FE4]/20 transition-colors">
                  <PlusCircle className="h-10 w-10 text-[#7B3FE4]" />
                </div>
                <h3 className="text-base font-semibold text-black mb-1.5">Create New Survey Agent</h3>
                <p className="text-black/60 text-center text-sm">Train a new AI survey agent to collect insights</p>
              </CardContent>
            </Card>
          </Link>

          {/* Agent Cards */}
          {recentAgents.map((agent) => (
            <Card key={agent.id} className="relative h-full bg-white border border-black/10 hover:border-black/20 transition-colors group">
              <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-black mb-2 line-clamp-1">{agent.name}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(agent.personality === 'Professional' || agent.personality === 'professional') && (
                        <span className="text-xs bg-[#7B3FE4]/10 text-[#7B3FE4] px-2 py-0.5 rounded font-medium">Professional</span>
                      )}
                      {(agent.personality === 'Friendly' || agent.personality === 'friendly') && (
                        <span className="text-xs bg-[#7B3FE4]/10 text-[#7B3FE4] px-2 py-0.5 rounded font-medium">Friendly</span>
                      )}
                      {(agent.personality === 'Playful' || agent.personality === 'playful' || agent.personality === 'fun') && (
                        <span className="text-xs bg-[#7B3FE4]/10 text-[#7B3FE4] px-2 py-0.5 rounded font-medium">Playful</span>
                      )}
                      {(agent.personality === 'Researcher' || agent.personality === 'researcher' || agent.personality === 'academic') && (
                        <span className="text-xs bg-[#7B3FE4]/10 text-[#7B3FE4] px-2 py-0.5 rounded font-medium">Researcher</span>
                      )}
                    </div>
                  </div>
                  <BrainCircuit className="h-5 w-5 text-[#7B3FE4]" />
                  </div>
                </CardHeader>
              <CardContent>
                <p className="text-sm text-black/60 mb-4 line-clamp-2">{agent.goal}</p>
                <div className="flex items-center justify-between pt-3 border-t border-black/10 mb-3">
                    <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#7B3FE4]" />
                    <span className="text-sm font-medium text-black">{agent.responses} responses</span>
                  </div>
                  <span className="text-xs text-black/50">{agent.created}</span>
                </div>
                <Button 
                  className="w-full bg-[#7B3FE4] hover:bg-[#6B35D0] text-white font-medium py-2 text-sm" 
                  asChild
                >
                  <Link to={agent.surveyId ? `/analytics/${agent.surveyId}` : `/analytics`}>
                    <BarChart className="h-4 w-4 mr-2" />
                    View Insights
                  </Link>
                </Button>
                </CardContent>
              </Card>
          ))}
        </div>
      </div>

      {/* Recent forms (kept for backward compatibility) */}
      <Card className="mb-6 sm:mb-10 bg-white border border-black/10 shadow-xl animate-fade-in w-full px-2 py-2 sm:px-6 sm:py-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black">Legacy Forms</CardTitle>
          <CardDescription className="text-base text-black/60">Your traditional forms (migrating to agents)</CardDescription>
        </CardHeader>
        <CardContent>
              {recentForms.length > 0 ? (
          <>
            {/* Table for sm+ screens, true vertical card list for xs screens */}
            <div className="hidden xs:block rounded-md border border-black/10 overflow-x-auto scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent w-full">
              <div className="grid grid-cols-5 bg-black/5 p-4 text-xs xs:text-sm font-semibold text-black rounded-t-md w-full min-w-[600px]">
                <div className="text-left">Form Title</div>
                <div className="text-center">Responses</div>
                <div className="text-center">Views</div>
                <div className="text-center">Created</div>
                <div className="text-center">Actions</div>
              </div>
              {recentForms.map((form) => (
                <div key={form.id} className="grid grid-cols-5 p-4 text-xs xs:text-sm border-t border-black/10 items-center bg-white hover:bg-black/5 transition-all duration-150 w-full min-w-[600px]">
                  <div className="font-semibold text-black truncate text-left">{form.title}</div>
                  <div className="text-center text-[#7B3FE4] font-bold">{form.responses}</div>
                  <div className="text-center text-black font-bold">{form.views}</div>
                  <div className="text-center text-black/60">{form.created}</div>
                  <div className="flex justify-center space-x-2">
                    <Button variant="ghost" size="sm" className="hover:bg-[#7B3FE4]/10" asChild>
                      <Link to={`/analytics/${form.id}`}>
                        <BarChart className="h-4 w-4 text-[#7B3FE4]" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {/* True vertical card list for xs screens, no horizontal scroll, all info stacked */}
            <div className="block xs:hidden space-y-4">
              {recentForms.map((form) => (
                <div key={form.id} className="border border-black/10 rounded-xl bg-white shadow-md p-4 flex flex-col gap-2 min-w-0 overflow-hidden">
                  <div className="font-semibold text-black text-base mb-1 break-words">{form.title}</div>
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2 text-[#7B3FE4] font-bold"><Users className="h-4 w-4" /> <span>{form.responses} Responses</span></div>
                    <div className="flex items-center gap-2 text-black font-bold"><Eye className="h-4 w-4" /> <span>{form.views} Views</span></div>
                    <div className="flex items-center gap-2 text-black/60"><FileText className="h-4 w-4" /> <span>{form.created}</span></div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm" className="hover:bg-[#7B3FE4]/10 px-3 py-2 text-sm" asChild>
                      <Link to={`/analytics/${form.id}`}>
                        <BarChart className="h-4 w-4 text-[#7B3FE4]" />
                        <span className="ml-1">Analytics</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
              ) : (
                <div className="text-center py-12 text-black/60 animate-fade-in-slow">
                  <FileText className="h-14 w-14 mx-auto mb-4 text-black/20" />
                  <p className="text-lg text-black">You don't have any forms yet</p>
                  <Button className="mt-6 bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] hover:from-[#6B35D0] hover:to-[#5B2FC0] text-white shadow-lg px-6 py-3 text-lg rounded-xl transition-all duration-200" asChild>
                    <Link to="/train-agent">Create Your First Survey Agent</Link>
                  </Button>
                </div>
              )}
              {recentForms.length > 0 && (
          <div className="mt-6 text-center animate-fade-in">
            <Button variant="outline" className="rounded-xl border-black/10 hover:bg-black/5 px-4 py-2 text-base" asChild>
              <Link to="/forms">View All Survey Agents</Link>
            </Button>
          </div>
              )}
        </CardContent>
      </Card>

      {/* Activity & Getting Started */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 animate-fade-in-slow mb-16">
        {/* Recent Activity */}
        <Card className="bg-white border border-black/10 shadow-xl px-2 py-4 sm:px-6 sm:py-6 w-full min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-black">Recent Activity</CardTitle>
            <CardDescription className="text-base text-black/60">Latest responses and survey agent interactions</CardDescription>
          </CardHeader>
          <CardContent>
                {recentActivity.length > 0 ? (
            <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 text-sm animate-slide-in-up min-w-0 overflow-hidden" style={{ animationDelay: `${index * 60}ms` }}>
                        <div className={`p-2 rounded-full shadow-md ${
                          activity.type === 'response' 
                            ? 'bg-[#7B3FE4]/10 text-[#7B3FE4]' 
                            : 'bg-black/10 text-black'
                        }`}>
                          {activity.type === 'response' ? <Users size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-semibold truncate">
                            {activity.type === 'response' ? 'New response' : 'Survey agent created'}
                          </p>
                    <p className="text-black/60 truncate">{activity.form}</p>
                  </div>
                  <div className="text-black/40 text-xs font-mono flex-shrink-0">{activity.time}</div>
                </div>
              ))}
            </div>
                ) : (
                  <div className="text-center py-8 text-black/40 animate-fade-in">
                    <p>No recent activity</p>
                  </div>
                )}
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card className="bg-white border border-black/10 shadow-xl px-2 py-4 sm:px-6 sm:py-6 w-full min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-black">Getting Started</CardTitle>
            <CardDescription className="text-base text-black/60">Quick tips to make the most of SmartFormAI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 border border-black/10 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-150 mb-2">
                <h3 className="font-semibold mb-1 text-black text-base">Create your first survey agent</h3>
                <p className="text-sm text-black/60 mb-2">Use natural language to generate intelligent survey questions.</p>
                <Button size="sm" className="bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] hover:from-[#6B35D0] hover:to-[#5B2FC0] text-white shadow px-4 py-2 rounded-lg text-base" asChild>
                  <Link to="/train-agent">Create Survey Agent</Link>
                </Button>
              </div>
              <div className="p-4 border border-black/10 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-150 mb-2">
                <h3 className="font-semibold mb-1 text-black text-base">Explore templates</h3>
                <p className="text-sm text-black/60 mb-2">Start from a pre-built template to save time.</p>
                <Button size="sm" variant="outline" className="rounded-lg border-black/10 hover:bg-black/5 text-base px-4 py-2" asChild>
                  <Link to="/templates">View Templates</Link>
                </Button>
              </div>
              <div className="p-4 border border-black/10 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-150 mb-2">
                <h3 className="font-semibold mb-1 text-black text-base">Connect with integrations</h3>
                <p className="text-sm text-black/60 mb-2">Connect your survey agents to other tools and services.</p>
                <Button size="sm" variant="outline" className="rounded-lg border-black/10 hover:bg-black/5 text-base px-4 py-2" asChild>
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