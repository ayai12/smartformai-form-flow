import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Logo } from "@/logo";
import { useAlert } from "../components/AlertProvider";

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

  // Get the path the user was trying to access
  // Try to get from query params or fallback to location state
  const searchParams = new URLSearchParams(location.search);
  const returnToParam = searchParams.get('returnTo');
  const returnTo = returnToParam || 
                  (location.state as any)?.returnTo || 
                  (location.state as any)?.from?.pathname || 
                  '/dashboard';
                  
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
  
  // Determine where to navigate after successful sign-in
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
    
    // Otherwise, return to the intended destination
    return {
      path: returnTo,
      state: {}
    };
  };

  const form = useForm<SignInFormValues>({
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        const destination = getRedirectDestination();
        navigate(destination.path, { state: destination.state, replace: true });
      } else {
        setError(result.error || 'Failed to sign in with Google');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    }
  };

  const onSubmit = async (data: SignInFormValues) => {
    try {
      const result = await signIn(data.email, data.password);
      if (result.success) {
        showAlert("Success", "Successfully signed in!", "success");
        const destination = getRedirectDestination();
        navigate(destination.path, { state: destination.state, replace: true });
      } else {
        showAlert("Error", result.error || "Invalid credentials", "error");
      }
    } catch (error) {
      showAlert(
        "Error", 
        "An unexpected error occurred", 
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Logo size={32} />
              <CardTitle className="text-2xl font-bold">Sign in to SmartFormAI</CardTitle>
            </div>
            <Link 
              to="/signup" 
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Sign up
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4 text-sm">{error}</div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">or</p>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full mt-4"
          >
            <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 mr-2" />
            Sign in with Google
          </Button>

          <p className="mt-6 text-sm text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;