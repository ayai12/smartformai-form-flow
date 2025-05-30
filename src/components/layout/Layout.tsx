import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/logo';

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
            <Logo size={40} className="mr-2" />
            <span className="text-xl font-poppins font-bold">SmartFormAI</span>
          </Link>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="font-medium text-gray-700 hover:text-smartform-blue transition-colors">Home</Link>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center mb-4">
                <Logo size={32} className="mr-2" />
                <span className="text-lg font-poppins font-bold">SmartFormAI</span>
              </div>
              <p className="text-gray-600 mb-2">Forms that think.</p>
              <p className="text-gray-500 text-sm">© 2025 SmartFormAI</p>
            </div>
            <div className="flex flex-col md:items-end md:text-right space-y-2">
              <div className="flex flex-wrap gap-4 mb-2">
                <Link to="/pricing" className="text-gray-600 hover:text-smartform-blue">Pricing</Link>
                <Link to="/privacy" className="text-gray-600 hover:text-smartform-blue">Privacy</Link>
                <Link to="/terms" className="text-gray-600 hover:text-smartform-blue">Terms</Link>
              </div>
              <div className="flex items-center gap-2">
                <a href="https://x.com/ReinwatashiDev" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-smartform-blue flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1"><path d="M20.893 3.104a2.5 2.5 0 0 0-3.535 0l-4.36 4.36-4.36-4.36a2.5 2.5 0 0 0-3.535 3.535l4.36 4.36-4.36 4.36a2.5 2.5 0 1 0 3.535 3.535l4.36-4.36 4.36 4.36a2.5 2.5 0 1 0 3.535-3.535l-4.36-4.36 4.36-4.36a2.5 2.5 0 0 0 0-3.535z"/></svg>
                  @ReinwatashiDev
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
