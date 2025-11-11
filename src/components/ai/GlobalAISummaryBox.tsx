import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, RefreshCw, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface GlobalAISummaryBoxProps {
  summary: string;
  timestamp?: Date;
  responseCount: number;
  onRefresh?: () => void;
  isGenerating?: boolean;
  keyInsights?: string[];
}

const GlobalAISummaryBox: React.FC<GlobalAISummaryBoxProps> = ({
  summary,
  timestamp,
  responseCount,
  onRefresh,
  isGenerating = false,
  keyInsights = [],
}) => {
  return (
    <Card className="bg-white border-2 border-[#8F00FF]/30 rounded-2xl shadow-xl mb-8 relative overflow-hidden ring-2 ring-[#8F00FF]/10">
      {/* Purple accent glow - more prominent */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#8F00FF] to-transparent opacity-60" />
      
      <CardHeader className="pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8F00FF]/10 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-[#8F00FF]" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-[#2E2E2E]">
                AI Summary
              </CardTitle>
              <p className="text-sm text-gray-600 mt-0.5">
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
              className="text-[#8F00FF] hover:text-[#8F00FF] hover:bg-[#8F00FF]/10"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Regenerate</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Main Summary Text */}
        <div className="prose prose-sm max-w-none">
          <p className="text-[#2E2E2E] leading-relaxed text-base mb-4">
            {summary || 'Your AI Analyst is reviewing new responses…'}
          </p>
        </div>

        {/* Key Insights */}
        {keyInsights.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-[#2E2E2E] mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#8F00FF] rounded-full" />
              Key Highlights
            </h4>
            <ul className="space-y-2">
              {keyInsights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#8F00FF] mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer with timestamp */}
        {timestamp && (
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Last updated {formatDistanceToNow(timestamp, { addSuffix: true })}</span>
            </div>
            <Badge variant="outline" className="text-xs border-[#8F00FF]/20 text-[#8F00FF]">
              AI Generated
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GlobalAISummaryBox;

