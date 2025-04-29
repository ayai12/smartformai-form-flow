import React, { useState, useEffect } from 'react';
import { fetchUserForms, fetchFormById, FormDoc } from '@/firebase/formFetch';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Copy, Edit, Eye, FileText, Link2, MoreHorizontal, PlusCircle, Search, Settings, Star, Trash2 } from 'lucide-react';
import { saveFormToFirestore } from '@/firebase/formSave';
import { generateRandomId } from '@/utils/generateId';
import FormPreviewModal from './FormPreviewModal';

const Forms: React.FC = () => {
  const navigate = useNavigate();
  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFormTitle, setPreviewFormTitle] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewCustomThankYou, setPreviewCustomThankYou] = useState<boolean>(false);
  const [previewThankYouMessage, setPreviewThankYouMessage] = useState<string>('');

  // Handler for opening preview
  const handlePreviewForm = (form: FormDoc) => {
    setPreviewFormTitle(form.title || '');
    setPreviewQuestions(form.questions || []);
    setPreviewCustomThankYou(!!form.customThankYou);
    setPreviewThankYouMessage(form.thankYouMessage ?? '');
    setPreviewOpen(true);
  };
  // ... existing state

  // Handler for duplicating a form
  const handleDuplicateForm = async (formId: string) => {
    try {
      const original = await fetchFormById(formId);
      if (!original) throw new Error('Form not found');
      // Create new form data
      const newFormId = generateRandomId();
      const newTitle = original.title?.includes('(duplicate)')
        ? original.title
        : `${original.title} (duplicate)`;
      const newForm = {
        formId: newFormId,
        title: newTitle,
        questions: original.questions,
        tone: original.tone,
        prompt: original.prompt,
        publishedLink: '',
      };
      await saveFormToFirestore(newForm);
      navigate(`/builder/${newFormId}`);
    } catch (err) {
      alert('Failed to duplicate form: ' + (err as any).message);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [forms, setForms] = useState<FormDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserForms();
        setForms(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load forms');
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  // Filter forms based on search query and active tab
  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'published') return matchesSearch && form.status === 'published';
    if (activeTab === 'drafts') return matchesSearch && form.status === 'draft';
    if (activeTab === 'starred') return matchesSearch && form.starred;
    return matchesSearch;
  });

  const toggleStarred = (id: string) => {
    // In a real app, this would update the database
    console.log(`Toggle starred for form ${id}`);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Forms</h1>
          <p className="text-gray-600">Manage and organize all your forms</p>
        </div>
        <Button className="bg-smartform-blue hover:bg-blue-700" asChild>
          <Link to="/builder">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Form
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-64 md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search forms..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <FileText className="h-4 w-4" />
                    Form Type
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>All Types</DropdownMenuItem>
                  <DropdownMenuItem>Surveys</DropdownMenuItem>
                  <DropdownMenuItem>Registration Forms</DropdownMenuItem>
                  <DropdownMenuItem>Feedback Forms</DropdownMenuItem>
                  <DropdownMenuItem>Contact Forms</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Last Updated</DropdownMenuItem>
                  <DropdownMenuItem>Creation Date</DropdownMenuItem>
                  <DropdownMenuItem>Alphabetical</DropdownMenuItem>
                  <DropdownMenuItem>Most Responses</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Forms</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No forms found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? `No forms matching "${searchQuery}"` : "You don't have any forms yet"}
              </p>
              <Button className="bg-smartform-blue hover:bg-blue-700" asChild>
                <Link to="/builder">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create a Form
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredForms.map((form) => (
                <Card key={form.formId} className="overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={form.starred ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"}
                      onClick={() => toggleStarred(form.formId)}
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </Button>
                    <Badge className={form.status === 'published' ? "bg-green-600" : "bg-gray-500"}>
                      {form.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <Link to={`/forms/${form.formId}`}>
                      <CardTitle className="text-lg hover:text-smartform-blue transition-colors">{form.title}</CardTitle>
                    </Link>
                    <CardDescription>
                      Created: {form.createdAt ? new Date(form.createdAt.seconds ? form.createdAt.seconds * 1000 : form.createdAt).toLocaleDateString() : 'N/A'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded-md">
                        {/* <div className="text-xl font-semibold">{form.responses}</div> */}<div className="text-xl font-semibold">-</div>
                        <div className="text-xs text-gray-500">Responses</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-md">
                        {/* <div className="text-xl font-semibold">{form.views}</div> */}<div className="text-xl font-semibold">-</div>
                        <div className="text-xs text-gray-500">Views</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-1" asChild>
                        <Link to={`/builder/${form.formId}`}>
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1" asChild>
                        <Link to={`/analytics/${form.formId}`}>
                          <BarChart className="h-3.5 w-3.5" />
                          Analytics
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem className="gap-2" onClick={() => handlePreviewForm(form)}>
                            <Eye className="h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Link2 className="h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleDuplicateForm(form.formId)}>
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Settings className="h-4 w-4" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    <FormPreviewModal
         open={previewOpen}
         onClose={() => setPreviewOpen(false)}
         formTitle={previewFormTitle}
         questions={previewQuestions}
         customThankYou={previewCustomThankYou}
         thankYouMessage={previewThankYouMessage}
         showProgress={typeof forms.find(f => f.title === previewFormTitle)?.showProgress === 'boolean' ? forms.find(f => f.title === previewFormTitle)?.showProgress : true}
       />
    </DashboardLayout>
  );
};

export default Forms;