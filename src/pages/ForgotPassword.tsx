import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Logo } from "@/logo";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../components/AlertProvider";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Create schema for form validation
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    }
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      const result = await resetPassword(data.email);
      if (result.success) {
        setEmailSent(true);
        showAlert(
          "Success", 
          "Password reset email sent! Check your inbox.", 
          "success"
        );
      } else {
        showAlert(
          "Error", 
          result.error || "Failed to send reset email", 
          "error"
        );
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-20 w-40 h-40 bg-smartform-blue/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-smartform-violet/5 rounded-full blur-3xl"></div>
      
      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white relative overflow-hidden transform transition-all hover:shadow-2xl">
            {/* Decorative corner elements */}
            <div className="absolute top-0 right-0 w-16 h-16">
              <div className="absolute top-0 right-0 w-full h-full bg-smartform-violet/10 rounded-bl-3xl"></div>
              <div className="absolute top-2 right-2 w-3 h-3 bg-smartform-violet rounded-full animate-ping opacity-70"></div>
            </div>
            
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-smartform-blue to-smartform-violet rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
                  <Logo size={40} className="relative" />
                </div>
                <div className="flex flex-col ml-2">
                  <span className="text-xl font-bold text-smartform-charcoal">SmartFormAI</span>
                  <span className="text-xs text-gray-500">Password Reset</span>
                </div>
              </div>
              <Link 
                to="/signin" 
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors transform hover:scale-105"
              >
                Sign in
              </Link>
            </div>
            
            <h2 className="text-2xl font-bold mb-2 text-center">Reset Your Password</h2>
            <p className="text-center text-gray-600 mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            {emailSent ? (
              <div className="text-center p-6 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Email Sent!</h3>
                <p className="text-gray-600">Check your inbox for instructions to reset your password.</p>
                <div className="pt-4">
                  <Link
                    to="/signin"
                    className="text-smartform-blue hover:underline font-medium"
                  >
                    Return to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-smartform-blue focus:border-transparent transition-all hover:shadow-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-smartform-blue to-smartform-violet text-white py-2 px-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : "Send Reset Link"}
                  </Button>
                </form>
              </Form>
            )}

            <p className="mt-8 text-sm text-center text-gray-600">
              Remember your password?{' '}
              <Link to="/signin" className="text-smartform-blue font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 