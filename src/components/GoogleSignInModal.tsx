import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { Logo } from '@/logo';
import { Loader2 } from 'lucide-react';

interface GoogleSignInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  message?: string;
}

const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({ 
  open, 
  onClose, 
  onSuccess,
  message = "Sign in to continue building your AI agent"
}) => {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await signInWithGoogle();
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to sign in with Google');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <Logo size={40} />
          </div>
          <DialogTitle className="text-xl font-semibold text-black text-center">
            Sign in to continue
          </DialogTitle>
          <DialogDescription className="text-black/60 mt-2 text-center">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
            {error}
          </div>
        )}

        <div className="mt-6">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-900 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-red-500" />
                <span>Sign in with Google</span>
              </div>
            )}
          </Button>
        </div>

        <p className="text-xs text-black/50 text-center mt-4">
          By continuing, you agree to SmartFormAI's Terms of Service and Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleSignInModal;

