import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Crown, CreditCard, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';
import FeatureGate from '@/components/ui/FeatureGate';
import { toast } from '@/lib/toast';

interface PremiumAISummaryProps {
  formId: string;
  responseCount: number;
  onGenerate?: (summary: string) => void;
  onUpgrade?: () => void;
  onBuyCredits?: () => void;
  className?: string;
}

const PremiumAISummary: React.FC<PremiumAISummaryProps> = ({
  formId,
  responseCount,
  onGenerate,
  onUpgrade,
  onBuyCredits,
  className,
}) => {
  const { 
    userType, 
    canUseAISummary, 
    performAction, 
    getSummaryUsageText,
    CREDIT_COSTS 
  } = useUserCredits();
  
  const [generating, setGenerating] = useState(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  const permission = canUseAISummary();
  const isLocked = !permission.allowed;

  const handleGenerate = async () => {
    if (isLocked || generating) return;

    // Check if user has enough credits first
    const permission = canUseAISummary();
    if (!permission.allowed) {
      // Show upgrade popup instead of toast error
      if (onUpgrade) {
        onUpgrade();
      } else if (onBuyCredits) {
        onBuyCredits();
      }
      return;
    }

    setGenerating(true);
    try {
      // Perform the action (deduct credits if needed)
      const result = await performAction('AI_TOTAL_SUMMARY', 'AI Total Summary Generation');
      
      if (!result.success) {
        // Check if upgrade is required
        if (result.requiresUpgrade) {
          if (onUpgrade) {
            onUpgrade();
          } else if (onBuyCredits) {
            onBuyCredits();
          }
        } else {
          toast.error(result.message || 'Failed to generate summary');
        }
        return;
      }

      // Simulate AI summary generation
      // In real implementation, this would call your AI service
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockSummary = `Based on ${responseCount} responses, here are the key insights:\n\n• High engagement with 87% completion rate\n• Mobile users show 23% faster completion times\n• Most responses received during business hours (9-5 PM)\n• Strong positive sentiment in feedback questions\n• Geographic concentration in urban areas\n\nRecommendations:\n• Optimize for mobile experience\n• Consider time-based targeting for campaigns\n• Leverage positive feedback for testimonials`;

      setLastSummary(mockSummary);
      onGenerate?.(mockSummary);
      
      toast.success('AI summary generated successfully!');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate AI summary');
    } finally {
      setGenerating(false);
    }
  };

  const SummaryContent = () => (
    <Card className={`bg-gradient-to-br from-white to-purple-50/30 border-[#8F00FF]/20 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-[#2E2E2E] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#8F00FF]" />
              AI Total Summary
            </CardTitle>
            <Badge className="bg-[#8F00FF]/10 text-[#8F00FF] border-[#8F00FF]/20 text-xs">
              Premium
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            {getSummaryUsageText()}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          💡 Get AI-powered insights across all your responses in seconds.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Action Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{responseCount} responses ready for analysis</span>
          </div>
          
          <div className="relative group">
            <Button
              onClick={() => {
                if (isLocked) {
                  if (onUpgrade) onUpgrade();
                } else {
                  handleGenerate();
                }
              }}
              disabled={generating || responseCount === 0}
              className={`bg-[#8F00FF] hover:bg-[#8F00FF]/90 text-white ${
                isLocked ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Summary
                  {userType === 'credit' && (
                    <span className="ml-1 text-xs opacity-80">
                      ({CREDIT_COSTS.AI_TOTAL_SUMMARY} credits)
                    </span>
                  )}
                </>
              )}
            </Button>
            
            {isLocked && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                🔒 {permission.message || 'Upgrade to Pro or buy credits to access AI summaries'}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        </div>

        {/* Generated Summary */}
        {lastSummary && (
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[#8F00FF]" />
              <span className="font-medium text-[#2E2E2E]">Analysis Complete</span>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Just now
              </Badge>
            </div>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {lastSummary}
              </pre>
            </div>
          </div>
        )}

        {/* Value Proposition for Credit Users */}
        {userType === 'credit' && (
          <div className="mt-4 p-3 bg-[#8F00FF]/5 rounded-lg border border-[#8F00FF]/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-[#8F00FF] mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-700">
                <p className="font-medium mb-1">💡 Pro Tip</p>
                <p>
                  Upgrade to Pro and save 85% on AI costs. Get unlimited summaries for just $14.99/month 
                  instead of {CREDIT_COSTS.AI_TOTAL_SUMMARY} credits each time.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return <SummaryContent />;
};

export default PremiumAISummary;
