import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Account for sticky header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false); // Close mobile menu after clicking
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="robots" content="index, follow" />
        {metaTitle && <title>{metaTitle}</title>}
        {metaDescription && <meta name="description" content={metaDescription} />}
        {/* TODO: Add JSON-LD structured data here for SEO */}
      </Helmet>
      <header className="border-b border-black/10 sticky top-0 bg-white z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2" aria-label="SmartFormAI Agents Home">
            <Logo size={32} className="mr-2" />
            <span className="text-xl font-medium">SmartFormAI Agents</span>
          </Link>
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {isLandingPage ? (
              <>
                <button onClick={() => scrollToSection('features')} className="text-black/70 hover:text-black transition-colors">Features</button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-black/70 hover:text-black transition-colors">How It Works</button>
                <button onClick={() => scrollToSection('demo')} className="text-black/70 hover:text-black transition-colors">Demo</button>
                <button onClick={() => scrollToSection('testimonials')} className="text-black/70 hover:text-black transition-colors">Testimonials</button>
                <button onClick={() => scrollToSection('pricing')} className="text-black/70 hover:text-black transition-colors">Pricing</button>
                <button onClick={() => scrollToSection('faq')} className="text-black/70 hover:text-black transition-colors">FAQ</button>
              </>
            ) : (
              <>
                <Link to="/" className="text-black/70 hover:text-black transition-colors">Home</Link>
                <Link to="/forms" className="text-black/70 hover:text-black transition-colors">Agents</Link>
                <Link to="/analytics" className="text-black/70 hover:text-black transition-colors">Analytics</Link>
                <Link to="/profile" className="text-black/70 hover:text-black transition-colors">Profile</Link>
                <Link to="/pricing" className="text-black/70 hover:text-black transition-colors">Pricing</Link>
              </>
            )}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-black/70 hover:text-black" asChild>
              <Link to="/signin">Login</Link>
            </Button>
            <Button className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white" asChild>
              <Link to={isLandingPage ? "/signup" : "/train-agent"}>
                {isLandingPage ? "Get Started" : "Train Agent"}
              </Link>
            </Button>
          </div>
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 focus:outline-none focus:ring-2 focus:ring-[#7B3FE4] rounded"
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
          <nav className="md:hidden border-t border-black/10 bg-white">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {isLandingPage ? (
                <>
                  <button onClick={() => scrollToSection('features')} className="py-2 px-3 hover:bg-black/5 rounded text-sm text-left">Features</button>
                  <button onClick={() => scrollToSection('how-it-works')} className="py-2 px-3 hover:bg-black/5 rounded text-sm text-left">How It Works</button>
                  <button onClick={() => scrollToSection('demo')} className="py-2 px-3 hover:bg-black/5 rounded text-sm text-left">Demo</button>
                  <button onClick={() => scrollToSection('testimonials')} className="py-2 px-3 hover:bg-black/5 rounded text-sm text-left">Testimonials</button>
                  <button onClick={() => scrollToSection('pricing')} className="py-2 px-3 hover:bg-black/5 rounded text-sm text-left">Pricing</button>
                  <button onClick={() => scrollToSection('faq')} className="py-2 px-3 hover:bg-black/5 rounded text-sm text-left">FAQ</button>
                </>
              ) : (
                <>
                  <Link to="/" className="py-2 px-3 hover:bg-black/5 rounded text-sm">Home</Link>
                  <Link to="/forms" className="py-2 px-3 hover:bg-black/5 rounded text-sm">Agents</Link>
                  <Link to="/analytics" className="py-2 px-3 hover:bg-black/5 rounded text-sm">Analytics</Link>
                  <Link to="/profile" className="py-2 px-3 hover:bg-black/5 rounded text-sm">Profile</Link>
                  <Link to="/pricing" className="py-2 px-3 hover:bg-black/5 rounded text-sm">Pricing</Link>
                </>
              )}
              <div className="flex flex-col gap-2 pt-3 border-t border-black/10 mt-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/signin">Login</Link>
                </Button>
                <Button className="w-full bg-[#7B3FE4] hover:bg-[#6B35D0] text-white" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </nav>
        )}
      </header>
      <main className="flex-grow bg-white">
        {children}
      </main>
      <footer className="border-t border-black/10 mt-12">
        <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div>
            <div className="flex items-center mb-4">
              <Logo size={28} className="mr-2" />
              <span className="text-base font-medium">SmartFormAI Agents</span>
            </div>
            <p className="text-black/60 mb-3 max-w-xs text-sm">Enterprise-grade AI agents for forms, business automation, research, and feedback.</p>
            <p className="text-black/50 text-xs">Created by Rein Watashi</p>
          </div>
          <div>
            <h3 className="font-medium text-black mb-3 text-sm">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-black/60 hover:text-[#7B3FE4] text-sm transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-black/60 hover:text-[#7B3FE4] text-sm transition-colors">Pricing</Link></li>
              <li><Link to="/about" className="text-black/60 hover:text-[#7B3FE4] text-sm transition-colors">About</Link></li>
              <li><Link to="/blog" className="text-black/60 hover:text-[#7B3FE4] text-sm transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="text-black/60 hover:text-[#7B3FE4] text-sm transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-black mb-3 text-sm">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/ai-form-generator-for-surveys" className="text-black/60 hover:text-[#7B3FE4] text-sm transition-colors">AI Survey Generator</Link></li>
              <li><Link to="/ai-form-generator-for-feedback" className="text-black/60 hover:text-[#7B3FE4] text-sm transition-colors">AI Feedback Form Generator</Link></li>
              <li><Link to="/ai-form-generator-types" className="text-black/60 hover:text-[#7B3FE4] text-sm transition-colors">Form Types</Link></li>
              <li><a href="https://x.com/ReinwatashiDev" target="_blank" rel="noopener noreferrer" className="text-black/60 hover:text-[#7B3FE4] text-sm transition-colors">@ReinWatashiDev</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
