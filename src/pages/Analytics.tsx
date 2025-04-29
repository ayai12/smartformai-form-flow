import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Filter, Users, Eye, Clock, TrendingUp, ChevronDown } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Placeholder for charts - replace with real chart library for production
const MockChart: React.FC<{ type: string; height?: number }> = ({ type, height = 300 }) => (
  <div className="w-full bg-gray-100 rounded-md flex items-center justify-center" style={{ height }}>
    <div className="text-gray-500 flex flex-col items-center">
      <div className="text-lg font-medium mb-2">{type} Chart</div>
      <div className="text-sm text-gray-400">(Visualization would appear here)</div>
    </div>
  </div>
);

const Analytics: React.FC = () => {
  const [forms, setForms] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>({});

  // Fetch forms owned by the current user
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setForms([]);
        setResponses([]);
        setMetrics({});
        setLoading(false);
        return;
      }
      const db = getFirestore();
      // Fetch forms
      const formsQuery = query(collection(db, 'forms'), where('ownerId', '==', user.uid));
      const formsSnap = await getDocs(formsQuery);
      const formsArr: any[] = [];
      for (const docSnap of formsSnap.docs) {
        formsArr.push({ id: docSnap.id, ...docSnap.data() });
      }
      setForms(formsArr);
      // Fetch responses for all forms
      let allResponses: any[] = [];
      if (formsArr.length > 0) {
        for (const form of formsArr) {
          const responsesQuery = query(collection(db, 'survey_responses'), where('formId', '==', form.id));
          const responsesSnap = await getDocs(responsesQuery);
          const responsesArr = responsesSnap.docs.map(d => ({ id: d.id, ...d.data(), formTitle: form.title }));
          allResponses = allResponses.concat(responsesArr);
        }
      }
      setResponses(allResponses);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Aggregate metrics for the selected form
  useEffect(() => {
    if (loading) return;
    let filteredForms = forms;
    if (selectedForm !== 'all') {
      filteredForms = forms.filter(f => f.id === selectedForm);
    }
    let filteredResponses = responses;
    if (selectedForm !== 'all') {
      filteredResponses = responses.filter(r => r.formId === selectedForm);
    }
    // Aggregate
    let totalResponses = filteredResponses.length;
    let totalViews = 0;
    let completionRate = 0;
    let avgCompletionTime = 0;
    let skipRates: number[] = [];
    let avgTimes: number[] = [];
    let dropoutRates: number[] = [];
    let devices: Record<string, number> = {};
    let locations: Record<string, number> = {};
    let referrals: Record<string, number> = {};
    let timeOfDay: Record<string, number> = {};
    let completedCount = 0;
    let totalTimeSum = 0;
    // Views and per-form stats
    if (filteredForms.length === 1) {
      totalViews = filteredForms[0].views || 0;
    } else {
      totalViews = filteredForms.reduce((sum, f) => sum + (f.views || 0), 0);
    }
    for (const resp of filteredResponses) {
      if (resp.completionStatus === 'complete') completedCount++;
      if (resp.totalTime) {
        totalTimeSum += resp.totalTime;
        avgTimes.push(resp.totalTime);
      }
      if (typeof resp.skipRate === 'number') skipRates.push(resp.skipRate);
      if (typeof resp.dropout === 'number') dropoutRates.push(resp.dropout);
      if (resp.device) devices[resp.device] = (devices[resp.device] || 0) + 1;
      if (resp.location && typeof resp.location.lat === 'number') {
        const key = `${resp.location.lat.toFixed(2)},${resp.location.lng.toFixed(2)}`;
        locations[key] = (locations[key] || 0) + 1;
      }
      if (resp.referral) referrals[resp.referral] = (referrals[resp.referral] || 0) + 1;
      if (resp.timeOfDay) {
        const hour = resp.timeOfDay.split(':')[0];
        timeOfDay[hour] = (timeOfDay[hour] || 0) + 1;
      }
    }
    completionRate = totalResponses > 0 ? completedCount / totalResponses : 0;
    avgCompletionTime = avgTimes.length > 0 ? avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length : 0;
    setMetrics({
      totalResponses,
      totalViews,
      completionRate,
      avgCompletionTime,
      skipRate: skipRates.length > 0 ? skipRates.reduce((a, b) => a + b, 0) / skipRates.length : 0,
      dropoutRate: dropoutRates.length > 0 ? dropoutRates.reduce((a, b) => a + b, 0) / dropoutRates.length : 0,
      devices,
      locations,
      referrals,
      timeOfDay,
    });
  }, [forms, responses, selectedForm, loading]);

  // Format time (ms to mm:ss)
  const formatTime = (ms: number) => {
    if (!ms) return '0s';
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return min ? `${min}m ${sec}s` : `${sec}s`;
  };

  return (
    <DashboardLayout>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your form performance and respondent behavior</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download size={16} />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Select value={selectedForm} onValueChange={setSelectedForm}>
            <SelectTrigger>
              <SelectValue placeholder="Select form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Forms</SelectItem>
              {forms.map((form) => (
                <SelectItem key={form.id} value={form.id}>{form.title || form.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter size={16} />
          More Filters
        </Button>
      </div>

      {/* Key Metrics - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalResponses ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate ? `${Math.round(metrics.completionRate * 100)}%` : '0%'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalViews ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.avgCompletionTime)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="questions">Question Analysis</TabsTrigger>
          <TabsTrigger value="respondents">Respondent Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Trend</CardTitle>
                <CardDescription>Daily response counts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4">Responses over time: {metrics.totalResponses ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Completion Rates</CardTitle>
                <CardDescription>Percentage of users who complete the form</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4">Completion Rate: {metrics.completionRate ? `${Math.round(metrics.completionRate * 100)}%` : '0%'}</div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Response Time Distribution</CardTitle>
              <CardDescription>How long respondents take to complete forms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4">Avg. Completion Time: {formatTime(metrics.avgCompletionTime)}</div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Response Summary</CardTitle>
              <CardDescription>Key insights from responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Multiple Choice Question Results</h3>
                  <MockChart type="Pie" height={250} />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Text Response Word Cloud</h3>
                  <div className="p-4">Referral Sources: {Object.entries(metrics.referrals || {}).map(([src, count]) => `${src}: ${count}`).join(', ') || 'N/A'}</div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Rating Question Distribution</h3>
                  <MockChart type="Bar" height={250} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>Question Performance</CardTitle>
                  <CardDescription>Analysis by question</CardDescription>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select question" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Questions</SelectItem>
                    <SelectItem value="q1">Question 1</SelectItem>
                    <SelectItem value="q2">Question 2</SelectItem>
                    <SelectItem value="q3">Question 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">Skip Rate</div>
                      <div className="text-2xl font-bold">12%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">Avg. Time Spent</div>
                      <div className="text-2xl font-bold">42s</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">Dropout Rate</div>
                      <div className="text-2xl font-bold">5%</div>
                    </CardContent>
                  </Card>
                </div>
                <div className="p-4">Skip Rate: {metrics.skipRate ? `${Math.round(metrics.skipRate * 100)}%` : '0%'}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="respondents">
          <Card>
            <CardHeader>
              <CardTitle>Respondent Demographics</CardTitle>
              <CardDescription>Who is filling out your forms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Device Type</h3>
                  <MockChart type="Pie" height={250} />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Location</h3>
                  <div className="p-4">Location Distribution: {Object.keys(metrics.locations || {}).length > 0 ? Object.entries(metrics.locations).map(([loc, count]) => `${loc}: ${count}`).join(', ') : 'N/A'}</div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Time of Day</h3>
                  <div className="p-4">Time of Day: {Object.entries(metrics.timeOfDay || {}).map(([hour, count]) => `${hour}:00 - ${count}`).join(', ') || 'N/A'}</div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Referral Source</h3>
                  <MockChart type="Bar" height={250} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Responses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Responses</CardTitle>
            <CardDescription>Latest form submissions</CardDescription>
          </div>
          <Button variant="ghost" className="gap-1">
            <span>View All</span>
            <ChevronDown size={16} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 bg-gray-50 p-4 text-sm font-medium text-gray-500">
              <div className="col-span-3">Date & Time</div>
              <div className="col-span-3">Form</div>
              <div className="col-span-2">Completion Time</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {[
              { id: '1', date: '2023-11-15 14:23', form: 'Customer Feedback', time: '1m 45s', status: 'Complete' },
              { id: '2', date: '2023-11-15 13:05', form: 'Event Registration', time: '3m 12s', status: 'Complete' },
              { id: '3', date: '2023-11-15 11:37', form: 'Product Preferences', time: '2m 08s', status: 'Partial' },
              { id: '4', date: '2023-11-15 10:52', form: 'Customer Feedback', time: '1m 33s', status: 'Complete' },
              { id: '5', date: '2023-11-14 16:14', form: 'Event Registration', time: '4m 02s', status: 'Complete' },
            ].map((response) => (
              <div key={response.id} className="grid grid-cols-12 p-4 text-sm border-t items-center">
                <div className="col-span-3">{response.date}</div>
                <div className="col-span-3 font-medium">{response.form}</div>
                <div className="col-span-2">{response.time}</div>
                <div className="col-span-2 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    response.status === 'Complete' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {response.status}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Analytics; 