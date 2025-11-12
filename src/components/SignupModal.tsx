import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { signUpWithEmail } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '@/components/AlertProvider';
import { validatePassword } from '@/lib/passwordValidation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '@/logo';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { updateUserProfile, UserProfile } from '@/firebase/userProfile';
import { User } from 'firebase/auth';

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ open, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { showAlert } = useAlert();

  const passwordChecks = [
    { id: 'length', label: 'At least 8 characters', check: () => password.length >= 8 },
    { id: 'uppercase', label: 'One uppercase letter', check: () => /[A-Z]/.test(password) },
    { id: 'lowercase', label: 'One lowercase letter', check: () => /[a-z]/.test(password) },
    { id: 'number', label: 'One number', check: () => /\d/.test(password) },
    { id: 'special', label: 'One special character', check: () => /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
      let errorMessage = "Password must contain:";
      if (!errors.minLength) errorMessage += "\n- At least 8 characters";
      if (!errors.hasUpperCase) errorMessage += "\n- One uppercase letter";
      if (!errors.hasLowerCase) errorMessage += "\n- One lowercase letter";
      if (!errors.hasNumber) errorMessage += "\n- One number";
      if (!errors.hasSpecialChar) errorMessage += "\n- One special character";
      
      setError(errorMessage);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const result = await signUpWithEmail(email, password) as { success: boolean; error?: string; user?: User };
      if (result.success && result.user) {
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const profileData: UserProfile = {
          firstName,
          lastName,
          email
        };
        
        await updateUserProfile(result.user.uid, profileData);
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <Logo size={40} />
          </div>
          <DialogTitle className="text-xl font-semibold text-black text-center">
            Create your account
          </DialogTitle>
          <DialogDescription className="text-black/60 mt-2 text-center">
            Sign up to build your AI agent
          </DialogDescription>
          <div className="mt-4 rounded-2xl border border-[#7B3FE4]/20 bg-[#7B3FE4]/5 p-4 text-left text-sm text-black/70 space-y-2">
            <p className="font-semibold text-black flex items-center gap-2 text-base">
              <span role="img" aria-label="wave">👋</span> Welcome to SmartFormAI Agents
            </p>
            <p>
              You’re joining during a very special phase — we’re building something truly new: AI survey agents that learn and evolve with every response.
            </p>
            <p>
              SmartFormAI is in a constant cycle of improvement — features, insights, and intelligence evolve week by week.
            </p>
            <p className="font-medium text-black">
              Thanks for being part of this journey — every click, test, and response helps shape the future of autonomous research. <span role="img" aria-label="rocket">🚀</span>
            </p>
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="fullName" className="text-black/70 text-sm font-medium">Full Name</Label>
            <Input 
              id="fullName"
              type="text" 
              placeholder="John Doe" 
              className="w-full h-11 border-black/10 focus:border-[#7B3FE4] focus:ring-[#7B3FE4] bg-white mt-1"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-black/70 text-sm font-medium">Email</Label>
            <Input 
              id="email"
              type="email" 
              placeholder="you@example.com" 
              className="w-full h-11 border-black/10 focus:border-[#7B3FE4] focus:ring-[#7B3FE4] bg-white mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-black/70 text-sm font-medium">Password</Label>
            <div className="relative mt-1">
              <Input 
                id="password"
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="w-full h-11 border-black/10 focus:border-[#7B3FE4] focus:ring-[#7B3FE4] bg-white pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/60 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {isPasswordFocused && password && (
              <PasswordStrengthIndicator password={password} />
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-black/70 text-sm font-medium">Confirm Password</Label>
            <div className="relative mt-1">
              <Input 
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="w-full h-11 border-black/10 focus:border-[#7B3FE4] focus:ring-[#7B3FE4] bg-white pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/60 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-11 bg-[#7B3FE4] hover:bg-[#6B35D0] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                Creating account...
              </span>
            ) : "Create Account"}
          </Button>
        </form>

        <div className="relative mt-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-black/50">or continue with</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          variant="outline"
          className="w-full h-11 border-black/10 hover:bg-black/5 hover:border-black/20 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isLoading ? (
            <Loader2 className="animate-spin h-5 w-5 text-black/60" />
          ) : (
            <>
              <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-red-500 mr-2" />
              Sign up with Google
            </>
          )}
        </Button>

        <p className="text-xs text-black/50 text-center mt-4">
          By continuing, you agree to SmartFormAI's Terms of Service and Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default SignupModal;

