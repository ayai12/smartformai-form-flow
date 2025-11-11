import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Logo } from "@/logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Logo size={80} />
        </div>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <div className="space-y-4">
          <a href="/" className="block text-blue-500 hover:text-blue-700 underline">
            Return to Home
          </a>
          <p className="text-sm text-gray-500">
            Need help? Contact{' '}
            <a 
              href="https://x.com/ReinwatashiDev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              @ReinwatashiDev on X
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
