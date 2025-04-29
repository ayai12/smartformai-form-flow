import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth, signInWithEmail, signInWithGoogle } from '../firebase/firebase';

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInHandler = async (email: string, password: string) => {
    try {
      const result = await signInWithEmail(email, password);
      if (result.success && result.user.emailVerified) {
        setUser(result.user);
        return { success: true };
      } else if (!result.user?.emailVerified) {
        return { success: false, error: 'Please verify your email before signing in' };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to sign in' };
    }
  };

  const signInWithGoogleHandler = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to sign in with Google' };
    }
  };

  const signOutHandler = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading,
        signIn: signInHandler,
        signInWithGoogle: signInWithGoogleHandler,
        signOut: signOutHandler
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 