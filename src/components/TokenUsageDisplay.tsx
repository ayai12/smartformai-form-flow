import React from 'react';
import { useTokenUsage } from '@/context/TokenUsageContext';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const TokenUsageDisplay: React.FC = () => {
  const { tokenUsage, isLoading, percentageUsed, tokensRemaining } = useTokenUsage();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }
  
  if (!tokenUsage) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
          <CardDescription>No usage data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Determine color based on percentage used
  const getProgressColor = () => {
    if (percentageUsed >= 90) return 'bg-red-500';
    if (percentageUsed >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  // Format next reset date
  const getNextResetText = () => {
    if (!tokenUsage.nextResetDate) return 'No reset date available';
    
    try {
      return `Resets ${formatDistanceToNow(tokenUsage.nextResetDate, { addSuffix: true })}`;
    } catch (error) {
      return 'Reset date unknown';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
        <CardDescription>
          {tokenUsage.aiRequestsUsed} of {tokenUsage.aiRequestsLimit} used
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor()}`} 
              style={{ width: `${percentageUsed}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{tokensRemaining} requests remaining</span>
            <span>{getNextResetText()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 