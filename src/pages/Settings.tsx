import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, Globe, Lock, Network, Save, User } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and application settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <User className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Network className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger id="language" className="mt-1.5">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="utc-5">
                      <SelectTrigger id="timezone" className="mt-1.5">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                        <SelectItem value="utc-7">Mountain Time (UTC-7)</SelectItem>
                        <SelectItem value="utc-6">Central Time (UTC-6)</SelectItem>
                        <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                        <SelectItem value="utc-0">UTC</SelectItem>
                        <SelectItem value="utc+1">Central European Time (UTC+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select defaultValue="mdy">
                      <SelectTrigger id="date-format" className="mt-1.5">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="ymd">YYYY/MM/DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Theme</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="border rounded-md p-4 flex flex-col items-center">
                      <div className="w-full h-20 bg-white border rounded-md mb-3"></div>
                      <div className="flex items-center justify-center">
                        <input 
                          type="radio" 
                          id="theme-light" 
                          name="theme" 
                          value="light" 
                          className="mr-2" 
                          defaultChecked 
                        />
                        <Label htmlFor="theme-light">Light</Label>
                      </div>
                    </div>
                    <div className="border rounded-md p-4 flex flex-col items-center">
                      <div className="w-full h-20 bg-gray-900 border rounded-md mb-3"></div>
                      <div className="flex items-center justify-center">
                        <input 
                          type="radio" 
                          id="theme-dark" 
                          name="theme" 
                          value="dark" 
                          className="mr-2" 
                        />
                        <Label htmlFor="theme-dark">Dark</Label>
                      </div>
                    </div>
                    <div className="border rounded-md p-4 flex flex-col items-center">
                      <div className="w-full h-20 bg-gradient-to-b from-white to-gray-900 border rounded-md mb-3"></div>
                      <div className="flex items-center justify-center">
                        <input 
                          type="radio" 
                          id="theme-system" 
                          name="theme" 
                          value="system" 
                          className="mr-2" 
                        />
                        <Label htmlFor="theme-system">System</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-smartform-blue hover:bg-blue-700 gap-2">
                    <Save className="h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Default Form Settings</CardTitle>
                <CardDescription>Set defaults for all new forms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="collect-email" className="font-medium">Collect Email Addresses</Label>
                    <p className="text-sm text-gray-500">Require respondents to provide their email</p>
                  </div>
                  <Switch id="collect-email" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="one-response" className="font-medium">One Response per Person</Label>
                    <p className="text-sm text-gray-500">Limit to one response per user</p>
                  </div>
                  <Switch id="one-response" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-progress" className="font-medium">Show Progress Bar</Label>
                    <p className="text-sm text-gray-500">Display progress indicator on forms</p>
                  </div>
                  <Switch id="show-progress" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="shuffle-questions" className="font-medium">Shuffle Questions</Label>
                    <p className="text-sm text-gray-500">Randomize question order for each respondent</p>
                  </div>
                  <Switch id="shuffle-questions" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your data and privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="data-collection" className="font-medium">Usage Data Collection</Label>
                  <p className="text-sm text-gray-500">Allow us to collect anonymous usage data to improve our services</p>
                </div>
                <Switch id="data-collection" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="third-party" className="font-medium">Third-Party Integrations</Label>
                  <p className="text-sm text-gray-500">Allow third-party integrations to access your form data</p>
                </div>
                <Switch id="third-party" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing" className="font-medium">Marketing Communications</Label>
                  <p className="text-sm text-gray-500">Receive updates on new features and product news</p>
                </div>
                <Switch id="marketing" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ai-data" className="font-medium">AI Data Processing</Label>
                  <p className="text-sm text-gray-500">Allow AI to process your form data to provide suggestions</p>
                </div>
                <Switch id="ai-data" defaultChecked />
              </div>

              <div className="pt-6 border-t">
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md flex items-start mb-6">
                  <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Data Privacy Notice</h4>
                    <p className="text-sm">
                      Your data is securely stored and processed according to our privacy policy. You can request data export or deletion at any time.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    Export All My Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50">
                    Delete All My Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control which notifications you receive and how</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-responses" className="font-medium">Form Responses</Label>
                      <p className="text-sm text-gray-500">When someone submits a response to your form</p>
                    </div>
                    <Select defaultValue="daily">
                      <SelectTrigger id="notify-responses" className="w-32">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-comments" className="font-medium">Comments</Label>
                      <p className="text-sm text-gray-500">When someone comments on your form</p>
                    </div>
                    <Select defaultValue="immediate">
                      <SelectTrigger id="notify-comments" className="w-32">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-form-activity" className="font-medium">Form Activity</Label>
                      <p className="text-sm text-gray-500">When people view or interact with your form</p>
                    </div>
                    <Select defaultValue="weekly">
                      <SelectTrigger id="notify-form-activity" className="w-32">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-medium text-lg">System Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-updates" className="font-medium">Product Updates</Label>
                      <p className="text-sm text-gray-500">New features and improvements</p>
                    </div>
                    <Switch id="notify-updates" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-tips" className="font-medium">Tips & Tutorials</Label>
                      <p className="text-sm text-gray-500">Helpful information about using the platform</p>
                    </div>
                    <Switch id="notify-tips" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-marketing" className="font-medium">Marketing</Label>
                      <p className="text-sm text-gray-500">Special offers and promotions</p>
                    </div>
                    <Switch id="notify-marketing" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button className="bg-smartform-blue hover:bg-blue-700 gap-2">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect with third-party services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {[
                  { 
                    name: 'Google', 
                    logo: '🅶', 
                    description: 'Connect your Google account to export data to Sheets and Drive',
                    connected: true 
                  },
                  { 
                    name: 'Slack', 
                    logo: '🆂', 
                    description: 'Get notifications in your Slack channels when someone submits a form',
                    connected: false 
                  },
                  { 
                    name: 'Zapier', 
                    logo: '🆉', 
                    description: 'Connect your forms to 3,000+ apps with automated workflows',
                    connected: true 
                  },
                  { 
                    name: 'Mailchimp', 
                    logo: '🅼', 
                    description: 'Sync form respondents with your Mailchimp email lists',
                    connected: false 
                  },
                  { 
                    name: 'Microsoft', 
                    logo: '🅼', 
                    description: 'Connect with Microsoft services like Excel, Teams, and OneDrive',
                    connected: false 
                  },
                ].map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center text-xl mr-4">
                        {integration.logo}
                      </div>
                      <div>
                        <h3 className="font-medium">{integration.name}</h3>
                        <p className="text-sm text-gray-500">{integration.description}</p>
                      </div>
                    </div>
                    <Button 
                      variant={integration.connected ? "outline" : "default"}
                      className={integration.connected ? "" : "bg-smartform-blue hover:bg-blue-700"}
                    >
                      {integration.connected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium text-lg mb-4">API Access</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex mt-1.5">
                      <Input 
                        id="api-key" 
                        value="••••••••••••••••••••••••" 
                        readOnly 
                        className="rounded-r-none"
                      />
                      <Button className="rounded-l-none bg-smartform-blue hover:bg-blue-700">
                        Generate New Key
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Use this key to access the SmartFormAI API. Keep it secret!
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="api-access" className="font-medium">Enable API Access</Label>
                      <p className="text-sm text-gray-500">Allow external applications to access your forms via API</p>
                    </div>
                    <Switch id="api-access" defaultChecked />
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" className="gap-2">
                      <Globe className="h-4 w-4" />
                      View API Documentation
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings; 