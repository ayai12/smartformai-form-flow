import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Heart, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PostBuildModalProps {
  open: boolean;
  onClose: () => void;
}

const PostBuildModal: React.FC<PostBuildModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Sparkles className="h-12 w-12 text-[#7B3FE4]" />
              <div className="absolute inset-0 bg-[#7B3FE4]/20 rounded-full blur-xl animate-pulse"></div>
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold text-black text-center">
            ✨ Your AI Agent is alive!
          </DialogTitle>
          <DialogDescription className="text-black/60 mt-2 text-center text-base">
            You just brought intelligence to life.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          <p className="text-sm text-black/70 text-center">
            Keep your creation growing — unlock more credits and features to help your agent evolve.
          </p>
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] hover:from-[#6B35D0] hover:to-[#5B2FC0] text-white font-semibold h-12 shadow-lg shadow-[#7B3FE4]/30 transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <Heart className="h-4 w-4 mr-2 relative z-10 fill-white" />
              <span className="relative z-10">Upgrade & Support My Agent ❤️</span>
            </Button>
            
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full border-black/10 hover:bg-black/5 text-black"
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostBuildModal;

