import React, { useState } from 'react';
import SideNavigation from './SideNavigation';
import DashboardHeader from './DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white">
      {/* Side Navigation - Hidden on mobile, shown on desktop */}
      <SideNavigation mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <DashboardHeader onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)} />
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 