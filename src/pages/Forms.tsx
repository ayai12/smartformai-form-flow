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
import { BarChart, Copy, Edit, Eye, FileText, Link2, MoreHorizontal, PlusCircle, Search, Star, Trash2 } from 'lucide-react';
import { saveFormToFirestore } from '@/firebase/formSave';
import { generateRandomId } from '@/utils/generateId';
import FormPreviewModal from './FormPreviewModal';
import { db } from '@/firebase/firebase';
import { collection, getDocs, query, where, getCountFromServer, doc, deleteDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const Forms: React.FC = () => {
  const navigate = useNavigate();
  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFormTitle, setPreviewFormTitle] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewCustomThankYou, setPreviewCustomThankYou] = useState<boolean>(false);
  const [previewThankYouMessage, setPreviewThankYouMessage] = useState<string>('');

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  // Sort state
  const [sortOption, setSortOption] = useState<string>('lastUpdated');

  // Handler for opening preview
  const handlePreviewForm = (form: FormDoc) => {
    setPreviewFormTitle(form.title || '');
    setPreviewQuestions(form.questions || []);
    setPreviewCustomThankYou(!!form.customThankYou);
    setPreviewThankYouMessage(form.thankYouMessage ?? '');
    setPreviewOpen(true);
  };

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

  // Handler for deleting a form
  const openDeleteDialog = (formId: string) => {
    setFormToDelete(formId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteForm = async () => {
    if (!formToDelete) return;
    
    try {
      const formRef = doc(db, 'forms', formToDelete);
      await deleteDoc(formRef);
      // Update local state to remove the deleted form
      setForms(forms.filter(form => form.formId !== formToDelete));
      setDeleteDialogOpen(false);
      setFormToDelete(null);
    } catch (err) {
      alert('Failed to delete form: ' + (err as any).message);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [forms, setForms] = useState<FormDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserForms();
        setForms(data);
        
        // Fetch response counts for each form
        const responseCounts: Record<string, number> = {};
        
        for (const form of data) {
          // Query the survey_responses collection to count responses for this form
          const responsesRef = collection(db, 'survey_responses');
          const q = query(responsesRef, where('formId', '==', form.formId));
          const snapshot = await getCountFromServer(q);
          responseCounts[form.formId] = snapshot.data().count;
        }
        
        setFormResponses(responseCounts);
      } catch (err: any) {
        setError(err.message || 'Failed to load forms');
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  // Filter and sort forms based on search query, active tab, and sort option
  const sortedAndFilteredForms = React.useMemo(() => {
    // Only show published or all forms
    const filtered = forms.filter(form => {
      const matchesSearch = form.title?.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeTab === 'all') return matchesSearch;
      if (activeTab === 'published') return matchesSearch && form.status === 'published';
      return matchesSearch;
    });

    // Then sort the filtered forms
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'lastUpdated':
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        case 'creationDate':
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        case 'alphabetical':
          return (a.title || '').localeCompare(b.title || '');
        case 'mostResponses':
          return (formResponses[b.formId] || 0) - (formResponses[a.formId] || 0);
        default:
          return 0;
      }
    });
  }, [forms, searchQuery, activeTab, sortOption, formResponses]);

  return (
    <DashboardLayout>
      <div className="relative flex flex-col md:flex-row justify-between items-center mb-10 gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm animate-fade-in">My Forms</h1>
          <p className="text-gray-600 text-lg mt-1 animate-fade-in-slow">Manage and organize all your forms</p>
        </div>
        <Button className="bg-gradient-to-r from-smartform-blue to-blue-400 hover:from-blue-700 hover:to-blue-500 shadow-lg px-6 py-3 text-lg rounded-xl transition-all duration-200 animate-bounce-in" asChild>
          <Link to="/builder">
            <PlusCircle className="mr-2 h-5 w-5" />
            New Form
          </Link>
        </Button>
      </div>

      <Card className="mb-10 bg-gradient-to-br from-blue-50/60 to-white/80 shadow-2xl border-0 animate-fade-in">
        <CardContent className="pt-8">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-64 md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-500" />
              <Input
                type="search"
                placeholder="Search forms..."
                className="pl-10 py-3 rounded-xl text-base shadow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1 rounded-xl border-blue-200 hover:bg-blue-50 text-base px-6 py-3">
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortOption('lastUpdated')}>
                    Last Updated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('creationDate')}>
                    Creation Date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('alphabetical')}>
                    Alphabetical
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('mostResponses')}>
                    Most Responses
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {sortedAndFilteredForms.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 animate-fade-in-slow">
          {sortedAndFilteredForms.map((form, idx) => (
            <Card key={form.formId} className="overflow-hidden bg-white/80 backdrop-blur-md shadow-xl hover:scale-[1.03] hover:shadow-2xl transition-all duration-200 border-0 animate-slide-in-up" style={{ animationDelay: `${idx * 60}ms` }}>
              <div className="bg-gradient-to-r from-blue-100/60 to-white/80 px-6 py-3 flex items-center justify-end">
                <span className="text-xs text-gray-400">{form.createdAt ? new Date(form.createdAt.seconds ? form.createdAt.seconds * 1000 : form.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <CardHeader className="pb-2">
                <Link to={`/forms/${form.formId}`}>
                  <CardTitle className="text-xl font-bold hover:text-smartform-blue transition-colors truncate">{form.title}</CardTitle>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-center p-3 bg-blue-50/60 rounded-xl shadow-inner">
                    <div className="text-2xl font-extrabold text-blue-700 animate-countup">{formResponses[form.formId] || 0}</div>
                    <div className="text-xs text-gray-500">Views</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1 rounded-lg border-blue-200 hover:bg-blue-50" asChild>
                    <Link to={`/builder/${form.formId}`}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 rounded-lg border-blue-200 hover:bg-blue-50" asChild>
                    <Link to={`/analytics/${form.formId}`}>
                      <BarChart className="h-4 w-4" />
                      Analytics
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 rounded-lg border-blue-200 hover:bg-blue-50">
                        <MoreHorizontal className="h-4 w-4" />
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
                      <DropdownMenuItem className="text-red-600 gap-2" onClick={() => openDeleteDialog(form.formId)}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this form? This action cannot be undone and all form data will be permanently lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteForm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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