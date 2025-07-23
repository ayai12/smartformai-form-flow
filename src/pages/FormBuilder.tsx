import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchFormById } from '../firebase/formFetch';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../components/AlertProvider';
import FormPreviewModal from './FormPreviewModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlignJustify, BookOpen, BrainCircuit, Check, Copy, DollarSign, Eye, Inbox, Lightbulb, Loader2, MessageSquare, Plus, Save, Share2, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Mock form question types
const QuestionType = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TEXT: 'text',
  RATING: 'rating',
  EMAIL: 'email',
  PHONE: 'phone',
  DATE: 'date',
} as const;

// AI action types
const AIActionType = {
  REVISE: 'revise',
  ADD: 'add',
  REBUILD: 'rebuild',
} as const;

// Define the type for the question type values
type QuestionTypeValues = typeof QuestionType[keyof typeof QuestionType];
type AIActionTypeValues = typeof AIActionType[keyof typeof AIActionType];

// Define interfaces for our question types
interface BaseQuestion {
  id: string;
  question: string;
  required: boolean;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: typeof QuestionType.MULTIPLE_CHOICE;
  options: string[];
}

interface TextQuestion extends BaseQuestion {
  type: typeof QuestionType.TEXT | typeof QuestionType.EMAIL | typeof QuestionType.PHONE | typeof QuestionType.DATE;
}

interface RatingQuestion extends BaseQuestion {
  type: typeof QuestionType.RATING;
  scale: number;
}

export type Question = MultipleChoiceQuestion | TextQuestion | RatingQuestion;

const FormBuilder: React.FC = () => {
  // Publish modal state
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishedLink, setPublishedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedType, setCopiedType] = useState<'link' | 'embed' | 'advanced'>('link');
  const { formId } = useParams<{ formId?: string }>();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  // Local storage key based on formId or 'new'
  const localKey = `formbuilder_${formId || 'new'}`;

  // State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('Untitled Form');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('business');
  const [aiAction, setAiAction] = useState<AIActionTypeValues>(AIActionType.ADD);
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formIdState, setFormIdState] = useState<string | undefined>(formId);
  // Form settings state
  const [requireLogin, setRequireLogin] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [customThankYou, setCustomThankYou] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for your submission!');
  // Add state for mobile AI sidebar toggle
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);

  // Effect to check if there are questions and reset action to ADD if needed
  useEffect(() => {
    if (questions.length === 0 && aiAction !== AIActionType.ADD) {
      setAiAction(AIActionType.ADD);
    }
  }, [questions, aiAction]);

  // Load from localStorage or fetch from backend if editing
  useEffect(() => {
    if (formId) {
      // Always fetch from backend for existing forms
      (async () => {
        try {
          const data = await fetchFormById(formId);
          if (data) {
            setFormTitle(data.title || 'Untitled Form');
            setPrompt(data.prompt || '');
            setTone(data.tone || 'business');
            setQuestions(data.questions || []);
            setFormIdState(formId);
            setRequireLogin(data.requireLogin ?? false);
            setShowProgress(data.showProgress ?? true);
            setCustomThankYou(data.customThankYou ?? false);
            setThankYouMessage(data.thankYouMessage ?? 'Thank you for your submission!');
            // Clear any local draft for this formId
            localStorage.removeItem(localKey);
            return;
          }
        } catch (e) {
          // fallback: try to load from localStorage if backend fails
          const local = localStorage.getItem(localKey);
          if (local) {
            try {
              const parsed = JSON.parse(local);
              setFormTitle(parsed.formTitle || 'Untitled Form');
              setPrompt(parsed.prompt || '');
              setTone(parsed.tone || 'business');
              setQuestions(parsed.questions || []);
              setFormIdState(formId);
            } catch {}
          } else {
            showAlert('Error', 'Failed to load form for editing.', 'error');
          }
        }
      })();
    } else {
      // New form: load draft if any
      const local = localStorage.getItem(localKey);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setFormTitle(parsed.formTitle || 'Untitled Form');
          setPrompt(parsed.prompt || '');
          setTone(parsed.tone || 'business');
          setQuestions(parsed.questions || []);
        } catch {}
      }
    }
    // eslint-disable-next-line
  }, [formId]);

  // Persist to localStorage on change
  useEffect(() => {
    const data = { formTitle, prompt, tone, questions };
    localStorage.setItem(localKey, JSON.stringify(data));
  }, [formTitle, prompt, tone, questions, localKey]);


  // Load from localStorage or fetch from backend if editing
  useEffect(() => {
    let loaded = false;
    if (formId) {
      // Try to load from localStorage first
      const local = localStorage.getItem(localKey);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setFormTitle(parsed.formTitle || 'Untitled Form');
          setPrompt(parsed.prompt || '');
          setTone(parsed.tone || 'business');
          setQuestions(parsed.questions || []);
          setFormIdState(formId);
          setRequireLogin(parsed.requireLogin ?? false);
          setShowProgress(parsed.showProgress ?? true);
          setCustomThankYou(parsed.customThankYou ?? false);
          setThankYouMessage(parsed.thankYouMessage ?? 'Thank you for your submission!');
          loaded = true;
        } catch {}
      }
      if (!loaded) {
        // Fetch from backend (firestore)
        (async () => {
          try {
            const { fetchFormById } = await import('../firebase/formFetch');
            const data = await fetchFormById(formId);
            if (data) {
              setFormTitle(data.title || 'Untitled Form');
              setPrompt(data.prompt || '');
              setTone(data.tone || 'business');
              setQuestions(data.questions || []);
              setFormIdState(formId);
            }
          } catch (e) {
            showAlert('Error', 'Failed to load form for editing.', 'error');
          }
        })();
      }
    } else {
      // New form: load draft if any
      const local = localStorage.getItem(localKey);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setFormTitle(parsed.formTitle || 'Untitled Form');
          setPrompt(parsed.prompt || '');
          setTone(parsed.tone || 'business');
          setQuestions(parsed.questions || []);
        } catch {}
      }
    }
    // eslint-disable-next-line
  }, [formId]);

  // Persist to localStorage on change
  useEffect(() => {
    const data = { formTitle, prompt, tone, questions };
    localStorage.setItem(localKey, JSON.stringify(data));
  }, [formTitle, prompt, tone, questions, localKey]);
  // (removed duplicate state declarations)

  const handleGenerateQuestions = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);

    try {
      // Always use the local development server endpoint
      // Change this back to the cloud function URL before deploying to production
      const apiUrl = 'http://localhost:5000/chat';
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          tone,
          questionCount,
          action: aiAction,
          userId: user?.uid
        })
      });
      
      if (!response.ok) {
        showAlert('Error', 'Failed to generate questions. Please try again.', 'error');
        setIsGenerating(false);
        return;
      }
      
      const data = await response.json();
      // Defensive: if no questions returned, show error
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        showAlert('Error', 'No questions were generated. Please try a different prompt or try again.', 'error');
        setIsGenerating(false);
        return;
      }
      // Convert backend types to frontend types and mark as AI-generated
      const mappedQuestions = (data.questions || []).map((q: any, idx: number) => {
        let type: QuestionTypeValues = QuestionType.TEXT;
        if (q.type === 'multiple choice') type = QuestionType.MULTIPLE_CHOICE;
        else if (q.type === 'rating') type = QuestionType.RATING;
        else if (q.type === 'text box') type = QuestionType.TEXT;
        return {
          id: `ai_${Date.now()}_${idx}`,
          type,
          question: q.question,
          required: true,
          options: q.options || undefined,
          scale: q.scale ? q.scale.length : undefined,
          _source: 'ai'
        };
      });
      // Apply the appropriate action
      if (aiAction === AIActionType.REBUILD) {
        setQuestions(mappedQuestions); // Always replace
      } else {
        setQuestions([...questions, ...mappedQuestions]);
      }
      
    } catch (err) {
      showAlert('Error', 'Failed to generate questions. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddQuestion = (type: QuestionTypeValues) => {
    let newQuestion: Question;
    
    if (type === QuestionType.MULTIPLE_CHOICE) {
      newQuestion = {
        id: Date.now().toString(),
        type: QuestionType.MULTIPLE_CHOICE,
        question: 'New Question',
        required: false,
        options: ['Option 1', 'Option 2', 'Option 3']
      };
    } else if (type === QuestionType.RATING) {
      newQuestion = {
        id: Date.now().toString(),
        type: QuestionType.RATING,
        question: 'New Question',
        required: false,
        scale: 5
      };
    } else {
      newQuestion = {
        id: Date.now().toString(),
        type,
        question: 'New Question',
        required: false
      };
    }
    
    setQuestions([...questions, newQuestion]);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleQuestionChange = (id: string, field: string, value: any) => {
    setQuestions(
      questions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const renderQuestionEditor = (question: Question) => {
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <div className="space-y-4">
            <Input 
              value={question.question} 
              onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
              className="font-medium"
              placeholder="Enter your question"
            />
            <div className="space-y-2">
              {question.options.map((option: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300">
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                  </div>
                  <Input 
                    value={option} 
                    onChange={(e) => {
                      const newOptions = [...question.options];
                      newOptions[index] = e.target.value;
                      handleQuestionChange(question.id, 'options', newOptions);
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      const newOptions = question.options.filter((_: any, i: number) => i !== index);
                      handleQuestionChange(question.id, 'options', newOptions);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const newOptions = [...question.options, `Option ${question.options.length + 1}`];
                  handleQuestionChange(question.id, 'options', newOptions);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        );
      
      case QuestionType.TEXT:
      case QuestionType.EMAIL:
      case QuestionType.PHONE:
      case QuestionType.DATE:
        return (
          <div className="space-y-4">
            <Input 
              value={question.question} 
              onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
              className="font-medium"
              placeholder="Enter your question"
            />
            <div className="bg-gray-50 border rounded-md p-3">
              <div className="text-gray-400 text-sm italic">Text input field will appear here</div>
            </div>
          </div>
        );
      
      case QuestionType.RATING:
        return (
          <div className="space-y-4">
            <Input 
              value={question.question} 
              onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
              className="font-medium"
              placeholder="Enter your question"
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rating Scale</Label>
                <Select 
                  value={question.scale.toString()} 
                  onValueChange={(value) => handleQuestionChange(question.id, 'scale', parseInt(value))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">1-5</SelectItem>
                    <SelectItem value="7">1-7</SelectItem>
                    <SelectItem value="10">1-10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-2">
                {Array.from({ length: question.scale }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center">
                      {i + 1}
                    </div>
                    {i === 0 && <div className="text-xs mt-1">Poor</div>}
                    {i === question.scale - 1 && <div className="text-xs mt-1">Excellent</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 animate-gradient-x font-sans">
      {/* Sticky mobile header for form title */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-purple-200 flex items-center px-4 py-3 shadow-md">
        <Input
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          className="w-full text-lg font-bold border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          placeholder="Untitled Form"
        />
      </div>
      {/* Add padding top for sticky header on mobile */}
      <div className='pt-16 lg:pt-0'>
      <DashboardLayout>
        {/* Desktop action bar (Save, Publish, Preview) */}
        <div className="hidden lg:flex flex-col items-end gap-1 mb-8">
          {/* Save tip above the three main buttons */}
          <div className="w-full flex justify-end mb-2 pr-1">
            <span className="text-xs text-gray-500 bg-white/80 px-3 py-1 rounded shadow border border-gray-200">
              Tip: Save your work regularly to avoid losing changes.
            </span>
          </div>
          <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-1 shadow-sm" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <FormPreviewModal
              open={previewOpen}
              onClose={() => setPreviewOpen(false)}
              formTitle={formTitle}
              questions={questions}
              showProgress={showProgress}
              customThankYou={customThankYou}
              thankYouMessage={thankYouMessage}
            />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-1 shadow-sm"
                      onClick={async () => {
                        if (formTitle.trim() === '') {
                          showAlert('Error', 'Please name your form before saving.', 'error');
                          return;
                        }
                        if (formTitle.trim().toLowerCase() === 'untitled form') {
                          showAlert('Error', 'Please give your form a unique name before saving.', 'error');
                          return;
                        }
                        if (questions.length === 0) {
                          showAlert('Error', 'Please add at least one question before saving the form.', 'error');
                          return;
                        }
                        try {
                          // Dynamically import to avoid SSR issues
                          const { saveFormToFirestore } = await import('../firebase/formSave');
                          const formId = formIdState || (window.crypto?.randomUUID?.() ?? Math.random().toString(36).substr(2, 9));
                          if (!formIdState) setFormIdState(formId);
                          await saveFormToFirestore({
                            formId,
                            title: formTitle ?? '',
                            questions: questions ?? [],
                            tone: tone ?? '',
                            prompt: prompt ?? '',
                            publishedLink: '',
                            showProgress,
                            customThankYou,
                            thankYouMessage: customThankYou ? thankYouMessage : undefined,
                            published: 'draft',
                            starred: '',
                          });
                          showAlert('Success', 'Form saved successfully!', 'success');
                        } catch (err: any) {
                          showAlert('Error', 'Failed to save form: ' + (err.message || err), 'error');
                        }
                      }}
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="bg-gray-900 text-white text-xs rounded shadow-lg px-3 py-2">
                    Tip: Save your work regularly to avoid losing changes.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            <Button
            className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:from-purple-600 hover:to-pink-600"
              onClick={async () => {
                if (formTitle.trim() === '') {
                  showAlert('Error', 'Please name your form before publishing.', 'error');
                  return;
                }
                if (formTitle.trim().toLowerCase() === 'untitled form') {
                  showAlert('Error', 'Please give your form a unique name before publishing.', 'error');
                  return;
                }
                if (questions.length === 0) {
                  showAlert('Error', 'Please add at least one question before publishing.', 'error');
                  return;
                }
                try {
                  const { saveFormToFirestore } = await import('../firebase/formSave');
                  const formId = formIdState || (window.crypto?.randomUUID?.() ?? Math.random().toString(36).substr(2, 9));
                  if (!formIdState) setFormIdState(formId);
                  const publishedLink = `/survey/${formId}`;
                  await saveFormToFirestore({
                    formId,
                    title: formTitle ?? '',
                    questions: questions ?? [],
                    tone: tone ?? '',
                    prompt: prompt ?? '',
                    publishedLink,
                    showProgress,
                    customThankYou,
                    thankYouMessage: customThankYou ? thankYouMessage : undefined,
                    published: 'published',
                    starred: '',
                  });
                  // Open the publish modal with the link
                  setPublishModalOpen(true);
                  setPublishedLink(window.location.origin + publishedLink);
                } catch (err: any) {
                  showAlert('Error', 'Failed to publish form: ' + (err.message || err), 'error');
                }
              }}
            >
              <Share2 className="h-4 w-4" />
              Publish
            </Button>
          </div>
        </div>
        {/* Floating action bar for mobile (move to sticky bottom, z-50) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden bg-white/90 backdrop-blur-md shadow-2xl rounded-t-2xl px-2 py-2 justify-between items-center border-t border-gray-200 transition-all">
          <Button className="flex-1 mx-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:from-purple-600 hover:to-pink-600 transition-transform active:scale-95 text-base py-3" size="lg"
            onClick={async () => {
              if (formTitle.trim() === '') {
                showAlert('Error', 'Please name your form before saving.', 'error');
                return;
              }
              if (formTitle.trim().toLowerCase() === 'untitled form') {
                showAlert('Error', 'Please give your form a unique name before saving.', 'error');
                return;
              }
              if (questions.length === 0) {
                showAlert('Error', 'Please add at least one question before saving the form.', 'error');
                return;
              }
              try {
                const { saveFormToFirestore } = await import('../firebase/formSave');
                const formId = formIdState || (window.crypto?.randomUUID?.() ?? Math.random().toString(36).substr(2, 9));
                if (!formIdState) setFormIdState(formId);
                await saveFormToFirestore({
                  formId,
                  title: formTitle ?? '',
                  questions: questions ?? [],
                  tone: tone ?? '',
                  prompt: prompt ?? '',
                  publishedLink: '',
                  showProgress,
                  customThankYou,
                  thankYouMessage: customThankYou ? thankYouMessage : undefined,
                  published: 'draft',
                  starred: '',
                });
                showAlert('Success', 'Form saved successfully!', 'success');
              } catch (err: any) {
                showAlert('Error', 'Failed to save form: ' + (err.message || err), 'error');
              }
            }}
          >
            <Save className="h-5 w-5 mr-2" /> Save
          </Button>
          <Button className="flex-1 mx-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg hover:from-blue-600 hover:to-purple-600 transition-transform active:scale-95 text-base py-3" size="lg"
            onClick={async () => {
              if (formTitle.trim() === '') {
                showAlert('Error', 'Please name your form before publishing.', 'error');
                return;
              }
              if (formTitle.trim().toLowerCase() === 'untitled form') {
                showAlert('Error', 'Please give your form a unique name before publishing.', 'error');
                return;
              }
              if (questions.length === 0) {
                showAlert('Error', 'Please add at least one question before publishing.', 'error');
                return;
              }
              try {
                const { saveFormToFirestore } = await import('../firebase/formSave');
                const formId = formIdState || (window.crypto?.randomUUID?.() ?? Math.random().toString(36).substr(2, 9));
                if (!formIdState) setFormIdState(formId);
                const publishedLink = `/survey/${formId}`;
                await saveFormToFirestore({
                  formId,
                  title: formTitle ?? '',
                  questions: questions ?? [],
                  tone: tone ?? '',
                  prompt: prompt ?? '',
                  publishedLink,
                  showProgress,
                  customThankYou,
                  thankYouMessage: customThankYou ? thankYouMessage : undefined,
                  published: 'published',
                  starred: '',
                });
                setPublishModalOpen(true);
                setPublishedLink(window.location.origin + publishedLink);
              } catch (err: any) {
                showAlert('Error', 'Failed to publish form: ' + (err.message || err), 'error');
              }
            }}
          >
            <Share2 className="h-5 w-5 mr-2" /> Publish
          </Button>
        </div>
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto px-1 sm:px-2 py-4 lg:gap-8 lg:px-4 lg:py-8">
        {/* Form Editor Column */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <Card className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border-0 transition-transform hover:scale-[1.01] p-2 sm:p-4">
            <CardHeader className="pb-4">
              <CardTitle>
                <Input 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)} 
                  className="text-lg sm:text-xl font-bold border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                />
              </CardTitle>
              <CardDescription>
                Edit your questions below or use AI to generate new ones
              </CardDescription>
            </CardHeader>
          </Card>
          {/* Form Questions */}
          <div className="space-y-3 sm:space-y-4">
            {questions.map((question) => (
                <Card key={question.id} className="relative bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border-0 transition-transform hover:scale-[1.01] p-2 sm:p-4">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex items-center gap-2">
                        <div className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 px-2 py-1 rounded-md font-semibold text-purple-700 shadow-sm">
                        {question.type === QuestionType.MULTIPLE_CHOICE && 'Multiple Choice'}
                        {question.type === QuestionType.TEXT && 'Text'}
                        {question.type === QuestionType.RATING && 'Rating'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch 
                          id={`required-${question.id}`} 
                          checked={question.required} 
                          onCheckedChange={(checked) => handleQuestionChange(question.id, 'required', checked)}
                            className="scale-110"
                        />
                        <Label htmlFor={`required-${question.id}`} className="text-xs">Required</Label>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="hover:bg-purple-100 rounded-full transition-transform active:scale-90">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                          className="hover:bg-pink-100 rounded-full transition-transform active:scale-90"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>{renderQuestionEditor(question)}</CardContent>
              </Card>
            ))}
            {/* Add Question Button */}
              <div className="p-2 sm:p-4 border border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 bg-white/60 backdrop-blur-md shadow-inner">
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                    className="gap-1 rounded-full border-2 border-purple-200 hover:bg-purple-50 shadow-sm"
                  onClick={() => handleAddQuestion(QuestionType.MULTIPLE_CHOICE)}
                >
                  <AlignJustify className="h-4 w-4" />
                  Multiple Choice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                    className="gap-1 rounded-full border-2 border-blue-200 hover:bg-blue-50 shadow-sm"
                  onClick={() => handleAddQuestion(QuestionType.TEXT)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                    className="gap-1 rounded-full border-2 border-pink-200 hover:bg-pink-50 shadow-sm"
                  onClick={() => handleAddQuestion(QuestionType.RATING)}
                >
                  <BookOpen className="h-4 w-4" />
                  Rating
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                    className="gap-1 rounded-full border-2 border-green-200 hover:bg-green-50 shadow-sm"
                  onClick={() => handleAddQuestion(QuestionType.EMAIL)}
                >
                  <Inbox className="h-4 w-4" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                    className="gap-1 rounded-full border-2 border-yellow-200 hover:bg-yellow-50 shadow-sm"
                  onClick={() => handleAddQuestion(QuestionType.DATE)}
                >
                  <DollarSign className="h-4 w-4" />
                  Date
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Choose a question type to add to your form
              </p>
            </div>
          </div>
        </div>
          {/* Divider for desktop */}
          <div className="hidden lg:flex flex-col items-center justify-center px-2">
            <div className="h-full w-1 bg-gradient-to-b from-purple-200 via-pink-200 to-blue-200 rounded-full opacity-60" style={{ minHeight: '400px' }} />
          </div>
          {/* AI Sidebar - sticky on desktop, always visible below on mobile */}
          <div className="lg:col-span-4 w-full z-30 mt-4 lg:mt-0">
            {/* Collapsible toggle for mobile (hidden, always show sidebar on mobile) */}
            {/* <div className="lg:hidden flex justify-end mb-2">
              <Button className="rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-md" size="sm" onClick={() => setAiSidebarOpen(!aiSidebarOpen)}>
                <BrainCircuit className="h-5 w-5" /> {aiSidebarOpen ? 'Hide AI Tools' : 'Show AI Tools'}
              </Button>
            </div> */}
            <Card className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl border-0 transition-transform hover:scale-[1.01] p-2 sm:p-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <BrainCircuit className="h-5 w-5 text-purple-500 animate-pulse" />
                AI Form Generator
              </CardTitle>
              <CardDescription>
                Describe what kind of form you want to create
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt">Describe your form</Label>
                <Textarea 
                  id="prompt" 
                  placeholder="e.g., Create a survey for my Shrek business to find out how much people love Shrek."
                    className="min-h-24 mt-1 bg-white/60 border-2 border-purple-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 rounded-xl shadow-inner transition-all text-base"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ai-action" className="mb-2 block">AI Action</Label>
                <div className="flex gap-2 flex-wrap">
                  <div 
                      className={`px-3 py-1.5 rounded-full text-sm ${aiAction === AIActionType.ADD ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'} cursor-pointer transition-colors relative group flex-1 text-center font-semibold`}
                    onClick={() => setAiAction(AIActionType.ADD)}
                    data-tooltip="Add new questions while keeping existing ones"
                  >
                    <span>Add</span>
                    <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                      Add new questions while keeping existing ones
                    </div>
                  </div>
                  <div 
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      questions.length === 0 
                        ? 'bg-gray-100 opacity-50 cursor-not-allowed' 
                        : aiAction === AIActionType.REBUILD 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                          : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                      } transition-colors relative group flex-1 text-center font-semibold`}
                    onClick={() => questions.length > 0 && setAiAction(AIActionType.REBUILD)}
                    data-tooltip={questions.length === 0 ? "Need questions to rebuild" : "Replace all questions with new ones"}
                  >
                    <span>Rebuild</span>
                    <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                      {questions.length === 0 ? "You need existing questions to use this option" : "Replace all questions with new ones"}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="tone">Select a tone</Label>
                <Select 
                  value={tone} 
                  onValueChange={(value: string) => setTone(value)}
                >
                    <SelectTrigger id="tone" className="mt-1 w-full bg-white/60 border-2 border-purple-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 rounded-xl shadow-inner text-base">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="question-count" className={aiAction === AIActionType.REVISE ? "text-gray-400" : ""}>
                    Number of Questions
                  </Label>
                </div>
                <div className="mt-2">
                  <div className={`grid grid-cols-5 gap-2 ${aiAction === AIActionType.REVISE ? "opacity-50" : ""}`}>
                    {[1, 2, 3, 5, 10].map((num) => (
                      <div
                        key={num}
                          className={`px-3 py-2 border-2 rounded-xl text-center cursor-pointer transition-colors font-semibold shadow-sm text-base ${
                          questionCount === num 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400' 
                              : 'bg-white hover:bg-purple-50 border-purple-100'
                        } ${aiAction === AIActionType.REVISE ? 'pointer-events-none' : ''}`}
                        onClick={() => {
                          if (aiAction !== AIActionType.REVISE) {
                            setQuestionCount(num);
                          }
                        }}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button 
                  className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-xl hover:from-purple-600 hover:to-pink-600 transition-all active:scale-95 animate-pulse text-base py-3"
                onClick={handleGenerateQuestions}
                disabled={isGenerating || !prompt}
                  size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                      <Lightbulb className="h-4 w-4 animate-pulse" />
                    {aiAction === AIActionType.ADD && `Add ${questionCount} Questions`}
                    {aiAction === AIActionType.REBUILD && `Rebuild with ${questionCount} Questions`}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
            <Card className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border-0 p-2 sm:p-4 mt-4">
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>
                Configure your form's appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-progress" className="font-medium">Show Progress</Label>
                  <p className="text-xs text-gray-500">Display progress indicator</p>
                </div>
                  <Switch id="show-progress" checked={showProgress} onCheckedChange={setShowProgress} className="scale-110" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="custom-thank-you" className="font-medium">Custom Thank You</Label>
                  <p className="text-xs text-gray-500">Customize the thank you message</p>
                </div>
                  <Switch id="custom-thank-you" checked={customThankYou} onCheckedChange={setCustomThankYou} className="scale-110" />
              </div>
              {customThankYou && (
                <div className="mt-2">
                  <Label htmlFor="thank-you-message" className="font-medium">Thank You Message</Label>
                  <Textarea
                    id="thank-you-message"
                      className="mt-1 bg-white/60 border-2 border-purple-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 rounded-xl shadow-inner text-base"
                    value={thankYouMessage}
                    onChange={e => setThankYouMessage(e.target.value)}
                    maxLength={500}
                    placeholder="Enter your custom thank you message..."
                  />
                  <div className="text-xs text-gray-400 text-right">{thankYouMessage.length}/500</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Publish Modal */}
      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent className="p-0 bg-transparent border-0 shadow-none max-w-full w-full sm:max-w-md md:max-w-lg">
          <div className="relative w-full rounded-2xl shadow-2xl bg-white/80 backdrop-blur-lg border-0 overflow-y-auto max-h-[90vh] p-0">
            {/* Jazzed up glassy modal with confetti shimmer */}
            <div className="relative rounded-t-2xl bg-gradient-to-br from-purple-500/80 via-pink-400/70 to-yellow-300/60 px-0 py-0 flex flex-col items-center justify-center text-center shadow-md overflow-hidden">
              {/* Subtle confetti/shimmer effect */}
              <div className="absolute inset-0 pointer-events-none z-0 animate-confetti" style={{ background: 'repeating-linear-gradient(135deg,rgba(255,255,255,0.08) 0 2px,transparent 2px 8px)' }} />
              {/* Big checkmark icon */}
              <div className="relative z-10 flex flex-col items-center justify-center py-8 w-full">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-gradient-to-br from-green-400 via-purple-400 to-pink-400 rounded-full p-4 shadow-lg">
                    <Check className="h-12 w-12 text-white drop-shadow-xl" />
              </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow mb-1">Your Form is Live!</h2>
                <p className="text-base sm:text-lg text-white/90 font-medium mb-2">Share your survey and start collecting responses.</p>
              </div>
          </div>
          {/* Modal content with glassmorphism */}
            <div className="px-2 py-4 sm:px-6 sm:py-6 bg-white/80 backdrop-blur-lg rounded-b-2xl">
            <Tabs defaultValue="link" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/60 border-b-2 border-purple-200 rounded-t-xl overflow-hidden mb-4 text-xs sm:text-base">
                <TabsTrigger value="link" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2 text-purple-700 font-semibold">
                  <Share2 className="h-4 w-4" /> Link
                </TabsTrigger>
                <TabsTrigger value="basic" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white flex items-center gap-2 text-pink-700 font-semibold">
                  <AlignJustify className="h-4 w-4" /> Basic Embed
                </TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-white flex items-center gap-2 text-yellow-700 font-semibold">
                  <Lightbulb className="h-4 w-4" /> Advanced Embed
                </TabsTrigger>
              </TabsList>
              {/* Link Tab */}
                <TabsContent value="link" className="mt-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-bold text-purple-700">Public Link</Label>
                  <div className="flex items-center gap-2 flex-col sm:flex-row">
                    <Input
                      value={publishedLink || ''}
                      readOnly
                        className="flex-1 bg-white/70 text-xs font-mono border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400"
                      onFocus={e => e.target.select()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                        className="border-purple-600 text-purple-600 hover:bg-purple-50 shadow-md mt-2 sm:mt-0"
                      onClick={() => {
                        if (publishedLink) {
                          navigator.clipboard.writeText(publishedLink);
                          setCopied(true);
                          setCopiedType('link');
                          setTimeout(() => setCopied(false), 1500);
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>
                  <div style={{ minHeight: 24 }}>
                    {copied && copiedType === 'link' && (
                      <span
                          className="text-green-600 text-xs transition-opacity duration-300 font-semibold"
                        style={{ display: 'block', textAlign: 'left', marginTop: 2 }}
                      >
                        Link copied!
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4 flex-col sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50 shadow-sm"
                      onClick={() => window.open(publishedLink || '', '_blank')}
                    >
                      <Share2 className="h-4 w-4 mr-1" /> Open Link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-blue-500 text-blue-500 hover:bg-blue-50 shadow-sm"
                      onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(publishedLink || '')}`, '_blank')}
                    >
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M19.633 7.997c.013.176.013.353.013.53 0 5.386-4.099 11.6-11.6 11.6-2.307 0-4.454-.676-6.26-1.845.324.039.636.052.972.052 1.92 0 3.685-.636 5.096-1.713-1.793-.038-3.304-1.216-3.825-2.844.25.039.502.065.767.065.369 0 .738-.052 1.082-.142-1.87-.38-3.277-2.027-3.277-4.011v-.052c.547.303 1.175.485 1.845.511a4.109 4.109 0 01-1.83-3.423c0-.754.202-1.462.554-2.07a11.65 11.65 0 008.457 4.287c-.065-.303-.104-.62-.104-.937 0-2.27 1.845-4.114 4.114-4.114 1.187 0 2.26.502 3.013 1.314a8.18 8.18 0 002.605-.996 4.077 4.077 0 01-1.804 2.27a8.224 8.224 0 002.357-.646 8.936 8.936 0 01-2.048 2.096z"/></svg> Share on Twitter
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-green-500 text-green-500 hover:bg-green-50 shadow-sm"
                      onClick={() => window.open(`mailto:?subject=Check%20out%20my%20form&body=${encodeURIComponent(publishedLink || '')}`)}
                    >
                      <Inbox className="h-4 w-4 mr-1" /> Email
                    </Button>
                  </div>
                </div>
              </TabsContent>
              {/* Basic Embed Tab */}
                <TabsContent value="basic" className="mt-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-bold text-pink-700">Basic Embed Code</Label>
                  <div className="flex items-center gap-2 flex-col sm:flex-row">
                    <Textarea
                      value={`<iframe src=\"${publishedLink || ''}\" width=\"100%\" height=\"600px\" frameborder=\"0\"></iframe>`}
                      readOnly
                        className="flex-1 bg-white/70 text-xs font-mono border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-400 h-20"
                      onFocus={e => e.target.select()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                        className="border-pink-500 text-pink-500 hover:bg-pink-50 shadow-md mt-2 sm:mt-0"
                      onClick={() => {
                        const embedCode = `<iframe src=\"${publishedLink || ''}\" width=\"100%\" height=\"600px\" frameborder=\"0\"></iframe>`;
                        navigator.clipboard.writeText(embedCode);
                        setCopied(true);
                        setCopiedType('embed');
                        setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>
                  <div style={{ minHeight: 24 }}>
                    {copied && copiedType === 'embed' && (
                      <span
                          className="text-green-600 text-xs transition-opacity duration-300 font-semibold"
                        style={{ display: 'block', textAlign: 'left', marginTop: 2 }}
                      >
                        Embed code copied!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Simple embed: paste this code into your website's HTML to embed the survey.
                  </p>
                </div>
              </TabsContent>
              {/* Advanced Embed Tab */}
                <TabsContent value="advanced" className="mt-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-bold text-yellow-700">Advanced Embed Code</Label>
                  <div className="flex items-center gap-2 flex-col sm:flex-row">
                    <Textarea
                      value={`<script>\n  (function(w,d,s,o,f,js,fjs){\n    w['SmartForm']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};\n    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];\n    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);\n  }(window,document,'script','smartform','https://embed.smartform.ai/loader.js'));\n  \n  smartform('init', {\n    formId: '${formIdState || ''}',\n    container: '#smartform-container',\n    theme: 'purple',\n    autoResize: true\n  });\n</script>\n\n<div id=\"smartform-container\"></div>`}
                      readOnly
                        className="flex-1 bg-white/70 text-xs font-mono border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 h-48"
                      onFocus={e => e.target.select()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                        className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 shadow-md mt-2 sm:mt-0"
                      onClick={() => {
                        const advancedCode = `<script>\n  (function(w,d,s,o,f,js,fjs){\n    w['SmartForm']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};\n    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];\n    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);\n  }(window,document,'script','smartform','https://embed.smartform.ai/loader.js'));\n  \n  smartform('init', {\n    formId: '${formIdState || ''}',\n    container: '#smartform-container',\n    theme: 'purple',\n    autoResize: true\n  });\n</script>\n\n<div id=\"smartform-container\"></div>`;
                        navigator.clipboard.writeText(advancedCode);
                        setCopied(true);
                        setCopiedType('advanced');
                        setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>
                  <div style={{ minHeight: 24 }}>
                    {copied && copiedType === 'advanced' && (
                      <span
                          className="text-green-600 text-xs transition-opacity duration-300 font-semibold"
                        style={{ display: 'block', textAlign: 'left', marginTop: 2 }}
                      >
                        Advanced embed code copied!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Advanced embed: includes JavaScript API for customization, theming, and responsive behavior.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
    </div>
    </div>
  );
}

export default FormBuilder;