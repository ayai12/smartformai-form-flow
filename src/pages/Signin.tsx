import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import logo from '../logo/Screenshot 2025-04-21 000221.png';
import { useAlert } from "../components/AlertProvider";

interface SignInFormValues {
  email: string;
  password: string;
}

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string>('');
  const { showAlert } = useAlert();

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
        navigate('/dashboard');
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
        navigate('/dashboard');
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
              <img src={logo} alt="GoalTrack" className="h-8 w-8" />
              <CardTitle className="text-2xl font-bold">Sign in to GoalTrack</CardTitle>
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