import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter, 
  Flag, 
  MoreHorizontal, 
  Search, 
  Star, 
  ThumbsDown, 
  ThumbsUp, 
  Trash2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Responses will be fetched from backend or context. Example placeholder for empty state:
const mockResponses: any[] = [];

const FormResponses: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('all');

  // Filter responses based on search, active tab, and date range
  const filteredResponses = mockResponses.filter(response => {
    // In a real app, we would search within answers as well
    const matchesSearch = true; // Simplified for demo
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'starred') return matchesSearch && response.starred;
    if (activeTab === 'flagged') return matchesSearch && response.flagged;
    if (activeTab === 'complete') return matchesSearch && response.status === 'complete';
    if (activeTab === 'partial') return matchesSearch && response.status === 'partial';
    
    return matchesSearch;
  });

  const currentResponse = selectedResponse 
    ? mockResponses.find(r => r.id === selectedResponse) 
    : filteredResponses[0];

  const toggleStarred = (id: string) => {
    // In a real app, this would update the database
    console.log(`Toggle starred for response ${id}`);
  };

  const toggleFlagged = (id: string) => {
    // In a real app, this would update the database
    console.log(`Toggle flagged for response ${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format individual answers based on their type
  const formatAnswer = (answer: string) => {
    if (!answer) return <span className="text-gray-400 italic">No response</span>;
    return answer;
  };

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shrek Fan Survey</h1>
          <p className="text-gray-600">Viewing responses (Total: {mockResponses.length})</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Response List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Responses</CardTitle>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search responses..."
                    className="pl-8 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[130px] h-9">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                  <TabsTrigger value="starred" className="flex-1">Starred</TabsTrigger>
                  <TabsTrigger value="flagged" className="flex-1">Flagged</TabsTrigger>
                </TabsList>
                
                <div className="mt-3 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredResponses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No responses found</p>
                    </div>
                  ) : (
                    filteredResponses.map((response) => (
                      <div 
                        key={response.id}
                        className={`p-3 rounded-md border cursor-pointer transition-colors ${
                          selectedResponse === response.id || (!selectedResponse && response.id === filteredResponses[0].id)
                            ? 'border-smartform-blue bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedResponse(response.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-sm font-medium mb-1">Response #{response.id}</div>
                            <div className="text-xs text-gray-500">{formatDate(response.submittedAt)}</div>
                          </div>
                          <div className="flex items-center">
                            {response.starred && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-yellow-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStarred(response.id);
                                }}
                              >
                                <Star className="h-4 w-4 fill-current" />
                              </Button>
                            )}
                            {response.flagged && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFlagged(response.id);
                                }}
                              >
                                <Flag className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={
                            response.status === 'complete' 
                              ? 'bg-green-600' 
                              : 'bg-yellow-600'
                          }>
                            {response.status === 'complete' ? 'Complete' : 'Partial'}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            Time: {response.completionTime}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Tabs>
              
              {filteredResponses.length > 0 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                  <div className="text-gray-500">
                    Showing {filteredResponses.length} of {mockResponses.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-gray-600">1-{filteredResponses.length}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Response Details */}
        <div className="lg:col-span-2">
          {currentResponse ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Response Details</CardTitle>
                    <CardDescription>
                      Submitted {formatDate(currentResponse.submittedAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={currentResponse.starred ? "text-yellow-500" : "text-gray-400"}
                      onClick={() => toggleStarred(currentResponse.id)}
                    >
                      <Star className={`h-4 w-4 ${currentResponse.starred ? "fill-current" : ""}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={currentResponse.flagged ? "text-red-500" : "text-gray-400"}
                      onClick={() => toggleFlagged(currentResponse.id)}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem className="gap-2">
                          <Download className="h-4 w-4" />
                          Export Response
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <ThumbsUp className="h-4 w-4" />
                          Mark as Useful
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <ThumbsDown className="h-4 w-4" />
                          Mark as Irrelevant
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-red-600">
                          <Trash2 className="h-4 w-4" />
                          Delete Response
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="text-sm text-gray-500">Submission ID</div>
                      <div className="font-medium">{currentResponse.id}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="text-sm text-gray-500">Completion Time</div>
                      <div className="font-medium">{currentResponse.completionTime}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="text-sm text-gray-500">Status</div>
                      <div>
                        <Badge className={
                          currentResponse.status === 'complete' 
                            ? 'bg-green-600' 
                            : 'bg-yellow-600'
                        }>
                          {currentResponse.status === 'complete' ? 'Complete' : 'Partial'}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="text-sm text-gray-500">Date</div>
                      <div className="font-medium">
                        {new Date(currentResponse.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium text-lg mb-4">Responses</h3>
                    <div className="space-y-6">
                      {currentResponse.answers.map((answer, index) => (
                        <div key={index} className="space-y-2">
                          <div className="font-medium">{answer.question}</div>
                          <div className="p-3 bg-gray-50 rounded-md">
                            {formatAnswer(answer.answer)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-between items-center">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous Response
                    </Button>
                    <Button variant="outline" size="sm">
                      Next Response
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No response selected</h3>
                  <p className="text-gray-500">
                    Select a response from the list to view details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FormResponses; 