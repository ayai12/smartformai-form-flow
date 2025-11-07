import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';

const CreditPurchaseSuccess = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const processCreditPurchase = async () => {
      if (!user?.uid || !sessionId) {
        setError('Missing user or session information');
        setStatus('error');
        return;
      }

      try {
        // Call backend to verify payment and add credits
        const apiUrl = import.meta.env.PROD
          ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/completeCreditPurchase'
          : 'http://localhost:3000/completeCreditPurchase';

        const authToken = await user.getIdToken();

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            userId: user.uid,
            sessionId: sessionId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process credit purchase');
        }

        const data = await response.json();
        
        if (data.success) {
          setCredits(data.credits);
          setStatus('success');
          toast.success(`Successfully added ${data.creditsAdded || 40} credits!`);
        } else {
          throw new Error(data.error || 'Failed to add credits');
        }

      } catch (err: any) {
        console.error('Error processing credit purchase:', err);
        setError(err.message || 'Failed to process credit purchase');
        setStatus('error');
        toast.error(err.message || 'Failed to process credit purchase');
      }
    };

    processCreditPurchase();
  }, [user?.uid, sessionId]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg border border-black/10 shadow-sm p-8">
          {status === 'processing' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 text-[#7B3FE4] animate-spin mx-auto" />
              <h1 className="text-2xl font-bold text-black">Processing Your Purchase</h1>
              <p className="text-black/60">Verifying payment and adding credits to your account...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">Purchase Successful!</h1>
                <p className="text-lg text-black/60 mb-4">
                  Your credits have been added to your account
                </p>
                {credits !== null && (
                  <div className="bg-[#7B3FE4]/10 rounded-lg p-6 my-6">
                    <p className="text-sm text-black/60 mb-2">Your new credit balance:</p>
                    <p className="text-4xl font-bold text-[#7B3FE4]">{credits} credits</p>
                  </div>
                )}
              </div>
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => navigate('/profile')}
                  variant="outline"
                  className="border-black/20"
                >
                  View Profile
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-4">
                  <AlertCircle className="h-16 w-16 text-red-600" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">Processing Error</h1>
                <p className="text-lg text-black/60 mb-4">{error || 'An error occurred while processing your purchase'}</p>
                <p className="text-sm text-black/40">
                  Don't worry - if you were charged, your credits will be added automatically.
                  <br />
                  Please contact support if the issue persists.
                </p>
              </div>
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={() => navigate('/profile')}
                  className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white"
                >
                  Go to Profile
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-black/20"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreditPurchaseSuccess;

