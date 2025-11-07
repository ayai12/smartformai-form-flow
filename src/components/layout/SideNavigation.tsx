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
        "w-full justify-start gap-3 font-normal h-10 rounded-lg transition-colors",
        isActive 
          ? "bg-[#7B3FE4]/10 text-[#7B3FE4] font-medium" 
          : "text-black/60 hover:bg-black/5 hover:text-black",
        collapsed && "px-2 justify-center"
      )}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span className="text-sm">{label}</span>}
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
      label: 'Home' 
    },
    { 
      to: '/forms', 
      icon: <FileText size={20} />, 
      label: 'Agents' 
    },
    { 
      to: '/analytics', 
      icon: <BarChart3 size={20} />, 
      label: 'Analytics' 
    },
    { 
      to: '/train-agent', 
      icon: <PlusCircle size={20} />, 
      label: 'Train Agent' 
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
        "h-screen flex flex-col border-r border-black/10 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "p-4 border-b border-black/10 flex items-center", 
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed ? (
            <Link to="/dashboard" className="flex items-center gap-2">
              <Logo size={28} />
              <span className="font-medium text-base text-black">SmartFormAI Agents</span>
            </Link>
          ) : (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="text-black/60 hover:text-black hover:bg-black/5"
            >
              <Menu size={18} />
            </Button>
          )}
          
          {!collapsed && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="text-black/60 hover:text-black hover:bg-black/5"
            >
              <X size={18} />
            </Button>
          )}
        </div>
        
        <div className={cn(
          "flex-1 overflow-y-auto p-3", 
          collapsed ? "space-y-2" : "space-y-1"
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
          "p-3 border-t border-black/10", 
          collapsed ? "space-y-2" : "space-y-1"
        )}>
          <NavItem
            to="/profile"
            icon={<User size={18} />}
            label="Profile"
            isActive={currentPath === '/profile' || currentPath.startsWith('/profile/')}
            collapsed={collapsed}
          />
          <Button
            variant="ghost"
            className={cn(
              "w-full font-normal h-10 gap-3 text-black/60 hover:bg-black/5 hover:text-black rounded-lg transition-colors",
              collapsed ? "px-2 justify-center" : "justify-start"
            )}
            title={collapsed ? "Sign Out" : undefined}
            onClick={() => setShowSignOutModal(true)}
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm">Sign Out</span>}
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