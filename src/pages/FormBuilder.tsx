import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchFormById } from '../firebase/formFetch';
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
import { AlertCircle, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useSubscriptionCheck from '@/hooks/useSubscriptionCheck';

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
  const { formId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [formCount, setFormCount] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use our subscription check hook
  const { 
    loading: subscriptionLoading, 
    checkAccess, 
    limits,
    isPro,
    isStarter
  } = useSubscriptionCheck({ redirectOnFailure: false });

  // Publish modal state
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishedLink, setPublishedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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

  // Fetch current form counts on component mount
  useEffect(() => {
    const fetchFormCounts = async () => {
      // Mock API call - in a real app, this would be an actual API call
      setTimeout(() => {
        setFormCount(15); // For testing - we're under the free limit (20)
        setGeneratedCount(8); // For testing - we're under the free AI generations limit (10)
        setIsLoading(false);
      }, 1000);
    };

    fetchFormCounts();
  }, []);

  // Check if user can create this form based on their current forms count
  const canCreateForm = () => {
    return checkAccess('activeForms', formCount + 1);
  };

  // Check if user can use AI generation based on their usage
  const canUseAIGeneration = () => {
    return checkAccess('aiGeneratedForms', generatedCount + 1);
  };

  // Determine if branding should be removed (pro feature)
  const shouldRemoveBranding = () => {
    return checkAccess('removeSmartFormAIBranding');
  };

  // Combined loading state
  const loading = isLoading || subscriptionLoading;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

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

  const handleGenerateQuestions = async () => {
    if (!prompt) return;
    setIsGenerating(true);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          tone,
          questionCount,
          action: aiAction
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
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {formId ? 'Edit Form' : 'Create New Form'}
          </h1>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/forms')}
            >
              Cancel
            </Button>
            <Button
              className="bg-smartform-blue hover:bg-blue-700"
              onClick={() => {
                // This would save the form in a real app
                alert('Form saved successfully!');
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Form
            </Button>
          </div>
        </div>

        {/* Subscription limit warnings */}
        {!isPro && !isStarter && formCount >= 15 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-600">Form Limit Warning</AlertTitle>
            <AlertDescription>
              You're approaching your free plan limit of {limits.activeForms} forms. 
              <Button
                variant="link"
                className="text-smartform-blue p-0 h-auto font-semibold"
                onClick={() => navigate('/pricing', { state: { from: '/builder' } })}
              >
                Upgrade now
              </Button> to create more.
            </AlertDescription>
          </Alert>
        )}

        {/* Form Builder UI would go here */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Form Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This is where the form building interface would be implemented.
            </p>
            
            {/* AI Form Generation Button - Limited by subscription */}
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="font-medium mb-2">AI Form Generation</h3>
              <p className="text-sm text-gray-600 mb-3">
                Use AI to quickly generate form questions based on your description.
              </p>
              <Button
                onClick={() => {
                  if (canUseAIGeneration()) {
                    // AI generation would happen here in a real app
                    alert('AI form generation triggered!');
                    setGeneratedCount(prevCount => prevCount + 1);
                  }
                }}
              >
                Generate with AI
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                You've used {generatedCount} of {limits.aiGeneratedForms} AI generations this month.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Branding Options - Pro feature */}
        <Card>
          <CardHeader>
            <CardTitle>Form Branding</CardTitle>
          </CardHeader>
          <CardContent>
            {shouldRemoveBranding() ? (
              <p className="text-green-600">
                SmartFormAI branding is removed for your forms as part of your Pro subscription.
              </p>
            ) : (
              <div>
                <p className="text-gray-600 mb-3">
                  Your form will display "Powered by SmartFormAI" branding.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/pricing', { state: { from: '/builder' } })}
                >
                  Upgrade to Pro to Remove Branding
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FormBuilder;
