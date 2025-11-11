/**
 * AI Summary Generator
 * Generates comprehensive global summaries and metric-specific insights
 * Uses local metricEngine for cost-free analysis, with optional AI enhancement
 */

import { analyzeAllMetrics, type ModularInputs, type MetricEngineResult } from '@/components/ai/metricEngine';
import { calculateDelta } from './analyticsHelpers';

export interface GlobalSummaryData {
  summary: string;
  keyInsights: string[];
  timestamp: Date;
  responseCount: number;
}

export interface MetricInsightData {
  metric: string;
  insight: string;
  recommendation: string;
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Generate a comprehensive global AI summary from all metrics
 */
export function generateGlobalSummary(
  metricResults: MetricEngineResult,
  responseCount: number,
  previousMetrics: Record<string, number> | null
): GlobalSummaryData {
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Build summary from all metric insights
  if (metricResults.completionRate) {
    insights.push(metricResults.completionRate.insight);
    recommendations.push(metricResults.completionRate.suggestion);
  }

  if (metricResults.devices) {
    insights.push(metricResults.devices.insight);
    recommendations.push(metricResults.devices.suggestion);
  }

  if (metricResults.questions) {
    insights.push(metricResults.questions.insight);
    recommendations.push(metricResults.questions.suggestion);
  }

  if (metricResults.avgCompletionTime) {
    insights.push(metricResults.avgCompletionTime.insight);
    recommendations.push(metricResults.avgCompletionTime.suggestion);
  }

  // Build comprehensive, accurate summary text
  let summary = `Your survey received ${responseCount} response${responseCount !== 1 ? 's' : ''}. `;
  
  // Extract completion rate percentage accurately
  if (metricResults.completionRate) {
    const crInsight = metricResults.completionRate.insight;
    const crMatch = crInsight.match(/(\d+(?:\.\d+)?)%/);
    if (crMatch) {
      const crPercent = parseFloat(crMatch[1]);
      summary += `Overall completion rate is ${crPercent.toFixed(1)}%. `;
      if (crPercent >= 80) {
        summary += `This is excellent engagement. `;
      } else if (crPercent >= 60) {
        summary += `Engagement is good but could be improved. `;
      } else {
        summary += `Consider optimizing your form to improve completion rates. `;
      }
    } else {
      summary += crInsight.replace(/\.$/, '') + '. ';
    }
  }

  // Device distribution with accurate numbers
  if (metricResults.devices) {
    const deviceInsight = metricResults.devices.insight;
    const mobileMatch = deviceInsight.match(/Mobile\s(\d+(?:\.\d+)?)%/i);
    const desktopMatch = deviceInsight.match(/Desktop\s(\d+(?:\.\d+)?)%/i);
    
    if (mobileMatch && desktopMatch) {
      const mobilePercent = parseFloat(mobileMatch[1]);
      const desktopPercent = parseFloat(desktopMatch[1]);
      summary += `Mobile users account for ${mobilePercent.toFixed(1)}% of responses, while desktop users represent ${desktopPercent.toFixed(1)}%. `;
      if (mobilePercent > 60) {
        summary += `Since most users are on mobile, ensure your form is mobile-optimized. `;
      }
    } else if (mobileMatch) {
      summary += `Mobile users represent ${mobileMatch[1]}% of responses. `;
    }
  }

  // Question performance insights
  if (metricResults.questions) {
    const qInsight = metricResults.questions.insight;
    if (qInsight.includes('skip') || qInsight.includes('drop')) {
      summary += qInsight.replace(/\.$/, '') + '. ';
    } else if (qInsight.length > 20) {
      summary += qInsight.substring(0, 100) + '. ';
    }
  }

  // Completion time with context
  if (metricResults.avgCompletionTime) {
    const timeInsight = metricResults.avgCompletionTime.insight;
    const timeMatch = timeInsight.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|seconds?|secs?)/i);
    if (timeMatch) {
      summary += `Average completion time is ${timeMatch[1]} ${timeMatch[2] || 'minutes'}. `;
    } else {
      summary += timeInsight.replace(/\.$/, '') + '. ';
    }
  }

  // Traffic sources
  if (metricResults.traffic) {
    const trafficInsight = metricResults.traffic.insight;
    const sourceMatch = trafficInsight.match(/Most responses come from (\w+)/i);
    if (sourceMatch) {
      summary += `Most traffic originates from ${sourceMatch[1]}. `;
    }
  }

  // Add trend information if available
  if (previousMetrics && metricResults.completionRate) {
    const crMatch = metricResults.completionRate.insight.match(/(\d+(?:\.\d+)?)%/);
    if (crMatch) {
      const currentCR = parseFloat(crMatch[1]);
      const delta = calculateDelta(currentCR, previousMetrics.completionRate * 100);
      if (delta && Math.abs(delta.deltaPercent) > 1) {
        summary += `Completion rate ${delta.trend === 'up' ? 'improved' : 'declined'} by ${Math.abs(delta.deltaPercent).toFixed(1)}% since last analysis. `;
      }
    }
  }

  // Clean up summary
  summary = summary.trim();
  if (!summary.endsWith('.')) summary += '.';
  
  // Ensure summary is comprehensive but not too long
  if (summary.length > 500) {
    summary = summary.substring(0, 497) + '...';
  }

  return {
    summary: summary || metricResults.overallSummary || 'Survey performance is building — more responses will unlock richer insights.',
    keyInsights: insights.slice(0, 3), // Top 3 insights
    timestamp: new Date(metricResults.updatedAt),
    responseCount,
  };
}

/**
 * Generate metric-specific insights
 */
export function generateMetricInsights(
  metricResults: MetricEngineResult
): Record<string, MetricInsightData> {
  const insights: Record<string, MetricInsightData> = {};

  if (metricResults.completionRate) {
    insights.completionRate = {
      metric: 'Completion Rate',
      insight: metricResults.completionRate.insight,
      recommendation: metricResults.completionRate.suggestion,
      confidence: metricResults.completionRate.confidence || 'medium',
    };
  }

  if (metricResults.avgCompletionTime) {
    insights.avgCompletionTime = {
      metric: 'Average Completion Time',
      insight: metricResults.avgCompletionTime.insight,
      recommendation: metricResults.avgCompletionTime.suggestion,
      confidence: metricResults.avgCompletionTime.confidence || 'medium',
    };
  }

  if (metricResults.devices) {
    insights.devices = {
      metric: 'Device Distribution',
      insight: metricResults.devices.insight,
      recommendation: metricResults.devices.suggestion,
      confidence: metricResults.devices.confidence || 'medium',
    };
  }

  if (metricResults.traffic) {
    insights.traffic = {
      metric: 'Traffic Sources',
      insight: metricResults.traffic.insight,
      recommendation: metricResults.traffic.suggestion,
      confidence: metricResults.traffic.confidence || 'medium',
    };
  }

  if (metricResults.geography) {
    insights.geography = {
      metric: 'Geographic Distribution',
      insight: metricResults.geography.insight,
      recommendation: metricResults.geography.suggestion,
      confidence: metricResults.geography.confidence || 'medium',
    };
  }

  if (metricResults.questions) {
    insights.questions = {
      metric: 'Question Performance',
      insight: metricResults.questions.insight,
      recommendation: metricResults.questions.suggestion,
      confidence: metricResults.questions.confidence || 'medium',
    };
  }

  if (metricResults.activity) {
    insights.activity = {
      metric: 'Time Activity',
      insight: metricResults.activity.insight,
      recommendation: metricResults.activity.suggestion,
      confidence: metricResults.activity.confidence || 'medium',
    };
  }

  return insights;
}

