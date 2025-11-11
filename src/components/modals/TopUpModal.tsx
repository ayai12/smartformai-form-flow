import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Crown, Coins, ArrowRight, X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits?: number;
  requiredCredits?: number;
  onBuyCredits?: () => void;
  onUpgrade?: () => void;
}

const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  currentCredits = 0,
  requiredCredits,
  onBuyCredits,
  onUpgrade
}) => {
  const navigate = useNavigate();

  const handleBuyCredits = () => {
    if (onBuyCredits) {
      onBuyCredits();
    } else {
      navigate('/pricing');
    }
    onClose();
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/pricing');
    }
    onClose();
  };

  const isOutOfCredits = currentCredits === 0;
  const needsMoreCredits = requiredCredits && currentCredits < requiredCredits;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border border-gray-200 rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-orange-500 to-pink-500 text-white p-6 pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Coins className="h-8 w-8 text-yellow-300" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white mb-2">
              {isOutOfCredits ? "You're out of credits" : "Need more credits?"}
            </DialogTitle>
            <p className="text-orange-100 text-sm leading-relaxed">
              {isOutOfCredits 
                ? "Add 100 credits for just $9.99 and continue building."
                : `You need ${requiredCredits} credits but only have ${currentCredits}. Top up to continue.`
              }
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 -mt-4">
          {/* Credit Status */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Credits</span>
              <span className="text-lg font-bold text-gray-900">{currentCredits}</span>
            </div>
            {needsMoreCredits && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Credits Needed</span>
                <span className="text-lg font-bold text-orange-600">{requiredCredits}</span>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-4 mb-6">
            {/* Buy Credits Option */}
            <Card className="border border-gray-200 hover:border-orange-300 transition-colors cursor-pointer" onClick={handleBuyCredits}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Buy Credit Pack</h3>
                    <p className="text-sm text-gray-600">100 credits for $9.99 • Never expires</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">$9.99</div>
                    <div className="text-xs text-gray-500">One-time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Option */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 cursor-pointer" onClick={handleUpgrade}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Crown className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">Upgrade to Pro</h3>
                      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Recommended</span>
                    </div>
                    <p className="text-sm text-gray-600">Unlimited access • No credit deductions</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">$14.99</div>
                    <div className="text-xs text-gray-500">/month</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleBuyCredits}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Buy Credits
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <Button 
              onClick={handleUpgrade}
              variant="outline"
              className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 py-3 rounded-xl"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro (Unlimited Access)
            </Button>
          </div>

          {/* Value Proposition */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">💡 Pro Tip</h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Upgrade to Pro and save 85% on AI costs. Get unlimited summaries for just $14.99/month 
                  instead of 10 credits each time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpModal;
