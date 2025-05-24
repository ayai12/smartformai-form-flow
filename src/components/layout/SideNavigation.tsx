import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3,
  Settings, 
  User, 
  PanelLeft,
  LogOut,
  PlusCircle,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/logo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  collapsed?: boolean;
};

const NavItem = ({ to, icon, label, isActive, collapsed }: NavItemProps) => (
  <Link to={to}>
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 font-normal h-10 rounded-md",
        isActive 
          ? "bg-smartform-blue/10 text-smartform-blue font-medium" 
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        collapsed && "px-2 justify-center"
      )}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Button>
  </Link>
);

const SideNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const currentPath = location.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  
  // Check window size on mount and when it changes
  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
    /* 
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
    */
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <div className={cn(
        "h-screen flex flex-col border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "p-4 border-b flex items-center", 
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed ? (
            <Link to="/dashboard" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-bold text-lg text-gray-800">SmartFormAI</span>
            </Link>
          ) : (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu size={20} />
            </Button>
          )}
          
          {!collapsed && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
            >
              <X size={20} />
            </Button>
          )}
        </div>
        
        <div className={cn(
          "flex-1 overflow-y-auto p-4", 
          collapsed ? "space-y-3" : "space-y-1"
        )}>
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.to || currentPath.startsWith(`${item.to}/`)}
              collapsed={collapsed}
            />
          ))}
        </div>
        
        <div className={cn(
          "p-4 border-t", 
          collapsed ? "space-y-3" : "space-y-1"
        )}>
          <NavItem
            to="/profile"
            icon={<User size={20} />}
            label="Profile"
            isActive={currentPath === '/profile' || currentPath.startsWith('/profile/')}
            collapsed={collapsed}
          />
          <Button
            variant="ghost"
            className={cn(
              "w-full font-normal h-10 gap-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              collapsed ? "px-2 justify-center" : "justify-start"
            )}
            title={collapsed ? "Sign Out" : undefined}
            onClick={() => setShowSignOutModal(true)}
          >
            <LogOut size={20} />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>

      <Dialog open={showSignOutModal} onOpenChange={setShowSignOutModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowSignOutModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SideNavigation; 