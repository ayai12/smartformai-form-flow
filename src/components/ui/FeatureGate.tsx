import React from 'react';
import { Lock, CreditCard, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  isLocked: boolean;
  userType: 'credit' | 'subscribed';
  feature: string;
  description?: string;
  creditsRequired?: number;
  onUpgrade?: () => void;
  onBuyCredits?: () => void;
  children: React.ReactNode;
  className?: string;
  showTooltip?: boolean;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  isLocked,
  userType,
  feature,
  description,
  creditsRequired,
  onUpgrade,
  onBuyCredits,
  children,
  className,
  showTooltip = true,
}) => {
  if (!isLocked) {
    return <>{children}</>;
  }

  const getOverlayContent = () => {
    if (userType === 'subscribed') {
      return {
        icon: <Crown className="h-6 w-6 text-[#8F00FF]" />,
        title: 'Feature Limit Reached',
        message: description || `You've reached your monthly limit for ${feature}`,
        showUpgrade: false,
      };
    }

    return {
      icon: <Lock className="h-5 w-5 text-[#8F00FF]" />,
      title: `🔒 Upgrade to unlock ${feature}`,
      message: creditsRequired 
        ? `Use ${creditsRequired} credits to unlock once, or upgrade for unlimited access`
        : description || `Upgrade to Pro for unlimited ${feature}`,
      showUpgrade: true,
    };
  };

  const overlayContent = getOverlayContent();

  const LockedOverlay = () => (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
      <div className="text-center p-6 max-w-sm">
        <div className="flex justify-center mb-3">
          {overlayContent.icon}
        </div>
        <h3 className="font-semibold text-[#2E2E2E] mb-2 text-sm">
          {overlayContent.title}
        </h3>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          {overlayContent.message}
        </p>
        
        {overlayContent.showUpgrade && (
          <div className="flex flex-col gap-2">
            {onUpgrade && (
              <Button
                onClick={onUpgrade}
                size="sm"
                className="bg-[#8F00FF] hover:bg-[#8F00FF]/90 text-white text-xs px-4 py-2 h-8"
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade to Pro
              </Button>
            )}
            {creditsRequired && onBuyCredits && (
              <Button
                onClick={onBuyCredits}
                variant="outline"
                size="sm"
                className="border-[#8F00FF]/30 text-[#8F00FF] hover:bg-[#8F00FF]/5 text-xs px-4 py-2 h-8"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Use {creditsRequired} Credits
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const content = (
    <div className={cn("relative", className)}>
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay */}
      <LockedOverlay />
    </div>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-center">
            <p className="font-medium text-sm mb-1">{overlayContent.title}</p>
            <p className="text-xs text-gray-300">{overlayContent.message}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FeatureGate;
