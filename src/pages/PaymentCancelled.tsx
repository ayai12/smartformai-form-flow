import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft, Home } from 'lucide-react';

const PaymentCancelled: React.FC = () => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#7B3FE4]/[0.02] to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-white/50 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center p-6 sm:p-8">
          <div className="inline-flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-4 sm:p-6 rounded-3xl shadow-2xl shadow-red-500/30">
              <XCircle className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-[#2E2E2E] mb-2">
            Payment Cancelled
          </CardTitle>
          <p className="text-gray-600 text-sm sm:text-base">
            Your payment was cancelled. No charges were made to your account.
          </p>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-8 pt-0">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 text-center">
                You can try again anytime or continue using SmartFormAI with your current plan.
              </p>
            </div>
            
            <Button
              onClick={handleGoToDashboard}
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] hover:from-[#6B35D0] hover:to-[#5A2BC0] text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
            >
              <Home className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
              Go to Dashboard
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancelled;
