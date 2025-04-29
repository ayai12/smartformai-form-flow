import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, CreditCard, Globe, Lock, Mail, Upload, User } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Profile: React.FC = () => {
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
          <TabsTrigger value="account">
            <Lock className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
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
                    <Input id="firstName" defaultValue="John" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Doe" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="john.doe@example.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input id="company" defaultValue="Acme Inc" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="website">Website (Optional)</Label>
                  <div className="flex mt-1">
                    <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                      <Globe size={16} />
                    </span>
                    <Input id="website" defaultValue="https://example.com" className="rounded-l-none" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <textarea
                    id="bio"
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-blue-500 focus:ring-blue-500"
                    defaultValue="Product manager with a passion for user experience and data-driven decisions."
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-4 pt-6 border-t">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-smartform-blue hover:bg-blue-700">Save Changes</Button>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Update your profile photo</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Upload size={14} />
                      Upload
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
                  <p className="text-sm text-gray-500 mb-4">Your plan renews on Dec 15, 2023</p>
                  <Button className="w-full" variant="outline">
                    Manage Subscription
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" className="mt-1" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" className="mt-1" />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      <p className="text-xs text-gray-500 mt-1">Status: <span className="text-yellow-600 font-medium">Not enabled</span></p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-4 pt-6 border-t">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-smartform-blue hover:bg-blue-700">Save Changes</Button>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sessions</CardTitle>
                  <CardDescription>Manage your active sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Current Session</h3>
                      <Badge className="bg-green-600">Active</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Windows 10 • Chrome • New York, USA</p>
                    <p className="text-xs text-gray-500">Started: November 15, 2023</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Mobile Session</h3>
                      <Badge className="bg-green-600">Active</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">iOS 16 • Safari • New York, USA</p>
                    <p className="text-xs text-gray-500">Started: November 10, 2023</p>
                  </div>
                  <Button variant="outline" className="w-full text-red-600 hover:bg-red-50">
                    Sign Out of All Sessions
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                  <CardDescription>Export or delete your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Change Email
                  </Button>
                  <Button variant="outline" className="w-full">
                    Export My Data
                  </Button>
                  <Button variant="outline" className="w-full text-red-600 hover:bg-red-50">
                    Delete Account
                  </Button>
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
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
                <Button variant="outline" className="gap-2">
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
                <Button variant="outline">Cancel</Button>
                <Button className="bg-smartform-blue hover:bg-blue-700">Save Changes</Button>
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
                    <p className="text-xs text-gray-500 mt-1">Renews on Dec 15, 2023</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button>Upgrade Plan</Button>
                    <Button variant="outline" className="text-red-600 hover:bg-red-50">Cancel Plan</Button>
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
                    { date: 'Nov 15, 2023', amount: '$29.00', status: 'Paid' },
                    { date: 'Oct 15, 2023', amount: '$29.00', status: 'Paid' },
                    { date: 'Sep 15, 2023', amount: '$29.00', status: 'Paid' },
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
                  <Button variant="outline" className="w-full">View All Invoices</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control when and how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Form Responses', description: 'Get notified when someone completes your form' },
                    { label: 'Form Comments', description: 'Get notified when someone comments on your form' },
                    { label: 'Marketing Updates', description: 'News, announcements, and product updates' },
                    { label: 'Tips & Tutorials', description: 'Tips on getting more out of SmartFormAI' },
                  ].map((notification, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={`email-${index}`} className="font-medium">{notification.label}</Label>
                        <p className="text-sm text-gray-500">{notification.description}</p>
                      </div>
                      <Switch id={`email-${index}`} defaultChecked={index < 2} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium text-lg mb-4">Notification Delivery</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium mb-2 block">Response Notification Frequency</Label>
                    <RadioGroup defaultValue="immediate">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="immediate" id="immediate" />
                        <Label htmlFor="immediate">Immediately</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily">Daily Digest</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly">Weekly Summary</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="browser-notifications" className="font-medium">Browser Notifications</Label>
                      <p className="text-sm text-gray-500">Get notifications in your browser</p>
                    </div>
                    <Switch id="browser-notifications" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4 pt-6 border-t">
              <Button variant="outline">Reset to Defaults</Button>
              <Button className="bg-smartform-blue hover:bg-blue-700">Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Profile; 