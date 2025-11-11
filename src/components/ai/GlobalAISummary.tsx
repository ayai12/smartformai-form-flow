import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Sparkles, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export interface GlobalAISummaryProps {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  timestamp?: Date;
  responseCount: number;
  onRefresh?: () => void;
  isGenerating?: boolean;
}

const GlobalAISummary: React.FC<GlobalAISummaryProps> = ({
  summary,
  keyInsights,
  recommendations,
  timestamp,
  responseCount,
  onRefresh,
  isGenerating = false,
}) => {
  return (
    <Card className="bg-gradient-to-br from-[#424245] to-[#353538] border-[#525255] rounded-2xl shadow-2xl mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0066cc]/20 rounded-xl">
              <BrainCircuit className="h-6 w-6 text-[#0066cc]" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">
                AI Intelligence Summary
              </CardTitle>
              <p className="text-sm text-[#b0b0b0] mt-0.5">
                {responseCount} responses analyzed
              </p>
            </div>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isGenerating}
              className="text-[#e6e6e6] hover:text-white hover:bg-[#525255]"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Text */}
        <div className="bg-[#353538] rounded-xl p-5 border border-[#525255]">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[#0066cc] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[#e6e6e6] leading-relaxed text-base">{summary}</p>
              {timestamp && (
                <div className="flex items-center gap-2 mt-3 text-xs text-[#b0b0b0]">
                  <Clock className="h-3.5 w-3.5" />
                  Updated {formatDistanceToNow(timestamp, { addSuffix: true })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Insights */}
        {keyInsights.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[#e6e6e6] mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#0066cc] rounded-full" />
              Key Insights
            </h3>
            <div className="space-y-2">
              {keyInsights.map((insight, index) => (
                <div
                  key={index}
                  className="bg-[#353538] rounded-lg p-3 border border-[#525255]"
                >
                  <p className="text-sm text-[#e6e6e6]">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[#e6e6e6] mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#00D084] rounded-full" />
              Recommendations
            </h3>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="bg-[#353538] rounded-lg p-3 border border-[#525255] flex items-start gap-2"
                >
                  <Badge className="bg-[#00D084]/20 text-[#00D084] border-[#00D084]/30 text-xs mt-0.5">
                    {index + 1}
                  </Badge>
                  <p className="text-sm text-[#e6e6e6] flex-1">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GlobalAISummary;

