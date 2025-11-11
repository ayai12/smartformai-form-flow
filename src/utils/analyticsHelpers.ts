/**
 * Analytics Helper Functions
 * For generating alerts, comparing metrics, and calculating deltas
 */

export interface MetricComparison {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AlertThreshold {
  metric: string;
  threshold: number;
  direction: 'above' | 'below';
  message: string;
}

/**
 * Calculate delta between current and previous metric values
 */
export function calculateDelta(
  current: number,
  previous: number | null | undefined
): MetricComparison | null {
  if (previous === null || previous === undefined || previous === 0) {
    return null;
  }

  const delta = current - previous;
  const deltaPercent = (delta / previous) * 100;
  const trend: 'up' | 'down' | 'stable' =
    deltaPercent > 1 ? 'up' : deltaPercent < -1 ? 'down' : 'stable';

  return {
    current,
    previous,
    delta,
    deltaPercent: Math.round(deltaPercent * 10) / 10,
    trend,
  };
}

/**
 * Generate smart alerts based on threshold crossings
 */
export function generateAlerts(
  metrics: Record<string, number>,
  previousMetrics: Record<string, number> | null,
  thresholds: AlertThreshold[]
): Array<{
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  metric: string;
  threshold: string;
  timestamp: Date;
}> {
  const alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'success';
    message: string;
    metric: string;
    threshold: string;
    timestamp: Date;
  }> = [];

  // Check threshold crossings
  thresholds.forEach((threshold) => {
    const value = metrics[threshold.metric];
    if (value === undefined) return;

    const crossed =
      threshold.direction === 'above'
        ? value > threshold.threshold
        : value < threshold.threshold;

    if (crossed) {
      alerts.push({
        id: `${threshold.metric}-${Date.now()}`,
        type: threshold.direction === 'above' ? 'warning' : 'info',
        message: threshold.message,
        metric: threshold.metric,
        threshold: `${threshold.direction === 'above' ? '>' : '<'} ${threshold.threshold}`,
        timestamp: new Date(),
      });
    }
  });

  // Check for significant changes (deltas)
  if (previousMetrics) {
    Object.keys(metrics).forEach((metric) => {
      const current = metrics[metric];
      const previous = previousMetrics[metric];
      if (previous === undefined || previous === null) return;

      const comparison = calculateDelta(current, previous);
      if (!comparison) return;

      // Alert on significant drops (>15%)
      if (comparison.deltaPercent < -15) {
        alerts.push({
          id: `${metric}-drop-${Date.now()}`,
          type: 'warning',
          message: `Your Agent noticed ${metric} dropped ${Math.abs(comparison.deltaPercent).toFixed(1)}% this week.`,
          metric,
          threshold: `${comparison.deltaPercent.toFixed(1)}% change`,
          timestamp: new Date(),
        });
      }

      // Alert on significant improvements (>15%)
      if (comparison.deltaPercent > 15) {
        alerts.push({
          id: `${metric}-improve-${Date.now()}`,
          type: 'success',
          message: `Great news! ${metric} improved ${comparison.deltaPercent.toFixed(1)}% this week.`,
          metric,
          threshold: `${comparison.deltaPercent.toFixed(1)}% change`,
          timestamp: new Date(),
        });
      }
    });
  }

  return alerts;
}

/**
 * Default alert thresholds for common metrics
 */
export const DEFAULT_ALERT_THRESHOLDS: AlertThreshold[] = [
  {
    metric: 'completionRate',
    threshold: 0.5, // 50%
    direction: 'below',
    message: 'Completion rate is below 50% — consider simplifying your survey.',
  },
  {
    metric: 'completionRate',
    threshold: 0.8, // 80%
    direction: 'above',
    message: 'Excellent completion rate! Keep up the great work.',
  },
  {
    metric: 'avgCompletionTime',
    threshold: 300000, // 5 minutes in ms
    direction: 'above',
    message: 'Average completion time exceeds 5 minutes — consider shortening your survey.',
  },
];

/**
 * Store feedback for insights in localStorage
 */
export function storeInsightFeedback(
  formId: string,
  insightId: string,
  helpful: boolean
): void {
  try {
    const key = `sfai:insight-feedback:${formId}:${insightId}`;
    localStorage.setItem(key, JSON.stringify({ helpful, timestamp: Date.now() }));
  } catch (error) {
    console.error('Failed to store insight feedback:', error);
  }
}

/**
 * Get stored feedback for an insight
 */
export function getInsightFeedback(
  formId: string,
  insightId: string
): 'helpful' | 'not-helpful' | null {
  try {
    const key = `sfai:insight-feedback:${formId}:${insightId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data.helpful ? 'helpful' : 'not-helpful';
  } catch {
    return null;
  }
}

