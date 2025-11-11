import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BrainCircuit, 
  Sparkles, 
  Clock, 
  Users, 
  RefreshCw, 
  History, 
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  Search,
  Lightbulb,
  CheckCircle2,
  Rocket,
  ArrowRightCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { CREDIT_COSTS } from '@/firebase/credits';

export interface AISummaryData {
  id: string;
  text: string;
  createdAt: any;
  responseCount: number;
  stage: number;
  formTitle?: string;
}

export interface AISummaryProps {
  formId: string;
  responses: any[];
  currentInsight: { text: string; createdAt: any; responseCount: number; id?: string } | null;
  setCurrentInsight: (insight: { text: string; createdAt: any; responseCount: number; id?: string } | null) => void;
  insightHistory: Array<{ id: string; text: string; createdAt: any; responseCount: number; stage: number; formTitle?: string; }>;
  setInsightHistory: (history: Array<{ id: string; text: string; createdAt: any; responseCount: number; stage: number; formTitle?: string; }>) => void;
  generatingInsight: boolean;
  setGeneratingInsight: (generating: boolean) => void;
  lastInsightResponseCount: number;
  setLastInsightResponseCount: (count: number) => void;
  lastInsightGenerationTime: number;
  setLastInsightGenerationTime: (time: number) => void;
  userPlan: 'free' | 'pro' | null;
  getInsightStage: (responseCount: number, lastGeneratedCount: number) => { stage: number; shouldGenerate: boolean };
  loadInsightHistory: (formId: string) => Promise<void>;
}

const AISummary: React.FC<AISummaryProps> = ({
  formId,
  responses,
  currentInsight,
  setCurrentInsight,
  insightHistory,
  setInsightHistory,
  generatingInsight,
  setGeneratingInsight,
  lastInsightResponseCount,
  setLastInsightResponseCount,
  lastInsightGenerationTime,
  setLastInsightGenerationTime,
  userPlan,
  getInsightStage,
  loadInsightHistory,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'recent' | 'high-response'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'response-count'>('date');

  const responseCount = responses.length;
  const formTitle = responses[0]?.formTitle || 'Survey';
  const creditCost = CREDIT_COSTS.ANALYZE_RESPONSES;

  // Get user credits and plan info
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    const fetchUserCredits = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserCredits(userDoc.data().credits || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching user credits:', error);
      }
    };

    fetchUserCredits();
  }, []);

  const canGenerateSummary = () => {
    if (responseCount < 5) return false;
    if (userPlan === 'free' && userCredits < creditCost) return false;
    return true;
  };

  const getGenerationReason = () => {
    if (responseCount < 5) {
      return `Need ${5 - responseCount} more responses to generate insights`;
    }
    if (userPlan === 'free' && userCredits < creditCost) {
      return `Insufficient credits. Need ${creditCost} credits to generate summary`;
    }
    return null;
  };

  const shouldAutoGenerate = () => {
    const { shouldGenerate } = getInsightStage(responseCount, lastInsightResponseCount);
    return shouldGenerate;
  };

  const getSummaryConfidence = () => {
    if (responseCount >= 100) return { level: 'high', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (responseCount >= 50) return { level: 'medium', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (responseCount >= 20) return { level: 'good', color: 'text-purple-600', bgColor: 'bg-purple-50' };
    return { level: 'initial', color: 'text-orange-600', bgColor: 'bg-orange-50' };
  };

  const formatSummaryText = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return <h3 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2">{line.replace('## ', '')}</h3>;
      } else if (line.startsWith('• ')) {
        return <li key={index} className="text-gray-700 ml-4 mb-1">{line.replace('• ', '')}</li>;
      } else if (line.startsWith('**') && line.includes('**:')) {
        const [title, ...content] = line.replace('**', '').split('**: ');
        return <p key={index} className="text-gray-800 mb-2"><strong>{title}:</strong> {content.join('**: ')}</p>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index} className="text-gray-800 mb-2">{line}</p>;
      }
    });
  };

  // Auto-generate summary when conditions are met
  useEffect(() => {
    if (shouldAutoGenerate() && !generatingInsight && formId) {
      handleGenerateSummary();
    }
  }, [responseCount, formId]);

  // Load insight history when form changes
  useEffect(() => {
    if (formId) {
      loadInsightHistory(formId);
    }
  }, [formId]);

  const handleGenerateSummary = async () => {
    if (!canGenerateSummary()) {
      const reason = getGenerationReason();
      if (reason) {
        toast.error(reason);
      }
      return;
    }

    if (insightHistory.some(item => item.responseCount === responseCount)) {
      toast.info('An insight for this response count has already been generated.');
      return;
    }

    setGeneratingInsight(true);
    
    try {
      const responseDataSummary = generateResponseDataSummary();
      const insight = generateExpertAnalysis(responseDataSummary);
      
      if (insight) {
        const newInsight = {
          id: Date.now().toString(),
          text: JSON.stringify(insight), // The entire insight object is stringified
          createdAt: new Date(),
          responseCount: responseCount,
          formTitle: formTitle
        };
        
        setCurrentInsight(newInsight);
        setLastInsightResponseCount(responseCount);
        setLastInsightGenerationTime(Date.now());
        
        const newHistoryItem: AISummaryData = {
          id: newInsight.id,
          text: newInsight.text,
          createdAt: newInsight.createdAt,
          responseCount: newInsight.responseCount,
          stage: getInsightStage(responseCount, lastInsightResponseCount).stage,
          formTitle: newInsight.formTitle
        };
        
        setInsightHistory([newHistoryItem, ...insightHistory]);
        
        toast.success('AI summary generated successfully!');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate AI summary');
    } finally {
      setGeneratingInsight(false);
    }
  };

  const handleRefreshSummary = async () => {
    await handleGenerateSummary();
  };

  const generateExpertAnalysis = (responseData: any): object => {
    const {
      completionRates,
      deviceBreakdown,
      timeAnalysis,
      questionStats,
      trends,
      referrers,
      geo,
    } = responseData;

    const totalResponses = responses.length;
    const completeResponses = completionRates.complete;
    const completionRate = totalResponses > 0 ? parseFloat((completeResponses / totalResponses * 100).toFixed(1)) : 0;

    // Key Insights
    const keyInsights = [];
    if (completionRate < 70) {
      keyInsights.push(`Low completion rate (${completionRate}%) suggests potential friction.`);
    }
    const highDropOffQuestion = questionStats.dropOffs.find(q => q.dropOffRate > 50);
    if (highDropOffQuestion) {
      keyInsights.push(`High drop-off rate (${highDropOffQuestion.dropOffRate}%) at "${highDropOffQuestion.question}".`);
    }
    if (deviceBreakdown.mobile > 70) {
      keyInsights.push('Audience is heavily mobile-dominant.');
    }

    // Recommendations
    const recommendations = [];
    if (completionRate < 70) {
      recommendations.push('Review survey length and question complexity to improve completion rates.');
    }
    if (highDropOffQuestion) {
      recommendations.push(`Simplify or clarify Question "${highDropOffQuestion.question}" to reduce drop-offs.`);
    }
    if (trends.completion.direction === 'decreasing') {
      recommendations.push('Investigate the recent decline in completion rates.');
    }

    // Summary
    let summary = `Overall performance is ${completionRate > 80 ? 'strong' : 'fair'}. `;
    if (keyInsights.length > 0) {
      summary += `Key areas for improvement include addressing the ${keyInsights.join(' ')}`;
    }

    return {
      summary,
      keyInsights,
      recommendations,
      // Keep the detailed structure for rendering
      details: {
        title: 'INTELLIGENCE REPORT',
        responsesAnalyzed: totalResponses,
        kpis: {
          title: 'KEY PERFORMANCE INDICATORS',
          completionRate: `${completionRate}% (${completeResponses}/${totalResponses})`,
          avgCompletionTime: `${timeAnalysis.averageTime} minutes`,
          deviceSplit: `Mobile ${deviceBreakdown.mobile}% | Desktop ${deviceBreakdown.desktop}% | Tablet ${deviceBreakdown.tablet}%`,
        },
        responseQuality: {
          title: 'RESPONSE QUALITY',
          significance: responseCount >= 100 ? 'EXCELLENT' : responseCount >= 50 ? 'GOOD' : 'FAIR',
          reliability: responseCount >= 100 ? 'HIGH' : responseCount >= 50 ? 'MEDIUM' : 'LOW',
        },
        behavioralInsights: {
          title: 'BEHAVIORAL INSIGHTS',
          engagement: `${completionRate >= 80 ? 'High' : 'Moderate'} user interaction detected.`,
          devicePreference: `${deviceBreakdown.mobile > 60 ? 'Mobile-first' : 'Multi-device'} audience.`,
          peakHours: `Most responses collected during ${timeAnalysis.peakHours.join(', ')}.`
        },
        strategicRecommendations: {
          title: 'STRATEGIC RECOMMENDATIONS',
          recommendations: recommendations.map(r => ({ priority: 'High', action: r})),
          nextSteps: 'Continue tracking patterns and adjust strategy.',
        },
      }
    };
  };

  const generateResponseDataSummary = (): object => {
    // Generate summary of response data for AI analysis
    const completionRates = {
      complete: responses.filter(r => r.completionStatus === 'complete').length,
      partial: responses.filter(r => r.completionStatus === 'partial').length,
      abandoned: responses.filter(r => r.completionStatus === 'abandoned').length
    };

    const deviceBreakdown = {
      desktop: responses.filter(r => r.device === 'desktop').length,
      mobile: responses.filter(r => r.device === 'mobile').length,
      tablet: responses.filter(r => r.device === 'tablet').length
    };

    const avgCompletionTime = responses.reduce((sum, r) => sum + (r.totalTime || 0), 0) / responses.length;

    return {
      totalResponses: responseCount,
      completionRates,
      deviceBreakdown,
      timeAnalysis: {
        averageTime: Math.round(avgCompletionTime),
        peakHours: [], // Add a default value for peakHours
      },
      responseTrends: getResponseTrends(),
      commonReferrers: getCommonReferrers(),
      geographicDistribution: getGeographicDistribution(),
      questionStats: {},
    };
  };

  const getResponseTrends = () => {
    // Simple trend analysis
    const lastWeek = responses.filter(r => {
      const date = new Date(r.completedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;

    const previousWeek = responses.filter(r => {
      const date = new Date(r.completedAt);
      const twoWeeksAgo = new Date();
      const oneWeekAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    }).length;

    return {
      lastWeek,
      previousWeek,
      growth: previousWeek > 0 ? Math.round(((lastWeek - previousWeek) / previousWeek) * 100) : 0
    };
  };

  const getCommonReferrers = () => {
    const referrers: Record<string, number> = {};
    responses.forEach(r => {
      if (r.referral) {
        referrers[r.referral] = (referrers[r.referral] || 0) + 1;
      }
    });
    
    return Object.entries(referrers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));
  };

  const getGeographicDistribution = () => {
    const countries: Record<string, number> = {};
    responses.forEach(r => {
      if (r.location?.lat && r.location?.lng) {
        // Simple country detection based on coordinates (you might want to use a more sophisticated method)
        const country = detectCountryFromCoordinates(r.location.lat, r.location.lng);
        countries[country] = (countries[country] || 0) + 1;
      }
    });
    
    return Object.entries(countries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));
  };

  const detectCountryFromCoordinates = (lat: number, lng: number): string => {
    // Very basic country detection - you might want to use a proper geocoding service
    if (lat > 24 && lat < 50 && lng > -125 && lng < -65) return 'United States';
    if (lat > 49 && lat < 85 && lng > -141 && lng < -52) return 'Canada';
    if (lat > 49 && lat < 61 && lng > -8 && lng < 2) return 'United Kingdom';
    if (lat > 20 && lat < 50 && lng > 70 && lng < 140) return 'China';
    if (lat > 8 && lat < 37 && lng > 68 && lng < 97) return 'India';
    if (lat > -44 && lat < -10 && lng > 112 && lng < 154) return 'Australia';
    return 'Unknown';
  };

  const getFilteredHistory = () => {
    let filtered = [...insightHistory];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(summary => 
        summary.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.formTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (historyFilter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(summary => new Date(summary.createdAt) >= oneWeekAgo);
    } else if (historyFilter === 'high-response') {
      filtered = filtered.filter(summary => summary.responseCount >= 50);
    }

    // Apply sorting
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'response-count') {
      filtered.sort((a, b) => b.responseCount - a.responseCount);
    }

    return filtered;
  };

  const confidence = getSummaryConfidence();

  const renderInsight = (insight: any) => {
    if (!insight || !insight.summary || !insight.keyInsights || !insight.recommendations) {
      // Handle cases where the insight object is not what we expect
      return <p>Could not load insights. Please try regenerating the report.</p>;
    }
  
    const { summary, keyInsights, recommendations } = insight;
  
    return (
      <div className="space-y-6">
        {/* Summary Section */}
        <div className="text-center pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Intelligence Summary</h2>
          <p className="text-base text-gray-600 mt-2 max-w-2xl mx-auto">{summary}</p>
        </div>
  
        {/* Key Insights & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Key Insights
            </h3>
            <ul className="space-y-3">
              {keyInsights.map((insight: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-500" />
              Recommendations
            </h3>
            <ul className="space-y-3">
              {recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <ArrowRightCircle className="h-5 w-5 text-indigo-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main AI Summary Card */}
      <Card className="bg-gradient-to-br from-purple-50 via-white to-blue-50 border-purple-200 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  AI Intelligence Report
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {responses.length} responses analyzed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentInsight && (
                <Badge className={`${confidence.bgColor} ${confidence.color} border-0`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {confidence.level.charAt(0).toUpperCase() + confidence.level.slice(1)} Confidence
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                History ({insightHistory.length})
                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {currentInsight ? (
            <div className="space-y-4">
              {/* Summary Content */}
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-gray-800 leading-relaxed">
                      {renderInsight(JSON.parse(currentInsight.text))}
                    </div>
                  </div>
                </div>
                
                {/* Summary Metadata */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(currentInsight.createdAt, { addSuffix: true })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Based on {currentInsight.responseCount} responses
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSummary}
                    disabled={generatingInsight || !canGenerateSummary()}
                    className="gap-2"
                  >
                    {generatingInsight ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh Analysis
                  </Button>
                </div>
              </div>
              
              {/* Credit Information */}
              {userPlan === 'free' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      This analysis used {creditCost} credits. You have {userCredits} credits remaining.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BrainCircuit className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {responseCount < 5 ? 'Building Intelligence...' : 'Ready for Analysis'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {responseCount < 5 
                    ? `Collect ${5 - responseCount} more responses to unlock AI-powered insights that will help you understand your audience better.`
                    : 'Generate your first AI intelligence report to discover patterns, trends, and actionable insights from your responses.'
                  }
                </p>
              </div>
              
              {responseCount >= 5 && (
                <Button
                  onClick={handleGenerateSummary}
                  disabled={generatingInsight || !canGenerateSummary()}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {generatingInsight ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing Data...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Intelligence Report
                    </>
                  )}
                </Button>
              )}
              
              {getGenerationReason() && (
                <p className="text-sm text-gray-500 mt-3">
                  {getGenerationReason()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Section */}
      {showHistory && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Analysis History</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search summaries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                <Select value={historyFilter} onValueChange={(value: any) => setHistoryFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="recent">Recent (7 days)</SelectItem>
                    <SelectItem value="high-response">High Response (50+)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="response-count">Sort by Responses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {getFilteredHistory().map((summary, index) => (
                  <div key={summary.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">#{insightHistory.length - index}</span>
                        <Badge variant="outline" className="text-xs">
                          {summary.responseCount} responses
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(summary.createdAt, 'MMM dd, yyyy h:mm a')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {summary.text.substring(0, 200)}{summary.text.length > 200 ? '...' : ''}
                    </div>
                  </div>
                ))}
                {getFilteredHistory().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No summaries match your filters.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AISummary;