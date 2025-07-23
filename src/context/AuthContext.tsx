import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth, signInWithEmail, signInWithGoogle, resetPassword as firebaseResetPassword } from '../firebase/firebase';
import { updatePassword as firebaseUpdatePassword, updateEmail as firebaseUpdateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateEmail: (currentPassword: string, newEmail: string) => Promise<{ success: boolean; error?: string }>;
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

  const resetPasswordHandler = async (email: string) => {
    try {
      const result = await firebaseResetPassword(email);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to reset password' };
    }
  };

  const updatePasswordHandler = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user) {
        return { success: false, error: 'No user is signed in' };
      }

      // Re-authenticate user before updating password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await firebaseUpdatePassword(user, newPassword);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update password' };
    }
  };

  const updateEmailHandler = async (currentPassword: string, newEmail: string) => {
    try {
      if (!user) {
        return { success: false, error: 'No user is signed in' };
      }

      // Re-authenticate user before updating email
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await firebaseUpdateEmail(user, newEmail);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update email' };
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading,
        signIn: signInHandler,
        signInWithGoogle: signInWithGoogleHandler,
        signOut: signOutHandler,
        resetPassword: resetPasswordHandler,
        updatePassword: updatePasswordHandler,
        updateEmail: updateEmailHandler
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