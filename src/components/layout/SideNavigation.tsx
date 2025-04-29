import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3,
  Settings, 
  User, 
  PanelLeft,
  LogOut,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
};

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => (
  <Link to={to}>
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 font-normal h-10 rounded-md",
        isActive 
          ? "bg-smartform-blue/10 text-smartform-blue font-medium" 
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      {icon}
      <span>{label}</span>
    </Button>
  </Link>
);

const SideNavigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navItems = [
    { 
      to: '/dashboard', 
      icon: <LayoutDashboard size={20} />, 
      label: 'Dashboard' 
    },
    { 
      to: '/forms', 
      icon: <FileText size={20} />, 
      label: 'My Forms' 
    },
    { 
      to: '/builder', 
      icon: <PlusCircle size={20} />, 
      label: 'Create Form' 
    },
    { 
      to: '/analytics', 
      icon: <BarChart3 size={20} />, 
      label: 'Analytics' 
    },
    { 
      to: '/templates', 
      icon: <PanelLeft size={20} />, 
      label: 'Templates' 
    },
    { 
      to: '/settings', 
      icon: <Settings size={20} />, 
      label: 'Settings' 
    },
    { 
      to: '/profile', 
      icon: <User size={20} />, 
      label: 'Profile' 
    },
  ];

  return (
    <div className="h-screen flex flex-col w-64 border-r border-gray-200 bg-white">
      <div className="p-4 border-b">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-smartform-blue rounded-md flex items-center justify-center text-white font-bold">
            SF
          </div>
          <span className="font-bold text-lg text-gray-800">SmartFormAI</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={currentPath === item.to || currentPath.startsWith(`${item.to}/`)}
          />
        ))}
      </div>
      
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

export default SideNavigation; 