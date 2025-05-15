import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Globe, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, updateUserProfile, UserProfile } from '@/firebase/userProfile';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
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
      setLoading(false);
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
      const success = await updateUserProfile(user.uid, profileData);
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
  
  // Handle billing info save
  const handleBillingInfoSave = () => {
    setSaving(true);
    toast.info('Saving billing information...');
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast.success('Billing information updated successfully');
    }, 1000);
  };
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="mb-2">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profileData.firstName} 
                      onChange={handleInputChange}
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profileData.lastName} 
                      onChange={handleInputChange}
                      className="mt-1" 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileData.email} 
                    onChange={handleInputChange}
                    className="mt-1" 
                    disabled={!!user?.email}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input 
                    id="company" 
                    value={profileData.company} 
                    onChange={handleInputChange}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website (Optional)</Label>
                  <div className="flex mt-1">
                    <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                      <Globe size={16} />
                    </span>
                    <Input 
                      id="website" 
                      value={profileData.website} 
                      onChange={handleInputChange}
                      className="rounded-l-none" 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <textarea
                    id="bio"
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-blue-500 focus:ring-blue-500"
                    value={profileData.bio}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-4 pt-6 border-t">
                <Button 
                  variant="outline" 
                  disabled={saving}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-smartform-blue hover:bg-blue-700" 
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Plan</CardTitle>
                  <CardDescription>Current subscription information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-lg">Plus Plan</h3>
                      <Badge className="bg-smartform-blue mt-1">Current</Badge>
                    </div>
                    <span className="font-bold">$29/mo</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Your plan renews on {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
                  <div className="space-y-3">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        toast.info('Opening subscription management...');
                        setTimeout(() => toast.success('Subscription updated'), 1000);
                      }}
                    >
                      Manage Subscription
                    </Button>
                    <Button
                      className="w-full bg-smartform-blue hover:bg-blue-700 text-white"
                      onClick={() => navigate('/pricing', { state: { from: '/profile' } })}
                    >
                      Upgrade Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment details and billing address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-8 bg-blue-100 rounded-md mr-4 flex items-center justify-center text-blue-800 font-bold">
                      Visa
                    </div>
                    <div>
                      <h3 className="font-medium">Visa ending in 4242</h3>
                      <p className="text-xs text-gray-500">Expires 12/24</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-smartform-blue">Default</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toast.info('Payment method edit functionality will be available soon')}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => toast.info('Add payment method functionality will be available soon')}
                >
                  <CreditCard className="h-4 w-4" />
                  Add Payment Method
                </Button>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Billing Address</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select defaultValue="us">
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="state">State / Province</Label>
                      <Input id="state" defaultValue="New York" className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" defaultValue="New York" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="zip">Zip / Postal</Label>
                      <Input id="zip" defaultValue="10001" className="mt-1" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" defaultValue="123 Main St, Apt 4B" className="mt-1" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-4 pt-6 border-t">
                <Button variant="outline" disabled={saving}>Cancel</Button>
                <Button 
                  className="bg-smartform-blue hover:bg-blue-700" 
                  disabled={saving}
                  onClick={handleBillingInfoSave}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                  <CardDescription>Manage your plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">Plus Plan</h3>
                    <p className="text-sm text-gray-500">$29 per month</p>
                    <p className="text-xs text-gray-500 mt-1">Renews on {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => toast.info('Plan upgrade functionality will be available soon')}>
                      Upgrade Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => toast.info('Plan cancellation functionality will be available soon')}
                    >
                      Cancel Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>View your recent invoices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { 
                      date: new Date(Date.now() - 0*30*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), 
                      amount: '$29.00', 
                      status: 'Paid' 
                    },
                    { 
                      date: new Date(Date.now() - 1*30*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), 
                      amount: '$29.00', 
                      status: 'Paid' 
                    },
                    { 
                      date: new Date(Date.now() - 2*30*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), 
                      amount: '$29.00', 
                      status: 'Paid' 
                    },
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{invoice.date}</p>
                        <p className="text-xs text-gray-500">Invoice #{2023100 + index}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{invoice.amount}</p>
                        <Badge className="bg-green-600">{invoice.status}</Badge>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => toast.info('Invoice history functionality will be available soon')}
                  >
                    View All Invoices
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Profile; 