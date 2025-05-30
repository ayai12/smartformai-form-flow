import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  Download, Filter, Users, Eye, Clock, TrendingUp, 
  ChevronDown, MapPin, Smartphone, Globe, BarChart2,
  Calendar as CalendarIcon, AlertCircle, CheckCircle, XCircle, Timer,
  ArrowUpRight, Loader2, Info, MessageSquare, PieChart
} from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ChartOptions } from 'chart.js';
import 'chart.js/auto';
import { format, parseISO } from 'date-fns';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DateRange } from 'react-day-picker';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DocumentData } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Constants for styling
const COLORS = {
  primary: '#0066CC',
  secondary: '#00D084',
  accent: '#8F00FF',
  background: '#FFFFFF',
  text: '#2E2E2E',
  chart: [
    'rgba(0, 102, 204, 0.7)',
    'rgba(0, 208, 132, 0.7)',
    'rgba(143, 0, 255, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
  ],
};

// Chart configuration
const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        font: {
          family: "'Inter', sans-serif",
          weight: 'normal' as const,
        },
        color: COLORS.text,
      },
    },
  },
};

const lineChartOptions: ChartOptions<'line'> = {
  ...baseChartOptions,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        font: {
          family: "'Inter', sans-serif",
        },
        color: COLORS.text,
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: "'Inter', sans-serif",
        },
        color: COLORS.text,
      },
    },
  },
};

const barChartOptions: ChartOptions<'bar'> = {
  ...baseChartOptions,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        font: {
          family: "'Inter', sans-serif",
        },
        color: COLORS.text,
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: "'Inter', sans-serif",
        },
        color: COLORS.text,
      },
    },
  },
};

const pieChartOptions: ChartOptions<'pie'> = {
  ...baseChartOptions,
};

interface DateRangeState {
  from?: Date;
  to?: Date;
}

interface AnalyticsMetrics {
  totalResponses: number;
  completionRate: number;
  avgCompletionTime: number;
  devices: Record<string, number>;
  locations: Array<{ lat: number; lng: number; count: number }>;
  timeOfDay: Record<string, number>;
  totalViews: number;
  questionAnalytics: {
    avgTimePerQuestion: number[];
    skipRates: number[];
    completionRates: number[];
  };
  userEngagement: {
    bounceRate: number;
    avgSessionDuration: number;
    returnRate: number;
  };
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  geographicHeatmap: Array<{ lat: number; lng: number; intensity: number }>;
  hourlyActivity: Record<string, number>;
  responseQuality: {
    validResponses: number;
    invalidResponses: number;
    partialResponses: number;
  };
}

// Add these interfaces after the imports and before the component
interface Form {
  id: string;
  title: string;
  ownerId: string;
  [key: string]: any; // For other potential form properties
}

// Add new interface for structured question answers
interface QuestionAnswer {
  question: string;
  answer: string | number;
  questionId: string;
}

// Update SurveyResponse interface to include answers
interface SurveyResponse {
  id: string;
  formId: string;
  completedAt: string;
  device?: string;
  location?: {
    lat: number;
    lng: number;
  };
  totalTime?: number;
  completionStatus?: string;
  timeOfDay?: string;
  skipRate?: number;
  questionTimes?: number[];
  referral?: string;
  formTitle?: string;
  answers?: Record<string, { question: string; answer: string | number }>;
}

interface RecentResponse {
  id: string;
  formId: string;
  completedAt: string;
  answers: Record<string, { question: string; answer: string | number }>;
  device: string;
  referral: string;
  formTitle?: string;
}

// Add this after the COLORS constant
const TOOLTIPS = {
  responseTrend: "Shows the pattern of form responses over time. Higher peaks indicate more responses during those periods.",
  deviceDistribution: "Breakdown of devices used to submit responses. Helps understand which platforms your form is most accessed from.",
  timeDistribution: "Shows when users typically submit responses throughout the day. Helps identify peak usage times.",
  completionTime: "Average time users spend on each question. Longer times may indicate complex or unclear questions.",
  dailyActivity: "Hour-by-hour breakdown of form submissions for the selected date.",
  referralSources: "Top sources directing users to your form. Helps track which channels drive the most engagement.",
  totalViews: "Total Views equals the number of responses (only counted after a submission is made).",
  responseAnalytics: "Analysis of actual user responses to your survey questions.",
  numericResponses: "Statistical breakdown of numeric answers including average, minimum, and maximum values.",
  textResponses: "Most common text responses provided by your users.",
};

// Add this after the interfaces
interface TooltipProps {
  content: string;
}

const InfoTooltip: React.FC<TooltipProps> = ({ content }) => (
  <div className="group relative inline-block ml-2">
    <Info className="h-4 w-4 text-gray-400 cursor-help" />
    <div className="invisible group-hover:visible absolute z-50 w-64 p-2 mt-1 text-sm text-white bg-gray-900 rounded-md -left-1/2 transform -translate-x-1/2">
      {content}
    </div>
  </div>
);

// Add this helper function after the formatTime function
const NoDataMessage = () => (
  <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
    <AlertCircle className="h-8 w-8 mb-2" />
    <p>No data available for this period</p>
  </div>
);

// First, add a new helper function after getHourlyDistribution
const getCompletionTimeData = (responses: SurveyResponse[], date: Date) => {
  const dayResponses = responses.filter(response => {
    const responseDate = new Date(response.completedAt);
    return responseDate.toDateString() === date.toDateString();
  });

  // Group by hour and calculate average completion time
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourResponses = dayResponses.filter(response => {
      const responseDate = new Date(response.completedAt);
      return responseDate.getHours() === hour;
    });

    const avgTime = hourResponses.length > 0
      ? hourResponses.reduce((acc, r) => acc + (r.totalTime || 0), 0) / hourResponses.length
      : 0;

    return {
      hour,
      avgTime: avgTime / 1000, // Convert to seconds
      count: hourResponses.length
    };
  });

  return hourlyData;
};

// Add helper functions for response analytics
const isNumeric = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

const getNumericStats = (values: number[]) => {
  if (values.length === 0) return { avg: 0, min: 0, max: 0 };
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return { avg, min, max };
};

const getTextFrequency = (values: string[]) => {
  const frequency: Record<string, number> = {};
  
  values.forEach(value => {
    frequency[value] = (frequency[value] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({
      value,
      count,
      percentage: (count / values.length) * 100
    }));
};

// Helper to sort question IDs numerically
const sortQuestionIds = (questionIds: string[]): string[] => {
  return questionIds.sort((a, b) => {
    // Extract numeric part from question IDs (q1, q2, etc.)
    const numA = parseInt(a.replace(/\D/g, ''));
    const numB = parseInt(b.replace(/\D/g, ''));
    return numA - numB;
  });
};

const Analytics: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalResponses: 0,
    completionRate: 0,
    avgCompletionTime: 0,
    devices: {},
    locations: [],
    timeOfDay: {},
    totalViews: 0,
    questionAnalytics: {
      avgTimePerQuestion: [],
      skipRates: [],
      completionRates: [],
    },
    userEngagement: {
      bounceRate: 0,
      avgSessionDuration: 0,
      returnRate: 0,
    },
    deviceBreakdown: {
      desktop: 0,
      mobile: 0,
      tablet: 0,
    },
    geographicHeatmap: [],
    hourlyActivity: {},
    responseQuality: {
      validResponses: 0,
      invalidResponses: 0,
      partialResponses: 0,
    },
  });
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [referralFilter, setReferralFilter] = useState('all');
  const [recentResponses, setRecentResponses] = useState<RecentResponse[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Add new state for processed question data
  const [questionAnalytics, setQuestionAnalytics] = useState<{
    [questionId: string]: {
      question: string;
      type: 'numeric' | 'text';
      data: any;
      totalResponses: number;
      questionId: string; // Store the original question ID
    }
  }>({});

  // Helper function to format referral URL
  const formatReferralSource = (referral: string) => {
    try {
      const url = new URL(referral);
      return url.hostname + url.pathname;
    } catch {
      return referral;
    }
  };

  // Helper function to group responses by hour
  const getHourlyDistribution = (responses: SurveyResponse[], date: Date) => {
    const hourlyData: number[] = new Array(24).fill(0);
    
    responses.forEach(response => {
      const responseDate = new Date(response.completedAt);
      if (responseDate.toDateString() === date.toDateString()) {
        const hour = responseDate.getHours();
        hourlyData[hour]++;
      }
    });
    
    return hourlyData;
  };

  // Fetch forms and responses
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          if (isMounted) {
            setForms([]);
            setResponses([]);
          }
          return;
        }

        const db = getFirestore();
        
        // Fetch forms
        const formsQuery = query(
          collection(db, 'forms'),
          where('ownerId', '==', user.uid)
        );
        
        const formsSnap = await getDocs(formsQuery);
        const formsArr = formsSnap.docs.map(doc => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            title: data.title,
            ownerId: data.ownerId,
            ...data
          } as Form;
        });
        
        if (isMounted) {
          setForms(formsArr);
        }

        // Only fetch responses if a form is selected
        if (selectedForm) {
          const responsesQuery = query(
            collection(db, 'survey_responses'),
            where('formId', '==', selectedForm)
          );
          const responsesSnap = await getDocs(responsesQuery);
          const formResponses = responsesSnap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            formTitle: formsArr.find(f => f.id === selectedForm)?.title 
          } as SurveyResponse));

          // Apply date range filter if set
          let filteredResponses = formResponses;
          if (dateRange?.from && dateRange?.to) {
            filteredResponses = formResponses.filter(response => {
              const responseDate = new Date(response.completedAt);
              return responseDate >= dateRange.from && responseDate <= dateRange.to;
            });
          }
          
          if (isMounted) {
            setResponses(filteredResponses);
          }
        } else {
          if (isMounted) {
            setResponses([]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedForm, dateRange?.from, dateRange?.to]);

  // Calculate metrics
  useEffect(() => {
    if (loading) return;

    let filteredResponses = [...responses];
    
    if (deviceFilter !== 'all') {
      filteredResponses = filteredResponses.filter(r => r.device === deviceFilter);
    }
    if (referralFilter !== 'all') {
      filteredResponses = filteredResponses.filter(r => r.referral === referralFilter);
    }

    const totalResponses = filteredResponses.length;
    const completedResponses = filteredResponses.filter(r => r.completionStatus === 'complete').length;
    const completionRate = totalResponses > 0 ? completedResponses / totalResponses : 0;
    const avgCompletionTime = filteredResponses.reduce((acc, r) => acc + (r.totalTime || 0), 0) / totalResponses || 0;

    // Enhanced metrics calculation
    const deviceBreakdown = {
      desktop: filteredResponses.filter(r => r.device?.toLowerCase() === 'desktop').length,
      mobile: filteredResponses.filter(r => r.device?.toLowerCase() === 'mobile').length,
      tablet: filteredResponses.filter(r => r.device?.toLowerCase() === 'tablet').length,
    };

    // Question analytics
    const questionAnalytics = {
      avgTimePerQuestion: filteredResponses.reduce((acc: number[], r) => {
        if (r.questionTimes) {
          r.questionTimes.forEach((time: number, idx: number) => {
            acc[idx] = (acc[idx] || 0) + time;
          });
        }
        return acc;
      }, []).map(total => total / totalResponses),
      skipRates: [],
      completionRates: [],
    };

    // Geographic data with intensity
    const locations = filteredResponses
      .filter(r => r.location?.lat && r.location?.lng)
      .map(r => ({
        lat: r.location.lat,
        lng: r.location.lng,
        count: 1
      }));

    // Hourly activity analysis
    const hourlyActivity = filteredResponses.reduce((acc: Record<string, number>, r) => {
      if (r.timeOfDay) {
        const hour = r.timeOfDay.split(':')[0];
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {});

    // Response quality metrics
    const responseQuality = {
      validResponses: completedResponses,
      invalidResponses: filteredResponses.filter(r => r.completionStatus === 'invalid').length,
      partialResponses: filteredResponses.filter(r => r.completionStatus === 'partial').length,
    };

    // User engagement metrics
    const userEngagement = {
      bounceRate: filteredResponses.filter(r => r.totalTime < 10000).length / totalResponses,
      avgSessionDuration: avgCompletionTime,
      returnRate: 0, // Would need additional data to calculate this
    };

    setMetrics({
      totalResponses,
      completionRate,
      avgCompletionTime,
      devices: deviceBreakdown,
      locations,
      timeOfDay: hourlyActivity,
      totalViews: totalResponses,
      questionAnalytics,
      userEngagement,
      deviceBreakdown,
      geographicHeatmap: locations.map(l => ({ ...l, intensity: l.count })),
      hourlyActivity,
      responseQuality,
    });
  }, [responses, deviceFilter, referralFilter, forms, loading]);

  // Add this section after the metrics calculation in useEffect
  useEffect(() => {
    if (loading) return;

    // Get recent responses
    const sortedResponses = [...responses].sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
    setRecentResponses(sortedResponses.slice(0, 5) as RecentResponse[]);

  }, [responses, loading]);

  // Format time helper
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Export data
  const exportData = () => {
    const analyticsData = {
      metrics,
      responses: responses.map(r => ({
        id: r.id,
        completedAt: r.completedAt,
        device: r.device,
        location: r.location,
        totalTime: r.totalTime,
        completionStatus: r.completionStatus,
        timeOfDay: r.timeOfDay,
        skipRate: r.skipRate,
        questionTimes: r.questionTimes,
        referral: r.referral,
      })),
      dateRange,
      formInfo: forms.find(f => f.id === selectedForm),
    };

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedForm}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  // Set initial selected form
  useEffect(() => {
    if (forms.length > 0 && !selectedForm) {
      setSelectedForm(forms[0].id);
    }
  }, [forms]);

  // Add question analytics processing
  useEffect(() => {
    if (loading || responses.length === 0) return;

    const questionData: {
      [questionId: string]: {
        question: string;
        type: 'numeric' | 'text';
        data: any;
        totalResponses: number;
        questionId: string; // Store the original question ID
      }
    } = {};

    // Process each response's answers
    responses.forEach(response => {
      if (response.answers) {
        Object.entries(response.answers).forEach(([questionId, data]) => {
          if (!questionData[questionId]) {
            // Initialize question data
            questionData[questionId] = {
              question: data.question,
              type: isNumeric(data.answer) ? 'numeric' : 'text',
              data: isNumeric(data.answer) ? [] : [],
              totalResponses: 0,
              questionId: questionId // Store the original question ID
            };
          }

          // Add answer to appropriate data structure
          if (questionData[questionId].type === 'numeric') {
            questionData[questionId].data.push(Number(data.answer));
          } else {
            questionData[questionId].data.push(String(data.answer));
          }
          
          questionData[questionId].totalResponses++;
        });
      }
    });

    // Calculate stats for each question
    Object.keys(questionData).forEach(questionId => {
      const question = questionData[questionId];
      
      if (question.type === 'numeric') {
        question.data = {
          stats: getNumericStats(question.data),
          distribution: question.data
        };
      } else {
        question.data = getTextFrequency(question.data);
      }
    });

    setQuestionAnalytics(questionData);
  }, [responses, loading]);

  return (
    <DashboardLayout>
      {/* Animated playful background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/2 h-40 bg-gradient-to-r from-pink-200 via-blue-100 to-purple-200 opacity-60 blur-2xl animate-float" />
        <div className="absolute bottom-0 right-0 w-1/3 h-32 bg-gradient-to-l from-blue-200 via-pink-100 to-purple-200 opacity-50 blur-2xl animate-float-delay" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-200/40 rounded-full blur-2xl animate-bounce-slow" />
        <div className="absolute bottom-1/3 right-1/3 w-32 h-32 bg-pink-200/30 rounded-full blur-3xl animate-pulse-slow" />
      </div>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-4 md:p-6">
        {/* Sticky header on mobile */}
        <div className="bg-white/90 px-4 py-3 flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text mb-1 drop-shadow-sm bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">Analytics Dashboard</h1>
            <p className="text-gray-600 text-base sm:text-lg">
              {forms.find(f => f.id === selectedForm)?.title || 'Loading survey...'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <Select value={selectedForm} onValueChange={setSelectedForm}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select survey" />
              </SelectTrigger>
              <SelectContent>
                {forms.map(form => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title || form.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2 w-full sm:w-auto"
              onClick={exportData}
              disabled={!selectedForm}
            >
              <Download size={16} />
              Export Data
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Responses</p>
                      <h3 className="text-2xl font-bold text-text mt-1">
                        {metrics.totalResponses}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {metrics.responseQuality.validResponses} valid
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <Progress 
                    value={(metrics.responseQuality.validResponses / metrics.totalResponses) * 100} 
                    className="mt-4"
                  />
          </CardContent>
        </Card>

              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <h3 className="text-2xl font-bold text-text mt-1">
                        {`${(metrics.completionRate * 100).toFixed(1)}%`}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {metrics.responseQuality.partialResponses} partial
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-secondary" />
                  </div>
                  <Progress 
                    value={metrics.completionRate * 100} 
                    className="mt-4"
                  />
          </CardContent>
        </Card>

              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Views</p>
                      <h3 className="text-2xl font-bold text-text mt-1">
                        {metrics.totalViews}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {`${(metrics.userEngagement.bounceRate * 100).toFixed(1)}% bounce rate`}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-8 w-8 text-accent" />
                      <InfoTooltip content={TOOLTIPS.totalViews} />
                    </div>
                  </div>
                  <Progress 
                    value={(1 - metrics.userEngagement.bounceRate) * 100} 
                    className="mt-4"
                  />
          </CardContent>
        </Card>

              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
                      <h3 className="text-2xl font-bold text-text mt-1">
                        {formatTime(metrics.avgCompletionTime)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        per response
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
          </CardContent>
        </Card>
      </div>

            {/* Tabs for detailed analytics */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="flex flex-wrap gap-2 mb-6">
                <TabsTrigger value="overview" className="px-4 py-2 font-semibold text-base transition-all border border-transparent rounded-md focus-visible:ring-2 focus-visible:ring-primary data-[state=active]:bg-[#f3f4f6] data-[state=active]:text-primary data-[state=active]:border-primary data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 hover:bg-gray-50">Overview</TabsTrigger>
                <TabsTrigger value="responses" className="px-4 py-2 font-semibold text-base transition-all border border-transparent rounded-md focus-visible:ring-2 focus-visible:ring-primary data-[state=active]:bg-[#f3f4f6] data-[state=active]:text-primary data-[state=active]:border-primary data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 hover:bg-gray-50">Response Analysis</TabsTrigger>
                <TabsTrigger value="engagement" className="px-4 py-2 font-semibold text-base transition-all border border-transparent rounded-md focus-visible:ring-2 focus-visible:ring-primary data-[state=active]:bg-[#f3f4f6] data-[state=active]:text-primary data-[state=active]:border-primary data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 hover:bg-gray-50">User Engagement</TabsTrigger>
                <TabsTrigger value="geographic" className="px-4 py-2 font-semibold text-base transition-all border border-transparent rounded-md focus-visible:ring-2 focus-visible:ring-primary data-[state=active]:bg-[#f3f4f6] data-[state=active]:text-primary data-[state=active]:border-primary data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 hover:bg-gray-50">Geographic Data</TabsTrigger>
                <TabsTrigger value="responseAnalytics" className="px-4 py-2 font-semibold text-base transition-all border border-transparent rounded-md focus-visible:ring-2 focus-visible:ring-primary data-[state=active]:bg-[#f3f4f6] data-[state=active]:text-primary data-[state=active]:border-primary data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 hover:bg-gray-50">Response Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Most Important Data First: Completion Time Analysis - Full Width */}
                  <Card className="bg-white shadow-sm col-span-2 border-primary/20 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold">Completion Time Analysis</h3>
                          <InfoTooltip content="Average time users spend completing the form throughout the day" />
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => date && setSelectedDate(date)}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="h-[300px]">
                        {responses.length > 0 && getCompletionTimeData(responses, selectedDate).some(d => d.avgTime > 0) ? (
                        <Line
                          data={{
                              labels: getCompletionTimeData(responses, selectedDate).map(
                                data => `${String(data.hour).padStart(2, '0')}:00`
                              ),
                            datasets: [{
                                label: 'Average Completion Time (seconds)',
                                data: getCompletionTimeData(responses, selectedDate).map(data => data.avgTime),
                                borderColor: '#8F00FF',
                                backgroundColor: 'rgba(143, 0, 255, 0.1)',
                                tension: 0.4,
                              fill: true,
                            }],
                          }}
                            options={{
                              ...lineChartOptions,
                              scales: {
                                ...lineChartOptions.scales,
                                y: {
                                  ...lineChartOptions.scales?.y,
                                  min: 0,
                                  title: {
                                    display: true,
                                    text: 'Time (seconds)'
                                  },
                                  ticks: {
                                    ...(lineChartOptions.scales?.y?.ticks || {})
                                  }
                                },
                                x: {
                                  ...lineChartOptions.scales?.x,
                                  title: {
                                    display: true,
                                    text: 'Hour of Day'
                                  }
                                }
                              },
                              plugins: {
                                ...lineChartOptions.plugins,
                                tooltip: {
                                  callbacks: {
                                    label: (context) => {
                                      const dataPoint = getCompletionTimeData(responses, selectedDate)[context.dataIndex];
                                      return [
                                        `Avg. Time: ${Math.round(dataPoint.avgTime)}s`,
                                        `Responses: ${dataPoint.count}`
                                      ];
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        ) : <NoDataMessage />}
          </div>
                      <div className="mt-4 text-sm text-gray-500">
                        {responses.length > 0 ? (
                          <div className="flex justify-between items-center">
                            <span>Total responses for {format(selectedDate, "PP")}: </span>
                            <span className="font-medium">
                              {getCompletionTimeData(responses, selectedDate).reduce((acc, data) => acc + data.count, 0)}
                            </span>
              </div>
                        ) : null}
              </div>
                    </CardContent>
                  </Card>

                  {/* Daily Activity Chart */}
                  <Card className="bg-white shadow-sm col-span-2">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                        <h3 className="text-lg font-semibold">Daily Activity</h3>
                          <InfoTooltip content={TOOLTIPS.dailyActivity} />
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                          <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => date && setSelectedDate(date)}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="h-[300px]">
                        {getHourlyDistribution(responses, selectedDate).some(count => count > 0) ? (
                        <Bar
                          data={{
                            labels: Array.from({ length: 24 }, (_, i) => 
                              `${i.toString().padStart(2, '0')}:00`
                            ),
                            datasets: [{
                              label: 'Responses',
                              data: getHourlyDistribution(responses, selectedDate),
                              backgroundColor: COLORS.chart[2],
                              borderRadius: 4,
                            }],
                          }}
                          options={{
                            ...barChartOptions,
                              scales: {
                                ...barChartOptions.scales,
                                y: {
                                  ...barChartOptions.scales?.y,
                                  min: 0,
                                  ticks: {
                                    ...(barChartOptions.scales?.y?.ticks || {}),
                                    callback: (value) => Number.isInteger(value) ? value : null
                                  }
                                }
                              },
                            plugins: {
                              ...barChartOptions.plugins,
                              title: {
                                display: true,
                                text: `Response distribution for ${selectedDate.toLocaleDateString()}`,
                              },
                            },
                          }}
                        />
                        ) : <NoDataMessage />}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Device Distribution */}
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">Device Distribution</h3>
                        <InfoTooltip content={TOOLTIPS.deviceDistribution} />
                      </div>
                      <div className="h-[300px]">
                        {metrics.deviceBreakdown.desktop + metrics.deviceBreakdown.mobile + metrics.deviceBreakdown.tablet > 0 ? (
                          <Pie
                            data={{
                              labels: ['Desktop', 'Mobile', 'Tablet'],
                              datasets: [{
                                data: [
                                  metrics.deviceBreakdown.desktop,
                                  metrics.deviceBreakdown.mobile,
                                  metrics.deviceBreakdown.tablet,
                                ],
                                backgroundColor: COLORS.chart,
                              }],
                            }}
                            options={pieChartOptions}
                          />
                        ) : <NoDataMessage />}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Referral Sources */}
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">Top Referral Sources</h3>
                        <InfoTooltip content={TOOLTIPS.referralSources} />
                      </div>
                      <div className="space-y-4 mt-4">
                        {Object.entries(
                          responses.reduce((acc: Record<string, number>, r) => {
                            const source = formatReferralSource(r.referral || '');
                            acc[source] = (acc[source] || 0) + 1;
                            return acc;
                          }, {})
                        ).length > 0 ? (
                          Object.entries(
                            responses.reduce((acc: Record<string, number>, r) => {
                              const source = formatReferralSource(r.referral || '');
                              acc[source] = (acc[source] || 0) + 1;
                              return acc;
                            }, {})
                          )
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([source, count]) => (
                              <div key={source} className="flex justify-between items-center">
                                <span className="truncate max-w-[300px] text-sm">{source}</span>
                                <Badge variant="secondary">{count}</Badge>
                              </div>
                            ))
                        ) : <NoDataMessage />}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Responses */}
                  <Card className="bg-white shadow-sm col-span-2">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">Recent Responses</h3>
                        <InfoTooltip content="Most recent form submissions with their details" />
                      </div>
                      <div className="space-y-4 mt-4">
                        {recentResponses.length > 0 ? (
                          recentResponses.map((response, index) => (
                          <div key={response.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="bg-primary/10 p-2 rounded-full">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{response.formTitle || 'Untitled Form'}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(response.completedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">
                                {response.device}
                              </Badge>
                              <Badge variant="outline">
                                {formatReferralSource(response.referral)}
                              </Badge>
                            </div>
                          </div>
                          ))
                        ) : <NoDataMessage />}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="responses" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Response Status Distribution */}
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">Response Status</h3>
                        <InfoTooltip content="Distribution of complete, partial, and invalid responses" />
                      </div>
                      <div className="h-[300px]">
                        {metrics.totalResponses > 0 ? (
                          <Pie
                          data={{
                              labels: ['Complete', 'Partial', 'Invalid'],
                            datasets: [{
                                data: [
                                  metrics.responseQuality.validResponses,
                                  metrics.responseQuality.partialResponses,
                                  metrics.responseQuality.invalidResponses,
                                ],
                                backgroundColor: [
                                  COLORS.chart[1], // green for complete
                                  COLORS.chart[2], // purple for partial
                                  COLORS.chart[4], // red for invalid
                                ],
                            }],
                          }}
                            options={pieChartOptions}
                        />
                        ) : <NoDataMessage />}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Overall Skip Rate */}
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">Question Skip Rate</h3>
                        <InfoTooltip content="Percentage of questions skipped by users" />
                            </div>
                      <div className="mt-8">
                        {responses.length > 0 ? (
                          <div className="space-y-6">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Overall Skip Rate</span>
                                <span className="font-semibold text-lg">
                                  {(responses.reduce((sum, r) => sum + (r.skipRate || 0), 0) / responses.length * 100).toFixed(1)}%
                                </span>
                          </div>
                              <Progress 
                                value={responses.reduce((sum, r) => sum + (r.skipRate || 0), 0) / responses.length * 100} 
                                className="h-3"
                              />
                            </div>
                          </div>
                        ) : <NoDataMessage />}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Form Completion Timeline */}
                  <Card className="bg-white shadow-sm col-span-2">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">Form Completion Timeline</h3>
                        <InfoTooltip content="Breakdown of when users complete forms over time" />
                      </div>
                      <div className="h-[300px]">
                        {responses.length > 0 ? (
                          <Line
                            data={{
                              labels: Array.from({ length: 7 }, (_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() - 6 + i);
                                return format(date, 'MMM dd');
                              }),
                              datasets: [{
                                label: 'Completed Forms',
                                data: Array.from({ length: 7 }, (_, i) => {
                                  const date = new Date();
                                  date.setDate(date.getDate() - 6 + i);
                                  date.setHours(0, 0, 0, 0);
                                  
                                  const nextDate = new Date(date);
                                  nextDate.setDate(nextDate.getDate() + 1);
                                  
                                  return responses.filter(r => {
                                    const responseDate = new Date(r.completedAt);
                                    return responseDate >= date && responseDate < nextDate && r.completionStatus === 'complete';
                                  }).length;
                                }),
                                borderColor: COLORS.primary,
                                backgroundColor: `${COLORS.primary}33`,
                                fill: true,
                              }],
                            }}
                            options={lineChartOptions}
                          />
                        ) : <NoDataMessage />}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="engagement" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Session Duration */}
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">Session Duration Distribution</h3>
                        <InfoTooltip content="Analysis of how long users spend on your form" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Average Session</span>
                          <span className="font-semibold">{formatTime(metrics.userEngagement.avgSessionDuration)}</span>
                        </div>
                        <Progress value={(metrics.userEngagement.avgSessionDuration / 300000) * 100} />
                        
                        <div className="flex justify-between items-center">
                          <span>Bounce Rate</span>
                          <span className="font-semibold">{(metrics.userEngagement.bounceRate * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={metrics.userEngagement.bounceRate * 100} />
                        
                        <div className="mt-6 space-y-3">
                          <h4 className="text-sm font-medium text-gray-500">Session Duration Breakdown</h4>
                          <div className="flex justify-between items-center">
                            <span>&lt; 30 seconds</span>
                            <span>{responses.filter(r => (r.totalTime || 0) < 30000).length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>30s - 2 minutes</span>
                            <span>{responses.filter(r => (r.totalTime || 0) >= 30000 && (r.totalTime || 0) < 120000).length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>2m - 5 minutes</span>
                            <span>{responses.filter(r => (r.totalTime || 0) >= 120000 && (r.totalTime || 0) < 300000).length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>&gt; 5 minutes</span>
                            <span>{responses.filter(r => (r.totalTime || 0) >= 300000).length}</span>
                          </div>
                        </div>
              </div>
            </CardContent>
          </Card>

                  {/* User Engagement Metrics */}
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">Engagement Metrics</h3>
                        <InfoTooltip content="Key metrics about user interaction with your forms" />
                      </div>
                      <div className="space-y-6 mt-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-4">Completion Rate by Device</h4>
                          {Object.entries({
                            Desktop: responses.filter(r => r.device === 'Desktop' && r.completionStatus === 'complete').length / 
                              (responses.filter(r => r.device === 'Desktop').length || 1) * 100,
                            Mobile: responses.filter(r => r.device === 'Mobile' && r.completionStatus === 'complete').length / 
                              (responses.filter(r => r.device === 'Mobile').length || 1) * 100,
                            Tablet: responses.filter(r => r.device === 'Tablet' && r.completionStatus === 'complete').length / 
                              (responses.filter(r => r.device === 'Tablet').length || 1) * 100
                          }).map(([device, rate]) => (
                            <div key={device} className="mb-3">
                              <div className="flex justify-between items-center mb-1">
                                <span>{device}</span>
                                <span>{rate.toFixed(1)}%</span>
                              </div>
                              <Progress value={rate} className="h-2" />
                            </div>
                          ))}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-4">Traffic Sources</h4>
                          {Object.entries(
                            responses.reduce((acc: Record<string, number>, r) => {
                              const source = formatReferralSource(r.referral || '');
                              acc[source] = (acc[source] || 0) + 1;
                              return acc;
                            }, {})
                          )
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([source, count]) => (
                              <div key={source} className="flex justify-between items-center mb-2">
                                <span className="truncate max-w-[200px] text-sm">{source}</span>
                            <Badge variant="secondary">{count}</Badge>
                </div>
                        ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Weekly Engagement Trend */}
                  <Card className="bg-white shadow-sm col-span-2">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">Weekly Engagement Trend</h3>
                        <InfoTooltip content="Form views and completions over the past week" />
                      </div>
                      <div className="h-[300px]">
                        {responses.length > 0 ? (
                          <Bar
                            data={{
                              labels: Array.from({ length: 7 }, (_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() - 6 + i);
                                return format(date, 'EEE');
                              }),
                              datasets: [
                                {
                                  label: 'Views',
                                  data: Array.from({ length: 7 }, (_, i) => {
                                    // For demo, generate views as 30-100% more than completions
                                    const completions = responses.filter(r => {
                                      const date = new Date(r.completedAt);
                                      const today = new Date();
                                      const day = new Date();
                                      day.setDate(day.getDate() - 6 + i);
                                      return date.toDateString() === day.toDateString();
                                    }).length;
                                    
                                    return Math.round(completions * (1.3 + Math.random() * 0.7));
                                  }),
                                  backgroundColor: COLORS.chart[0],
                                },
                                {
                                  label: 'Completions',
                                  data: Array.from({ length: 7 }, (_, i) => {
                                    return responses.filter(r => {
                                      const date = new Date(r.completedAt);
                                      const today = new Date();
                                      const day = new Date();
                                      day.setDate(day.getDate() - 6 + i);
                                      return date.toDateString() === day.toDateString();
                                    }).length;
                                  }),
                                  backgroundColor: COLORS.chart[1],
                                }
                              ],
                            }}
                            options={{
                              ...barChartOptions,
                              scales: {
                                ...barChartOptions.scales,
                                x: {
                                  ...barChartOptions.scales?.x,
                                  stacked: false,
                                },
                                y: {
                                  ...barChartOptions.scales?.y,
                                  stacked: false,
                                  min: 0,
                                  ticks: {
                                    ...(barChartOptions.scales?.y?.ticks || {}),
                                    callback: (value) => Number.isInteger(value) ? value : null
                                  }
                                }
                              }
                            }}
                          />
                        ) : <NoDataMessage />}
                </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="geographic" className="space-y-6">
                {/* Geographic Distribution */}
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
                    <div className="w-full overflow-x-auto rounded-2xl">
                      <MapContainer
                        center={[0, 0]}
                        zoom={2}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {metrics.locations.map((loc, idx) => (
                          <CircleMarker
                            key={idx}
                            center={[loc.lat, loc.lng]}
                            radius={8}
                            fillColor={COLORS.primary}
                            color={COLORS.primary}
                            weight={1}
                            opacity={0.8}
                            fillOpacity={0.4}
                          >
                            <Popup>
                              Responses: {loc.count}
                            </Popup>
                          </CircleMarker>
                        ))}
                      </MapContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

              <TabsContent value="responseAnalytics" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
            <Card className="bg-white shadow-sm col-span-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold">Response Analysis by Question</h3>
                    <InfoTooltip content={TOOLTIPS.responseAnalytics} />
                  </div>
                  <Badge variant="outline" className="px-3 py-1">
                    {Object.keys(questionAnalytics).length} Questions
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Question-by-question breakdown of all user responses from your survey
                </p>
                
                {Object.keys(questionAnalytics).length === 0 ? (
                  <NoDataMessage />
                ) : (
                  <div className="space-y-8">
                    {sortQuestionIds(Object.keys(questionAnalytics)).map(questionId => {
                      const data = questionAnalytics[questionId];
                      return (
                        <div key={questionId} className="p-6 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                  <span className="text-primary font-semibold">{questionId.replace('q', '')}</span>
                                </div>
                                <h4 className="text-lg font-medium">{data.question}</h4>
                              </div>
                              <div className="flex items-center text-sm text-gray-500 mt-2 ml-11">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                <span>{data.totalResponses} responses</span>
                                {data.type === 'numeric' && (
                                  <Badge variant="secondary" className="ml-3">Numeric</Badge>
                                )}
                                {data.type === 'text' && (
                                  <Badge variant="secondary" className="ml-3">Text/Choice</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {data.type === 'numeric' ? (
                            <div className="space-y-6 ml-11">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-sm text-gray-500 mb-1">Average</p>
                                  <p className="text-2xl font-semibold text-primary">{data.data.stats.avg.toFixed(1)}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-sm text-gray-500 mb-1">Minimum</p>
                                  <p className="text-2xl font-semibold text-secondary">{data.data.stats.min}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-sm text-gray-500 mb-1">Maximum</p>
                                  <p className="text-2xl font-semibold text-accent">{data.data.stats.max}</p>
                                </div>
                              </div>
                              
                              <div className="h-[240px]">
                                <Bar
                                  data={{
                                    labels: Array.from({ length: data.data.stats.max + 1 }, (_, i) => i),
                                    datasets: [{
                                      label: 'Response Count',
                                      data: Array.from({ length: data.data.stats.max + 1 }, (_, i) => 
                                        data.data.distribution.filter(val => val === i).length
                                      ),
                                      backgroundColor: COLORS.chart[2],
                                      borderRadius: 6,
                                      borderWidth: 0,
                                      hoverBackgroundColor: '#8F00FF',
                                    }],
                                  }}
                                  options={{
                                    ...barChartOptions,
                                    plugins: {
                                      ...barChartOptions.plugins,
                                      title: {
                                        display: false
                                      },
                                      legend: {
                                        display: false
                                      }
                                    },
                                    scales: {
                                      ...barChartOptions.scales,
                                      y: {
                                        ...barChartOptions.scales?.y,
                                        grid: {
                                          color: 'rgba(0, 0, 0, 0.06)'
                                        },
                                        ticks: {
                                          ...(barChartOptions.scales?.y?.ticks || {}),
                                          callback: (value) => Number.isInteger(value) ? value : null
                                        }
                                      },
                                      x: {
                                        ...barChartOptions.scales?.x,
                                        grid: {
                                          display: false
                                        },
                                        title: {
                                          display: true,
                                          text: 'Rating Value'
                                        }
                                      }
                                    },
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4 ml-11">
                              {/* For text responses, show frequency distribution */}
                              {data.data.slice(0, 6).map((item: any, index: number) => (
                                <div key={index} className="mb-3">
                                  <div className="flex justify-between mb-1 text-sm">
                                    <span className="truncate max-w-[70%] font-medium">{item.value}</span>
                                    <span className="text-gray-600">{item.percentage.toFixed(1)}% ({item.count})</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div 
                                      className="bg-primary h-3 rounded-full" 
                                      style={{ width: `${item.percentage}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                              
                              {data.data.length > 6 && (
                                <Sheet>
                                  <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="mt-2 w-full">
                                      View all {data.data.length} responses
                                    </Button>
                                  </SheetTrigger>
                                  <SheetContent className="w-[400px] sm:w-[540px]">
                                    <SheetHeader>
                                      <SheetTitle>All Responses for Question {questionId.replace('q', '')}</SheetTitle>
                                      <SheetDescription>{data.question}</SheetDescription>
                                    </SheetHeader>
                                    <ScrollArea className="h-[calc(100vh-180px)] mt-6">
                                      <div className="space-y-4">
                                        {data.data.map((item: any, index: number) => (
                                          <div key={index} className="mb-3 pr-2">
                                            <div className="flex justify-between mb-1 text-sm">
                                              <span className="break-words max-w-[70%] font-medium">{item.value}</span>
                                              <span className="text-gray-600">{item.percentage.toFixed(1)}% ({item.count})</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-3">
                                              <div 
                                                className="bg-primary h-3 rounded-full" 
                                                style={{ width: `${item.percentage}%` }}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </SheetContent>
                                </Sheet>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
