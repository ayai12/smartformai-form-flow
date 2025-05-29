import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getTokenUsage, incrementTokenUsage } from '@/firebase/tokenService';

export interface TokenUsage {
  aiRequestsUsed: number;
  aiRequestsLimit: number;
  lastResetDate?: Date;
  nextResetDate?: Date;
  planId: string;
}

interface TokenUsageContextType {
  tokenUsage: TokenUsage | null;
  isLoading: boolean;
  refreshTokenUsage: () => Promise<void>;
  hasTokensAvailable: boolean;
  tokensRemaining: number;
  percentageUsed: number;
  useToken: () => Promise<boolean>;
}

const TokenUsageContext = createContext<TokenUsageContextType>({
  tokenUsage: null,
  isLoading: true,
  refreshTokenUsage: async () => {},
  hasTokensAvailable: false,
  tokensRemaining: 0,
  percentageUsed: 0,
  useToken: async () => false
});

export const useTokenUsage = () => useContext(TokenUsageContext);

interface TokenUsageProviderProps {
  children: ReactNode;
}

export const TokenUsageProvider: React.FC<TokenUsageProviderProps> = ({ children }) => {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  
  const fetchTokenUsage = async () => {
    if (!user) {
      setTokenUsage(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const usage = await getTokenUsage(user.uid);
      
      if (usage) {
        setTokenUsage(usage);
      }
    } catch (error) {
      console.error('Error fetching token usage:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTokenUsage();
  }, [user]);
  
  // Use a token (increment usage)
  const useToken = async (): Promise<boolean> => {
    if (!user || !tokenUsage) return false;
    
    // Check if user has tokens available
    if (tokenUsage.aiRequestsUsed >= tokenUsage.aiRequestsLimit) {
      return false;
    }
    
    // Increment token usage
    const success = await incrementTokenUsage(user.uid);
    
    // Refresh token usage data
    if (success) {
      await fetchTokenUsage();
    }
    
    return success;
  };
  
  // Calculate if user has tokens available
  const hasTokensAvailable = tokenUsage ? 
    tokenUsage.aiRequestsUsed < tokenUsage.aiRequestsLimit : 
    false;
  
  // Calculate tokens remaining
  const tokensRemaining = tokenUsage ? 
    Math.max(0, tokenUsage.aiRequestsLimit - tokenUsage.aiRequestsUsed) : 
    0;
  
  // Calculate percentage used
  const percentageUsed = tokenUsage && tokenUsage.aiRequestsLimit > 0 ? 
    Math.min(100, Math.round((tokenUsage.aiRequestsUsed / tokenUsage.aiRequestsLimit) * 100)) : 
    0;
  
  const value = {
    tokenUsage,
    isLoading,
    refreshTokenUsage: fetchTokenUsage,
    hasTokensAvailable,
    tokensRemaining,
    percentageUsed,
    useToken
  };
  
  return (
    <TokenUsageContext.Provider value={value}>
      {children}
    </TokenUsageContext.Provider>
  );
}; 