import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Logo } from "@/logo";
import { useAlert } from "../components/AlertProvider";
import { Eye, EyeOff } from 'lucide-react';

interface SignInFormValues {
  email: string;
  password: string;
}

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string>('');
  const { showAlert } = useAlert();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get the path the user was trying to access
  const searchParams = new URLSearchParams(location.search);
  const returnToParam = searchParams.get('returnTo');
  const returnTo = returnToParam || 
                  (location.state as any)?.returnTo || 
                  (location.state as any)?.from?.pathname || 
                  '/dashboard';

  const form = useForm<SignInFormValues>({
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle();
      if (result.success) {
        navigate(returnTo, { replace: true });
      } else {
        setError(result.error || 'Failed to sign in with Google');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SignInFormValues) => {
    try {
      setIsLoading(true);
      const result = await signIn(data.email, data.password);
      if (result.success) {
        showAlert("Success", "Successfully signed in!", "success");
        navigate(returnTo, { replace: true });
      } else {
        showAlert("Error", result.error || "Invalid credentials", "error");
      }
    } catch (error) {
      showAlert(
        "Error", 
        "An unexpected error occurred", 
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo size={32} />
            <span className="text-xl font-medium text-black">SmartFormAI Agents</span>
            </div>
          <h2 className="text-2xl font-semibold text-black">Sign in to your account</h2>
          <p className="text-sm text-black/60">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              state={{ from: returnTo, returnTo: returnTo }}
              className="text-[#7B3FE4] hover:text-[#6B35D0] font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
          </div>
            
        {/* Error message */}
          {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
          )}
            
        {/* Form */}
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel className="text-black/70 text-sm font-medium">Email</FormLabel>
                    <FormControl>
                        <Input 
                          type="email" 
                      placeholder="you@example.com" 
                      className="w-full h-11 border-black/10 focus:border-[#7B3FE4] focus:ring-[#7B3FE4] bg-white"
                          {...field} 
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-black/70 text-sm font-medium">Password</FormLabel>
                    <Link 
                      to="/forgot-password" 
                      className="text-xs text-[#7B3FE4] hover:text-[#6B35D0] transition-colors"
                    >
                          Forgot password?
                        </Link>
                      </div>
                    <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                        className="w-full h-11 border-black/10 focus:border-[#7B3FE4] focus:ring-[#7B3FE4] bg-white pr-10"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/60 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                <Button 
                  type="submit" 
                  disabled={isLoading}
              className="w-full h-11 bg-[#7B3FE4] hover:bg-[#6B35D0] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : "Sign in"}
              </Button>
            </form>
          </Form>

        {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-black/50">or continue with</span>
              </div>
          </div>

        {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
              disabled={isLoading}
            variant="outline"
          className="w-full h-11 border-black/10 hover:bg-black/5 hover:border-black/20 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-black/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
            <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-red-500 mr-2" />
              )}
          <span>Sign in with Google</span>
          </Button>
      </div>
    </div>
  );
};

export default SignInPage;