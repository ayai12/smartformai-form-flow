import React, { useState, useEffect, useRef } from 'react';
import { Bell, HelpCircle, Users, FileText, X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { getUserCredits } from '@/firebase/credits';

const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>('User');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(true);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const notificationRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Helper function to format time ago
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  };

  useEffect(() => {
    // Set the user's display name or email
    if (user) {
      if (user.displayName) {
        setUserName(user.displayName);
      } else if (user.email) {
        // Use the part before @ in email
        setUserName(user.email.split('@')[0]);
      }
      
      // Fetch user credits and plan
      const fetchUserCredits = async () => {
        if (user.uid) {
          try {
            const { credits, plan } = await getUserCredits(user.uid);
            setUserCredits(credits);
            setUserPlan(plan);
          } catch (error) {
            console.error('Error fetching user credits:', error);
          }
        }
      };
      
      fetchUserCredits();
    }

    // Fetch recent activity for notifications
    const fetchRecentActivity = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const db = getFirestore();
        
        // Get the user's forms
        const formsQuery = query(
          collection(db, 'forms'),
          where('ownerId', '==', user.uid),
          limit(5)
        );
        
        const formsSnap = await getDocs(formsQuery);
        const formIds = formsSnap.docs.map(doc => doc.id);
        
        // If user has no forms, return empty
        if (formIds.length === 0) {
          setRecentActivity([]);
          setLoading(false);
          return;
        }
        
        // Get recent responses for these forms
        const allResponses: any[] = [];
        
        for (const formId of formIds) {
          const formData = formsSnap.docs.find(doc => doc.id === formId)?.data();
          const formTitle = formData?.title || 'Untitled Form';
          
          const responsesQuery = query(
            collection(db, 'survey_responses'),
            where('formId', '==', formId),
            limit(3)
          );
          
          const responsesSnap = await getDocs(responsesQuery);
          
          const formResponses = responsesSnap.docs.map(doc => {
            const data = doc.data();
            return {
              type: 'response',
              id: doc.id,
              form: formTitle,
              formId: formId,
              time: getTimeAgo(new Date(data.completedAt || Date.now()))
            };
          });
          
          allResponses.push(...formResponses);
        }
        
        // Sort by most recent
        allResponses.sort((a, b) => {
          const timeToSeconds = (timeStr: string) => {
            const [value, unit] = timeStr.split(' ');
            const num = parseInt(value);
            
            switch(unit) {
              case 'seconds': return num;
              case 'minutes': case 'minute': return num * 60;
              case 'hours': case 'hour': return num * 3600;
              case 'days': case 'day': return num * 86400;
              case 'months': case 'month': return num * 2592000;
              case 'years': case 'year': return num * 31536000;
              default: return 0;
            }
          };
          
          return timeToSeconds(a.time) - timeToSeconds(b.time);
        });
        
        setRecentActivity(allResponses.slice(0, 5));
        setHasUnread(allResponses.length > 0);
        
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentActivity();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  const markAllAsRead = () => {
    setHasUnread(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Calculate notification panel position when bell icon is clicked
  const getNotificationPosition = () => {
    if (!bellRef.current) return {};
    
    const bellRect = bellRef.current.getBoundingClientRect();
    const rightPosition = window.innerWidth - bellRect.right;
    
    return {
      top: `${bellRect.bottom + 8}px`,
      right: `${rightPosition}px`
    };
  };

  return (
    <header className="h-16 bg-white border-b border-black/10 flex items-center justify-between px-6 min-w-0 relative z-10">
      <div>
        {/* Placeholder for breadcrumbs or page title */}
      </div>
      <div className="flex items-center space-x-3 min-w-0">
        {/* Credit Balance Display */}
        {userCredits !== null && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#7B3FE4]/5 border border-[#7B3FE4]/20">
            <CreditCard className="h-4 w-4 text-[#7B3FE4]" />
            <span className="text-sm font-medium text-black">
              {userPlan === 'pro' ? 'Unlimited' : `${userCredits} credits`}
            </span>
          </div>
        )}
        <Button variant="ghost" size="icon" className="text-black/60 hover:text-black hover:bg-black/5 h-9 w-9">
          <HelpCircle size={18} />
        </Button>
        <div className="relative" ref={notificationRef}>
          <Button 
            ref={bellRef}
            variant="ghost" 
            size="icon" 
            className="text-black/60 hover:text-black hover:bg-black/5 relative h-9 w-9"
            onClick={toggleNotifications}
          >
            <Bell size={18} />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7B3FE4] rounded-full"></span>
            )}
          </Button>
          
          {/* Fixed position notification panel */}
          {showNotifications && (
            <>
              {/* Overlay to capture clicks outside */}
              <div className="fixed inset-0 z-[9998]" onClick={() => setShowNotifications(false)}></div>
              
              {/* Notification panel with fixed positioning */}
              <div 
                className="fixed w-[320px] bg-white rounded-lg shadow-lg border border-black/10 z-[9999]"
                style={getNotificationPosition()}
              >
                <div className="flex justify-between items-center p-4 border-b border-black/10">
                  <h4 className="font-medium text-sm text-black">Notifications</h4>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-black/60 hover:text-black hover:bg-black/5" 
                    onClick={() => setShowNotifications(false)}
                  >
                    <X size={14} />
                  </Button>
                </div>
                
                <div className="p-2 max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center py-6">
                      <span className="text-sm text-black/50">Loading...</span>
                    </div>
                  ) : recentActivity.length > 0 ? (
                    <div className="space-y-1">
                      {recentActivity.slice(0, 3).map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-black/5 transition-colors">
                          <div className="p-2 rounded-lg bg-[#7B3FE4]/10 text-[#7B3FE4] flex-shrink-0 mt-0.5">
                            <Users size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs text-black">New response</p>
                            <p className="text-black/60 text-xs mt-0.5">{activity.form}</p>
                            <p className="text-black/40 text-xs mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-black/40">
                      <Bell size={20} className="mb-2 text-black/20" />
                      <p className="text-xs">No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="h-6 w-px bg-black/10 hidden sm:block"></div>
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-8 w-8 border border-black/10">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback className="bg-black/5 text-black text-xs">{userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-black hidden sm:inline-block truncate max-w-[100px]">{userName}</span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader; 