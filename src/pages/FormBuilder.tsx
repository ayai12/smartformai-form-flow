import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchFormById } from '../firebase/formFetch';
import { useAuth } from '../context/AuthContext';
import { useTokenUsage } from '../context/TokenUsageContext';
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
  const { tokenUsage, hasTokensAvailable, tokensRemaining, refreshTokenUsage } = useTokenUsage();
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
    
    // Check if user has tokens available
    if (user && !hasTokensAvailable) {
      showAlert(
        'Token Limit Reached', 
        `You've used all ${tokenUsage?.aiRequestsLimit} AI requests for this billing cycle. Please upgrade your plan for more tokens.`, 
        'error'
      );
      return;
    }
    
    setIsGenerating(true);

    try {
      const response = await fetch('https://us-central1-smartformai-51e03.cloudfunctions.net/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          tone,
          questionCount,
          action: aiAction,
          userId: user?.uid // Include userId for token tracking
        })
      });
      
      if (response.status === 403) {
        const errorData = await response.json();
        showAlert(
          'Token Limit Reached', 
          `You've used all ${errorData.tokenUsage?.aiRequestsLimit} AI requests for this billing cycle. Please upgrade your plan for more tokens.`, 
          'error'
        );
        setIsGenerating(false);
        // Refresh token usage to show updated count
        if (user) refreshTokenUsage();
        return;
      }
      
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
      
      // Refresh token usage to show updated count
      if (user) refreshTokenUsage();
      
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
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
          <p className="text-gray-600">Create and design your form</p>
          {formIdState && (
            <div className="mt-2">
              <Label className="text-xs text-gray-500">Form ID:</Label>
              <Input value={formIdState} readOnly className="w-64 mt-1 text-xs bg-gray-100" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="w-full mb-1">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded px-3 py-2 flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20.5C6.753 20.5 2 15.747 2 10.5S6.753.5 12 .5s10 4.753 10 10-4.753 10-10 10z" /></svg>
              <span>Tip: Always save your survey after making changes to avoid losing your work!</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1" onClick={() => setPreviewOpen(true)}>
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
            <div className="flex flex-row flex-wrap items-center gap-2 min-w-0">
              <Button
                variant="outline"
                className="gap-1"
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
            </div>
            <Button
              className="gap-1 bg-smartform-blue hover:bg-blue-700"
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
      </div>

      {/* Publish Modal */}
      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-purple-600">Form Published!</DialogTitle>
            <DialogDescription>
              Share your form using the public link or embed it on your website.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Tabs defaultValue="link" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-purple-50">
                <TabsTrigger value="link" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Link</TabsTrigger>
                <TabsTrigger value="basic" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Basic Embed</TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Advanced Embed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="link" className="mt-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium">Public Link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={publishedLink || ''}
                      readOnly
                      className="flex-1 bg-gray-100 text-xs"
                      onFocus={e => e.target.select()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
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
                        className="text-green-600 text-xs transition-opacity duration-300 animate-fade-in-out"
                        style={{ display: 'block', textAlign: 'left', marginTop: 2 }}
                      >
                        Link copied!
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      onClick={() => window.open(publishedLink || '', '_blank')}
                    >
                      <Share2 className="h-4 w-4 mr-1" /> Open Link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(publishedLink || '')}`, '_blank')}
                    >
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M19.633 7.997c.013.176.013.353.013.53 0 5.386-4.099 11.6-11.6 11.6-2.307 0-4.454-.676-6.26-1.845.324.039.636.052.972.052 1.92 0 3.685-.636 5.096-1.713-1.793-.038-3.304-1.216-3.825-2.844.25.039.502.065.767.065.369 0 .738-.052 1.082-.142-1.87-.38-3.277-2.027-3.277-4.011v-.052c.547.303 1.175.485 1.845.511a4.109 4.109 0 01-1.83-3.423c0-.754.202-1.462.554-2.07a11.65 11.65 0 008.457 4.287c-.065-.303-.104-.62-.104-.937 0-2.27 1.845-4.114 4.114-4.114 1.187 0 2.26.502 3.013 1.314a8.18 8.18 0 002.605-.996 4.077 4.077 0 01-1.804 2.27a8.224 8.224 0 002.357-.646 8.936 8.936 0 01-2.048 2.096z"/></svg> Share on Twitter
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      onClick={() => window.open(`mailto:?subject=Check%20out%20my%20form&body=${encodeURIComponent(publishedLink || '')}`)}
                    >
                      <Inbox className="h-4 w-4 mr-1" /> Email
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="basic" className="mt-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium">Basic Embed Code</Label>
                  <div className="flex items-center gap-2">
                    <Textarea
                      value={`<iframe src="${publishedLink || ''}" width="100%" height="600px" frameborder="0"></iframe>`}
                      readOnly
                      className="flex-1 bg-gray-100 text-xs font-mono"
                      onFocus={e => e.target.select()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      onClick={() => {
                        const embedCode = `<iframe src="${publishedLink || ''}" width="100%" height="600px" frameborder="0"></iframe>`;
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
                        className="text-green-600 text-xs transition-opacity duration-300 animate-fade-in-out"
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
              
              <TabsContent value="advanced" className="mt-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium">Advanced Embed Code</Label>
                  <div className="flex items-center gap-2">
                    <Textarea
                      value={`<script>
  (function(w,d,s,o,f,js,fjs){
    w['SmartForm']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','smartform','https://embed.smartform.ai/loader.js'));
  
  smartform('init', {
    formId: '${formIdState || ''}',
    container: '#smartform-container',
    theme: 'purple',
    autoResize: true
  });
</script>

<div id="smartform-container"></div>`}
                      readOnly
                      className="flex-1 bg-gray-100 text-xs font-mono h-48"
                      onFocus={e => e.target.select()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      onClick={() => {
                        const advancedCode = `<script>
  (function(w,d,s,o,f,js,fjs){
    w['SmartForm']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','smartform','https://embed.smartform.ai/loader.js'));
  
  smartform('init', {
    formId: '${formIdState || ''}',
    container: '#smartform-container',
    theme: 'purple',
    autoResize: true
  });
</script>

<div id="smartform-container"></div>`;
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
                        className="text-green-600 text-xs transition-opacity duration-300 animate-fade-in-out"
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
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Editor Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>
                <Input 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)} 
                  className="text-xl font-bold border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </CardTitle>
              <CardDescription>
                Edit your questions below or use AI to generate new ones
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Form Questions */}
          <div className="space-y-4">
            {questions.map((question) => (
              <Card key={question.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded-md">
                        {question.type === QuestionType.MULTIPLE_CHOICE && 'Multiple Choice'}
                        {question.type === QuestionType.TEXT && 'Text'}
                        {question.type === QuestionType.RATING && 'Rating'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch 
                          id={`required-${question.id}`} 
                          checked={question.required} 
                          onCheckedChange={(checked) => handleQuestionChange(question.id, 'required', checked)}
                        />
                        <Label htmlFor={`required-${question.id}`} className="text-xs">Required</Label>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
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
            <div className="p-4 border border-dashed rounded-md flex flex-col items-center justify-center gap-2">
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleAddQuestion(QuestionType.MULTIPLE_CHOICE)}
                >
                  <AlignJustify className="h-4 w-4" />
                  Multiple Choice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleAddQuestion(QuestionType.TEXT)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleAddQuestion(QuestionType.RATING)}
                >
                  <BookOpen className="h-4 w-4" />
                  Rating
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleAddQuestion(QuestionType.EMAIL)}
                >
                  <Inbox className="h-4 w-4" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
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

        {/* AI Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-smartform-blue" />
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
                  className="min-h-24 mt-1"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ai-action" className="mb-2 block">AI Action</Label>
                <div className="flex gap-2 flex-wrap">
                  <div 
                    className={`px-3 py-1.5 rounded-full text-sm ${aiAction === AIActionType.ADD ? 'bg-smartform-blue text-white' : 'bg-gray-100 hover:bg-gray-200'} cursor-pointer transition-colors relative group flex-1 text-center`}
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
                          ? 'bg-smartform-blue text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                    } transition-colors relative group flex-1 text-center`}
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
                  <SelectTrigger id="tone" className="mt-1 w-full">
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
                        className={`px-3 py-2 border rounded-md text-center cursor-pointer transition-colors ${
                          questionCount === num 
                            ? 'bg-smartform-blue text-white border-smartform-blue' 
                            : 'bg-white hover:bg-gray-50'
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
                className="w-full gap-2 bg-smartform-blue hover:bg-blue-700" 
                onClick={handleGenerateQuestions}
                disabled={isGenerating || !prompt}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4" />
                    {aiAction === AIActionType.ADD && `Add ${questionCount} Questions`}
                    {aiAction === AIActionType.REBUILD && `Rebuild with ${questionCount} Questions`}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
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
                <Switch id="show-progress" checked={showProgress} onCheckedChange={setShowProgress} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="custom-thank-you" className="font-medium">Custom Thank You</Label>
                  <p className="text-xs text-gray-500">Customize the thank you message</p>
                </div>
                <Switch id="custom-thank-you" checked={customThankYou} onCheckedChange={setCustomThankYou} />
              </div>
              {customThankYou && (
                <div className="mt-2">
                  <Label htmlFor="thank-you-message" className="font-medium">Thank You Message</Label>
                  <Textarea
                    id="thank-you-message"
                    className="mt-1"
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
    </DashboardLayout>
  );
};

export default FormBuilder;
