import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Heart, Sparkles, BarChart3, BrainCircuit, MessageCircle, X, Loader2, AlertTriangle, ArrowRight, Mail } from 'lucide-react';

interface CancelSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userName?: string;
  currentPeriodEnd: string;
}

const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  open,
  onClose,
  onConfirm,
  userName = 'there',
  currentPeriodEnd,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [step, setStep] = useState<'initial' | 'confirm'>('initial');
  const [canceling, setCanceling] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(true);

  const requiredText = 'DELETE';
  const isConfirmed = confirmationText === requiredText;

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setConfirmationText('');
      setStep('initial');
      setCanceling(false);
      setShowAlternatives(true);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (step === 'initial') {
      // Move to confirmation step
      setStep('confirm');
      return;
    }

    // Final confirmation
    if (!isConfirmed) {
      return;
    }

    setCanceling(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error canceling subscription:', error);
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        {step === 'initial' ? (
          <>
            {/* Header Section */}
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-100 to-pink-100 p-3 rounded-full">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-semibold text-black">
                    Hey {userName}, are you sure?
                  </DialogTitle>
                  <DialogDescription className="text-base text-black/60 mt-1">
                    We'd really hate to see you go
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Emotional Message Section */}
              <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 rounded-xl p-6 border border-purple-200/50">
                <div className="flex items-start gap-4">
                  <div className="bg-white/60 p-2 rounded-lg">
                    <Heart className="h-5 w-5 text-[#7B3FE4]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-black/90 text-base leading-relaxed mb-3">
                      <strong className="text-[#7B3FE4] font-semibold">We'll really miss you, {userName}.</strong>
                    </p>
                    <p className="text-black/70 text-sm leading-relaxed">
                      It's been amazing having you with us, and we're genuinely sad to see you go. Your AI agents have been working hard for you, and they'll miss you too. You've come so far with us, and we'd hate to see all that progress go to waste.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* What You'll Lose Section */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  What you'll lose
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <BrainCircuit className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm mb-1">AI Agents</p>
                        <p className="text-black/60 text-xs">All your trained agents and configurations</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm mb-1">Analytics</p>
                        <p className="text-black/60 text-xs">Advanced insights and reports</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Sparkles className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm mb-1">Unlimited Features</p>
                        <p className="text-black/60 text-xs">No credit deductions</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <MessageCircle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm mb-1">Priority Support</p>
                        <p className="text-black/60 text-xs">Exclusive features & help</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Alternative Options Section */}
              {showAlternatives && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Before you go...</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-black mb-1">Talk to our support team</p>
                          <p className="text-black/60 text-sm mb-4">
                            Maybe we can help solve whatever's bothering you. We're here to listen and make things right.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            onClick={() => {
                              window.open('mailto:support@smartformai.com?subject=Subscription Help', '_blank');
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Contact Support
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="bg-purple-100 p-3 rounded-lg">
                          <Heart className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-black mb-1">Stay until {formatDate(currentPeriodEnd)}</p>
                          <p className="text-black/60 text-sm">
                            Your subscription will remain active until the end of your billing period. You can always change your mind before then!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Reminder Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <p className="text-black/70 text-sm text-center">
                  <strong className="text-black">Remember:</strong> You'll continue to have access to all Pro features until <strong className="text-[#7B3FE4]">{formatDate(currentPeriodEnd)}</strong>. 
                  You can reactivate anytime before then with no interruption.
                </p>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="px-6 py-4 border-t border-black/10 bg-gray-50/50 flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={canceling}
                className="w-full sm:w-auto border-black/20 hover:bg-black/5"
              >
                Never Mind, I'll Stay
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={canceling}
                className="w-full sm:w-auto"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                I Still Want to Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Confirmation Step Header */}
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-full">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-semibold text-black">
                    One Last Step...
                  </DialogTitle>
                  <DialogDescription className="text-base text-black/60 mt-1">
                    We want to make sure this is really what you want
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Confirmation Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
                <Heart className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p className="text-black/80 text-xl font-semibold mb-2">
                  We're really going to miss you, {userName}
                </p>
                <p className="text-black/60 text-sm mb-8 max-w-md mx-auto">
                  If you're absolutely sure, please type <strong className="text-red-600 font-mono text-base">DELETE</strong> below to confirm cancellation.
                </p>
                
                <div className="max-w-xs mx-auto space-y-4">
                  <div>
                    <Label htmlFor="confirm-delete" className="text-black/70 text-sm mb-3 block text-left">
                      Type DELETE to confirm:
                    </Label>
                    <Input
                      id="confirm-delete"
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                      placeholder="DELETE"
                      className="text-center font-mono text-xl tracking-wider h-12 border-2"
                      autoFocus
                    />
                  </div>
                  
                  {confirmationText && !isConfirmed && (
                    <p className="text-red-600 text-sm">
                      Please type exactly "DELETE" to confirm
                    </p>
                  )}
                </div>
              </div>

              <Alert className="bg-orange-50 border-orange-300">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-orange-900 text-sm">
                  <strong>Last chance!</strong> Once you confirm, your subscription will be canceled at the end of your billing period ({formatDate(currentPeriodEnd)}). 
                  You can still reactivate before then, but we'd really prefer you stay with us.
                </AlertDescription>
              </Alert>
            </div>

            {/* Footer */}
            <DialogFooter className="px-6 py-4 border-t border-black/10 bg-gray-50/50 flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('initial')}
                disabled={canceling}
                className="w-full sm:w-auto border-black/20 hover:bg-black/5"
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={!isConfirmed || canceling}
                className="w-full sm:w-auto"
              >
                {canceling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Yes, Cancel My Subscription
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CancelSubscriptionModal;

