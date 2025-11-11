import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, TrendingUp, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  metric: string;
  threshold: string;
  timestamp: Date;
}

export interface SmartAlertsProps {
  alerts: Alert[];
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  const alertColors = {
    warning: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
  };

  const alertIcons = {
    warning: TrendingDown,
    info: AlertCircle,
    success: TrendingUp,
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-[#8F00FF]" />
          <h3 className="text-lg font-semibold text-[#2E2E2E]">Smart Alerts</h3>
          <Badge className="bg-[#8F00FF]/10 text-[#8F00FF] border-[#8F00FF]/20">
            {alerts.length}
          </Badge>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alertIcons[alert.type];
            return (
              <div
                key={alert.id}
                className={cn(
                  'rounded-lg p-4 border flex items-start gap-3',
                  alertColors[alert.type]
                )}
              >
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{alert.message}</p>
                  <p className="text-xs opacity-80">
                    {alert.metric} • {alert.threshold}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartAlerts;

