import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Clock, TrendingUp, Users, X, Lock, Crown } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useUserCredits } from '@/hooks/useUserCredits';
import FeatureGate from '@/components/ui/FeatureGate';

export interface InsightHistoryItem {
  id: string;
  formId: string;
  summary: string;
  keyInsights: string[];
  responseCount: number;
  timestamp: Date;
  metrics: {
    completionRate: number;
    avgCompletionTime: number;
    totalResponses: number;
  };
}

interface InsightHistoryProps {
  formId: string | null;
  onSelectVersion?: (item: InsightHistoryItem) => void;
  onUpgrade?: () => void;
  onBuyCredits?: () => void;
}

const InsightHistory: React.FC<InsightHistoryProps> = ({ 
  formId, 
  onSelectVersion, 
  onUpgrade, 
  onBuyCredits 
}) => {
  const [history, setHistory] = useState<InsightHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { userType } = useUserCredits();

  useEffect(() => {
    if (formId && isOpen) {
      loadHistory();
    }
  }, [formId, isOpen]);

  const loadHistory = async () => {
    if (!formId) return;
    
    setLoading(true);
    try {
      const db = getFirestore();
      // Read from the actual collection where Analytics saves summaries:
      // forms/{formId}/ai_summaries ordered by generatedAt desc
      const summariesRef = collection(db, 'forms', formId, 'ai_summaries');
      const q = query(
        summariesRef,
        orderBy('generatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const items: InsightHistoryItem[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          formId: data.formId || formId,
          summary: data.summaryText || data.summary || '',
          keyInsights: data.keyInsights || [],
          responseCount: data.responseCount || 0,
          timestamp: (data.generatedAt && typeof data.generatedAt.toDate === 'function')
            ? data.generatedAt.toDate()
            : new Date(),
          metrics: data.metrics || {
            completionRate: 0,
            avgCompletionTime: 0,
            totalResponses: data.responseCount || 0,
          },
        });
      });
      
      setHistory(items);
    } catch (error) {
      console.error('Error loading insight history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!formId) return null;

  // AI Insight Engine is locked for credit users
  const isLocked = userType === 'credit';

  const HistoryButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
    <div ref={ref} className="relative group" {...props}>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "gap-2 border-gray-300 bg-white text-[#2E2E2E] hover:bg-gray-50",
          isLocked && "opacity-60 cursor-not-allowed"
        )}
        onClick={() => {
          if (isLocked && onUpgrade) {
            onUpgrade();
          }
        }}
      >
        <History className="h-4 w-4" />
        View History
        {isLocked && <Lock className="h-3 w-3 ml-1" />}
      </Button>
      
      {isLocked && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          🔒 Upgrade to Pro to access insight history
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  ));
  HistoryButton.displayName = "HistoryButton";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <HistoryButton />
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-[#2E2E2E]">Analytics Insight History</DialogTitle>
          <DialogDescription className="text-gray-600">
            View all AI-generated insights and summaries for this form's responses.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8F00FF]"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No insight history yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Insights will be saved here as they're generated
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <Card
                  key={item.id}
                  className={cn(
                    "bg-white border border-gray-200 hover:border-[#8F00FF]/30 transition-colors cursor-pointer",
                    index === 0 && "border-[#8F00FF]/50"
                  )}
                  onClick={() => {
                    onSelectVersion?.(item);
                    setIsOpen(false);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Badge className="bg-[#8F00FF]/10 text-[#8F00FF] border-[#8F00FF]/20">
                            Latest
                          </Badge>
                        )}
                        <CardTitle className="text-base font-semibold text-[#2E2E2E]">
                          Version {history.length - index}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#2E2E2E] line-clamp-2 mb-3">
                      {item.summary}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{item.responseCount} responses</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{(item.metrics.completionRate * 100).toFixed(1)}% completion</span>
                      </div>
                    </div>
                    {item.keyInsights.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-700 mb-1">Key Insights:</p>
                        <ul className="space-y-1">
                          {item.keyInsights.slice(0, 2).map((insight, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                              <span className="text-[#8F00FF] mt-0.5">•</span>
                              <span className="line-clamp-1">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-3 text-xs text-gray-500">
                      {format(item.timestamp, 'PPp')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default InsightHistory;

