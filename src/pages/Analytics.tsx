import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Download, Users, Clock, TrendingUp, 
  MessageSquare, BarChart2, PieChart, BrainCircuit, Sparkles, Lock, CreditCard,
  CheckCircle2, XCircle, Smartphone, Monitor, Tablet, ArrowUpRight, Loader2,
  MapPin, Globe, Eye, Calendar as CalendarIcon, Info, Filter, ChevronLeft, ChevronRight,
  History, X
} from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, getDoc, startAfter, QueryDocumentSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from '@/lib/toast';
import { useAlert } from '@/components/AlertProvider';

// Helper function to safely format dates
const safeFormatDate = (date: Date | string | number | null | undefined, formatStr: string, fallback: string = 'N/A'): string => {
  if (!date) return fallback;
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return fallback;
  }
};

// Helper function to safely create date objects
const safeDate = (date: Date | string | number | null | undefined): Date | null => {
  if (!date) return null;
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    return dateObj;
  } catch (error) {
    console.error('Error creating date:', error, date);
    return null;
  }
};
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { DocumentData } from 'firebase/firestore';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AISummary from '@/components/ai/AISummary';
import { CREDIT_COSTS } from '@/firebase/credits';
import InsightCard from '@/components/ai/InsightCard';
import GlobalAISummary from '@/components/ai/GlobalAISummary';
import GlobalAISummaryBox from '@/components/ai/GlobalAISummaryBox';
import MetricInsightCard from '@/components/ai/MetricInsightCard';
import SmartAlerts, { Alert } from '@/components/ai/SmartAlerts';
import ExportModal from '@/components/ai/ExportModal';
import InsightHistory from '@/components/ai/InsightHistory';
import CountriesBreakdown from '@/components/ai/CountriesBreakdown';
import { analyzeAllMetrics, type ModularInputs, type MetricEngineResult } from '@/components/ai/metricEngine';
import { 
  calculateDelta, 
  generateAlerts, 
  DEFAULT_ALERT_THRESHOLDS,
  storeInsightFeedback,
  getInsightFeedback 
} from '@/utils/analyticsHelpers';
import { generateGlobalSummary, generateMetricInsights } from '@/utils/aiSummaryGenerator';
import { saveInsightToDB } from '@/utils/saveInsightToDB';
import { useUserCredits } from '@/hooks/useUserCredits';
import UserStatusBadge from '@/components/ui/UserStatusBadge';
import FeatureGate from '@/components/ui/FeatureGate';
import PremiumAISummary from '@/components/ai/PremiumAISummary';
import UpgradeModal from '@/components/modals/UpgradeModal';
import TopUpModal from '@/components/modals/TopUpModal';

// Helper components
const InfoTooltip: React.FC<{ content: string }> = ({ content }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 ml-2 text-gray-400 cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const NoDataMessage: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <p>No data available</p>
    </div>
  );
};

// Fix for Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface Form {
  id: string;
  title: string;
  ownerId: string;
  [key: string]: any;
}

interface SurveyResponse {
  id: string;
  formId: string;
  completedAt: string;
  device?: string;
  location?: { lat: number; lng: number };
  totalTime?: number;
  completionStatus?: string;
  timeOfDay?: string;
  skipRate?: number;
  referral?: string;
  answers?: Record<string, { question: string; answer: string | number }>;
  formTitle?: string;
}

const Analytics: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAgent, setCurrentAgent] = useState<{ name: string; personality: string; goal: string } | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | null>(null);
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { userType, credits, refreshCredits } = useUserCredits();
  
  // Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [modalFeature, setModalFeature] = useState<string>('');
  const [modalDescription, setModalDescription] = useState<string>('');
  
  // Upgrade handlers
  const handleUpgrade = (feature?: string, description?: string) => {
    setModalFeature(feature || 'premium features');
    setModalDescription(description || 'Upgrade to Pro for unlimited access to all features');
    setShowUpgradeModal(true);
  };

  const handleBuyCredits = (requiredCredits?: number) => {
    setShowTopUpModal(true);
  };

  const handleUpgradeFromModal = () => {
    navigate('/pricing');
  };

  const handleBuyCreditsFromModal = () => {
    navigate('/pricing');
  };

  const [deviceFilter, setDeviceFilter] = useState('all');
  const [referralFilter, setReferralFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Pagination state for large datasets
  const [responsePage, setResponsePage] = useState(1);
  const [lastResponseDoc, setLastResponseDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreResponses, setHasMoreResponses] = useState(true);
  const [totalResponseCount, setTotalResponseCount] = useState(0);
  const RESPONSES_PER_PAGE = 50; // Load 50 at a time for performance
  
  // AI Insights state
  const [currentInsight, setCurrentInsight] = useState<{ text: string; createdAt: any; responseCount: number; id?: string } | null>(null);
  const [insightHistory, setInsightHistory] = useState<Array<{ id: string; text: string; createdAt: any; responseCount: number; stage: number }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [lastInsightResponseCount, setLastInsightResponseCount] = useState(0);
  const [lastInsightGenerationTime, setLastInsightGenerationTime] = useState<number>(0);
  
  // AI Insight Engine state
  const [viewMode, setViewMode] = useState<'raw' | 'insights'>('insights');
  const [metricInsights, setMetricInsights] = useState<MetricEngineResult | null>(null);
  const [previousMetrics, setPreviousMetrics] = useState<Record<string, number> | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [globalSummary, setGlobalSummary] = useState<{ summary: string; keyInsights: string[]; timestamp: Date } | null>(null);
  const [metricInsightData, setMetricInsightData] = useState<Record<string, { metric: string; insight: string; recommendation: string; confidence: 'low' | 'medium' | 'high' }>>({});
  const [generatingGlobalSummary, setGeneratingGlobalSummary] = useState(false);
  const [lastSavedResponseCount, setLastSavedResponseCount] = useState<number>(0);
  
  // Stage-based trigger logic - COST CONTROL: Reduced frequency to prevent excessive API calls
  const getInsightStage = (responseCount: number, lastGeneratedCount: number): { stage: number; shouldGenerate: boolean } => {
    // COST CONTROL: Only auto-generate at specific milestones (much less frequent)
    // Milestones: 5, 10, 20, 50, 100, 200, 500, 1000 (reduced from every 20 to save costs)
    const milestones = [5, 10, 20, 50, 100, 200, 500, 1000];
    
    // Check if we've crossed any milestone threshold
    const crossedMilestone = milestones.some(milestone => {
      return responseCount >= milestone && lastGeneratedCount < milestone;
    });
    
    if (!crossedMilestone) {
      return { stage: 0, shouldGenerate: false };
    }
    
    // Determine stage based on response count
    if (responseCount === 5) return { stage: 1, shouldGenerate: true }; // Stage 1: Early signal
    if (responseCount === 10) return { stage: 2, shouldGenerate: true }; // Stage 2: Initial insights
    if (responseCount === 20) return { stage: 3, shouldGenerate: true }; // Stage 3: First full analysis
    if (responseCount >= 100) return { stage: 5, shouldGenerate: true }; // Stage 5: Deep insights
    if (responseCount >= 50 && responseCount % 50 === 0) return { stage: 4, shouldGenerate: true }; // Stage 4: Evolving insights (every 50, not 20)
    
    return { stage: 0, shouldGenerate: false };
  };

  // Load insight history from Firestore subcollection
  const loadInsightHistory = async (formId: string) => {
    if (!formId) return;
    
    try {
      const db = getFirestore();
      const summariesRef = collection(db, 'forms', formId, 'ai_summaries');
      const summariesQuery = query(summariesRef, orderBy('generatedAt', 'desc'), limit(50)); // Load more history
      const summariesSnap = await getDocs(summariesQuery);
      
      const history = summariesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.summaryText || '',
          createdAt: data.generatedAt?.toDate 
            ? data.generatedAt.toDate() 
            : new Date(data.generatedAt || Date.now()),
          responseCount: data.responseCount || 0,
          stage: data.stage || 0,
        };
      });
      
      setInsightHistory(history);
      
      // Set the latest as current insight if we have history
      if (history.length > 0) {
        const latestSummary = history[0];
        setCurrentInsight({
          text: latestSummary.text,
          createdAt: latestSummary.createdAt,
          responseCount: latestSummary.responseCount,
          id: latestSummary.id,
        });
        setLastInsightResponseCount(latestSummary.responseCount);
        return latestSummary.responseCount; // Return for use in checkAndGenerateInsights
      } else {
        // No history yet - clear current insight
        setCurrentInsight(null);
        setLastInsightResponseCount(0);
        return 0;
      }
    } catch (error) {
      console.error('Error loading insight history:', error);
      // On error, don't clear existing state
      return lastInsightResponseCount;
    }
  };

  // Check if insights should be generated automatically (only every 20 responses)
  // COST CONTROL: Only auto-generate at specific milestones to prevent excessive API calls
  const checkAndGenerateInsights = async (formId: string, totalCount: number, currentResponses: SurveyResponse[], formTitle: string) => {
    // Don't generate if already generating
    if (generatingInsight) {
      console.log('⏭️ [ANALYSIS] Already generating, skipping');
      return;
    }
    
    // COST CONTROL: Only auto-generate if we have at least 5 responses
    if (totalCount < 5) {
      console.log(`⏭️ [ANALYSIS] Too few responses (${totalCount}), skipping auto-generation`);
      return;
    }
    
    // Load existing insight history first to get lastInsightResponseCount
    const lastCount = await loadInsightHistory(formId);
    
    // Check if we should generate a new insight based on stage logic
    // COST CONTROL: Only auto-generate at milestones (every 20 responses) to reduce API calls
    const stageInfo = getInsightStage(totalCount, lastCount);
    
    // COST CONTROL: Don't auto-generate if we just generated one recently (within last 10 minutes)
    const MIN_TIME_BETWEEN_AUTO_GENERATIONS = 600000; // 10 minutes (increased to reduce costs)
    const timeSinceLastGeneration = Date.now() - lastInsightGenerationTime;
    
    if (stageInfo.shouldGenerate && totalCount > 0 && timeSinceLastGeneration > MIN_TIME_BETWEEN_AUTO_GENERATIONS) {
      console.log(`🔄 Auto-generating summary at ${totalCount} responses (last was ${lastCount})`);
      await generateInsight(formId, totalCount, currentResponses, formTitle, stageInfo.stage);
    } else {
      if (timeSinceLastGeneration <= MIN_TIME_BETWEEN_AUTO_GENERATIONS) {
        console.log(`⏭️ [COST CONTROL] Skipping auto-generation - too soon since last generation (${Math.round(timeSinceLastGeneration / 1000 / 60)} min ago, need ${MIN_TIME_BETWEEN_AUTO_GENERATIONS / 1000 / 60} min)`);
      } else {
        console.log(`⏭️ Skipping auto-generation. Current: ${totalCount}, Last: ${lastCount}, Should generate: ${stageInfo.shouldGenerate}`);
      }
    }
  };

  // Manual refresh function - always generates a new summary
  const refreshInsight = async () => {
    if (!selectedForm || generatingInsight) return;
    
    const db = getFirestore();
    const formDoc = await getDoc(doc(db, 'forms', selectedForm));
    if (!formDoc.exists()) return;
    
    const formTitle = formDoc.data().title || '';
    
    // Determine stage based on response count for manual generation
    let stage = 4; // Default to evolving insights
    if (totalResponseCount === 1) stage = 1;
    else if (totalResponseCount === 10) stage = 2;
    else if (totalResponseCount === 20) stage = 3;
    else if (totalResponseCount >= 100) stage = 5;
    
    console.log(`🔧 Manual summary generation requested at ${totalResponseCount} responses`);
    await generateInsight(selectedForm, totalResponseCount, responses, formTitle, stage);
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
        
        // Fetch forms AND forms linked to agents
        const formsQuery = query(
          collection(db, 'forms'),
          where('ownerId', '==', user.uid)
        );
        
        const formsSnap = await getDocs(formsQuery);
        let formsArr = formsSnap.docs.map(doc => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            title: data.title,
            ownerId: data.ownerId,
            ...data
          } as Form;
        });
        
        // Also fetch forms linked via agents
        const agentsQuery = query(
          collection(db, 'agents'),
          where('userId', '==', user.uid)
        );
        const agentsSnap = await getDocs(agentsQuery);
        
        const agentSurveyIds = agentsSnap.docs
          .map(doc => doc.data().surveyId)
          .filter(id => id);
        
        const agentFormIds = agentSurveyIds.filter(id => !formsArr.find(f => f.id === id));
        if (agentFormIds.length > 0) {
          const agentFormsPromises = agentFormIds.map(async (formId) => {
            try {
              const formDoc = await getDoc(doc(db, 'forms', formId));
              if (formDoc.exists()) {
                const data = formDoc.data() as DocumentData;
                return {
                  id: formDoc.id,
                  title: data.title,
                  ownerId: data.ownerId,
                  ...data
                } as Form;
              }
            } catch (error) {
              console.error(`Error fetching form ${formId}:`, error);
            }
            return null;
          });
          
          const agentForms = (await Promise.all(agentFormsPromises)).filter(f => f !== null) as Form[];
          formsArr = [...formsArr, ...agentForms];
        }
        
        if (isMounted) {
          setForms(formsArr);
          if (formsArr.length > 0 && !selectedForm) {
            setSelectedForm(formsArr[0].id);
          }
        }

        // Fetch user plan
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        if (isMounted) {
          setUserPlan(userData?.plan || 'free');
          }
        } catch (error) {
          console.error('Error fetching user plan:', error);
          if (isMounted) {
            setUserPlan('free');
          }
        }

        // Fetch agent info if form is selected
        if (selectedForm || formsArr[0]?.id) {
          const formIdToCheck = selectedForm || formsArr[0]?.id;
          const agent = agentsSnap.docs.find(doc => {
            const data = doc.data();
            return data.surveyId === formIdToCheck;
          });
          
          if (agent && isMounted) {
            const agentData = agent.data();
            setCurrentAgent({
              name: agentData.name || 'Unknown Agent',
              personality: agentData.personality || 'professional',
              goal: agentData.goal || 'No goal specified'
            });
          } else if (isMounted) {
            setCurrentAgent(null);
          }
        }

        // Fetch responses with pagination for performance (handle millions of responses)
        const formIdToFetch = selectedForm || formsArr[0]?.id;
        if (formIdToFetch) {
          try {
            // For large datasets, we'll use a sampling approach for metrics
            // First, get total count efficiently
            const countQuery = query(
            collection(db, 'survey_responses'),
              where('formId', '==', formIdToFetch)
            );
            const countSnap = await getDocs(countQuery);
            const totalCount = countSnap.size;
            
            if (isMounted) {
              setTotalResponseCount(totalCount);
            }

            // Fetch first page with limit for performance (50 at a time)
            let responsesQuery = query(
              collection(db, 'survey_responses'),
              where('formId', '==', formIdToFetch),
              orderBy('createdAt', 'desc'),
              limit(RESPONSES_PER_PAGE)
            );
            
            let responsesSnap;
            try {
              responsesSnap = await getDocs(responsesQuery);
            } catch (error: any) {
              // Fallback if createdAt index doesn't exist - use completedAt
              console.warn('Using fallback query without createdAt:', error);
              responsesQuery = query(
                collection(db, 'survey_responses'),
                where('formId', '==', formIdToFetch),
                limit(RESPONSES_PER_PAGE)
              );
              responsesSnap = await getDocs(responsesQuery);
            }
            
          const formResponses = responsesSnap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
              formTitle: formsArr.find(f => f.id === formIdToFetch)?.title 
          } as SurveyResponse));

            // Sort by completedAt if createdAt not available
            formResponses.sort((a, b) => {
              const dateA = safeDate(a.completedAt);
              const dateB = safeDate(b.completedAt);
              if (!dateA || !dateB) return 0;
              return dateB.getTime() - dateA.getTime();
            });
          
          if (isMounted) {
              setResponses(formResponses);
              setLastResponseDoc(responsesSnap.docs[responsesSnap.docs.length - 1] || null);
              setHasMoreResponses(responsesSnap.docs.length === RESPONSES_PER_PAGE && totalCount > RESPONSES_PER_PAGE);
              setResponsePage(1);
            }
            
            // Load insight history first (without generating)
            if (isMounted && formIdToFetch) {
              // Load history to show existing summaries
              await loadInsightHistory(formIdToFetch);
              
              // Then check if we should auto-generate (only every 20 responses)
              await checkAndGenerateInsights(formIdToFetch, totalCount, formResponses, formsArr.find(f => f.id === formIdToFetch)?.title || '');
            }
          } catch (error) {
            console.error('Error fetching responses:', error);
          if (isMounted) {
            setResponses([]);
            }
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
  }, [selectedForm]);

  // Load insight history when survey changes (preserves existing summaries)
  useEffect(() => {
    if (selectedForm) {
      loadInsightHistory(selectedForm);
    }
  }, [selectedForm]);

  // Enforce viewMode restrictions for credit users
  useEffect(() => {
    if (userType === 'credit' && viewMode === 'insights') {
      setViewMode('raw');
    }
  }, [userType, viewMode]);

  // Generate AI insight based on analytics data with stage-based prompts
  const generateInsight = async (formId: string, responseCount: number, responses: SurveyResponse[], formTitle: string, stage: number) => {
    if (generatingInsight) {
      console.log('⏭️ [ANALYSIS] Already generating insight, skipping duplicate request');
      return;
    }
    
    setGeneratingInsight(true);
    
    try {
      const db = getFirestore();
      
      // Calculate key metrics
      const completed = responses.filter(r => r.completionStatus === 'complete').length;
      const completionRate = responses.length > 0 ? completed / responses.length : 0;
      const avgTime = responses.reduce((acc, r) => acc + (r.totalTime || 0), 0) / responses.length || 0;
      
    const deviceBreakdown = {
        desktop: responses.filter(r => r.device?.toLowerCase() === 'desktop').length,
        mobile: responses.filter(r => r.device?.toLowerCase() === 'mobile').length,
        tablet: responses.filter(r => r.device?.toLowerCase() === 'tablet').length,
      };
      
      // Analyze question data with sentiment and trends
      const questionData: Record<string, { question: string; answers: any[]; type: string; average?: number; trends?: string }> = {};
      responses.forEach(response => {
        if (response.answers) {
          Object.entries(response.answers).forEach(([qId, data]) => {
            if (!questionData[qId]) {
              // Determine question type more accurately
              let qType = typeof data.answer === 'number' ? 'numeric' : 'text';
              // Check if it's actually multiple choice by looking at distinct values
              if (typeof data.answer === 'string') {
                // Could be multiple choice or text
                qType = 'text';
              }
              questionData[qId] = {
                question: data.question,
                answers: [],
                type: qType,
              };
            }
            questionData[qId].answers.push(data.answer);
          });
        }
      });
      
      // Detect multiple choice questions by checking answer diversity
      Object.entries(questionData).forEach(([qId, data]) => {
        if (data.type === 'text' && data.answers.length > 0) {
          const uniqueAnswers = new Set(data.answers.map(a => String(a).toLowerCase().trim()));
          // If there are few unique answers relative to total, it's likely multiple choice
          if (uniqueAnswers.size <= 5 && data.answers.length > uniqueAnswers.size * 2) {
            data.type = 'multiple_choice';
          }
        }
      });
      
      // Calculate numeric averages and trends
      Object.entries(questionData).forEach(([qId, data]) => {
        if (data.type === 'numeric' && data.answers.length > 0) {
          const numericAnswers = data.answers.filter(a => typeof a === 'number') as number[];
          if (numericAnswers.length > 0) {
            const sum = numericAnswers.reduce((a, b) => a + b, 0);
            data.average = sum / numericAnswers.length;
            const min = Math.min(...numericAnswers);
            const max = Math.max(...numericAnswers);
            data.trends = `Range: ${min}-${max}, Average: ${data.average.toFixed(1)}`;
          }
        }
      });
      
      // Analyze text responses for sentiment (simple keyword-based)
      const analyzeTextSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
        const lowerText = text.toLowerCase();
        const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'happy', 'satisfied', 'best', 'fantastic', 'wonderful', 'awesome'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'disappointed', 'poor', 'unhappy', 'frustrated', 'problem', 'issue', 'fail'];
        
        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
      };
      
      // Build response data summary for AI (DO NOT include question text - only data patterns)
      const responseDataSummary: any[] = [];
      Object.entries(questionData).forEach(([qId, data]) => {
        const item: any = {
          questionType: data.type,
          responseCount: data.answers.length,
        };
        
        if (data.type === 'numeric' && data.average !== undefined) {
          item.numericData = {
            average: data.average,
            min: Math.min(...(data.answers.filter(a => typeof a === 'number') as number[])),
            max: Math.max(...(data.answers.filter(a => typeof a === 'number') as number[])),
            valueCounts: data.answers.reduce((acc: Record<number, number>, val) => {
              if (typeof val === 'number') {
                acc[val] = (acc[val] || 0) + 1;
      }
      return acc;
            }, {}),
          };
        } else if (data.type === 'text') {
          const textAnswers = data.answers.filter(a => typeof a === 'string') as string[];
          const sentimentCounts = textAnswers.reduce((acc, text) => {
            const sentiment = analyzeTextSentiment(text);
            acc[sentiment] = (acc[sentiment] || 0) + 1;
            return acc;
          }, { positive: 0, neutral: 0, negative: 0 });
          
          item.textData = {
            totalTextResponses: textAnswers.length,
            sentimentDistribution: sentimentCounts,
            sampleResponses: textAnswers.slice(0, 5), // Sample for context
          };
        } else if (data.type === 'multiple_choice') {
          item.choiceData = {
            options: data.answers.reduce((acc: Record<string, number>, val) => {
              const key = String(val);
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {}),
          };
        }
        
        responseDataSummary.push(item);
      });
      
      // Call dedicated analysis endpoint (backend handles prompt building)
      const apiUrl = import.meta.env.PROD 
        ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/analyzeSurvey'
        : 'http://localhost:3000/analyzeSurvey';
      
      // Get current user for rate limiting
      const auth = getAuth();
      const user = auth.currentUser;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          surveyData: responseDataSummary,
          formTitle,
          responseCount,
          stage,
          formId,
          userId: user?.uid || null
        })
      });
      
      // Handle rate limit responses with upgrade prompts
      if (response.status === 429) {
        const result = await response.json().catch(() => ({}));
        const retryAfter = result.retryAfter || 30;
        const requiresUpgrade = result.requiresUpgrade || false;
        const upgradeMessage = result.upgradeMessage || 'Upgrade to Pro for unlimited analysis requests!';
        
        console.warn(`⚠️ [ANALYSIS] Rate limited. Retry after ${retryAfter}s`);
        setGeneratingInsight(false);
        
        // Show upgrade prompt for free/credit users
        if (requiresUpgrade && userPlan !== 'pro') {
          showAlert(
            'Rate Limit Reached',
            `${upgradeMessage} Click "Upgrade to Pro" below to unlock unlimited requests.`,
            'warning'
          );
          toast.warning(upgradeMessage);
        } else {
          toast.warning(result.error || 'Rate limit exceeded');
        }
        return;
      }
      
      if (response.ok) {
        const result = await response.json();
        
        // Extract insight from AI response
        let insightText = result.summaryText || '';
        
        // If no summary text, use fallback
        if (!insightText || insightText.trim().length === 0) {
          insightText = generateFallbackInsightByStage(stage, {
            totalResponses: responseCount,
            completionRate: Math.round(completionRate * 100),
            deviceBreakdown,
          });
        }
        
        // Save insight to Firestore subcollection forms/{formId}/ai_summaries/{summaryId}
        const summariesRef = collection(db, 'forms', formId, 'ai_summaries');
        const summaryDoc = await addDoc(summariesRef, {
          summaryText: insightText,
          generatedAt: serverTimestamp(),
          responseCount,
          stage,
          formId, // Store formId for easier querying
        });
        
        console.log('✅ AI Summary saved to forms/', formId, '/ai_summaries/', summaryDoc.id);
        
        // Update state
        const createdAt = new Date();
        setCurrentInsight({
          text: insightText,
          createdAt,
          responseCount,
          id: summaryDoc.id,
        });
        setLastInsightResponseCount(responseCount);
        setLastInsightGenerationTime(Date.now()); // Track when we last generated
        
        // Reload history to include new summary
        await loadInsightHistory(formId);
      } else {
        throw new Error('Failed to generate insight');
      }
    } catch (error) {
      console.error('Error generating insight:', error);
      // Generate fallback insight
      const completed = responses.filter(r => r.completionStatus === 'complete').length;
      const completionRate = responses.length > 0 ? completed / responses.length : 0;
      const deviceBreakdown = {
        desktop: responses.filter(r => r.device?.toLowerCase() === 'desktop').length,
        mobile: responses.filter(r => r.device?.toLowerCase() === 'mobile').length,
        tablet: responses.filter(r => r.device?.toLowerCase() === 'tablet').length,
      };
      
      const stageInfo = getInsightStage(responseCount, lastInsightResponseCount);
      const fallbackInsight = generateFallbackInsightByStage(stageInfo.stage, {
        totalResponses: responseCount,
        completionRate: Math.round(completionRate * 100),
      deviceBreakdown,
      });
      
      setCurrentInsight({
        text: fallbackInsight,
        createdAt: new Date(),
        responseCount,
      });
    } finally {
      setGeneratingInsight(false);
    }
  };

  // Generate fallback insight by stage (with improved messaging for < 5 responses)
  const generateFallbackInsightByStage = (stage: number, data: any): string => {
    const { totalResponses, completionRate, deviceBreakdown } = data;
    const topDevice = deviceBreakdown?.mobile > deviceBreakdown?.desktop ? 'mobile' : 'desktop';
    const deviceCount = deviceBreakdown?.[topDevice] || 0;
    
    // Special handling for low response counts (< 5)
    if (totalResponses < 5) {
      return `You're off to a great start with ${totalResponses} ${totalResponses === 1 ? 'response' : 'responses'}! While we need more data for meaningful analysis, every response brings valuable insights. Share your survey link across your networks to gather more responses and unlock deeper insights about your audience.`;
    }
    
    switch (stage) {
      case 1:
        return `Congratulations! You've received your first response to your survey. This is an exciting milestone! Share your survey link across your networks to gather more responses and unlock deeper insights.`;
      case 2:
        return `Great progress! You've collected 10 responses. Early data shows a ${completionRate}% completion rate, with most responses coming from ${topDevice} devices. Keep sharing your survey to reach meaningful sample sizes.`;
      case 3:
        return `Excellent! You've reached 20 responses—a solid foundation for analysis. Your completion rate is ${completionRate}%, and ${topDevice} devices dominate with ${deviceCount} responses. Consider analyzing partial responses to identify potential improvements.`;
      case 4:
        return `You've collected ${totalResponses} responses! Your survey shows a ${completionRate}% completion rate, with strong engagement from ${topDevice} users. Analyze trends over time and consider A/B testing different questions to optimize results.`;
      case 5:
        return `Impressive! With ${totalResponses} responses, you have rich data for deep analysis. Your ${completionRate}% completion rate indicates good engagement. ${topDevice} devices lead with ${deviceCount} responses. Use statistical analysis to identify correlations and actionable insights.`;
      default:
        return `You've collected ${totalResponses} responses with a ${completionRate}% completion rate. Most responses are from ${topDevice} devices. Continue monitoring trends to identify patterns and opportunities for improvement.`;
    }
  };

  // Load more responses function for pagination
  const loadMoreResponses = async () => {
    if (!selectedForm || !hasMoreResponses || !lastResponseDoc) return;
    
    try {
      const db = getFirestore();
      let responsesQuery = query(
        collection(db, 'survey_responses'),
        where('formId', '==', selectedForm),
        orderBy('createdAt', 'desc'),
        startAfter(lastResponseDoc),
        limit(RESPONSES_PER_PAGE)
      );
      
      let responsesSnap;
      try {
        responsesSnap = await getDocs(responsesQuery);
      } catch (error: any) {
        // Fallback if createdAt index doesn't exist
        responsesQuery = query(
          collection(db, 'survey_responses'),
          where('formId', '==', selectedForm),
          limit(RESPONSES_PER_PAGE)
        );
        responsesSnap = await getDocs(responsesQuery);
      }
      
      const newResponses = responsesSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        formTitle: forms.find(f => f.id === selectedForm)?.title 
      } as SurveyResponse));
      
      if (newResponses.length > 0) {
        setResponses(prev => [...prev, ...newResponses]);
        setLastResponseDoc(responsesSnap.docs[responsesSnap.docs.length - 1]);
        setHasMoreResponses(responsesSnap.docs.length === RESPONSES_PER_PAGE);
        setResponsePage(prev => prev + 1);
      } else {
        setHasMoreResponses(false);
      }
    } catch (error) {
      console.error('Error loading more responses:', error);
      setHasMoreResponses(false);
    }
  };

  // Memoize filtered responses for performance - limit to 1000 responses max
  const filteredResponses = useMemo(() => {
    // Limit to first 1000 responses for performance
    const maxResponses = 1000;
    let filtered = responses.slice(0, maxResponses);
    
    if (deviceFilter !== 'all') {
      filtered = filtered.filter(r => r.device?.toLowerCase() === deviceFilter.toLowerCase());
    }
    if (referralFilter !== 'all') {
      filtered = filtered.filter(r => {
        const ref = r.referral?.toLowerCase() || '';
        return ref.includes(referralFilter.toLowerCase());
      });
    }
    return filtered;
  }, [responses.length, deviceFilter, referralFilter]); // Only depend on length, not full array

  // Memoize device breakdown - optimized counting
  const deviceBreakdown = useMemo(() => {
    let desktop = 0, mobile = 0, tablet = 0;
    const limit = Math.min(filteredResponses.length, 1000);
    for (let i = 0; i < limit; i++) {
      const device = filteredResponses[i]?.device?.toLowerCase();
      if (device === 'desktop') desktop++;
      else if (device === 'mobile') mobile++;
      else if (device === 'tablet') tablet++;
    }
    return { desktop, mobile, tablet };
  }, [filteredResponses, deviceFilter]); // Need full array for counting

  // Generate AI insights using metric engine - Optimized with debouncing
  useEffect(() => {
    if (!selectedForm || responses.length === 0 || viewMode !== 'insights') {
      setMetricInsights(null);
      return;
    }

    // Debounce to prevent excessive recalculations
    const timeoutId = setTimeout(() => {
      const generateInsights = async () => {
        try {
          // Limit processing to first 1000 responses for performance
          const sampleSize = Math.min(responses.length, 1000);
          const sampleResponses = responses.slice(0, sampleSize);
          
          const completed = sampleResponses.filter(r => r.completionStatus === 'complete').length;
          const partial = sampleResponses.filter(r => r.completionStatus === 'partial').length;
          const abandoned = sampleResponses.filter(r => r.completionStatus === 'abandoned').length;
          const total = sampleResponses.length;

          // Calculate average completion time
          const avgTime = sampleResponses.reduce((sum, r) => sum + (r.totalTime || 0), 0) / sampleResponses.length || 0;

          // Device breakdown with time - simplified
          const deviceTimes: Record<string, number[]> = { desktop: [], mobile: [], tablet: [] };
          sampleResponses.forEach(r => {
            const device = r.device?.toLowerCase() || 'desktop';
            if (r.totalTime && (device === 'desktop' || device === 'mobile' || device === 'tablet')) {
              deviceTimes[device].push(r.totalTime);
            }
          });
          const avgTimeByDevice: Partial<Record<'desktop' | 'mobile' | 'tablet', number>> = {};
          Object.entries(deviceTimes).forEach(([device, times]) => {
            if (times.length > 0) {
              avgTimeByDevice[device as 'desktop' | 'mobile' | 'tablet'] = 
                times.reduce((a, b) => a + b, 0) / times.length;
            }
          });

          // Traffic sources - limit to top 10
          const bySource: Record<string, number> = {};
          sampleResponses.forEach(r => {
            const source = r.referral ? formatReferralSource(r.referral) : 'Direct';
            bySource[source] = (bySource[source] || 0) + 1;
          });

          // Geography - limit processing
          const byCountry: Record<string, number> = {};
          let geoCount = 0;
          for (const r of sampleResponses) {
            if (geoCount >= 500) break; // Limit geography processing
            if (r.location?.lat && r.location?.lng) {
              const country = getCountryFromCoordinates(r.location.lat, r.location.lng);
              byCountry[country] = (byCountry[country] || 0) + 1;
              geoCount++;
            }
          }

          // Question performance - limit to first 20 questions
          const questionDataLocal: Record<string, { question: string; answers: any[]; type: 'text' | 'numeric' }> = {};
          let questionCount = 0;
          for (const response of sampleResponses) {
            if (questionCount >= 20) break;
            if (response.answers) {
              Object.entries(response.answers).forEach(([qId, answerData]) => {
                if (questionCount >= 20) return;
                if (!questionDataLocal[qId]) {
                  questionDataLocal[qId] = {
                    question: answerData.question,
                    answers: [],
                    type: typeof answerData.answer === 'number' ? 'numeric' : 'text',
                  };
                  questionCount++;
                }
                questionDataLocal[qId].answers.push(answerData.answer);
              });
            }
          }
          
          const questionItems = Object.entries(questionDataLocal).slice(0, 20).map(([id, data]) => ({
            id,
            label: data.question,
            completionRate: data.answers.length / total,
            skipRate: 1 - (data.answers.length / total),
          }));

          // Time activity
          const byHour = Array(24).fill(0);
          sampleResponses.forEach(r => {
            if (r.timeOfDay) {
              const hour = parseInt(r.timeOfDay.split(':')[0]);
              if (hour >= 0 && hour < 24) byHour[hour]++;
            }
          });

          const inputs: ModularInputs = {
            completion: {
              totalResponses: total,
              complete: completed,
              partial: partial,
              abandoned: abandoned,
            },
            time: {
              avgMs: avgTime,
            },
            devices: {
              desktop: deviceBreakdown.desktop,
              mobile: deviceBreakdown.mobile,
              tablet: deviceBreakdown.tablet,
              avgTimeByDeviceMs: avgTimeByDevice,
            },
            traffic: {
              bySource,
            },
            geography: {
              byCountry,
            },
            questions: {
              items: questionItems,
            },
            activity: {
              byHour,
            },
          };

          analyzeAllMetrics(inputs, { formId: selectedForm }).then(async (result) => {
            setMetricInsights(result);

            // Calculate completion rate for alerts
            const completionRateLocal = total > 0 ? completed / total : 0;

            // Generate global summary with improved accuracy
            const summaryData = generateGlobalSummary(result, total, previousMetrics);
            setGlobalSummary(summaryData);

            // Generate metric-specific insights
            const insights = generateMetricInsights(result);
            setMetricInsightData(insights);

            // Save to database (cost-optimized: only if significant change)
            if (selectedForm) {
              const savedId = await saveInsightToDB(
                {
                  formId: selectedForm,
                  summary: summaryData.summary,
                  keyInsights: summaryData.keyInsights,
                  responseCount: total,
                  metrics: {
                    completionRate: completionRateLocal,
                    avgCompletionTime: avgTime,
                    totalResponses: total,
                  },
                },
                lastSavedResponseCount
              );
              if (savedId) {
                setLastSavedResponseCount(total);
              }
            }

            // Generate alerts
            const currentMetrics = {
              completionRate: completionRateLocal,
              avgCompletionTime: avgTime,
              totalResponses: total,
            };
            const newAlerts = generateAlerts(currentMetrics, previousMetrics, DEFAULT_ALERT_THRESHOLDS);
            setAlerts(newAlerts);

            // Store current metrics for next comparison
            setPreviousMetrics(currentMetrics);
          });
        } catch (error) {
          console.error('Error generating insights:', error);
        }
      };

      generateInsights();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [selectedForm, responses.length, viewMode, deviceBreakdown.desktop, deviceBreakdown.mobile, deviceBreakdown.tablet]);

  // Memoize location data for map (aggregate nearby locations for performance) - limit to 200 locations
  const locationData = useMemo(() => {
    // Limit to first 500 responses with location data
    const sampleSize = Math.min(filteredResponses.length, 500);
    const sample = filteredResponses.slice(0, sampleSize);
    
    const locations = sample
      .filter(r => r.location?.lat && r.location?.lng)
      .slice(0, 200) // Max 200 locations
      .map(r => ({
        lat: r.location!.lat,
        lng: r.location!.lng,
        count: 1,
        responseId: r.id,
        completedAt: r.completedAt,
      }));
    
    // Aggregate locations by proximity (within 0.1 degrees) for performance with large datasets
    const aggregated: Record<string, { lat: number; lng: number; count: number; ids: string[] }> = {};
    locations.forEach(loc => {
      const key = `${Math.round(loc.lat * 10) / 10},${Math.round(loc.lng * 10) / 10}`;
      if (!aggregated[key]) {
        aggregated[key] = { lat: loc.lat, lng: loc.lng, count: 0, ids: [] };
      }
      aggregated[key].count += loc.count;
      aggregated[key].ids.push(loc.responseId);
    });
    
    return Object.values(aggregated);
  }, [filteredResponses.length]); // Only depend on length

  // Optimize metrics calculation with useMemo for large datasets - limit processing
  const metrics = useMemo(() => {
    const total = totalResponseCount > 0 ? totalResponseCount : responses.length;
    
    // For large datasets, use sample-based calculation - limit to 500 responses
    const sampleSize = Math.min(responses.length, 500);
    const sample = responses.slice(0, sampleSize);
    
    const completed = sample.filter(r => r.completionStatus === 'complete').length;
    const partial = sample.filter(r => r.completionStatus === 'partial').length;
    const valid = sample.filter(r => r.completionStatus === 'complete' || r.completionStatus === 'partial').length;
    
    // Scale up to total for display (if we sampled)
    const scaleFactor = total > 0 && sampleSize > 0 ? total / sampleSize : 1;
    const scaledCompleted = Math.round(completed * scaleFactor);
    const scaledPartial = Math.round(partial * scaleFactor);
    const scaledValid = Math.round(valid * scaleFactor);
    
    const completionRate = sampleSize > 0 ? completed / sampleSize : 0;
    const avgCompletionTime = sample.reduce((acc, r) => acc + (r.totalTime || 0), 0) / sampleSize || 0;
    
    // Calculate user engagement metrics
    const avgSessionDuration = avgCompletionTime;
    const bounceRate = sampleSize > 0 ? sample.filter(r => (r.totalTime || 0) < 5000).length / sampleSize : 0;
    
    // Calculate total views (estimate as 30-100% more than completions)
    const totalViews = Math.round(total * 1.5);
    
    return {
      totalResponses: total,
      completedResponses: scaledCompleted,
      completionRate,
      avgCompletionTime,
      responseQuality: {
        validResponses: scaledValid,
        partialResponses: scaledPartial,
        invalidResponses: total - scaledValid,
      },
      totalViews,
      userEngagement: {
        avgSessionDuration,
        bounceRate,
      },
      deviceBreakdown,
      locations: locationData,
    };
  }, [responses.length, totalResponseCount, deviceBreakdown.desktop, deviceBreakdown.mobile, deviceBreakdown.tablet, locationData.length]); // Only depend on lengths and counts

  // Calculate metrics (use memoized version)
  const totalResponses = totalResponseCount > 0 ? totalResponseCount : responses.length;
  const completedResponses = responses.filter(r => r.completionStatus === 'complete').length;
  const completionRate = metrics.completionRate;
  const avgCompletionTime = metrics.avgCompletionTime;

  const formatTime = (ms: number) => {
    if (!ms) return '0s';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Constants - SmartFormAI Official Palette
  const COLORS = {
    primary: '#8F00FF', // Electric Purple
    chart: ['#8F00FF', '#A020FF', '#B040FF', '#C060FF', '#FF6B6B'],
  };

  const TOOLTIPS = {
    totalViews: 'Total number of times your form has been viewed',
    dailyActivity: 'Distribution of responses throughout the day',
    deviceDistribution: 'Breakdown of responses by device type',
    referralSources: 'Where your form responses are coming from',
    responseAnalytics: 'Detailed analytics for each question in your form',
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: { size: 11 },
          color: '#000',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
          color: '#000',
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: { size: 12 },
          color: '#000',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: { size: 11 },
          color: '#000',
          stepSize: 1,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
          color: '#000',
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: { size: 12 },
          color: '#000',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
      },
    },
  };

  // Helper functions
  const getCompletionTimeData = (responses: SurveyResponse[], date?: Date) => {
    if (!date) return [];
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const dayResponses = responses.filter(r => {
      const responseDate = safeDate(r.completedAt);
      if (!responseDate) return false;
      return responseDate >= startOfDay && responseDate <= endOfDay;
    });
    
    // Group by hour
    const hourlyData: Record<number, { count: number; totalTime: number }> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { count: 0, totalTime: 0 };
    }
    
    dayResponses.forEach(r => {
      const responseDate = safeDate(r.completedAt);
      if (!responseDate) return;
      const hour = responseDate.getHours();
      hourlyData[hour].count++;
      hourlyData[hour].totalTime += r.totalTime || 0;
    });
    
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourlyData[i].count,
      avgTime: hourlyData[i].count > 0 ? hourlyData[i].totalTime / hourlyData[i].count : 0,
    }));
  };

  const getHourlyDistribution = (responses: SurveyResponse[], date?: Date) => {
    if (!date) return Array(24).fill(0);
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const dayResponses = responses.filter(r => {
      const responseDate = new Date(r.completedAt);
      return responseDate >= startOfDay && responseDate <= endOfDay;
    });
    
    const hourlyCounts = Array(24).fill(0);
    dayResponses.forEach(r => {
      const responseDate = safeDate(r.completedAt);
      const hour = responseDate ? responseDate.getHours() : -1;
      if (hour === -1) return null;
      hourlyCounts[hour]++;
    });
    
    return hourlyCounts;
  };

  // Recent responses
  const recentResponses = useMemo(() => {
    return filteredResponses
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 10);
  }, [filteredResponses]);

  const formatReferralSource = (referral: string) => {
    if (!referral || referral === 'Direct') return 'Direct';
    try {
      const url = new URL(referral);
      return url.hostname.replace('www.', '');
    } catch {
      return referral.substring(0, 30);
    }
  };

  // Chart data
  const deviceChartData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [deviceBreakdown.desktop, deviceBreakdown.mobile, deviceBreakdown.tablet],
      backgroundColor: ['#8F00FF', '#A020FF', '#B040FF'],
      borderWidth: 0,
    }],
  };

  const deviceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: { size: 12 },
          color: '#000',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
      },
    },
  };

  // Response timeline (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return format(date, 'MMM dd');
  });

  const responsesByDay = last7Days.map(dayLabel => {
    const date = new Date();
    const dayIndex = last7Days.indexOf(dayLabel);
    date.setDate(date.getDate() - 6 + dayIndex);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    return filteredResponses.filter(r => {
      const responseDate = safeDate(r.completedAt);
      if (!responseDate) return false;
      return responseDate >= date && responseDate < nextDate;
    }).length;
  });

  const timelineChartData = {
    labels: last7Days,
    datasets: [{
      label: 'Responses',
      data: responsesByDay,
      borderColor: '#8F00FF',
      backgroundColor: 'rgba(143, 0, 255, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#8F00FF',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }],
  };

  const timelineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: { size: 11 },
          color: '#000',
          stepSize: 1,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
          color: '#000',
        },
      },
    },
  };

  // Hourly activity
    const hourlyActivity = filteredResponses.reduce((acc: Record<string, number>, r) => {
      if (r.timeOfDay) {
        const hour = r.timeOfDay.split(':')[0];
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {});

  const hourlyChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
    datasets: [{
      label: 'Responses',
      data: Array.from({ length: 24 }, (_, i) => hourlyActivity[i.toString().padStart(2, '0')] || 0),
      backgroundColor: '#8F00FF',
      borderRadius: 4,
    }],
  };

  const hourlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: { size: 11 },
          color: '#000',
          stepSize: 1,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
          color: '#000',
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  // Memoize question data processing for performance - limit to 50 questions max
  const questionData = useMemo(() => {
    const data: Record<string, { question: string; answers: any[]; type: 'text' | 'numeric' }> = {};
    
    // Process only loaded responses (pagination handles this) - limit to first 500 responses
    const sampleSize = Math.min(filteredResponses.length, 500);
    const sample = filteredResponses.slice(0, sampleSize);
    
    let questionCount = 0;
    for (const response of sample) {
      if (questionCount >= 50) break;
      if (response.answers) {
        Object.entries(response.answers).forEach(([qId, answerData]) => {
          if (questionCount >= 50) return;
          if (!data[qId]) {
            data[qId] = {
              question: answerData.question,
              answers: [],
              type: typeof answerData.answer === 'number' ? 'numeric' : 'text',
            };
            questionCount++;
          }
          data[qId].answers.push(answerData.answer);
        });
      }
    }
    
    return data;
  }, [filteredResponses.length]); // Only depend on length, not full array

  // Question analytics
  const questionAnalytics = useMemo(() => {
    return questionData;
  }, [questionData]);

  // Get country from coordinates (simple approximation)
  const getCountryFromCoordinates = (lat: number, lng: number): string => {
    // This is a simplified mapping - for production, use a proper geocoding service
    // Major country coordinate ranges
    if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) return 'United States';
    if (lat >= 41 && lat <= 84 && lng >= -141 && lng <= -52) return 'Canada';
    if (lat >= 35 && lat <= 72 && lng >= -10 && lng <= 40) return 'Europe';
    if (lat >= 50 && lat <= 61 && lng >= -9 && lng <= 2) return 'United Kingdom';
    if (lat >= 35 && lat <= 54 && lng >= 103 && lng <= 135) return 'China';
    if (lat >= 6 && lat <= 36 && lng >= 68 && lng <= 97) return 'India';
    if (lat >= -45 && lat <= -10 && lng >= 112 && lng <= 154) return 'Australia';
    if (lat >= -50 && lat <= -34 && lng >= 165 && lng <= 179) return 'New Zealand';
    if (lat >= -35 && lat <= -10 && lng >= 113 && lng <= 154) return 'Australia';
    if (lat >= 35 && lat <= 46 && lng >= 125 && lng <= 146) return 'Japan';
    if (lat >= 55 && lat <= 70 && lng >= 18 && lng <= 31) return 'Finland';
    if (lat >= 57 && lat <= 69 && lng >= 4 && lng <= 31) return 'Sweden';
    if (lat >= 58 && lat <= 71 && lng >= 4 && lng <= 31) return 'Norway';
    if (lat >= 47 && lat <= 55 && lng >= 5 && lng <= 16) return 'Germany';
    if (lat >= 42 && lat <= 51 && lng >= -5 && lng <= 10) return 'France';
    if (lat >= 36 && lat <= 44 && lng >= 6 && lng <= 19) return 'Italy';
    if (lat >= 35 && lat <= 44 && lng >= -10 && lng <= 4) return 'Spain';
    if (lat >= 51 && lat <= 54 && lng >= 14 && lng <= 25) return 'Poland';
    if (lat >= 49 && lat <= 55 && lng >= 12 && lng <= 19) return 'Czech Republic';
    if (lat >= 48 && lat <= 51 && lng >= 15 && lng <= 23) return 'Slovakia';
    if (lat >= 46 && lat <= 49 && lng >= 16 && lng <= 23) return 'Hungary';
    if (lat >= 45 && lat <= 48 && lng >= 13 && lng <= 17) return 'Austria';
    if (lat >= 54 && lat <= 56 && lng >= 8 && lng <= 13) return 'Denmark';
    if (lat >= 60 && lat <= 70 && lng >= 20 && lng <= 32) return 'Finland';
    if (lat >= 53 && lat <= 56 && lng >= 23 && lng <= 28) return 'Lithuania';
    if (lat >= 56 && lat <= 58 && lng >= 20 && lng <= 28) return 'Latvia';
    if (lat >= 57 && lat <= 60 && lng >= 23 && lng <= 28) return 'Estonia';
    if (lat >= 4 && lat <= 14 && lng >= -79 && lng <= -66) return 'Colombia';
    if (lat >= -56 && lat <= -17 && lng >= -74 && lng <= -53) return 'Argentina';
    if (lat >= -34 && lat <= -15 && lng >= -74 && lng <= -32) return 'Brazil';
    if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) return 'Mexico';
    if (lat >= -35 && lat <= -10 && lng >= 113 && lng <= 154) return 'Australia';
    if (lat >= -38 && lat <= -10 && lng >= 140 && lng <= 154) return 'Australia';
    if (lat >= 25 && lat <= 35 && lng >= 120 && lng <= 122) return 'Taiwan';
    if (lat >= 33 && lat <= 43 && lng >= 124 && lng <= 132) return 'South Korea';
    if (lat >= 22 && lat <= 30 && lng >= 114 && lng <= 114) return 'Hong Kong';
    if (lat >= 1 && lat <= 7 && lng >= 103 && lng <= 104) return 'Singapore';
    if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) return 'Indonesia';
    if (lat >= 1 && lat <= 7 && lng >= 100 && lng <= 119) return 'Malaysia';
    if (lat >= 5 && lat <= 21 && lng >= 92 && lng <= 110) return 'Thailand';
    if (lat >= 8 && lat <= 24 && lng >= 102 && lng <= 110) return 'Vietnam';
    if (lat >= 9 && lat <= 24 && lng >= 100 && lng <= 108) return 'Thailand';
    if (lat >= -35 && lat <= -10 && lng >= 113 && lng <= 154) return 'Australia';
    if (lat >= 51 && lat <= 55 && lng >= 3 && lng <= 8) return 'Belgium';
    if (lat >= 47 && lat <= 49 && lng >= 5 && lng <= 11) return 'Switzerland';
    if (lat >= 47 && lat <= 53 && lng >= 5 && lng <= 16) return 'Netherlands';
    if (lat >= 40 && lat <= 44 && lng >= 2 && lng <= 10) return 'Portugal';
    if (lat >= 60 && lat <= 70 && lng >= 5 && lng <= 31) return 'Norway';
    if (lat >= 64 && lat <= 67 && lng >= -25 && lng <= -13) return 'Iceland';
    if (lat >= 62 && lat <= 67 && lng >= 24 && lng <= 32) return 'Finland';
    if (lat >= 25 && lat <= 36 && lng >= 32 && lng <= 37) return 'Israel';
    if (lat >= 29 && lat <= 37 && lng >= 35 && lng <= 42) return 'Jordan';
    if (lat >= 24 && lat <= 32 && lng >= 26 && lng <= 37) return 'Egypt';
    if (lat >= 22 && lat <= 32 && lng >= 8 && lng <= 18) return 'Libya';
    if (lat >= 19 && lat <= 32 && lng >= 25 && lng <= 37) return 'Sudan';
    if (lat >= 8 && lat <= 12 && lng >= -13 && lng <= -8) return 'Senegal';
    if (lat >= 6 && lat <= 14 && lng >= -3 && lng <= 2) return 'Ghana';
    if (lat >= -35 && lat <= -10 && lng >= 113 && lng <= 154) return 'Australia';
    if (lat >= 0 && lat <= 12 && lng >= -18 && lng <= -10) return 'Guinea';
    if (lat >= -5 && lat <= 8 && lng >= 29 && lng <= 35) return 'Rwanda';
    if (lat >= -1 && lat <= 4 && lng >= 33 && lng <= 35) return 'Uganda';
    if (lat >= -5 && lat <= 5 && lng >= 34 && lng <= 42) return 'Kenya';
    if (lat >= -35 && lat <= -10 && lng >= 113 && lng <= 154) return 'Australia';
    if (lat >= -27 && lat <= -10 && lng >= 113 && lng <= 154) return 'Australia';
    
    return 'Unknown';
  };

  // Country flag emoji mapping
  const getCountryFlag = (country: string): string => {
    const flagMap: Record<string, string> = {
      'United States': '🇺🇸',
      'Canada': '🇨🇦',
      'United Kingdom': '🇬🇧',
      'China': '🇨🇳',
      'India': '🇮🇳',
      'Australia': '🇦🇺',
      'New Zealand': '🇳🇿',
      'Japan': '🇯🇵',
      'Finland': '🇫🇮',
      'Sweden': '🇸🇪',
      'Norway': '🇳🇴',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Poland': '🇵🇱',
      'Czech Republic': '🇨🇿',
      'Slovakia': '🇸🇰',
      'Hungary': '🇭🇺',
      'Austria': '🇦🇹',
      'Denmark': '🇩🇰',
      'Lithuania': '🇱🇹',
      'Latvia': '🇱🇻',
      'Estonia': '🇪🇪',
      'Colombia': '🇨🇴',
      'Argentina': '🇦🇷',
      'Brazil': '🇧🇷',
      'Mexico': '🇲🇽',
      'Taiwan': '🇹🇼',
      'South Korea': '🇰🇷',
      'Hong Kong': '🇭🇰',
      'Singapore': '🇸🇬',
      'Indonesia': '🇮🇩',
      'Malaysia': '🇲🇾',
      'Thailand': '🇹🇭',
      'Vietnam': '🇻🇳',
      'Belgium': '🇧🇪',
      'Switzerland': '🇨🇭',
      'Netherlands': '🇳🇱',
      'Portugal': '🇵🇹',
      'Iceland': '🇮🇸',
      'Israel': '🇮🇱',
      'Jordan': '🇯🇴',
      'Egypt': '🇪🇬',
      'Libya': '🇱🇾',
      'Sudan': '🇸🇩',
      'Senegal': '🇸🇳',
      'Ghana': '🇬🇭',
      'Guinea': '🇬🇳',
      'Rwanda': '🇷🇼',
      'Uganda': '🇺🇬',
      'Kenya': '🇰🇪',
      'Europe': '🇪🇺',
      'Unknown': '🌍',
    };
    return flagMap[country] || '🌍';
  };

  // Count responses by country
  const countryStats = useMemo(() => {
    const countryCounts: Record<string, number> = {};
    
    filteredResponses
      .filter(r => r.location?.lat && r.location?.lng)
      .forEach(r => {
        const country = getCountryFromCoordinates(r.location!.lat, r.location!.lng);
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
    
    return Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredResponses]);

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (locationData.length === 0) return [20, 0] as [number, number]; // Default to world view
    const avgLat = locationData.reduce((sum, loc) => sum + loc.lat, 0) / locationData.length;
    const avgLng = locationData.reduce((sum, loc) => sum + loc.lng, 0) / locationData.length;
    return [avgLat, avgLng] as [number, number];
  }, [locationData]);

  // Sort question IDs
  const sortQuestionIds = (ids: string[]) => {
    return ids.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      return numA - numB;
    });
  };

  // Get numeric stats helper
  const getNumericStats = (values: number[]) => {
    if (values.length === 0) return { avg: 0, min: 0, max: 0, median: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    return { avg, min, max, median };
  };

  // Get text frequency helper
  const getTextFrequency = (values: string[]) => {
    const freq: Record<string, number> = {};
    values.forEach(v => {
      const key = String(v).trim();
      freq[key] = (freq[key] || 0) + 1;
    });
    const total = values.length;
    return Object.entries(freq)
      .map(([value, count]) => ({
        value,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const exportData = () => {
    const analyticsData = {
      form: forms.find(f => f.id === selectedForm),
      metrics: {
        totalResponses,
        completionRate,
        avgCompletionTime,
        deviceBreakdown,
      },
      responses: responses.map(r => ({
        id: r.id,
        completedAt: r.completedAt,
        device: r.device,
        completionStatus: r.completionStatus,
        answers: r.answers,
      })),
    };

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedForm}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  if (loading) {
  return (
    <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#8F00FF]" />
      </div>
      </DashboardLayout>
    );
  }

  // Prepare export data
  const exportDataForAI = () => {
    if (!metricInsights || !selectedForm) return null;
    
    const formTitle = forms.find(f => f.id === selectedForm)?.title || 'Survey';
    const keyInsights: string[] = [];
    const recommendations: string[] = [];

    if (metricInsights.completionRate) {
      keyInsights.push(metricInsights.completionRate.insight);
      recommendations.push(metricInsights.completionRate.suggestion);
    }
    if (metricInsights.devices) {
      keyInsights.push(metricInsights.devices.insight);
      recommendations.push(metricInsights.devices.suggestion);
    }
    if (metricInsights.questions) {
      keyInsights.push(metricInsights.questions.insight);
      recommendations.push(metricInsights.questions.suggestion);
    }

    return {
      summary: metricInsights.overallSummary || 'No summary available',
      keyInsights,
      recommendations,
      metrics: {
        completionRate: completionRate,
        avgCompletionTime: avgCompletionTime,
        totalResponses: totalResponses,
        deviceBreakdown,
      },
      timestamp: new Date(),
      responseCount: totalResponses,
      formTitle,
    };
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-4 sm:p-6">
        {/* Auto-Rebuild teaser */}
        <Card className="mb-6 border border-[#8F00FF]/20 bg-gradient-to-r from-[#8F00FF]/10 via-white to-white shadow-sm">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5">
            <div className="space-y-2 text-sm sm:text-base text-[#2E2E2E]">
              <h2 className="text-lg font-semibold text-[#2E2E2E] sm:text-xl">Auto-Rebuild is warming up</h2>
              <p className="text-[#2E2E2E]/70">
                This feature is still in testing and will be released publicly once it performs flawlessly for every dataset we run through it.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Badge className="w-fit bg-[#8F00FF]/10 text-[#8F00FF]" variant="outline">
                Private Preview
              </Badge>
              <Button
                className="w-full sm:w-auto"
                onClick={() =>
                  showAlert(
                    'Feature Updates',
                    'We’ll email you as soon as Auto-Rebuild is fully verified and ready for production surveys.',
                    'success'
                  )
                }
              >
                Notify me when it’s ready
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documentation teaser */}
        <Card className="mb-6 border border-black/10 bg-white shadow-sm">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[#2E2E2E] sm:text-lg">Documentation Hub</h2>
              <p className="text-sm text-[#2E2E2E]/70">
                Deep-dive guides and API docs are under review. We’ll reveal everything once every example is production-ready.
              </p>
            </div>
            <Button disabled variant="outline" className="w-full cursor-not-allowed opacity-70 sm:w-auto">
              Docs (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        {/* Header with SmartFormAI theme */}
        <div className="mb-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Top section with title and survey selector */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 sm:p-6 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2E2E2E] mb-1 truncate">Analytics Dashboard</h1>
              <p className="text-gray-600 truncate">
                {forms.find(f => f.id === selectedForm)?.title || 'Loading survey...'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full lg:w-auto">
              <UserStatusBadge 
                onUpgrade={handleUpgrade}
                onBuyCredits={handleBuyCredits}
                showCredits={true}
                showSummaryUsage={true}
              />
              <Select value={selectedForm} onValueChange={setSelectedForm}>
                <SelectTrigger className="w-full sm:w-[200px] bg-white border border-gray-300 text-[#2E2E2E]">
                  <SelectValue placeholder="Select survey" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  {forms.map(form => (
                    <SelectItem key={form.id} value={form.id} className="text-[#2E2E2E]">
                      {form.title || form.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Navigation tabs section */}
          <div className="px-4 sm:px-6 py-3 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Main navigation tabs */}
              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                <Button
                  variant={viewMode === 'raw' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('raw')}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-all',
                    viewMode === 'raw' 
                      ? 'bg-[#8F00FF] text-white hover:bg-[#7A00E6] shadow-sm' 
                      : 'text-[#2E2E2E] hover:bg-gray-100'
                  )}
                >
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Raw Metrics
                </Button>
                <div className="relative group">
                  <Button
                    variant={viewMode === 'insights' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      if (userType === 'subscribed') {
                        setViewMode('insights');
                      } else {
                        handleUpgrade('AI Insight Engine', 'Upgrade to Pro to unlock AI-powered insights and advanced analytics. Only $14.99/month — 70% cheaper than Typeform.');
                      }
                    }}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-all',
                      viewMode === 'insights' 
                        ? 'bg-[#8F00FF] text-white hover:bg-[#7A00E6] shadow-sm' 
                        : 'text-[#2E2E2E] hover:bg-gray-100',
                      userType === 'credit' && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <BrainCircuit className="h-4 w-4 mr-2" />
                    AI Insights
                    {userType === 'credit' && <Lock className="h-3 w-3 ml-2" />}
                  </Button>
                  
                  {userType === 'credit' && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      🔒 Upgrade to Pro to access AI Insights
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompareMode(!compareMode)}
                  className={cn(
                    'gap-2 border-gray-300 bg-white text-sm font-medium transition-all',
                    compareMode 
                      ? 'bg-[#8F00FF] text-white border-[#8F00FF] shadow-sm' 
                      : 'text-[#2E2E2E] hover:bg-gray-50'
                  )}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Compare</span>
                </Button>

                {/* Export */}
                {exportDataForAI() && (
                  <ExportModal data={exportDataForAI()!} />
                )}

                {/* Insight History */}
                {selectedForm && (
                  <InsightHistory
                    formId={selectedForm}
                    onSelectVersion={(item) => {
                      setGlobalSummary({
                        summary: item.summary,
                        keyInsights: item.keyInsights,
                        timestamp: item.timestamp,
                      });
                      setLastSavedResponseCount(item.responseCount);
                    }}
                    onUpgrade={handleUpgrade}
                    onBuyCredits={handleBuyCredits}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Alerts */}
        {alerts.length > 0 && <SmartAlerts alerts={alerts} />}

        {/* Premium AI Total Summary - Available to all users with gating */}
        {selectedForm && responses.length > 0 && (
          <div className="mb-8">
            <PremiumAISummary
              formId={selectedForm}
              responseCount={totalResponseCount}
              onGenerate={(summary) => {
                // Handle generated summary
                setGlobalSummary({
                  summary,
                  keyInsights: [],
                  timestamp: new Date(),
                });
              }}
              onUpgrade={handleUpgrade}
              onBuyCredits={handleBuyCredits}
            />
          </div>
        )}

        {/* Global AI Summary Box - Prominent at top when in insights mode */}
        {viewMode === 'insights' && globalSummary && selectedForm && responses.length > 0 && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <GlobalAISummaryBox
            summary={globalSummary.summary}
            keyInsights={globalSummary.keyInsights}
            timestamp={globalSummary.timestamp}
            responseCount={totalResponses}
            onRefresh={async () => {
              setGeneratingGlobalSummary(true);
              // Force refresh by clearing cache
              if (metricInsights) {
                const refreshed = await analyzeAllMetrics(
                  {
                    completion: {
                      totalResponses: responses.length,
                      complete: responses.filter(r => r.completionStatus === 'complete').length,
                      partial: responses.filter(r => r.completionStatus === 'partial').length,
                      abandoned: responses.filter(r => r.completionStatus === 'abandoned').length,
                    },
                    time: {
                      avgMs: responses.reduce((sum, r) => sum + (r.totalTime || 0), 0) / responses.length || 0,
                    },
                    devices: {
                      desktop: deviceBreakdown.desktop,
                      mobile: deviceBreakdown.mobile,
                      tablet: deviceBreakdown.tablet,
                    },
                  },
                  { formId: selectedForm, forceRefresh: true }
                );
                const summaryData = generateGlobalSummary(refreshed, totalResponses, previousMetrics);
                setGlobalSummary(summaryData);
                setMetricInsights(refreshed);
              }
              setGeneratingGlobalSummary(false);
            }}
            isGenerating={generatingGlobalSummary}
          />
          </div>
        )}

          {/* Upgrade Banner for Free/Credit Users */}

          {/* Agent Info */}
          {currentAgent && (
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-[#8F00FF]/10 p-3 rounded-lg">
                    <BrainCircuit className="h-6 w-6 text-[#8F00FF]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2E2E2E]">{currentAgent.name}</h3>
                    <p className="text-sm text-gray-600">{currentAgent.personality}</p>
                    <p className="text-sm text-gray-500 mt-1">{currentAgent.goal}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* KPI Cards - Each metric with its own AI insight card below */}
          <div className="space-y-6 mb-6">
            {/* Completion Rate Metric */}
            <div className="space-y-3">
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#2E2E2E] mt-1">
                        {`${(metrics.completionRate * 100).toFixed(1)}%`}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {metrics.responseQuality.partialResponses} partial
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-[#8F00FF]" />
                  </div>
                  <Progress 
                    value={metrics.completionRate * 100} 
                    className="mt-4"
                  />
                </CardContent>
              </Card>
              {/* AI Insight for Completion Rate */}
              {viewMode === 'insights' && metricInsightData.completionRate && (
                <MetricInsightCard
                  metricName="Completion Rate"
                  insight={metricInsightData.completionRate.insight}
                  recommendation={metricInsightData.completionRate.recommendation}
                  confidence={metricInsightData.completionRate.confidence}
                  onFeedback={(helpful) => {
                    if (selectedForm) {
                      storeInsightFeedback(selectedForm, 'completion-rate', helpful);
                    }
                  }}
                  feedbackState={selectedForm ? getInsightFeedback(selectedForm, 'completion-rate') : null}
                />
              )}
            </div>

            {/* Avg Completion Time Metric */}
            <div className="space-y-3">
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#2E2E2E] mt-1">
                        {formatTime(metrics.avgCompletionTime)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        per response
                      </p>
                    </div>
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-[#8F00FF]" />
                  </div>
                </CardContent>
              </Card>
              {/* AI Insight for Completion Time */}
              {viewMode === 'insights' && metricInsightData.avgCompletionTime && (
                <MetricInsightCard
                  metricName="Average Completion Time"
                  insight={metricInsightData.avgCompletionTime.insight}
                  recommendation={metricInsightData.avgCompletionTime.recommendation}
                  confidence={metricInsightData.avgCompletionTime.confidence}
                  onFeedback={(helpful) => {
                    if (selectedForm) {
                      storeInsightFeedback(selectedForm, 'completion-time', helpful);
                    }
                  }}
                  feedbackState={selectedForm ? getInsightFeedback(selectedForm, 'completion-time') : null}
                />
              )}
            </div>

            {/* Device Distribution Metric */}
            <div className="space-y-3">
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Device Distribution</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#2E2E2E] mt-1">
                        {deviceBreakdown.mobile} mobile, {deviceBreakdown.desktop} desktop
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {deviceBreakdown.tablet} tablet
                      </p>
                    </div>
                    <Smartphone className="h-6 w-6 sm:h-8 sm:w-8 text-[#8F00FF]" />
                  </div>
                </CardContent>
              </Card>
              {/* AI Insight for Devices */}
              {viewMode === 'insights' && metricInsightData.devices && (
                <MetricInsightCard
                  metricName="Device Distribution"
                  insight={metricInsightData.devices.insight}
                  recommendation={metricInsightData.devices.recommendation}
                  confidence={metricInsightData.devices.confidence}
                  onFeedback={(helpful) => {
                    if (selectedForm) {
                      storeInsightFeedback(selectedForm, 'devices', helpful);
                    }
                  }}
                  feedbackState={selectedForm ? getInsightFeedback(selectedForm, 'devices') : null}
                />
              )}
            </div>

            {/* Total Responses Metric */}
            <div className="space-y-3">
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Responses</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#2E2E2E] mt-1">
                        {metrics.totalResponses}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {metrics.responseQuality.validResponses} valid
                      </p>
                    </div>
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[#8F00FF]" />
                  </div>
                  <Progress 
                    value={(metrics.responseQuality.validResponses / metrics.totalResponses) * 100} 
                    className="mt-4"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Raw Mode - Show all metrics in grid if not in insights mode */}
          {viewMode === 'raw' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Responses</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#2E2E2E] mt-1">
                        {metrics.totalResponses}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {metrics.responseQuality.validResponses} valid
                      </p>
                    </div>
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[#8F00FF]" />
                  </div>
                  <Progress 
                    value={(metrics.responseQuality.validResponses / metrics.totalResponses) * 100} 
                    className="mt-4"
                  />
          </CardContent>
        </Card>

              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#2E2E2E] mt-1">
                        {`${(metrics.completionRate * 100).toFixed(1)}%`}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {metrics.responseQuality.partialResponses} partial
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-[#8F00FF]" />
                  </div>
                  <Progress 
                    value={metrics.completionRate * 100} 
                    className="mt-4"
                  />
          </CardContent>
        </Card>

              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Views</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#2E2E2E] mt-1">
                        {metrics.totalViews}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {`${(metrics.userEngagement.bounceRate * 100).toFixed(1)}% bounce rate`}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-[#8F00FF]" />
                      <InfoTooltip content={TOOLTIPS.totalViews} />
                    </div>
                  </div>
                  <Progress 
                    value={(1 - metrics.userEngagement.bounceRate) * 100} 
                    className="mt-4"
                  />
          </CardContent>
        </Card>

              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#2E2E2E] mt-1">
                        {formatTime(metrics.avgCompletionTime)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        per response
                      </p>
                    </div>
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-[#8F00FF]" />
                  </div>
          </CardContent>
        </Card>
      </div>
          )}

          {/* Tabs for detailed analytics */}
          {selectedForm && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="responses" className="text-xs sm:text-sm">Responses</TabsTrigger>
                <TabsTrigger value="engagement" className="text-xs sm:text-sm">Engagement</TabsTrigger>
                <TabsTrigger value="geographic" className="text-xs sm:text-sm">Geographic</TabsTrigger>
                <TabsTrigger value="responseAnalytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
        </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Most Important Data First: Completion Time Analysis - Full Width */}
                  <Card className="bg-white shadow-sm col-span-1 lg:col-span-2 border-primary/20 shadow-md">
                    <CardContent className="p-4 sm:p-6">
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
                              {selectedDate ? safeFormatDate(selectedDate, "PPP", "Pick a date") : <span>Pick a date</span>}
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
                            <span>Total responses for {safeFormatDate(selectedDate, "PP", "selected date")}: </span>
                            <span className="font-medium">
                              {getCompletionTimeData(responses, selectedDate).reduce((acc, data) => acc + data.count, 0)}
                            </span>
              </div>
                        ) : null}
              </div>
                    </CardContent>
                  </Card>
                  {/* AI Insight for Completion Time Analysis */}
                  {viewMode === 'insights' && metricInsightData.avgCompletionTime && (
                    <div className="col-span-2">
                      <MetricInsightCard
                        metricName="Completion Time Analysis"
                        insight={metricInsightData.avgCompletionTime.insight}
                        recommendation={metricInsightData.avgCompletionTime.recommendation}
                        confidence={metricInsightData.avgCompletionTime.confidence}
                        onFeedback={(helpful) => {
                          if (selectedForm) {
                            storeInsightFeedback(selectedForm, 'completion-time-analysis', helpful);
                          }
                        }}
                        feedbackState={selectedForm ? getInsightFeedback(selectedForm, 'completion-time-analysis') : null}
                      />
                    </div>
                  )}

                  {/* Daily Activity Chart */}
                  <Card className="bg-white shadow-sm col-span-1 lg:col-span-2">
                    <CardContent className="p-4 sm:p-6">
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
                              {selectedDate ? safeFormatDate(selectedDate, "PPP", "Pick a date") : <span>Pick a date</span>}
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
                  {/* AI Insight for Daily Activity */}
                  {viewMode === 'insights' && metricInsightData.activity && (
                    <div className="col-span-2">
                      <MetricInsightCard
                        metricName="Daily Activity"
                        insight={metricInsightData.activity.insight}
                        recommendation={metricInsightData.activity.recommendation}
                        confidence={metricInsightData.activity.confidence}
                        onFeedback={(helpful) => {
                          if (selectedForm) {
                            storeInsightFeedback(selectedForm, 'daily-activity', helpful);
                          }
                        }}
                        feedbackState={selectedForm ? getInsightFeedback(selectedForm, 'daily-activity') : null}
                      />
                    </div>
                  )}

                  {/* Device Distribution */}
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-4 sm:p-6">
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
                  {/* AI Insight for Device Distribution */}
                  {viewMode === 'insights' && metricInsightData.devices && (
                    <MetricInsightCard
                      metricName="Device Distribution"
                      insight={metricInsightData.devices.insight}
                      recommendation={metricInsightData.devices.recommendation}
                      confidence={metricInsightData.devices.confidence}
                      onFeedback={(helpful) => {
                        if (selectedForm) {
                          storeInsightFeedback(selectedForm, 'device-distribution', helpful);
                        }
                      }}
                      feedbackState={selectedForm ? getInsightFeedback(selectedForm, 'device-distribution') : null}
                    />
                  )}

                  {/* Top Referral Sources */}
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-4 sm:p-6">
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
                  <Card className="bg-white shadow-sm col-span-1 lg:col-span-2">
                    <CardContent className="p-4 sm:p-6">
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
                                  {safeDate(response.completedAt)?.toLocaleString() || 'N/A'}
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

              <TabsContent value="responses" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Response Status Distribution */}
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-4 sm:p-6">
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
                  {/* AI Insight for Response Status */}
                  {viewMode === 'insights' && metricInsightData.completionRate && (
                    <MetricInsightCard
                      metricName="Response Status"
                      insight={metricInsightData.completionRate.insight}
                      recommendation={metricInsightData.completionRate.recommendation}
                      confidence={metricInsightData.completionRate.confidence}
                      onFeedback={(helpful) => {
                        if (selectedForm) {
                          storeInsightFeedback(selectedForm, 'response-status', helpful);
                        }
                      }}
                      feedbackState={selectedForm ? getInsightFeedback(selectedForm, 'response-status') : null}
                    />
                  )}
                </div>

                {/* Response Status Breakdown */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-black">Response Status</CardTitle>
                    <CardDescription>Complete vs partial responses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-black">Complete</span>
                        </div>
                          <span className="text-2xl font-semibold text-black">{completedResponses}</span>
                      </div>
                        <Progress value={(completedResponses / totalResponses) * 100} className="h-3" />
                        </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-yellow-600" />
                            <span className="font-medium text-black">Partial</span>
                      </div>
                          <span className="text-2xl font-semibold text-black">{totalResponses - completedResponses}</span>
                      </div>
                        <Progress value={((totalResponses - completedResponses) / totalResponses) * 100} className="h-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              </TabsContent>

              {/* Questions Tab - Improved */}
              <TabsContent value="questions" className="space-y-6">
                {Object.keys(questionData).length === 0 ? (
                  <Card className="bg-white border border-black/10">
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-12 w-12 text-black/20 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-black mb-2">No question data yet</h3>
                      <p className="text-black/60">Question analysis will appear here once responses are collected.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {sortQuestionIds(Object.keys(questionData)).map((qId, idx) => {
                      const data = questionData[qId];
                      const isNumeric = data.type === 'numeric';
                      const numericAnswers = isNumeric ? data.answers.filter(a => typeof a === 'number') : [];
                      
                      let stats: any = null;
                      let textFreq: any[] = [];
                      
                      if (isNumeric && numericAnswers.length > 0) {
                        stats = getNumericStats(numericAnswers as number[]);
                        // Create distribution for chart
                        const distribution: number[] = [];
                        const min = stats.min;
                        const max = stats.max;
                        for (let i = min; i <= max; i++) {
                          distribution.push(numericAnswers.filter(a => a === i).length);
                        }
                        stats.distribution = distribution;
                        stats.distributionLabels = Array.from({ length: max - min + 1 }, (_, i) => min + i);
                      } else if (!isNumeric) {
                        textFreq = getTextFrequency(data.answers as string[]);
                      }

                      return (
                        <Card key={qId} className="bg-white border border-black/10">
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              <div className="bg-[#8F00FF]/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-[#8F00FF] font-semibold">{idx + 1}</span>
                              </div>
                              <div>
                                <CardTitle>{data.question}</CardTitle>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
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
                                    const responseDate = safeDate(r.completedAt);
                                    if (!responseDate) return false;
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
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="engagement" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Session Duration */}
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-4 sm:p-6">
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

                  {/* Session Duration */}
                <Card className="bg-white border border-black/10">
                  <CardHeader>
                    <CardTitle className="text-black">Session Duration</CardTitle>
                    <CardDescription>Time users spend completing the survey</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-black/5 rounded-lg p-4">
                        <p className="text-xs text-black/60 mb-1">Average</p>
                        <p className="text-xl font-semibold text-black">{formatTime(avgCompletionTime)}</p>
                      </div>
                      <div className="bg-black/5 rounded-lg p-4">
                        <p className="text-xs text-black/60 mb-1">&lt; 30 seconds</p>
                        <p className="text-xl font-semibold text-black">
                          {filteredResponses.filter(r => (r.totalTime || 0) < 30000).length}
                        </p>
                        </div>
                      <div className="bg-black/5 rounded-lg p-4">
                        <p className="text-xs text-black/60 mb-1">30s - 2 min</p>
                        <p className="text-xl font-semibold text-black">
                          {filteredResponses.filter(r => (r.totalTime || 0) >= 30000 && (r.totalTime || 0) < 120000).length}
                        </p>
                        </div>
                      <div className="bg-black/5 rounded-lg p-4">
                        <p className="text-xs text-black/60 mb-1">&gt; 2 minutes</p>
                        <p className="text-xl font-semibold text-black">
                          {filteredResponses.filter(r => (r.totalTime || 0) >= 120000).length}
                        </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                {/* Referral Sources */}
                {filteredResponses.some(r => r.referral) && (
                  <Card className="bg-white border border-black/10">
                    <CardHeader>
                      <CardTitle className="text-black">Traffic Sources</CardTitle>
                      <CardDescription>Where your responses are coming from</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                          {Object.entries(
                          filteredResponses.reduce((acc: Record<string, number>, r) => {
                            const source = formatReferralSource(r.referral || 'Direct');
                              acc[source] = (acc[source] || 0) + 1;
                              return acc;
                            }, {})
                          )
                            .sort(([, a], [, b]) => b - a)
                          .slice(0, 10)
                            .map(([source, count]) => (
                            <div key={source} className="flex items-center justify-between p-3 bg-black/5 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-black/40" />
                                <span className="text-sm text-black/80">{source}</span>
                              </div>
                              <Badge className="bg-[#8F00FF]/10 text-[#8F00FF] border-[#8F00FF]/20">
                                {count}
                              </Badge>
                </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                  {/* Weekly Engagement Trend */}
                  <Card className="bg-white shadow-sm col-span-1 lg:col-span-2">
                    <CardContent className="p-4 sm:p-6">
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
                                      const responseDate = safeDate(r.completedAt);
                                      if (!responseDate) return false;
                                      const day = new Date();
                                      day.setDate(day.getDate() - 6 + i);
                                      return responseDate.toDateString() === day.toDateString();
                                    }).length;
                                    
                                    return Math.round(completions * (1.3 + Math.random() * 0.7));
                                  }),
                                  backgroundColor: COLORS.chart[0],
                                },
                                {
                                  label: 'Completions',
                                  data: Array.from({ length: 7 }, (_, i) => {
                                    return responses.filter(r => {
                                      const responseDate = safeDate(r.completedAt);
                                      if (!responseDate) return false;
                                      const day = new Date();
                                      day.setDate(day.getDate() - 6 + i);
                                      return responseDate.toDateString() === day.toDateString();
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
                  {/* AI Insight for Engagement */}
                  {viewMode === 'insights' && metricInsightData.activity && (
                    <div className="col-span-2">
                      <MetricInsightCard
                        metricName="User Engagement"
                        insight={metricInsightData.activity.insight}
                        recommendation={metricInsightData.activity.recommendation}
                        confidence={metricInsightData.activity.confidence}
                        onFeedback={(helpful) => {
                          if (selectedForm) {
                            storeInsightFeedback(selectedForm, 'engagement', helpful);
                          }
                        }}
                        feedbackState={selectedForm ? getInsightFeedback(selectedForm, 'engagement') : null}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="geographic" className="space-y-4">
                {/* Geographic Distribution */}
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Geographic Distribution</h3>
                      <CountriesBreakdown responses={responses} />
                    </div>
                    <div className="h-[400px] rounded-lg overflow-hidden">
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
                {/* AI Insight for Geographic Distribution */}
                {viewMode === 'insights' && metricInsightData.geography && (
                  <MetricInsightCard
                    metricName="Geographic Distribution"
                    insight={metricInsightData.geography.insight}
                    recommendation={metricInsightData.geography.recommendation}
                    confidence={metricInsightData.geography.confidence}
                    onFeedback={(helpful) => {
                      if (selectedForm) {
                        storeInsightFeedback(selectedForm, 'geographic', helpful);
                      }
                    }}
                    feedbackState={selectedForm ? getInsightFeedback(selectedForm, 'geographic') : null}
                  />
                )}
        </TabsContent>

        <TabsContent value="responseAnalytics" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
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
                {Object.keys(questionAnalytics).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(questionAnalytics).map(([qId, data], idx) => {
                      const isNumeric = data.type === 'numeric';
                      const answers = data.answers;
                      let stats: any = {};
                      let textFreq: any[] = [];
                      
                      if (isNumeric && answers.length > 0) {
                        const nums = answers.filter(a => typeof a === 'number') as number[];
                        if (nums.length > 0) {
                          const min = Math.min(...nums);
                          const max = Math.max(...nums);
                          const sum = nums.reduce((a, b) => a + b, 0);
                          const avg = sum / nums.length;
                          const sorted = [...nums].sort((a, b) => a - b);
                          const median = sorted.length % 2 === 0
                            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                            : sorted[Math.floor(sorted.length / 2)];
                          
                          stats = {
                            min,
                            max,
                            avg: Math.round(avg * 100) / 100,
                            median: Math.round(median * 100) / 100,
                            count: nums.length,
                          };
                          
                          const distribution: Record<number, number> = {};
                          nums.forEach(n => {
                            distribution[n] = (distribution[n] || 0) + 1;
                          });
                          stats.distribution = distribution;
                          stats.distributionLabels = Array.from({ length: max - min + 1 }, (_, i) => min + i);
                        }
                      } else if (!isNumeric) {
                        const freq: Record<string, number> = {};
                        answers.forEach((a: any) => {
                          const key = String(a);
                          freq[key] = (freq[key] || 0) + 1;
                        });
                        textFreq = Object.entries(freq)
                          .map(([value, count]) => ({ value, count, percentage: (count / answers.length) * 100 }))
                          .sort((a, b) => b.count - a.count);
                      }

                      return (
                        <Card key={qId} className="bg-white border border-black/10">
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              <div className="bg-[#8F00FF]/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-[#8F00FF] font-semibold">{idx + 1}</span>
                              </div>
                              <div>
                                <CardTitle>{data.question}</CardTitle>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {isNumeric && stats.count ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600">Average</p>
                                    <p className="text-2xl font-semibold">{stats.avg}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Median</p>
                                    <p className="text-2xl font-semibold">{stats.median}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Min</p>
                                    <p className="text-2xl font-semibold">{stats.min}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Max</p>
                                    <p className="text-2xl font-semibold">{stats.max}</p>
                                  </div>
                                </div>
                              </div>
                            ) : textFreq.length > 0 ? (
                              <div className="space-y-2">
                                {textFreq.slice(0, 6).map((item, i) => (
                                  <div key={i} className="flex justify-between items-center">
                                    <span className="truncate max-w-[70%]">{item.value}</span>
                                    <span className="text-gray-600">{item.percentage.toFixed(1)}% ({item.count})</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No data available</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No question data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Responses Tab */}
        <TabsContent value="responses" className="space-y-6">
                <Card className="bg-white border border-black/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-black">All Responses</CardTitle>
                        <CardDescription>View and filter all individual responses</CardDescription>
                                </div>
                      <div className="flex gap-2">
                        <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Device" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Devices</SelectItem>
                            <SelectItem value="desktop">Desktop</SelectItem>
                            <SelectItem value="mobile">Mobile</SelectItem>
                            <SelectItem value="tablet">Tablet</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={referralFilter} onValueChange={setReferralFilter}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            <SelectItem value="direct">Direct</SelectItem>
                            <SelectItem value="google">Google</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="twitter">Twitter</SelectItem>
                          </SelectContent>
                        </Select>
                              </div>
                              </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredResponses.length === 0 ? (
                        <div className="p-12 text-center">
                          <Users className="h-12 w-12 text-black/20 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-black mb-2">No responses match filters</h3>
                          <p className="text-black/60">Try adjusting your filters to see more responses.</p>
                            </div>
                          ) : (
                            <>
                              {filteredResponses.map((response) => (
                                <Sheet key={response.id}>
                                  <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full justify-between">
                                      <span>{safeFormatDate(response.completedAt, 'PPpp')}</span>
                                      <Badge variant={response.completionStatus === 'complete' ? 'default' : 'secondary'}>
                                        {response.completionStatus === 'complete' ? 'Complete' : 'Partial'}
                                      </Badge>
                                    </Button>
                                  </SheetTrigger>
                                  <SheetContent className="w-full sm:w-[600px] overflow-y-auto">
                                    <SheetHeader>
                                      <SheetTitle>Response Details</SheetTitle>
                                      <SheetDescription>
                                        Submitted on {safeFormatDate(response.completedAt, 'PPpp')}
                                      </SheetDescription>
                                    </SheetHeader>
                                    <div className="mt-6 space-y-6">
                                      {/* Response Info */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/5 rounded-lg p-4">
                                          <p className="text-xs text-black/60 mb-1">Status</p>
                                          <Badge className={
                                            response.completionStatus === 'complete'
                                              ? 'bg-green-100 text-green-700 border-green-200'
                                              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                          }>
                                            {response.completionStatus === 'complete' ? 'Complete' : 'Partial'}
                                          </Badge>
                                        </div>
                                        <div className="bg-black/5 rounded-lg p-4">
                                          <p className="text-xs text-black/60 mb-1">Device</p>
                                          <p className="font-medium text-black">{response.device || 'Unknown'}</p>
                                        </div>
                                        {response.totalTime && (
                                          <div className="bg-black/5 rounded-lg p-4">
                                            <p className="text-xs text-black/60 mb-1">Time Taken</p>
                                            <p className="font-medium text-black">{formatTime(response.totalTime)}</p>
                                          </div>
                                        )}
                                        {response.referral && (
                                          <div className="bg-black/5 rounded-lg p-4">
                                            <p className="text-xs text-black/60 mb-1">Source</p>
                                            <p className="font-medium text-black truncate">{formatReferralSource(response.referral)}</p>
                                          </div>
                                        )}
                                        {response.skipRate !== undefined && (
                                          <div className="bg-black/5 rounded-lg p-4">
                                            <p className="text-xs text-black/60 mb-1">Skip Rate</p>
                                            <p className="font-medium text-black">{(response.skipRate * 100).toFixed(1)}%</p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Answers */}
                                      {response.answers && Object.keys(response.answers).length > 0 && (
                                        <div>
                                          <h4 className="font-semibold text-black mb-4">Answers</h4>
                                          <div className="space-y-4">
                                            {sortQuestionIds(Object.keys(response.answers)).map((qId) => {
                                              const answerData = response.answers![qId];
                                              return (
                                                <div key={qId} className="border border-black/10 rounded-lg p-4 bg-white">
                                                  <p className="font-medium text-black mb-2">{answerData.question}</p>
                                                  <div className="bg-black/5 rounded p-3">
                                                    <p className="text-black/80 whitespace-pre-wrap break-words">
                                                      {typeof answerData.answer === 'string' 
                                                        ? answerData.answer 
                                                        : answerData.answer.toString()}
                                                    </p>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </SheetContent>
                                </Sheet>
                              ))}
                              
                              {/* Load More Button */}
                              {hasMoreResponses && (
                                <div className="flex justify-center pt-4">
                                  <Button
                                    onClick={loadMoreResponses}
                                    variant="outline"
                                    className="gap-2"
                                  >
                                    Load More ({totalResponseCount - filteredResponses.length} remaining)
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

      </div>

      {/* Modals */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={modalFeature}
        description={modalDescription}
        onUpgrade={handleUpgradeFromModal}
      />

      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        currentCredits={credits}
        onBuyCredits={handleBuyCreditsFromModal}
        onUpgrade={handleUpgradeFromModal}
      />
    </DashboardLayout>
  );
};

export default Analytics;