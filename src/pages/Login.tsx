
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      <Link to="/" className="flex items-center mb-8">
        <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-smartform-blue to-smartform-violet rounded-lg mr-2">
          <span className="text-white font-bold text-xl">S</span>
        </div>
        <span className="text-xl font-poppins font-bold">SmartFormAI</span>
      </Link>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Log in to your account</h1>
        
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input id="email" type="email" placeholder="your@email.com" />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input id="password" type="password" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-smartform-blue focus:ring-smartform-blue border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            
            <div className="text-sm">
              <a href="#" className="text-smartform-blue hover:underline">
                Forgot your password?
              </a>
            </div>
          </div>
          
          <Button className="w-full bg-smartform-blue hover:bg-blue-700">
            Sign in
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-smartform-blue hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
