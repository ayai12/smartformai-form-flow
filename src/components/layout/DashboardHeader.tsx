import React, { useState, useEffect, useRef } from 'react';
import { Bell, HelpCircle, Users, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>('User');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(true);
  const notificationRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Set the user's display name or email
    if (user) {
      if (user.displayName) {
        setUserName(user.displayName);
      } else if (user.email) {
        // Use the part before @ in email
        setUserName(user.email.split('@')[0]);
      }
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 min-w-0 overflow-x-auto relative z-10">
      <div>
        {/* Placeholder for breadcrumbs or page title */}
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
        <Button variant="ghost" size="icon" className="text-gray-500">
          <HelpCircle size={20} />
        </Button>
        <div className="relative" ref={notificationRef}>
          <Button 
            ref={bellRef}
            variant="ghost" 
            size="icon" 
            className="text-gray-500 relative h-10 w-10 sm:h-8 sm:w-8"
            onClick={toggleNotifications}
          >
            <Bell size={24} />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </Button>
          
          {/* Fixed position notification panel */}
          {showNotifications && (
            <>
              {/* Overlay to capture clicks outside */}
              <div className="fixed inset-0 z-[9998]" onClick={() => setShowNotifications(false)}></div>
              
              {/* Notification panel with fixed positioning */}
              <div 
                className="fixed w-[350px] bg-white rounded-md shadow-xl border z-[9999]"
                style={getNotificationPosition()}
              >
                <div className="flex justify-between items-center p-3 border-b">
                  <h4 className="font-medium">Notifications</h4>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => setShowNotifications(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>
                
                <div className="p-2">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : recentActivity.length > 0 ? (
                    <div className="space-y-2">
                      {recentActivity.slice(0, 3).map((activity, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50">
                          <div className="p-1.5 rounded-full bg-green-100 text-green-600 flex-shrink-0">
                            <Users size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs">New response</p>
                            <p className="text-gray-600 text-xs">{activity.form}</p>
                            <p className="text-gray-400 text-xs">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-gray-500">
                      <Bell size={20} className="mb-2 text-gray-300" />
                      <p className="text-xs">No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline-block truncate max-w-[100px]">{userName}</span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader; 