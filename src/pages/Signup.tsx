import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { signUpWithEmail } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { useAlert } from "@/components/AlertProvider";
import { validatePassword } from '@/lib/passwordValidation';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../logo/Screenshot 2025-04-21 000221.png';
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";

const SignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle } = useAuth();
  const { showAlert } = useAlert();
  
  // Get the path the user was trying to access
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Get plan selection information if available
  const selectedPlan = (location.state as any)?.selectedPlan || localStorage.getItem('selectedPlan');
  const billingCycle = (location.state as any)?.billingCycle || localStorage.getItem('billingCycle');
  const subscriptionToken = (location.state as any)?.subscriptionToken;
  
  // If we have a plan from location state, save it to localStorage for persistence
  useEffect(() => {
    if ((location.state as any)?.selectedPlan) {
      localStorage.setItem('selectedPlan', (location.state as any)?.selectedPlan);
      localStorage.setItem('billingCycle', (location.state as any)?.billingCycle || 'annual');
      if (subscriptionToken) {
        localStorage.setItem('subscriptionToken', subscriptionToken);
      }
    }
  }, [location.state, subscriptionToken]);
  
  // Determine where to navigate after successful sign-up
  const getRedirectDestination = () => {
    // If user was trying to subscribe to a plan, take them directly to payment
    if (selectedPlan) {
      // Keep subscription token in storage for validation in pricing page
      // We'll clear it only after redirecting to payment page
      
      return {
        path: '/pricing',  // Redirect to pricing which will then redirect to payment if token is valid
        state: { 
          selectedPlan: selectedPlan,
          billingCycle: billingCycle || 'annual',
          subscriptionToken: subscriptionToken
        }
      };
    }
    
    // Otherwise, go to dashboard
    return {
      path: '/dashboard',
      state: {}
    };
  };

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
      const result = await signUpWithEmail(email, password);
      if (result.success) {
        showAlert("Success", "Account created successfully!", "success");
        const destination = getRedirectDestination();
        navigate(destination.path, { state: destination.state, replace: true });
      } else {
        showAlert("Error", result.error || "Failed to create account", "error");
      }
    } catch (error) {
      showAlert("Error", "An unexpected error occurred", "error");
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      const destination = getRedirectDestination();
      navigate(destination.path, { state: destination.state, replace: true });
    } else {
      setError(result.error || 'Failed to sign in with Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <img src={logo} alt="GoalTrack" className="h-8 w-8" />
            <span className="text-xl font-bold">GoalTrack</span>
          </div>
          <Link 
            to="/signin" 
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Log in
          </Link>
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Sign up</h2>
        
        {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7B61FF]"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7B61FF]"
              placeholder="email@domain.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7B61FF] pr-10"
                placeholder="••••••"
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
            {isPasswordFocused && <PasswordStrengthIndicator password={password} />}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7B61FF] pr-10"
                placeholder="••••••"
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
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#7B61FF] text-white rounded-lg hover:bg-[#6B51EF] transition-colors"
          >
            Sign up
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">or</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full mt-4 py-2 px-4 border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <FontAwesomeIcon icon={faGoogle} className="w-5 h-5" />
          <span className="text-gray-700">Sign in with Google</span>
        </button>

        <p className="mt-6 text-sm text-center text-gray-600">
          By signing up, you acknowledge that you have read and understood, and agree to GoalTrack's{' '}
          <Link to="/terms" className="text-[#7B61FF] hover:underline">Terms of Service</Link>,{' '}
          <Link to="/content-rules" className="text-[#7B61FF] hover:underline">Content Rules</Link> and{' '}
          <Link to="/privacy" className="text-[#7B61FF] hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;