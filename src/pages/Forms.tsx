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
      <div className="relative flex flex-col md:flex-row justify-between items-center mb-8 gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl font-semibold text-black tracking-tight">My Forms</h1>
          <p className="text-black/60 text-base mt-1.5">Manage and organize all your forms</p>
        </div>
        <Button className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white px-5 py-2.5 text-sm font-medium rounded-lg transition-colors" asChild>
          <Link to="/builder">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Form
          </Link>
        </Button>
      </div>
      {/* Upgrade Nudge if form count is high (e.g., >= 10) */}
      {forms.length >= 10 && (
        <div className="my-8 flex justify-center">
          <div className="bg-[#7B3FE4] text-white px-6 py-3 rounded-lg flex items-center gap-4">
            <span className="font-medium">Need more forms?</span>
            <Button className="bg-white text-[#7B3FE4] font-medium px-4 py-2 rounded hover:bg-white/90 transition-colors" onClick={() => window.location.href='/pricing'}>
              Upgrade for More Forms
            </Button>
          </div>
        </div>
      )}
      <Card className="mb-8 bg-white border border-black/10">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-64 md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <Input
                type="search"
                placeholder="Search forms..."
                className="pl-10 h-11 border-black/10 focus:border-[#7B3FE4] focus:ring-[#7B3FE4]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1 rounded-lg border-black/10 hover:bg-black/5 text-sm h-11">
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
          <div className="mx-auto w-16 h-16 rounded-full bg-[#7B3FE4]/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-[#7B3FE4]" />
          </div>
          <h3 className="text-lg font-semibold text-black mb-1">No forms found</h3>
          <p className="text-black/60 mb-4">
            {searchQuery ? `No forms matching "${searchQuery}"` : "You don't have any forms yet. Create your first AI-powered form!"}
          </p>
          <Button className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white font-medium px-5 py-2.5 rounded-lg" asChild>
            <Link to="/builder">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create a Form
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedAndFilteredForms.map((form, idx) => (
            <Card key={form.formId} className="overflow-hidden bg-white border border-black/10 hover:border-black/20 transition-colors group">
              <div className="bg-black/5 px-4 py-2 flex items-center justify-end border-b border-black/10">
                <span className="text-xs text-black/50">{form.createdAt ? new Date(form.createdAt.seconds ? form.createdAt.seconds * 1000 : form.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <CardHeader className="pb-3">
                <Link to={`/forms/${form.formId}`} className="group-hover:text-[#7B3FE4] transition-colors truncate">
                  <CardTitle className="text-base font-semibold truncate text-black">{form.title}</CardTitle>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-center p-3 bg-[#7B3FE4]/5 rounded-lg border border-black/10">
                    <div className="text-2xl font-semibold text-black">{formResponses[form.formId] || 0}</div>
                    <div className="text-xs text-black/50 mt-0.5">Views</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1 rounded-lg border-black/10 hover:bg-black/5 text-sm h-9" asChild>
                    <Link to={`/builder/${form.formId}`}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 rounded-lg border-black/10 hover:bg-black/5 text-sm h-9" asChild>
                    <Link to={`/analytics/${form.formId}`}>
                      <BarChart className="h-4 w-4" />
                      Analytics
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 rounded-lg border-black/10 hover:bg-black/5 h-9">
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