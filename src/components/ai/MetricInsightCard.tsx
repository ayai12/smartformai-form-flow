import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MetricInsightCardProps {
  metricName: string;
  insight: string;
  recommendation?: string;
  confidence?: 'low' | 'medium' | 'high';
  onFeedback?: (helpful: boolean) => void;
  feedbackState?: 'helpful' | 'not-helpful' | null;
}

const MetricInsightCard: React.FC<MetricInsightCardProps> = ({
  metricName,
  insight,
  recommendation,
  confidence = 'medium',
  onFeedback,
  feedbackState,
}) => {
  const [localFeedback, setLocalFeedback] = useState<'helpful' | 'not-helpful' | null>(feedbackState || null);

  const handleFeedback = (helpful: boolean) => {
    const newState = helpful ? 'helpful' : 'not-helpful';
    setLocalFeedback(newState);
    onFeedback?.(helpful);
  };

  const confidenceColors = {
    high: 'bg-green-500/10 text-green-700 border-green-500/20',
    medium: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    low: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  };

  return (
    <Card className="bg-[#F5F5F7] border-l-4 border-l-[#8F00FF] rounded-lg shadow-sm mt-4 animate-in fade-in duration-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-[#8F00FF]/10 rounded-md flex-shrink-0">
            <Lightbulb className="h-4 w-4 text-[#8F00FF]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-[#2E2E2E]">{metricName} Analysis</h4>
              {confidence && (
                <Badge className={cn('text-xs border', confidenceColors[confidence])}>
                  {confidence}
                </Badge>
              )}
            </div>
            <p className="text-sm text-[#2E2E2E] leading-relaxed mb-2">
              {insight}
            </p>
            {recommendation && (
              <p className="text-xs text-gray-600 italic mt-2">
                💡 {recommendation}
              </p>
            )}
            {onFeedback && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-600">Helpful?</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-6 w-6 p-0',
                      localFeedback === 'helpful' ? 'bg-green-500/20 text-green-600' : 'text-gray-500 hover:text-green-600'
                    )}
                    onClick={() => handleFeedback(true)}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-6 w-6 p-0',
                      localFeedback === 'not-helpful' ? 'bg-red-500/20 text-red-600' : 'text-gray-500 hover:text-red-600'
                    )}
                    onClick={() => handleFeedback(false)}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricInsightCard;

