import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-100 sticky top-0 bg-white z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-smartform-blue to-smartform-violet rounded-lg mr-2">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-poppins font-bold">SmartFormAI</span>
          </Link>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="font-medium text-gray-700 hover:text-smartform-blue transition-colors">Home</Link>
            <Link to="/features" className="font-medium text-gray-700 hover:text-smartform-blue transition-colors">Features</Link>
            <Link to="/pricing" className="font-medium text-gray-700 hover:text-smartform-blue transition-colors">Pricing</Link>
            <Link to="/about" className="font-medium text-gray-700 hover:text-smartform-blue transition-colors">About</Link>
            <Link to="/blog" className="font-medium text-gray-700 hover:text-smartform-blue transition-colors">Blog</Link>
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button className="bg-smartform-blue hover:bg-blue-700" asChild>
              <Link to="/signup">Sign Up Free</Link>
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              className="w-6 h-6"
            >
              {isMenuOpen ? (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              ) : (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 animate-fade-in">
            <div className="container mx-auto px-4 py-3">
              <nav className="flex flex-col space-y-3">
                <Link to="/" className="py-2 px-3 font-medium text-gray-700 hover:bg-gray-50 rounded-md">Home</Link>
                <Link to="/features" className="py-2 px-3 font-medium text-gray-700 hover:bg-gray-50 rounded-md">Features</Link>
                <Link to="/pricing" className="py-2 px-3 font-medium text-gray-700 hover:bg-gray-50 rounded-md">Pricing</Link>
                <Link to="/about" className="py-2 px-3 font-medium text-gray-700 hover:bg-gray-50 rounded-md">About</Link>
                <Link to="/blog" className="py-2 px-3 font-medium text-gray-700 hover:bg-gray-50 rounded-md">Blog</Link>
                <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200">
                  <Button variant="outline" className="justify-center" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button className="bg-smartform-blue hover:bg-blue-700 justify-center" asChild>
                    <Link to="/signup">Sign Up Free</Link>
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-smartform-blue to-smartform-violet rounded-lg mr-2">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-lg font-poppins font-bold">SmartFormAI</span>
              </div>
              <p className="text-gray-600 mb-4">Forms that think.</p>
              <p className="text-gray-500 text-sm">© 2025 SmartFormAI Inc.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Product</h3>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-600 hover:text-smartform-blue">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-600 hover:text-smartform-blue">Pricing</Link></li>
                <li><Link to="/templates" className="text-gray-600 hover:text-smartform-blue">Templates</Link></li>
                <li><Link to="/integrations" className="text-gray-600 hover:text-smartform-blue">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Resources</h3>
              <ul className="space-y-2">
                <li><Link to="/blog" className="text-gray-600 hover:text-smartform-blue">Blog</Link></li>
                <li><Link to="/documentation" className="text-gray-600 hover:text-smartform-blue">Documentation</Link></li>
                <li><Link to="/faq" className="text-gray-600 hover:text-smartform-blue">FAQ</Link></li>
                <li><Link to="/support" className="text-gray-600 hover:text-smartform-blue">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Company</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-600 hover:text-smartform-blue">About</Link></li>
                <li><Link to="/careers" className="text-gray-600 hover:text-smartform-blue">Careers</Link></li>
                <li><Link to="/privacy" className="text-gray-600 hover:text-smartform-blue">Privacy</Link></li>
                <li><Link to="/terms" className="text-gray-600 hover:text-smartform-blue">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
