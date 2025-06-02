import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/logo';
import { Helmet } from 'react-helmet';

interface LayoutProps {
  children: React.ReactNode;
  metaTitle?: string;
  metaDescription?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, metaTitle, metaDescription }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="robots" content="index, follow" />
        {metaTitle && <title>{metaTitle}</title>}
        {metaDescription && <meta name="description" content={metaDescription} />}
        {/* TODO: Add JSON-LD structured data here for SEO */}
      </Helmet>
      <header className="border-b border-gray-100 sticky top-0 bg-white z-50 shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2" aria-label="SmartFormAI Home">
            <Logo size={40} className="mr-2" />
            <span className="text-2xl font-poppins font-bold tracking-tight">SmartFormAI</span>
          </Link>
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8 text-base">
            <Link to="/features" className="hover:text-smartform-blue transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-smartform-blue transition-colors">Pricing</Link>
            <Link to="/about" className="hover:text-smartform-blue transition-colors">About</Link>
            <Link to="/blog" className="hover:text-smartform-blue transition-colors">Blog</Link>
            <Link to="/contact" className="hover:text-smartform-blue transition-colors">Contact</Link>
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button className="bg-smartform-blue hover:bg-blue-700" asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 focus:outline-none focus:ring-2 focus:ring-smartform-blue rounded"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              className="w-7 h-7"
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
          <nav className="md:hidden border-t border-gray-200 animate-fade-in bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <Link to="/features" className="py-2 px-3 hover:bg-gray-50 rounded">Features</Link>
              <Link to="/pricing" className="py-2 px-3 hover:bg-gray-50 rounded">Pricing</Link>
              <Link to="/about" className="py-2 px-3 hover:bg-gray-50 rounded">About</Link>
              <Link to="/blog" className="py-2 px-3 hover:bg-gray-50 rounded">Blog</Link>
              <Link to="/contact" className="py-2 px-3 hover:bg-gray-50 rounded">Contact</Link>
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 mt-2">
                <Button variant="outline" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                <Button className="bg-smartform-blue hover:bg-blue-700" asChild>
                  <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
            </div>
          </nav>
        )}
      </header>
      <main className="flex-grow bg-white">
        {children}
      </main>
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div>
              <div className="flex items-center mb-4">
                <Logo size={32} className="mr-2" />
                <span className="text-lg font-poppins font-bold">SmartFormAI</span>
              </div>
            <p className="text-gray-700 mb-2 max-w-xs">Enterprise-grade AI form generator for business, research, and feedback. Secure, customizable, and easy to use.</p>
            <p className="text-gray-500 text-sm">Created by Rein Watashi</p>
            <p className="text-gray-400 text-xs mt-2">© 2025 SmartFormAI. All rights reserved.</p>
            </div>
          <div>
            <h3 className="font-semibold text-neutral-800 mb-3">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/features" className="hover:text-smartform-blue">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-smartform-blue">Pricing</Link></li>
              <li><Link to="/about" className="hover:text-smartform-blue">About</Link></li>
              <li><Link to="/blog" className="hover:text-smartform-blue">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-smartform-blue">Contact</Link></li>
            </ul>
            <div className="mt-6">
              <h4 className="font-semibold text-neutral-800 mb-2 text-sm">Trust & Security</h4>
              <div className="flex gap-3 items-center">
                {/* Placeholder for trust badges/certifications */}
                <span className="inline-block bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs">GDPR Ready</span>
                <span className="inline-block bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs">SSL Secured</span>
                <span className="inline-block bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs">99.99% Uptime</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800 mb-3">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/ai-form-generator-for-surveys" className="hover:text-smartform-blue">AI Survey Generator</Link></li>
              <li><Link to="/ai-form-generator-for-feedback" className="hover:text-smartform-blue">AI Feedback Form Generator</Link></li>
              <li><Link to="/ai-form-generator-types" className="hover:text-smartform-blue">Form Types</Link></li>
              <li><a href="https://x.com/ReinwatashiDev" target="_blank" rel="noopener noreferrer" className="hover:text-smartform-blue">@ReinWatashiDev</a></li>
            </ul>
            <div className="mt-6">
              <h4 className="font-semibold text-neutral-800 mb-2 text-sm">Testimonials</h4>
              <div className="text-gray-600 text-xs italic">“SmartFormAI streamlined our research process and saved us hours every week.”<br/>– B2B Client</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
