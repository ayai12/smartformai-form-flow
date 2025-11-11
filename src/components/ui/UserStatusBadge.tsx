import React from 'react';
import { Crown, CreditCard, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserCredits } from '@/hooks/useUserCredits';

interface UserStatusBadgeProps {
  onUpgrade?: () => void;
  onBuyCredits?: () => void;
  showCredits?: boolean;
  showSummaryUsage?: boolean;
  compact?: boolean;
}

const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({
  onUpgrade,
  onBuyCredits,
  showCredits = true,
  showSummaryUsage = false,
  compact = false,
}) => {
  const { 
    credits, 
    userType, 
    summariesThisMonth, 
    loading, 
    getSummaryUsageText,
    MONTHLY_LIMITS 
  } = useUserCredits();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        {!compact && <span className="text-sm text-gray-500">Loading...</span>}
      </div>
    );
  }

  const isSubscribed = userType === 'subscribed';
  const maxSummaries = isSubscribed ? 20 : MONTHLY_LIMITS.AI_TOTAL_SUMMARY;
  const summaryProgress = (summariesThisMonth / maxSummaries) * 100;

  return (
    <div className="flex items-center gap-3">
      {/* User Type Badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              className={`${
                isSubscribed 
                  ? 'bg-[#8F00FF]/10 text-[#8F00FF] border-[#8F00FF]/20' 
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              } font-medium`}
            >
              {isSubscribed ? (
                <>
                  <Crown className="h-3 w-3 mr-1" />
                  {compact ? 'PRO' : 'Pro User'}
                </>
              ) : (
                <>
                  <CreditCard className="h-3 w-3 mr-1" />
                  {compact ? 'Credits' : 'Credit User'}
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isSubscribed 
                ? 'Pro subscription - unlimited access to most features' 
                : 'Pay-as-you-go with credits'
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Credits Display */}
      {showCredits && !isSubscribed && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#2E2E2E]">
            {credits} credits
          </span>
          {credits < 10 && onBuyCredits && (
            <Button
              onClick={onBuyCredits}
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs border-[#8F00FF]/30 text-[#8F00FF] hover:bg-[#8F00FF]/5"
            >
              Top Up
            </Button>
          )}
        </div>
      )}

      {/* Summary Usage */}
      {showSummaryUsage && (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">
                    {summariesThisMonth}/{maxSummaries} summaries
                  </span>
                  {!compact && (
                    <Progress 
                      value={summaryProgress} 
                      className="w-16 h-2"
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getSummaryUsageText()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Upgrade Button for Credit Users */}
      {!isSubscribed && onUpgrade && !compact && (
        <Button
          onClick={onUpgrade}
          size="sm"
          className="bg-[#8F00FF] hover:bg-[#8F00FF]/90 text-white h-7 px-3 text-xs"
        >
          <Crown className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      )}
    </div>
  );
};

export default UserStatusBadge;
