// Force TypeScript rebuild
import React, { useState, useEffect, ErrorInfo, ReactNode } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, updateUserProfile, UserProfile } from '@/firebase/userProfile';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: ReactNode, fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode, fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error in Profile component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

const ProfileContent: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    website: '',
    bio: ''
  });
  const navigate = useNavigate();
  
  // Fetch user profile data function
  const fetchUserProfile = async () => {
    if (user?.uid) {
      setLoading(true);
      try {
        console.log("Fetching user profile for:", user.uid);
        const profile = await getUserProfile(user.uid);
        
        // Initialize with data from auth if available
        const initialData: UserProfile = {
          firstName: user.displayName ? user.displayName.split(' ')[0] : '',
          lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
          email: user.email || '',
          // Add data from Firestore profile if available
          ...(profile || {})
        };
        
        setProfileData(initialData);
        console.log("Profile data loaded:", initialData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading profile data:", error);
        setLoading(false);
      }
    }
  };
  
  // Load user profile data
  useEffect(() => {
    fetchUserProfile();
  }, [user]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Handle profile save
  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    
    setSaving(true);
    toast.info('Saving your profile...');
    
    try {
      // Create a clean object with only defined values
      const cleanProfileData = Object.fromEntries(
        Object.entries({
          company: profileData.company,
          website: profileData.website,
          bio: profileData.bio
        }).filter(([_, value]) => value !== undefined)
      );
      
      const success = await updateUserProfile(user.uid, cleanProfileData);
      if (success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('An error occurred while saving your profile');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle cancel button actions
  const handleCancel = () => {
    // Reload original profile data
    if (user?.uid) {
      fetchUserProfile();
      toast.info('Changes discarded');
    }
  };

  // Add a safe rendering function
  const safeRender = (renderFn: () => React.ReactNode): React.ReactNode => {
    try {
      return renderFn();
    } catch (error) {
      console.error('Error rendering component:', error);
      return <div className="p-4 text-red-500">Error rendering this section. Please refresh the page.</div>;
    }
  };

  // Add avatar/initials logic
  const getUserInitials = () => {
    if (profileData.firstName || profileData.lastName) {
      return `${profileData.firstName.charAt(0) || ''}${profileData.lastName.charAt(0) || ''}`.toUpperCase();
    }
    if (profileData.email) {
      return profileData.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <>
      {/* Responsive background gradient */}
      <div className="relative min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-100 py-6 px-2 sm:px-6 md:px-12 lg:px-24 transition-all duration-300 overflow-x-hidden">
        {/* Animated SVG background pattern */}
        <svg className="absolute top-0 left-0 w-full h-40 opacity-20 animate-fade-in-slow pointer-events-none z-0" viewBox="0 0 1440 320"><path fill="#a5b4fc" fillOpacity="0.3" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path></svg>
        {/* Trust & Security Badge Row */}
        <div className="flex flex-wrap justify-center gap-4 mb-6 z-20 relative animate-fade-in-slow">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-xl px-4 py-2 shadow border border-gray-100">
            <span className="inline-block w-4 h-4 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs font-semibold text-gray-700">Secure & Private</span>
          </div>
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-xl px-4 py-2 shadow border border-gray-100">
            <span className="inline-block w-4 h-4 bg-blue-400 rounded-full animate-pulse"></span>
            <span className="text-xs font-semibold text-gray-700">GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-xl px-4 py-2 shadow border border-gray-100">
            <span className="inline-block w-4 h-4 bg-purple-400 rounded-full animate-pulse"></span>
            <span className="text-xs font-semibold text-gray-700">AI-Powered</span>
          </div>
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* User Avatar */}
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white animate-fade-in">
                {getUserInitials()}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">Account Settings</h1>
                <p className="text-gray-600 text-sm md:text-base">Manage your profile and preferences</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="mb-6 bg-white/80 p-1 rounded-lg shadow-sm flex flex-wrap gap-2">
              <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600 transition-all flex items-center gap-2 px-4 py-2 rounded-lg">
                <User className="h-5 w-5 mr-1" />
                Profile
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 shadow-lg border-0 hover:shadow-2xl transition-shadow duration-300 rounded-2xl bg-white/90 backdrop-blur-md animate-fade-in-slow">
                  <CardHeader className="bg-gray-50 border-b rounded-t-2xl">
                    <CardTitle className="text-lg md:text-xl">Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={profileData.firstName} 
                          onChange={handleInputChange}
                          className="mt-2 shadow-sm bg-gray-50 rounded-lg" 
                          disabled={true}
                        />
                        <p className="text-xs text-gray-500 mt-1">First name cannot be changed</p>
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={profileData.lastName} 
                          onChange={handleInputChange}
                          className="mt-2 shadow-sm bg-gray-50 rounded-lg" 
                          disabled={true}
                        />
                        <p className="text-xs text-gray-500 mt-1">Last name cannot be changed</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={profileData.email} 
                        onChange={handleInputChange}
                        className="mt-2 shadow-sm rounded-lg" 
                        disabled={!!user?.email}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-gray-700">Company (Optional)</Label>
                      <Input 
                        id="company" 
                        value={profileData.company} 
                        onChange={handleInputChange}
                        className="mt-2 shadow-sm rounded-lg" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="website" className="text-gray-700">Website (Optional)</Label>
                      <div className="flex mt-2">
                        <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                          <Globe size={16} />
                        </span>
                        <Input 
                          id="website" 
                          value={profileData.website} 
                          onChange={handleInputChange}
                          className="rounded-l-none shadow-sm rounded-r-lg" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bio" className="text-gray-700">Bio (Optional)</Label>
                      <textarea
                        id="bio"
                        rows={3}
                        className="mt-2 block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:border-blue-500 focus:ring-blue-500"
                        value={profileData.bio}
                        onChange={handleInputChange}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end pt-8 border-t bg-gray-50 rounded-b-2xl gap-2">
                    <Button 
                      variant="outline" 
                      className="mr-2 transition-all duration-200 hover:scale-105 hover:bg-gray-100"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-8 py-2 shadow-md transition-all duration-200 hover:scale-105"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </CardFooter>
                </Card>

                <div className="space-y-8">
                  <Card className="shadow-lg border-0 hover:shadow-2xl transition-shadow duration-300 rounded-2xl bg-white/90 backdrop-blur-md animate-fade-in-slow">
                    <CardHeader className="bg-gray-50 border-b rounded-t-2xl">
                      <CardTitle>Need Help?</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <p className="text-gray-600 mb-4">Have questions about using SmartFormAI?</p>
                      <Button 
                        variant="outline"
                        className="w-full border-indigo-400 text-indigo-600 hover:bg-indigo-50 transition-all duration-200 hover:scale-105"
                        onClick={() => navigate('/support', { state: { from: '/profile' } })}
                      >
                        Contact Support
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

const ProfilePage: React.FC = () => {
  return (
    <ErrorBoundary fallback={<div className="p-4 text-red-500">Something went wrong. Please refresh the page.</div>}>
      <DashboardLayout>
        <ProfileContent />
      </DashboardLayout>
    </ErrorBoundary>
  );
};

export default ProfilePage; 