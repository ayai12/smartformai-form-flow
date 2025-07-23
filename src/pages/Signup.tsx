import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { signUpWithEmail } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { useAlert } from "@/components/AlertProvider";
import { validatePassword } from '@/lib/passwordValidation';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Logo } from "@/logo";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { updateUserProfile, UserProfile } from '@/firebase/userProfile';
import { User } from 'firebase/auth';
import { Button } from "@/components/ui/button";

// Extend the success result type to include user
interface SignupResult {
  success: boolean;
  error?: string;
  user?: User;
}

const SignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const { showAlert } = useAlert();

  // Password validation checks
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
      showAlert("Error", "Please fill in all fields", "error");
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
      
      showAlert("Error", errorMessage, "error");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Error", "Passwords do not match", "error");
      return;
    }

    try {
      setIsLoading(true);
      const result = await signUpWithEmail(email, password) as SignupResult;
      if (result.success && result.user) {
        // Split full name into first and last name
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Save user profile data to Firestore
        const profileData: UserProfile = {
          firstName,
          lastName,
          email
        };
        
        await updateUserProfile(result.user.uid, profileData);
        
        showAlert("Success", "Account created successfully!", "success");
        navigate('/dashboard', { replace: true });
      } else {
        showAlert("Error", result.error || "Failed to create account", "error");
      }
    } catch (error) {
      showAlert("Error", "An unexpected error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle();
      if (result.success) {
        navigate('/dashboard', { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-20 w-40 h-40 bg-smartform-blue/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-smartform-violet/5 rounded-full blur-3xl"></div>
      <div className="absolute -top-5 right-1/4 w-20 h-20 border-4 border-smartform-green/10 rounded-full animate-spin-slow"></div>
      <div className="absolute -bottom-5 left-1/4 w-16 h-16 border-4 border-yellow-300/10 rounded-xl rotate-12 animate-float"></div>
      
      {/* Floating shapes */}
      <div className="hidden md:block absolute top-20 right-20 w-16 h-16 bg-smartform-blue/10 rounded-xl rotate-12 animate-float"></div>
      <div className="hidden md:block absolute bottom-40 left-20 w-12 h-12 bg-smartform-violet/10 rounded-full animate-float-delay"></div>
      
      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white relative overflow-hidden">
            {/* Decorative corner elements */}
            <div className="absolute top-0 right-0 w-16 h-16">
              <div className="absolute top-0 right-0 w-full h-full bg-smartform-violet/10 rounded-bl-3xl"></div>
              <div className="absolute top-2 right-2 w-3 h-3 bg-smartform-violet rounded-full animate-ping opacity-70"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-12 h-12">
              <div className="absolute bottom-0 left-0 w-full h-full bg-smartform-blue/10 rounded-tr-3xl"></div>
              <div className="absolute bottom-2 left-2 w-2 h-2 bg-smartform-blue rounded-full animate-ping opacity-70"></div>
            </div>
            
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-smartform-blue to-smartform-violet rounded-full blur opacity-30 animate-pulse-slow"></div>
                  <Logo size={40} className="relative" />
                </div>
                <div className="flex flex-col ml-2">
                  <span className="text-xl font-bold text-smartform-charcoal">SmartFormAI</span>
                  <span className="text-xs text-gray-500">Create your account</span>
                </div>
          </div>
          <Link 
            to="/signin" 
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors transform hover:scale-105"
          >
            Log in
          </Link>
        </div>
        
            <h2 className="text-2xl font-bold mb-6 text-center">Sign up for free</h2>
            
            {error && (
              <div className="bg-red-50 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-smartform-blue focus:border-transparent transition-all hover:shadow-sm"
              placeholder="Your name"
            />
          </div>

          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-smartform-blue focus:border-transparent transition-all hover:shadow-sm"
              placeholder="email@domain.com"
            />
          </div>

          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-smartform-blue focus:border-transparent transition-all hover:shadow-sm pr-10"
                    placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
                {(isPasswordFocused || password) && (
                  <div className="mt-2 space-y-1">
                    {passwordChecks.map((check) => (
                      <div 
                        key={check.id} 
                        className={`flex items-center text-xs ${check.check() ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {check.check() ? (
                          <Check className="h-3 w-3 mr-1 text-green-600" />
                        ) : (
                          <div className="h-3 w-3 mr-1 rounded-full border border-gray-300"></div>
                        )}
                        {check.label}
                      </div>
                    ))}
                  </div>
                )}
          </div>

          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-smartform-blue focus:border-transparent transition-all hover:shadow-sm pr-10"
                    placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
                {password && confirmPassword && (
                  <div className="mt-1 flex items-center">
                    {password === confirmPassword ? (
                      <>
                        <Check className="h-3 w-3 text-green-600 mr-1" />
                        <span className="text-xs text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 text-red-500 mr-1" />
                        <span className="text-xs text-red-500">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
          </div>

          <button
            type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-smartform-blue to-smartform-violet text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : "Sign up"}
          </button>
        </form>

        <div className="mt-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or continue with</span>
                </div>
              </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full mt-6 py-3 px-4 border border-gray-200 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-red-500" />
              )}
              <span className="text-gray-700">Sign up with Google</span>
        </button>

            <p className="mt-8 text-sm text-center text-gray-600">
          By signing up, you acknowledge that you have read and understood, and agree to SmartFormAI's{' '}
              <Link to="/terms" className="text-smartform-blue hover:underline">Terms of Service</Link>,{' '}
              <Link to="/content-rules" className="text-smartform-blue hover:underline">Content Rules</Link> and{' '}
              <Link to="/privacy" className="text-smartform-blue hover:underline">Privacy Policy</Link>.
            </p>
            
       
       
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;