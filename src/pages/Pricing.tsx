import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import PricingSection from '@/components/sections/Pricing';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFromInternalPage, setIsFromInternalPage] = useState(false);
  
  // Check if user came from an internal page (like profile)
  useEffect(() => {
    const fromPath = location.state?.from || '';
    setIsFromInternalPage(fromPath.includes('/profile') || fromPath.includes('/dashboard'));
  }, [location]);
  
  // Handle back button click
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <>
      {isFromInternalPage ? (
        <div className="min-h-screen bg-white">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2" 
                onClick={handleBackToDashboard}
              >
                <ArrowLeft size={16} />
                Go Back to Dashboard
              </Button>
            </div>
            <PricingSection isAuthenticated={!!user} />
          </div>
        </div>
      ) : (
        <Layout>
          <PricingSection isAuthenticated={!!user} />
        </Layout>
      )}
    </>
  );
};

export default Pricing;
