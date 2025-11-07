import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleBuyCredits = () => {
    onClose();
    navigate('/pricing');
  };

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-black">
            Insufficient Credits
          </DialogTitle>
          <DialogDescription className="text-black/60 mt-2">
            You've run out of credits. Choose how you'd like to continue:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="bg-[#7B3FE4]/5 border border-[#7B3FE4]/20 rounded-lg p-4">
            <h3 className="font-medium text-black mb-2 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#7B3FE4]" />
              Buy Credit Pack
            </h3>
            <p className="text-sm text-black/60 mb-3">
              Get 40 credits for €9.99 (one-time purchase) to continue using AI features.
            </p>
            <Button
              onClick={handleBuyCredits}
              className="w-full bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
            >
              Buy Credits (€9.99)
            </Button>
          </div>
          
          <div className="bg-gradient-to-br from-[#7B3FE4]/10 to-white border border-[#7B3FE4]/30 rounded-lg p-4">
            <h3 className="font-medium text-black mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#7B3FE4]" />
              Upgrade to Pro
            </h3>
            <p className="text-sm text-black/60 mb-3">
              Unlimited access to all features for €14.99/month. No credit deductions.
            </p>
            <Button
              onClick={handleUpgrade}
              className="w-full bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
            >
              Upgrade to Pro (€14.99/mo)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
