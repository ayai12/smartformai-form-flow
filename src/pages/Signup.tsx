
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const Signup: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      <Link to="/" className="flex items-center mb-8">
        <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-smartform-blue to-smartform-violet rounded-lg mr-2">
          <span className="text-white font-bold text-xl">S</span>
        </div>
        <span className="text-xl font-poppins font-bold">SmartFormAI</span>
      </Link>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Create your account</h1>
        
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <Input id="first-name" type="text" />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <Input id="last-name" type="text" />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input id="email" type="email" placeholder="your@email.com" />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input id="password" type="password" />
            <p className="mt-1 text-sm text-gray-500">At least 8 characters</p>
          </div>
          
          <div>
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-smartform-blue focus:ring-smartform-blue border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-smartform-blue hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-smartform-blue hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>
          
          <Button className="w-full bg-smartform-blue hover:bg-blue-700">
            Create Account
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-smartform-blue hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
