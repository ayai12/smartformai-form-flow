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
<<<<<<< HEAD
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo size={32} />
            <span className="text-xl font-medium text-black">SmartFormAI Agents</span>
=======
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white relative overflow-hidden transform transition-all hover:shadow-2xl">
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
                  <div className="absolute -inset-1 bg-gradient-to-r from-smartform-blue to-smartform-violet rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
                  <Logo size={40} className="relative" />
                </div>
                <div className="flex flex-col ml-2">
                  <span className="text-xl font-bold text-smartform-charcoal">SmartFormAI</span>
                  <span className="text-xs text-gray-500">Welcome back</span>
                </div>
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
            </div>
          <h2 className="text-2xl font-semibold text-black">Sign in to your account</h2>
          <p className="text-sm text-black/60">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
<<<<<<< HEAD
              state={{ from: returnTo, returnTo: returnTo }}
              className="text-[#7B3FE4] hover:text-[#6B35D0] font-medium transition-colors"
=======
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors transform hover:scale-105"
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
            >
              Sign up
            </Link>
          </p>
          </div>
            
<<<<<<< HEAD
        {/* Error message */}
          {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
=======
            <h2 className="text-2xl font-bold mb-6 text-center">Sign in to your account</h2>
            
          {error && (
              <div className="bg-red-50 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
                {error}
              </div>
          )}
            
<<<<<<< HEAD
        {/* Form */}
=======
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
<<<<<<< HEAD
                  <FormLabel className="text-black/70 text-sm font-medium">Email</FormLabel>
                    <FormControl>
                        <Input 
                          type="email" 
                      placeholder="you@example.com" 
                      className="w-full h-11 border-black/10 focus:border-[#7B3FE4] focus:ring-[#7B3FE4] bg-white"
=======
                      <FormLabel className="text-gray-700">Email</FormLabel>
                    <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email" 
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-smartform-blue focus:border-transparent transition-all hover:shadow-sm"
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
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
<<<<<<< HEAD
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-black/70 text-sm font-medium">Password</FormLabel>
                    <Link 
                      to="/forgot-password" 
                      className="text-xs text-[#7B3FE4] hover:text-[#6B35D0] transition-colors"
                    >
=======
                      <div className="flex justify-between">
                        <FormLabel className="text-gray-700">Password</FormLabel>
                        <Link to="/forgot-password" className="text-xs text-smartform-blue hover:underline">
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
                          Forgot password?
                        </Link>
                      </div>
                    <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
<<<<<<< HEAD
                        className="w-full h-11 border-black/10 focus:border-[#7B3FE4] focus:ring-[#7B3FE4] bg-white pr-10"
=======
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-smartform-blue focus:border-transparent transition-all hover:shadow-sm pr-10"
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
<<<<<<< HEAD
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/60 transition-colors"
=======
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
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
<<<<<<< HEAD
              className="w-full h-11 bg-[#7B3FE4] hover:bg-[#6B35D0] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
=======
                  className="w-full bg-gradient-to-r from-smartform-blue to-smartform-violet text-white py-2 px-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
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

<<<<<<< HEAD
        {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-black/50">or continue with</span>
=======
          <div className="mt-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or continue with</span>
                </div>
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
              </div>
          </div>

        {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
              disabled={isLoading}
            variant="outline"
<<<<<<< HEAD
          className="w-full h-11 border-black/10 hover:bg-black/5 hover:border-black/20 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-black/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
=======
              className="w-full mt-6 py-2 px-4 border border-gray-200 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
<<<<<<< HEAD
            <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-red-500 mr-2" />
              )}
          <span>Sign in with Google</span>
          </Button>
=======
                <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-red-500" />
              )}
              <span className="text-gray-700">Sign in with Google</span>
          </Button>

            <p className="mt-8 text-sm text-center text-gray-600">
            Don't have an account?{' '}
              <Link to="/signup" className="text-smartform-blue font-medium hover:underline">
                Create an account
            </Link>
          </p>
            
          </div>
        </div>
>>>>>>> 41acb0f1f453b8b41b92dea4ecb5f2dd504198c4
      </div>
    </div>
  );
};

export default SignInPage;