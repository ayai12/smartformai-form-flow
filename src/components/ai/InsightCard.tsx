import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface InsightCardProps {
  metric: string;
  value: string | number;
  insight: string;
  suggestion?: string;
  delta?: number;
  deltaLabel?: string;
  confidence?: 'low' | 'medium' | 'high';
  onFeedback?: (helpful: boolean) => void;
  feedbackState?: 'helpful' | 'not-helpful' | null;
}

const InsightCard: React.FC<InsightCardProps> = ({
  metric,
  value,
  insight,
  suggestion,
  delta,
  deltaLabel,
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
    high: 'bg-green-500/10 text-green-600 border-green-500/20',
    medium: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    low: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  };

  const deltaIcon = delta !== undefined ? (
    delta > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : delta < 0 ? (
      <TrendingDown className="h-4 w-4 text-red-600" />
    ) : (
      <Minus className="h-4 w-4 text-gray-500" />
    )
  ) : null;

  return (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-[#2E2E2E]">{metric}</h4>
              {confidence && (
                <Badge className={cn('text-xs border', confidenceColors[confidence])}>
                  {confidence}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-[#2E2E2E] mb-1">{value}</p>
            {delta !== undefined && deltaLabel && (
              <div className="flex items-center gap-1 text-sm">
                {deltaIcon}
                <span className={cn(
                  'font-medium',
                  delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-500'
                )}>
                  {delta > 0 ? '+' : ''}{delta}% {deltaLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-[#8F00FF] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#2E2E2E] leading-relaxed">{insight}</p>
          </div>
          {suggestion && (
            <p className="text-xs text-gray-600 mt-2 ml-6 italic">{suggestion}</p>
          )}
        </div>

        {onFeedback && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
            <span className="text-xs text-gray-600">Was this helpful?</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 w-7 p-0',
                  localFeedback === 'helpful' ? 'bg-green-500/20 text-green-600' : 'text-gray-500 hover:text-green-600'
                )}
                onClick={() => handleFeedback(true)}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 w-7 p-0',
                  localFeedback === 'not-helpful' ? 'bg-red-500/20 text-red-600' : 'text-gray-500 hover:text-red-600'
                )}
                onClick={() => handleFeedback(false)}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightCard;

