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
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { format, formatDistanceToNow } from 'date-fns';
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
  Tooltip,
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
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [referralFilter, setReferralFilter] = useState('all');
  
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
  
  // Stage-based trigger logic - only trigger every 20 responses
  const getInsightStage = (responseCount: number, lastGeneratedCount: number): { stage: number; shouldGenerate: boolean } => {
    // Only auto-generate if we've crossed a milestone threshold
    const milestones = [1, 10, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200];
    
    // Check if we've crossed any milestone threshold
    const crossedMilestone = milestones.some(milestone => {
      return responseCount >= milestone && lastGeneratedCount < milestone;
    });
    
    if (!crossedMilestone) {
      return { stage: 0, shouldGenerate: false };
    }
    
    // Determine stage based on response count
    if (responseCount === 1) return { stage: 1, shouldGenerate: true }; // Stage 1: Motivational
    if (responseCount === 10) return { stage: 2, shouldGenerate: true }; // Stage 2: Early signal
    if (responseCount === 20) return { stage: 3, shouldGenerate: true }; // Stage 3: First full analysis
    if (responseCount >= 100) return { stage: 5, shouldGenerate: true }; // Stage 5: Deep insights
    if (responseCount >= 20 && responseCount % 20 === 0) return { stage: 4, shouldGenerate: true }; // Stage 4: Evolving insights
    
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
  const checkAndGenerateInsights = async (formId: string, totalCount: number, currentResponses: SurveyResponse[], formTitle: string) => {
    // Don't generate if already generating
    if (generatingInsight) return;
    
    // Load existing insight history first to get lastInsightResponseCount
    const lastCount = await loadInsightHistory(formId);
    
    // Check if we should generate a new insight based on stage logic
    // Only auto-generate if we've crossed a milestone (every 20 responses)
    const stageInfo = getInsightStage(totalCount, lastCount);
    
    if (stageInfo.shouldGenerate && totalCount > 0) {
      console.log(`🔄 Auto-generating summary at ${totalCount} responses (last was ${lastCount})`);
      await generateInsight(formId, totalCount, currentResponses, formTitle, stageInfo.stage);
    } else {
      console.log(`⏭️ Skipping auto-generation. Current: ${totalCount}, Last: ${lastCount}, Should generate: ${stageInfo.shouldGenerate}`);
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
              const dateA = new Date(a.completedAt);
              const dateB = new Date(b.completedAt);
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

  // Generate AI insight based on analytics data with stage-based prompts
  const generateInsight = async (formId: string, responseCount: number, responses: SurveyResponse[], formTitle: string, stage: number) => {
    if (generatingInsight) return;
    
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
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          surveyData: responseDataSummary,
          formTitle,
          responseCount,
          stage
        })
      });
      
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
      
      const stageInfo = getInsightStage(responseCount);
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

  // Optimize metrics calculation with useMemo for large datasets
  const metrics = useMemo(() => {
    const total = totalResponseCount > 0 ? totalResponseCount : responses.length;
    const completed = responses.filter(r => r.completionStatus === 'complete').length;
    
    // For large datasets, use sample-based calculation
    const sampleSize = Math.min(responses.length, 1000);
    const sample = responses.slice(0, sampleSize);
    const completionRate = sampleSize > 0 ? completed / sampleSize : 0;
    const avgCompletionTime = sample.reduce((acc, r) => acc + (r.totalTime || 0), 0) / sampleSize || 0;
    
    return {
      totalResponses: total,
      completedResponses: completed,
      completionRate,
      avgCompletionTime,
    };
  }, [responses, totalResponseCount]);

  // Calculate metrics (use memoized version)
  const totalResponses = totalResponseCount > 0 ? totalResponseCount : responses.length;
  const completedResponses = responses.filter(r => r.completionStatus === 'complete').length;
  const completionRate = metrics.completionRate;
  const avgCompletionTime = metrics.avgCompletionTime;
  
  // Memoize filtered responses for performance
  const filteredResponses = useMemo(() => {
    let filtered = responses;
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
  }, [responses, deviceFilter, referralFilter]);

  // Memoize device breakdown
  const deviceBreakdown = useMemo(() => ({
      desktop: filteredResponses.filter(r => r.device?.toLowerCase() === 'desktop').length,
      mobile: filteredResponses.filter(r => r.device?.toLowerCase() === 'mobile').length,
      tablet: filteredResponses.filter(r => r.device?.toLowerCase() === 'tablet').length,
  }), [filteredResponses]);

  const formatTime = (ms: number) => {
    if (!ms) return '0s';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

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
      backgroundColor: ['#7B3FE4', '#9B5FE4', '#BB7FE4'],
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
      const responseDate = new Date(r.completedAt);
      return responseDate >= date && responseDate < nextDate;
    }).length;
  });

  const timelineChartData = {
    labels: last7Days,
    datasets: [{
      label: 'Responses',
      data: responsesByDay,
      borderColor: '#7B3FE4',
      backgroundColor: 'rgba(123, 63, 228, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#7B3FE4',
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
      backgroundColor: '#7B3FE4',
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

  // Memoize question data processing for performance
  const questionData = useMemo(() => {
    const data: Record<string, { question: string; answers: any[]; type: 'text' | 'numeric' }> = {};
    
    // Process only loaded responses (pagination handles this)
    filteredResponses.forEach(response => {
      if (response.answers) {
        Object.entries(response.answers).forEach(([qId, answerData]) => {
          if (!data[qId]) {
            data[qId] = {
              question: answerData.question,
              answers: [],
              type: typeof answerData.answer === 'number' ? 'numeric' : 'text',
            };
          }
          data[qId].answers.push(answerData.answer);
        });
      }
    });
    
    return data;
  }, [filteredResponses]);

  // Memoize location data for map (aggregate nearby locations for performance)
  const locationData = useMemo(() => {
    const locations = filteredResponses
      .filter(r => r.location?.lat && r.location?.lng)
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
  }, [filteredResponses]);

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
          <Loader2 className="h-8 w-8 animate-spin text-[#7B3FE4]" />
      </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
        {/* Upgrade Banner for Free Users */}
        {userPlan === 'free' && (
          <Card className="mb-6 bg-gradient-to-r from-[#7B3FE4]/10 to-[#7B3FE4]/5 border border-[#7B3FE4]/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Lock className="h-6 w-6 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-black mb-2">Unlock Full Analytics with Pro</h3>
                  <p className="text-sm text-black/60 mb-4">
                    Upgrade to Pro for advanced insights, detailed question analysis, and export capabilities.
                  </p>
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Upgrade to Pro (€14.99/mo)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
              <h1 className="text-3xl font-semibold text-black mb-2">Analytics Dashboard</h1>
              <p className="text-black/60">
              {forms.find(f => f.id === selectedForm)?.title || 'Select an agent to view insights'}
            </p>
          </div>
            <div className="flex gap-3">
            <Select value={selectedForm} onValueChange={setSelectedForm}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Select agent" />
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
                className="gap-2"
              onClick={exportData}
                disabled={!selectedForm || responses.length === 0}
            >
                <Download className="h-4 w-4" />
                Export
            </Button>
          </div>
        </div>

          {/* Agent Info */}
          {currentAgent && (
            <Card className="bg-white border border-black/10">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-[#7B3FE4]/10 p-3 rounded-lg">
                    <BrainCircuit className="h-6 w-6 text-[#7B3FE4]" />
          </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-1">{currentAgent.name}</h3>
                    <p className="text-sm text-black/60">{currentAgent.goal}</p>
                  </div>
                  <Badge className="bg-[#7B3FE4]/10 text-[#7B3FE4] border-[#7B3FE4]/20 capitalize">
                    {currentAgent.personality}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {responses.length === 0 ? (
          <Card className="bg-white border border-black/10">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-black/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No responses yet</h3>
              <p className="text-black/60 mb-4">
                Share your agent link to start collecting responses. All responses will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* AI Summary Card - Always show if there are responses */}
            <Card className="mb-8 bg-gradient-to-r from-[#7B3FE4]/10 via-[#7B3FE4]/5 to-transparent border-2 border-[#7B3FE4]/30 shadow-lg relative">
              <CardContent className="p-6">
                {/* History icon in top-right corner */}
                {insightHistory.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="absolute top-4 right-4 h-8 w-8 p-0 text-black/60 hover:text-black hover:bg-black/5 rounded-full"
                    title={`View history (${insightHistory.length} summaries)`}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex items-start gap-4">
                  <div className="bg-[#7B3FE4]/20 p-3 rounded-lg flex-shrink-0">
                    <BrainCircuit className="h-6 w-6 text-[#7B3FE4]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-black">AI Summary</h3>
                        {currentInsight && (
                          <Badge className="bg-[#7B3FE4]/20 text-[#7B3FE4] border-[#7B3FE4]/30">
                            {currentInsight.responseCount} {currentInsight.responseCount === 1 ? 'response' : 'responses'}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshInsight}
                        disabled={generatingInsight}
                        className="gap-2 text-[#7B3FE4] hover:text-[#6B35D0] hover:bg-[#7B3FE4]/10"
                      >
                        {generatingInsight ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            {currentInsight ? 'Refresh Summary' : 'Get AI Analysis'}
                          </>
                        )}
                      </Button>
                    </div>
                    {generatingInsight ? (
                      <div className="flex items-center gap-2 text-black/70">
                        <Loader2 className="h-4 w-4 animate-spin text-[#7B3FE4]" />
                        <p>Analyzing your survey data and generating insights...</p>
                      </div>
                    ) : currentInsight?.text ? (
                      <div className="space-y-3">
                        <p className="text-black/90 leading-relaxed">{currentInsight.text}</p>
                        {currentInsight.createdAt && (
                          <p className="text-xs text-black/50">
                            AI Summary last updated {formatDistanceToNow(new Date(currentInsight.createdAt), { addSuffix: true })}
                          </p>
                        )}
                    </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-black/70 text-sm">
                          Get AI-powered insights about your survey performance, trends, and actionable recommendations.
                        </p>
                        <p className="text-xs text-black/50">
                          Click "Get AI Analysis" above to generate insights based on your {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}.
                        </p>
                  </div>
                    )}
                    
                    {/* History Panel */}
                    {showHistory && insightHistory.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-[#7B3FE4]/20">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-black">Summary History</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHistory(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <ScrollArea className="h-[300px] pr-4">
                          <div className="space-y-4">
                            {insightHistory.map((summary) => (
                              <div
                                key={summary.id}
                                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                  summary.id === currentInsight?.id
                                    ? 'bg-[#7B3FE4]/10 border-[#7B3FE4]/30'
                                    : 'bg-white border-black/10 hover:border-[#7B3FE4]/20'
                                }`}
                                onClick={() => {
                                  setCurrentInsight({
                                    text: summary.text,
                                    createdAt: summary.createdAt,
                                    responseCount: summary.responseCount,
                                    id: summary.id,
                                  });
                                }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-[#7B3FE4]/20 text-[#7B3FE4] border-[#7B3FE4]/30 text-xs">
                                      {summary.responseCount} {summary.responseCount === 1 ? 'response' : 'responses'}
                                    </Badge>
                                    {summary.id === currentInsight?.id && (
                                      <Badge className="bg-[#7B3FE4] text-white text-xs">Current</Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-black/50">
                                    {formatDistanceToNow(summary.createdAt, { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm text-black/80 line-clamp-3">{summary.text}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
                </CardContent>
              </Card>

            {/* Key Metrics - Always visible */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white border border-black/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-[#7B3FE4]/10 p-3 rounded-lg">
                      <Users className="h-6 w-6 text-[#7B3FE4]" />
                    </div>
                    <Badge className="bg-[#7B3FE4]/10 text-[#7B3FE4] border-[#7B3FE4]/20">
                      Total
                    </Badge>
                  </div>
                  <h3 className="text-3xl font-semibold text-black mb-1">{totalResponses}</h3>
                  <p className="text-sm text-black/60">Total responses collected</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-black/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {Math.round(completionRate * 100)}%
                    </Badge>
                    </div>
                  <h3 className="text-3xl font-semibold text-black mb-1">{completedResponses}</h3>
                  <p className="text-sm text-black/60">Completed responses</p>
                  <Progress value={completionRate * 100} className="mt-3 h-2" />
                </CardContent>
              </Card>

              <Card className="bg-white border border-black/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-[#7B3FE4]/10 p-3 rounded-lg">
                      <Clock className="h-6 w-6 text-[#7B3FE4]" />
                  </div>
                  </div>
                  <h3 className="text-3xl font-semibold text-black mb-1">{formatTime(avgCompletionTime)}</h3>
                  <p className="text-sm text-black/60">Average completion time</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-black/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-[#7B3FE4]/10 p-3 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-[#7B3FE4]" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-semibold text-black mb-1">
                    {deviceBreakdown.mobile > deviceBreakdown.desktop ? 'Mobile' : 'Desktop'}
                  </h3>
                  <p className="text-sm text-black/60">Most used device</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Response Summary on Main Page */}
            {responses.length > 0 && (
              <Card className="bg-white border border-black/10 mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-black">Recent Responses</CardTitle>
                      <CardDescription>Click any response to view details</CardDescription>
                    </div>
                    <Badge className="bg-[#7B3FE4]/10 text-[#7B3FE4] border-[#7B3FE4]/20">
                      {responses.length} total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {responses.slice(0, 6).map((response) => (
                      <Sheet key={response.id}>
                        <SheetTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-auto p-4 justify-start text-left hover:bg-[#7B3FE4]/5 hover:border-[#7B3FE4]/30 transition-all"
                          >
                            <div className="flex items-start gap-3 w-full">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${
                                response.completionStatus === 'complete' 
                                  ? 'bg-green-100' 
                                  : 'bg-yellow-100'
                              }`}>
                                {response.completionStatus === 'complete' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-yellow-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-black text-sm truncate">
                                  {format(new Date(response.completedAt), 'MMM dd, h:mm a')}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {response.device && (
                                    <Badge variant="outline" className="text-xs border-black/10 text-black/60">
                                      {response.device}
                                    </Badge>
                                  )}
                                  {response.totalTime && (
                                    <span className="text-xs text-black/50">
                                      {formatTime(response.totalTime)}
                                    </span>
                                  )}
                                </div>
                                {response.answers && (
                                  <p className="text-xs text-black/50 mt-1 truncate">
                                    {Object.keys(response.answers).length} {Object.keys(response.answers).length === 1 ? 'answer' : 'answers'}
                                  </p>
                                )}
                              </div>
                            </div>
                  </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>Response Details</SheetTitle>
                            <SheetDescription>
                              Submitted on {format(new Date(response.completedAt), 'PPpp')}
                            </SheetDescription>
                          </SheetHeader>
                          <div className="mt-6 space-y-6">
                            {/* Response Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-black/5 rounded-lg p-3">
                                <p className="text-xs text-black/60 mb-1">Status</p>
                                <Badge className={
                                  response.completionStatus === 'complete'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }>
                                  {response.completionStatus === 'complete' ? 'Complete' : 'Partial'}
                                </Badge>
                </div>
                              <div className="bg-black/5 rounded-lg p-3">
                                <p className="text-xs text-black/60 mb-1">Device</p>
                                <p className="font-medium text-black">{response.device || 'Unknown'}</p>
                              </div>
                              {response.totalTime && (
                                <div className="bg-black/5 rounded-lg p-3">
                                  <p className="text-xs text-black/60 mb-1">Time Taken</p>
                                  <p className="font-medium text-black">{formatTime(response.totalTime)}</p>
              </div>
            )}
                              {response.referral && (
                                <div className="bg-black/5 rounded-lg p-3">
                                  <p className="text-xs text-black/60 mb-1">Source</p>
                                  <p className="font-medium text-black truncate">{formatReferralSource(response.referral)}</p>
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
                                      <div key={qId} className="border border-black/10 rounded-lg p-4">
                                        <p className="font-medium text-black mb-2">{answerData.question}</p>
                                        <p className="text-black/80 bg-black/5 rounded p-2">
                                          {typeof answerData.answer === 'string' ? answerData.answer : answerData.answer.toString()}
                                        </p>
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs for Detailed Analytics */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-black/5 p-1 rounded-lg">
                <TabsTrigger value="overview" className="data-[state=active]:bg-[#7B3FE4] data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="questions" className="data-[state=active]:bg-[#7B3FE4] data-[state=active]:text-white">
                  Questions
                </TabsTrigger>
                <TabsTrigger value="engagement" className="data-[state=active]:bg-[#7B3FE4] data-[state=active]:text-white">
                  Engagement
                </TabsTrigger>
                <TabsTrigger value="geographic" className="data-[state=active]:bg-[#7B3FE4] data-[state=active]:text-white">
                  Geographic
                </TabsTrigger>
                <TabsTrigger value="responses" className="data-[state=active]:bg-[#7B3FE4] data-[state=active]:text-white">
                  All Responses
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Response Timeline */}
                  <Card className="bg-white border border-black/10">
                    <CardHeader>
                      <CardTitle className="text-black">Response Timeline</CardTitle>
                      <CardDescription>Responses over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <Line data={timelineChartData} options={timelineChartOptions} />
                    </div>
                  </CardContent>
                </Card>

                  {/* Device Breakdown */}
                  <Card className="bg-white border border-black/10">
                    <CardHeader>
                      <CardTitle className="text-black">Device Breakdown</CardTitle>
                      <CardDescription>Responses by device type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <Pie data={deviceChartData} options={deviceChartOptions} />
                        </div>
                      <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-black/40" />
                            <span className="text-sm text-black/70">Desktop</span>
                      </div>
                          <span className="font-semibold text-black">{deviceBreakdown.desktop}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-black/40" />
                            <span className="text-sm text-black/70">Mobile</span>
                      </div>
                          <span className="font-semibold text-black">{deviceBreakdown.mobile}</span>
                          </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Tablet className="h-4 w-4 text-black/40" />
                            <span className="text-sm text-black/70">Tablet</span>
                          </div>
                          <span className="font-semibold text-black">{deviceBreakdown.tablet}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Response Status Breakdown */}
                <Card className="bg-white border border-black/10">
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
                              <div className="bg-[#7B3FE4]/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-[#7B3FE4] font-semibold">{idx + 1}</span>
                      </div>
                              <div className="flex-1">
                                <CardTitle className="text-black mb-2">{data.question}</CardTitle>
                                <CardDescription>
                                  {data.answers.length} {data.answers.length === 1 ? 'response' : 'responses'} • {' '}
                                  {isNumeric ? 'Rating/Scale Question' : 'Text/Choice Question'}
                                </CardDescription>
                                </div>
                                </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {isNumeric && stats && (
                              <>
                                {/* Numeric Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-[#7B3FE4]/5 rounded-lg p-4 border border-[#7B3FE4]/10">
                                    <p className="text-xs text-black/60 mb-1">Average</p>
                                    <p className="text-2xl font-semibold text-black">{stats.avg.toFixed(1)}</p>
                              </div>
                                  <div className="bg-[#7B3FE4]/5 rounded-lg p-4 border border-[#7B3FE4]/10">
                                    <p className="text-xs text-black/60 mb-1">Median</p>
                                    <p className="text-2xl font-semibold text-black">{stats.median.toFixed(1)}</p>
                              </div>
                                  <div className="bg-[#7B3FE4]/5 rounded-lg p-4 border border-[#7B3FE4]/10">
                                    <p className="text-xs text-black/60 mb-1">Minimum</p>
                                    <p className="text-2xl font-semibold text-black">{stats.min}</p>
                            </div>
                                  <div className="bg-[#7B3FE4]/5 rounded-lg p-4 border border-[#7B3FE4]/10">
                                    <p className="text-xs text-black/60 mb-1">Maximum</p>
                                    <p className="text-2xl font-semibold text-black">{stats.max}</p>
                      </div>
                </div>

                                {/* Distribution Chart */}
                                {stats.distribution && stats.distributionLabels && (
                                  <div>
                                    <h4 className="font-medium text-black mb-3">Response Distribution</h4>
                                    <div className="h-[200px]">
                                      <Bar
                            data={{
                                          labels: stats.distributionLabels.map((v: number) => v.toString()),
                              datasets: [{
                                            label: 'Count',
                                            data: stats.distribution,
                                            backgroundColor: '#7B3FE4',
                                            borderRadius: 4,
                              }],
                            }}
                                        options={{
                                          responsive: true,
                                          maintainAspectRatio: false,
                                          plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                              padding: 12,
                                            },
                                          },
                                          scales: {
                                            y: {
                                              beginAtZero: true,
                                              grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                              ticks: { font: { size: 11 }, color: '#000', stepSize: 1 },
                                            },
                                            x: {
                                              grid: { display: false },
                                              ticks: { font: { size: 11 }, color: '#000' },
                                            },
                                          },
                                        }}
                                      />
                        </div>
                      </div>
                                )}
                              </>
                            )}

                            {!isNumeric && textFreq.length > 0 && (
                            <div>
                                <h4 className="font-medium text-black mb-4">Top Responses</h4>
                                <div className="space-y-3">
                                  {textFreq.slice(0, 5).map((item, i) => (
                                    <div key={i} className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm text-black/80 flex-1 break-words pr-4">
                                          {item.value.length > 100 ? `${item.value.substring(0, 100)}...` : item.value}
                                        </p>
                                        <Badge className="bg-[#7B3FE4]/10 text-[#7B3FE4] border-[#7B3FE4]/20">
                                          {item.count} ({item.percentage.toFixed(1)}%)
                                        </Badge>
                          </div>
                                      <Progress value={item.percentage} className="h-2" />
                            </div>
                                  ))}
                                  {textFreq.length > 5 && (
                                    <p className="text-xs text-black/50 text-center mt-4">
                                      Showing top 5 of {textFreq.length} unique responses
                                    </p>
                                  )}
                          </div>
                      </div>
                            )}
                    </CardContent>
                  </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Engagement Tab */}
              <TabsContent value="engagement" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Hourly Activity */}
                  <Card className="bg-white border border-black/10">
                    <CardHeader>
                      <CardTitle className="text-black">Hourly Activity</CardTitle>
                      <CardDescription>When users submit responses throughout the day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <Bar data={hourlyChartData} options={hourlyChartOptions} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Completion Rate by Device */}
                  <Card className="bg-white border border-black/10">
                    <CardHeader>
                      <CardTitle className="text-black">Completion Rate by Device</CardTitle>
                      <CardDescription>How well each device type performs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {['Desktop', 'Mobile', 'Tablet'].map(device => {
                          const deviceResponses = filteredResponses.filter(r => r.device === device);
                          const deviceCompleted = deviceResponses.filter(r => r.completionStatus === 'complete').length;
                          const deviceRate = deviceResponses.length > 0 ? deviceCompleted / deviceResponses.length : 0;
                          
                          return (
                            <div key={device}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-black">{device}</span>
                                <span className="text-lg font-semibold text-black">
                                  {Math.round(deviceRate * 100)}%
                                </span>
                        </div>
                              <Progress value={deviceRate * 100} className="h-3" />
                              <p className="text-xs text-black/50 mt-1">
                                {deviceCompleted} of {deviceResponses.length} completed
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

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
                              <Badge className="bg-[#7B3FE4]/10 text-[#7B3FE4] border-[#7B3FE4]/20">
                                {count}
                              </Badge>
                </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Geographic Tab */}
              <TabsContent value="geographic" className="space-y-6">
                <Card className="bg-white border border-black/10">
                  <CardHeader>
                    <CardTitle className="text-black flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-[#7B3FE4]" />
                      Geographic Distribution
                    </CardTitle>
                    <CardDescription>
                      {locationData.length > 0 
                        ? `${locationData.length} location${locationData.length === 1 ? '' : 's'} plotted on map`
                        : 'Location data from responses (if available)'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {locationData.length === 0 ? (
                      <div className="p-12 text-center">
                        <MapPin className="h-12 w-12 text-black/20 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-black mb-2">No location data</h3>
                        <p className="text-black/60">Location data will appear here if users allow location access.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Leaflet Map */}
                        <div className="w-full h-[500px] rounded-lg overflow-hidden border border-black/10">
                        <MapContainer
                            center={mapCenter}
                            zoom={locationData.length === 1 ? 3 : 1}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                            minZoom={1}
                            maxZoom={10}
                        >
                          <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                            {locationData.map((loc, idx) => (
                            <CircleMarker
                                key={`${loc.lat}-${loc.lng}-${idx}`}
                              center={[loc.lat, loc.lng]}
                                radius={Math.min(Math.max(loc.count * 2, 5), 20)}
                                fillColor="#7B3FE4"
                                color="#7B3FE4"
                                weight={2}
                              opacity={0.8}
                                fillOpacity={0.6}
                            >
                              <Popup>
                                  <div className="p-2">
                                    <p className="font-semibold text-black mb-1">
                                      {loc.count} {loc.count === 1 ? 'Response' : 'Responses'}
                                    </p>
                                    <p className="text-xs text-black/60">
                                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                                    </p>
                                  </div>
                              </Popup>
                            </CircleMarker>
                          ))}
                        </MapContainer>
                    </div>
                        
                        {/* Location Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {locationData.slice(0, 12).map((loc, idx) => (
                            <div key={idx} className="bg-black/5 rounded-lg p-4 border border-black/10">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-[#7B3FE4]" />
                                <span className="text-sm font-medium text-black">
                                  Location #{idx + 1}
                                </span>
                                <Badge className="bg-[#7B3FE4]/10 text-[#7B3FE4] border-[#7B3FE4]/20 ml-auto">
                                  {loc.count}
                  </Badge>
                </div>
                              <p className="text-xs text-black/60">
                                {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                              </p>
                                </div>
                          ))}
                              </div>
                        {locationData.length > 12 && (
                          <p className="text-xs text-black/50 text-center">
                            Showing 12 of {locationData.length} locations
                          </p>
                        )}
                        
                        {/* Country Statistics */}
                        {countryStats.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-semibold text-black mb-4 flex items-center gap-2">
                              <Globe className="h-5 w-5 text-[#7B3FE4]" />
                              Responses by Country
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {countryStats.map((stat) => (
                                <div
                                  key={stat.country}
                                  className="flex items-center justify-between p-3 bg-black/5 rounded-lg border border-black/10 hover:bg-black/10 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">{getCountryFlag(stat.country)}</span>
                                    <span className="text-sm font-medium text-black">{stat.country}</span>
                              </div>
                                  <Badge className="bg-[#7B3FE4]/10 text-[#7B3FE4] border-[#7B3FE4]/20 font-semibold">
                                    {stat.count}
                                  </Badge>
                            </div>
                              ))}
                          </div>
                                </div>
                        )}
                                </div>
                    )}
                  </CardContent>
                </Card>
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
                          {/* Response Count Info */}
                          <div className="mb-4 p-3 bg-[#7B3FE4]/5 rounded-lg border border-[#7B3FE4]/20">
                            <p className="text-sm text-black/80">
                              Showing <span className="font-semibold text-black">{filteredResponses.length}</span> of{' '}
                              <span className="font-semibold text-black">{totalResponseCount || filteredResponses.length}</span> total responses
                            </p>
                          </div>
                          
                          {filteredResponses.map((response) => (
                            <Sheet key={response.id}>
                              <SheetTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full h-auto p-4 justify-between text-left hover:bg-[#7B3FE4]/5 hover:border-[#7B3FE4]/30 transition-all"
                                >
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className={`p-2 rounded-lg ${
                                      response.completionStatus === 'complete' 
                                        ? 'bg-green-100' 
                                        : 'bg-yellow-100'
                                    }`}>
                                      {response.completionStatus === 'complete' ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-yellow-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-black">
                                        {format(new Date(response.completedAt), 'MMM dd, yyyy h:mm a')}
                                      </p>
                                      <div className="flex items-center gap-3 mt-1">
                                        {response.device && (
                                          <Badge variant="outline" className="text-xs border-black/10 text-black/60">
                                            {response.device}
                                          </Badge>
                                        )}
                                        {response.totalTime && (
                                          <span className="text-xs text-black/50">
                                            {formatTime(response.totalTime)}
                                      </span>
                                        )}
                                        {response.referral && (
                                          <span className="text-xs text-black/50 truncate max-w-[150px]">
                                            {formatReferralSource(response.referral)}
                                          </span>
                                        )}
                                    </div>
                                    </div>
                                    <Badge className={
                                      response.completionStatus === 'complete'
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    }>
                                      {response.completionStatus === 'complete' ? 'Complete' : 'Partial'}
                                    </Badge>
                                  </div>
                                    </Button>
                                  </SheetTrigger>
                              <SheetContent className="w-full sm:w-[600px] overflow-y-auto">
                                    <SheetHeader>
                                  <SheetTitle>Response Details</SheetTitle>
                                  <SheetDescription>
                                    Submitted on {format(new Date(response.completedAt), 'PPpp')}
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
