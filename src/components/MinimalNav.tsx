import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/logo';

const MinimalNav: React.FC = () => {
  return (
    <header className="border-b border-black/10 sticky top-0 bg-white z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2" aria-label="SmartFormAI Agents Home">
          <Logo size={32} className="mr-2" />
          <span className="text-xl font-medium">SmartFormAI Agents</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-black/70 hover:text-black" asChild>
            <Link to="/signin">Login</Link>
          </Button>
          <Button className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white" asChild>
            <Link to="/signup">Sign Up Free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default MinimalNav;

