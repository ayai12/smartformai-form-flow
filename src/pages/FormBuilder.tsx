import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchFormById } from '../firebase/formFetch';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../components/AlertProvider';
import { canPerformAction, deductCredits, CREDIT_COSTS } from '@/firebase/credits';
import UpgradeModal from '@/components/UpgradeModal';
import PostBuildModal from '@/components/PostBuildModal';
import { toast } from 'sonner';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agentId');
  const { showAlert } = useAlert();
  const { user } = useAuth();
  // Local storage key based on formId or 'new'
  const localKey = `formbuilder_${formId || 'new'}`;

  // State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('Untitled Agent');
  const [agentData, setAgentData] = useState<any>(null);
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPostBuildModal, setShowPostBuildModal] = useState(false);

  // Check if agent was just built successfully and show post-build modal
  useEffect(() => {
    const checkAgentBuilt = async () => {
      // Only show if agent was just built successfully
      const agentBuilt = localStorage.getItem('agent_built_successfully') === 'true';
      if (!user?.uid || !agentBuilt || questions.length === 0) return;
      
      try {
        const db = getFirestore();
        const agentsQuery = query(
          collection(db, 'agents'),
          where('userId', '==', user.uid)
        );
        const agentsSnap = await getDocs(agentsQuery);
        const agentCount = agentsSnap.docs.length;
        
        // Only show for first agent after successful build
        if (agentCount === 1) {
          // Clear the flag
          localStorage.removeItem('agent_built_successfully');
          
          // Show post-build modal after 10 seconds delay
          setTimeout(async () => {
            try {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              const userData = userDoc.data();
              if (userData?.plan === 'free') {
                setShowPostBuildModal(true);
              }
            } catch (error) {
              console.error('Error checking user plan for modal:', error);
            }
          }, 10000);
        }
      } catch (error) {
        console.error('Error checking agent count:', error);
      }
    };

    checkAgentBuilt();
  }, [user?.uid, questions.length]);

  // Debug: Log when questions change
  useEffect(() => {
    console.log('📊 Questions state changed:', {
      count: questions.length,
      agentId,
      formId,
      questions: questions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question?.substring(0, 30)
      }))
    });
  }, [questions.length, agentId, formId]);

  // Effect to check if there are questions and reset action to ADD if needed
  useEffect(() => {
    if (questions.length === 0 && aiAction !== AIActionType.ADD) {
      setAiAction(AIActionType.ADD);
    }
  }, [questions, aiAction]);

  // Load from agent data, form data, or localStorage
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    // Priority 1: Load from agent if agentId exists
    if (agentId) {
      (async () => {
        try {
          const db = getFirestore();
          const agentDoc = await getDoc(doc(db, 'agents', agentId));
          if (!isMounted) return;
          
          if (agentDoc.exists()) {
            const agent = agentDoc.data();
            setAgentData(agent);
            setFormTitle(agent.name || 'Untitled Agent');
            setPrompt(agent.generatedPrompt || agent.goal || '');
            setTone(agent.personality?.toLowerCase() || 'business');
            
            // Load questions from agent.questions - normalize types
            if (agent.questions && Array.isArray(agent.questions) && agent.questions.length > 0) {
              // Normalize question types to match QuestionType enum
              const normalizedQuestions: Question[] = agent.questions.map((q: any) => {
                // Ensure type matches QuestionType enum values
                const qType = (q.type || '').toLowerCase();
                
                if (qType === 'multiple_choice' || qType === 'multiple choice') {
                  return {
                    id: q.id,
                    type: QuestionType.MULTIPLE_CHOICE,
                    question: q.question,
                    required: q.required !== undefined ? Boolean(q.required) : true,
                    options: q.options || ['Option 1', 'Option 2']
                  } as MultipleChoiceQuestion;
                } else if (qType === 'rating') {
                  return {
                    id: q.id,
                    type: QuestionType.RATING,
                    question: q.question,
                    required: q.required !== undefined ? Boolean(q.required) : true,
                    scale: q.scale || 5
                  } as RatingQuestion;
                } else {
                  return {
                    id: q.id,
                    type: QuestionType.TEXT,
                    question: q.question,
                    required: q.required !== undefined ? Boolean(q.required) : true,
                  } as TextQuestion;
                }
              });
              
              if (isMounted) {
                setQuestions(normalizedQuestions);
                console.log(`✅ Loaded ${normalizedQuestions.length} questions from agent`);
                console.log('📋 Questions:', normalizedQuestions.map(q => ({ type: q.type, question: q.question?.substring(0, 50) })));
              }
            } else if (agent.surveyId) {
              // Fallback: try to load from linked survey
              try {
                const formData = await fetchFormById(agent.surveyId);
                if (!isMounted) return;
                
                if (formData?.questions && Array.isArray(formData.questions) && formData.questions.length > 0) {
                  // Normalize types for form questions too
                  const normalizedQuestions: Question[] = formData.questions.map((q: any) => {
                    const qType = (q.type || '').toLowerCase();
                    
                    if (qType === 'multiple_choice' || qType === 'multiple choice') {
                      return {
                        id: q.id,
                        type: QuestionType.MULTIPLE_CHOICE,
                        question: q.question,
                        required: q.required !== undefined ? Boolean(q.required) : true,
                        options: q.options || ['Option 1', 'Option 2']
                      } as MultipleChoiceQuestion;
                    } else if (qType === 'rating') {
                      return {
                        id: q.id,
                        type: QuestionType.RATING,
                        question: q.question,
                        required: q.required !== undefined ? Boolean(q.required) : true,
                        scale: q.scale || 5
                      } as RatingQuestion;
                    } else {
                      return {
                        id: q.id,
                        type: QuestionType.TEXT,
                        question: q.question,
                        required: q.required !== undefined ? Boolean(q.required) : true,
                      } as TextQuestion;
                    }
                  });
                  
                  if (isMounted) {
                    setQuestions(normalizedQuestions);
                    console.log(`✅ Loaded ${normalizedQuestions.length} questions from linked survey`);
                  }
                }
              } catch (e) {
                console.error('Failed to load questions from linked survey:', e);
              }
            }
            
            if (isMounted && agent.surveyId) {
              setFormIdState(agent.surveyId);
            }
            
            if (isMounted) {
              console.log('✅ Loaded agent data:', agent.name);
            }
            return;
          }
        } catch (e) {
          console.error('Error loading agent:', e);
          if (isMounted) {
            showAlert('Error', 'Failed to load agent data.', 'error');
          }
        }
      })();
      
      return () => {
        isMounted = false; // Cleanup
      };
    }

    // Priority 2: Load from form if formId exists AND no agentId (to prevent overwriting agent questions)
    if (formId && !agentId) {
      // Always fetch from backend for existing forms
      (async () => {
        try {
          const data = await fetchFormById(formId);
          if (data) {
            setFormTitle(data.title || 'Untitled Agent');
            setPrompt(data.prompt || '');
            setTone(data.tone || 'business');
            // Normalize question types when loading from form
            const normalizedQuestions: Question[] = (data.questions || []).map((q: any) => {
              const qType = (q.type || '').toLowerCase();
              
              if (qType === 'multiple_choice' || qType === 'multiple choice') {
                return {
                  id: q.id,
                  type: QuestionType.MULTIPLE_CHOICE,
                  question: q.question,
                  required: q.required !== undefined ? Boolean(q.required) : true,
                  options: q.options || ['Option 1', 'Option 2']
                } as MultipleChoiceQuestion;
              } else if (qType === 'rating') {
                return {
                  id: q.id,
                  type: QuestionType.RATING,
                  question: q.question,
                  required: q.required !== undefined ? Boolean(q.required) : true,
                  scale: q.scale || 5
                } as RatingQuestion;
              } else {
                return {
                  id: q.id,
                  type: QuestionType.TEXT,
                  question: q.question,
                  required: q.required !== undefined ? Boolean(q.required) : true,
                } as TextQuestion;
              }
            });
            setQuestions(normalizedQuestions);
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
              setFormTitle(parsed.formTitle || 'Untitled Agent');
              setPrompt(parsed.prompt || '');
              setTone(parsed.tone || 'business');
              setQuestions(parsed.questions || []);
              setFormIdState(formId);
            } catch {}
          } else {
            showAlert('Error', 'Failed to load agent for editing.', 'error');
          }
        }
      })();
    } else {
      // Priority 3: New agent/form: load draft if any
      const local = localStorage.getItem(localKey);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setFormTitle(parsed.formTitle || 'Untitled Agent');
          setPrompt(parsed.prompt || '');
          setTone(parsed.tone || 'business');
          setQuestions(parsed.questions || []);
        } catch {}
      }
    }
    // eslint-disable-next-line
  }, [formId, agentId]);

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
    
    if (!user?.uid) {
      showAlert('Error', 'You must be logged in to generate questions.', 'error');
      return;
    }

    // Check credits (Pro users bypass this check)
    const creditCheck = await canPerformAction(user.uid, CREDIT_COSTS.REGENERATE_QUESTIONS);
    
    if (!creditCheck.allowed) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsGenerating(true);

    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/chat'
        : 'http://localhost:3000/chat';
        
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || 'Failed to generate questions. Please try again.';
        
        // Handle rate limiting with upgrade prompts
        if (response.status === 429) {
          const requiresUpgrade = errorData.requiresUpgrade || false;
          const upgradeMessage = errorData.upgradeMessage || 'Upgrade to Pro for unlimited survey creation!';
          
          if (requiresUpgrade) {
            showAlert('Rate Limit Reached', `${upgradeMessage} Click here to upgrade.`, 'warning');
            // Navigate to pricing after a short delay
            setTimeout(() => {
              window.location.href = '/pricing';
            }, 2000);
          } else {
            showAlert('Rate Limit', errorMessage, 'warning');
          }
        } else {
          showAlert('Error', errorMessage, 'error');
        }
        
        setIsGenerating(false);
        return;
      }
      
      const data = await response.json();
      
      // Check for errors first
      if (data.error) {
        const errorMsg = data.error + (data.details ? `: ${data.details}` : '');
        showAlert('Error', errorMsg, 'error');
        setIsGenerating(false);
        return;
      }
      
      // Defensive: if no questions returned, show error
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        console.error('Invalid response from API:', data);
        const errorMsg = data.error || 'No questions were generated. Please try a different prompt or try again.';
        showAlert('Error', errorMsg, 'error');
        setIsGenerating(false);
        return;
      }
      
      console.log(`✅ Received ${data.questions.length} questions from API`);

      // Deduct credits AFTER successful generation (Pro users bypass this)
      // This ensures credits are only consumed if questions were actually generated
      const deductionResult = await deductCredits(user.uid, CREDIT_COSTS.REGENERATE_QUESTIONS, 'Regenerate Questions');
      if (!deductionResult.success) {
        // If deduction fails but we have questions, log warning but continue
        console.error('Failed to deduct credits after successful generation:', deductionResult.message);
        showAlert('Warning', 'Questions generated but credit deduction failed. Please contact support.', 'warning');
        // Continue anyway - questions were generated successfully
      }

      // Convert backend types to frontend types and mark as AI-generated
      const mappedQuestions = (data.questions || []).map((q: any, idx: number) => {
        // Parse question text - handle multiple possible field names (same as backend)
        let questionText = '';
        if (q.question) {
          questionText = q.question;
        } else if (q.text) {
          questionText = q.text;
        } else if (q.content) {
          questionText = q.content;
        } else if (q.prompt) {
          questionText = q.prompt;
        } else if (q.query) {
          questionText = q.query;
        } else if (typeof q === 'string') {
          questionText = q;
        } else if (q.title) {
          questionText = q.title;
        } else if (q.label) {
          questionText = q.label;
        } else {
          // Last resort: use the first string value we find (same as backend)
          const firstStringValue = Object.values(q).find((v: any) => typeof v === 'string' && v.length > 10);
          if (firstStringValue) {
            questionText = firstStringValue as string;
            console.log(`⚠️ Question ${idx + 1}: Using first string value as question: ${(firstStringValue as string).substring(0, 50)}`);
          }
        }
        
        // Log the raw question object for debugging
        if (idx === 0) {
          console.log('🔍 Raw question object from API (FormBuilder):', JSON.stringify(q, null, 2));
          console.log('🔍 Question object keys:', Object.keys(q));
        }
        
        // Parse question type - handle variations
        let type: QuestionTypeValues = QuestionType.TEXT;
        const qType = (q.type || '').toLowerCase();
        if (qType === 'multiple choice' || qType === 'multiple_choice') {
          type = QuestionType.MULTIPLE_CHOICE;
        } else if (qType === 'rating') {
          type = QuestionType.RATING;
        } else if (qType === 'text box' || qType === 'text' || qType === 'textbox') {
          type = QuestionType.TEXT;
        }
        
        // Parse options - ensure it's an array
        let options = undefined;
        if (type === QuestionType.MULTIPLE_CHOICE && q.options) {
          options = Array.isArray(q.options) ? q.options : [];
        }
        
        // Parse scale - convert to number (length of scale array)
        let scale = undefined;
        if (type === QuestionType.RATING && q.scale) {
          if (Array.isArray(q.scale)) {
            scale = q.scale.length;
          } else if (typeof q.scale === 'number') {
            scale = q.scale;
          } else if (typeof q.scale === 'string') {
            scale = parseInt(q.scale) || 5;
          }
        }
        
        const mappedQuestion = {
          id: `ai_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          type,
          question: questionText.trim() || `Question ${idx + 1}`,
          required: true,
          options,
          scale,
          _source: 'ai'
        };
        
        // Warn if question text is missing
        if (!questionText.trim()) {
          console.error(`❌ Question ${idx + 1} has no question text! Raw object:`, JSON.stringify(q, null, 2));
        } else {
          // Log success for first question
          if (idx === 0) {
            console.log(`✅ Successfully parsed question: "${questionText.substring(0, 50)}..."`);
          }
        }
        
        return mappedQuestion;
      });
      
      console.log(`✅ Mapped ${mappedQuestions.length} questions to frontend format`);
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
    <div className="min-h-screen w-full bg-white">
      {/* Sticky mobile header for agent title */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/10 flex items-center px-4 py-3 shadow-sm">
        <Input
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          className="w-full text-lg font-semibold text-black border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-black/40"
          placeholder="Untitled Agent"
        />
      </div>
      {/* Add padding top for sticky header on mobile */}
      <div className='pt-16 lg:pt-0'>
      <DashboardLayout>
        {/* Desktop action bar (Save, Publish, Preview) */}
        <div className="hidden lg:flex flex-col items-end gap-1 mb-8">
          {/* Save tip above the three main buttons */}
          <div className="w-full flex justify-end mb-2 pr-1">
            <span className="text-xs text-black/60 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-black/10">
              Tip: Save your agent regularly to avoid losing changes.
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
                          showAlert('Error', 'Please name your agent before saving.', 'error');
                          return;
                        }
                        if (formTitle.trim().toLowerCase() === 'untitled agent') {
                          showAlert('Error', 'Please give your agent a unique name before saving.', 'error');
                          return;
                        }
                        if (questions.length === 0) {
                          showAlert('Error', 'Please add at least one question before saving the agent.', 'error');
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
                          showAlert('Success', 'Agent saved successfully!', 'success');
                        } catch (err: any) {
                          showAlert('Error', 'Failed to save agent: ' + (err.message || err), 'error');
                        }
                      }}
                    >
                      <Save className="h-4 w-4 relative z-10" />
                      <span className="relative z-10">Save Agent</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="bg-black text-white text-xs rounded-lg shadow-lg px-3 py-2">
                    Tip: Save your agent regularly to avoid losing changes.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            <Button
            className="gap-2 bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] hover:from-[#6B35D0] hover:to-[#5B2FC0] text-white shadow-lg shadow-[#7B3FE4]/30 hover:shadow-xl hover:shadow-[#7B3FE4]/40 transition-all relative overflow-hidden group"
              onClick={async () => {
                if (!user?.uid) {
                  showAlert('Error', 'You must be logged in to publish an agent.', 'error');
                  return;
                }
                if (formTitle.trim() === '') {
                  showAlert('Error', 'Please name your agent before publishing.', 'error');
                  return;
                }
                if (formTitle.trim().toLowerCase() === 'untitled agent') {
                  showAlert('Error', 'Please give your agent a unique name before publishing.', 'error');
                  return;
                }
                if (questions.length === 0) {
                  showAlert('Error', 'Please add at least one question before publishing.', 'error');
                  return;
                }
                
                // Skip credit check for first agent publish (during onboarding)
                const isFirstAgent = await (async () => {
                  try {
                    const db = getFirestore();
                    const agentsQuery = query(
                      collection(db, 'agents'),
                      where('userId', '==', user.uid)
                    );
                    const agentsSnap = await getDocs(agentsQuery);
                    return agentsSnap.docs.length === 1;
                  } catch {
                    return false;
                  }
                })();
                
                // Only check credits for subsequent agents
                if (!isFirstAgent) {
                  const creditCheck = await canPerformAction(user.uid, CREDIT_COSTS.PUBLISH_AGENT);
                  if (!creditCheck.allowed) {
                    setShowUpgradeModal(true);
                    return;
                  }
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
                  
                  // Skip credit deduction for first agent publish (during onboarding)
                  const isFirstAgentCheck = await (async () => {
                    try {
                      const db = getFirestore();
                      const agentsQuery = query(
                        collection(db, 'agents'),
                        where('userId', '==', user.uid)
                      );
                      const agentsSnap = await getDocs(agentsQuery);
                      return agentsSnap.docs.length === 1;
                    } catch {
                      return false;
                    }
                  })();
                  
                  // Only deduct credits for subsequent agents
                  if (!isFirstAgentCheck) {
                    const deductionResult = await deductCredits(user.uid, CREDIT_COSTS.PUBLISH_AGENT, 'Publish Agent');
                    if (!deductionResult.success) {
                      console.error('Failed to deduct credits after publishing:', deductionResult.message);
                      showAlert('Warning', 'Agent published but credit deduction failed. Please contact support.', 'warning');
                    }
                  }
                  
                  // Open the publish modal with the link
                  setPublishModalOpen(true);
                  setPublishedLink(window.location.origin + publishedLink);
                } catch (err: any) {
                  showAlert('Error', 'Failed to publish agent: ' + (err.message || err), 'error');
                }
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <Share2 className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Publish Agent</span>
            </Button>
          </div>
        </div>
        {/* Floating action bar for mobile (move to sticky bottom, z-50) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden bg-white shadow-lg rounded-t-2xl px-2 py-2 justify-between items-center border-t border-black/10 transition-all">
          <Button className="flex-1 mx-1 bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] hover:from-[#6B35D0] hover:to-[#5B2FC0] text-white font-semibold shadow-lg shadow-[#7B3FE4]/30 transition-all active:scale-95 text-base py-3 relative overflow-hidden group" size="lg"
            onClick={async () => {
              if (formTitle.trim() === '') {
                showAlert('Error', 'Please name your agent before saving.', 'error');
                return;
              }
              if (formTitle.trim().toLowerCase() === 'untitled agent') {
                showAlert('Error', 'Please give your agent a unique name before saving.', 'error');
                return;
              }
              if (questions.length === 0) {
                showAlert('Error', 'Please add at least one question before saving the agent.', 'error');
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
                showAlert('Success', 'Agent saved successfully!', 'success');
              } catch (err: any) {
                showAlert('Error', 'Failed to save agent: ' + (err.message || err), 'error');
              }
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <Save className="h-5 w-5 mr-2 relative z-10" /> 
            <span className="relative z-10">Save Agent</span>
          </Button>
          <Button className="flex-1 mx-1 bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] hover:from-[#6B35D0] hover:to-[#5B2FC0] text-white font-semibold shadow-lg shadow-[#7B3FE4]/30 transition-all active:scale-95 text-base py-3 relative overflow-hidden group" size="lg"
            onClick={async () => {
              if (!user?.uid) {
                showAlert('Error', 'You must be logged in to publish an agent.', 'error');
                return;
              }
              if (formTitle.trim() === '') {
                showAlert('Error', 'Please name your agent before publishing.', 'error');
                return;
              }
              if (formTitle.trim().toLowerCase() === 'untitled agent') {
                showAlert('Error', 'Please give your agent a unique name before publishing.', 'error');
                return;
              }
              if (questions.length === 0) {
                showAlert('Error', 'Please add at least one question before publishing.', 'error');
                return;
              }
              
              // Skip credit check for first agent publish (during onboarding)
              const isFirstAgentCheck = await (async () => {
                try {
                  const db = getFirestore();
                  const agentsQuery = query(
                    collection(db, 'agents'),
                    where('userId', '==', user.uid)
                  );
                  const agentsSnap = await getDocs(agentsQuery);
                  return agentsSnap.docs.length === 1;
                } catch {
                  return false;
                }
              })();
              
              // Only check credits for subsequent agents
              if (!isFirstAgentCheck) {
                const creditCheck = await canPerformAction(user.uid, CREDIT_COSTS.PUBLISH_AGENT);
                if (!creditCheck.allowed) {
                  setShowUpgradeModal(true);
                  return;
                }
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
                
                // Skip credit deduction for first agent publish (during onboarding)
                const isFirstAgentCheckPublish2 = await (async () => {
                  try {
                    const db = getFirestore();
                    const agentsQuery = query(
                      collection(db, 'agents'),
                      where('userId', '==', user.uid)
                    );
                    const agentsSnap = await getDocs(agentsQuery);
                    return agentsSnap.docs.length === 1;
                  } catch {
                    return false;
                  }
                })();
                
                // Only deduct credits for subsequent agents
                if (!isFirstAgentCheckPublish2) {
                  const deductionResult = await deductCredits(user.uid, CREDIT_COSTS.PUBLISH_AGENT, 'Publish Agent');
                  if (!deductionResult.success) {
                    console.error('Failed to deduct credits after publishing:', deductionResult.message);
                    showAlert('Warning', 'Agent published but credit deduction failed. Please contact support.', 'warning');
                  }
                }
                
                setPublishModalOpen(true);
                setPublishedLink(window.location.origin + publishedLink);
              } catch (err: any) {
                showAlert('Error', 'Failed to publish form: ' + (err.message || err), 'error');
              }
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <Share2 className="h-5 w-5 mr-2 relative z-10" /> 
            <span className="relative z-10">Publish Agent</span>
          </Button>
        </div>
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto px-1 sm:px-2 py-4 lg:gap-8 lg:px-4 lg:py-8">
        {/* Form Editor Column */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <Card className="bg-white border border-black/10 shadow-sm rounded-lg transition-shadow hover:shadow-md p-2 sm:p-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-black">
                <Input 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)} 
                  className="text-lg sm:text-xl font-semibold text-black border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-black/40"
                  placeholder="Untitled Agent"
                />
              </CardTitle>
              <CardDescription className="text-black/60">
                Build your survey agent by editing questions or training it with AI
              </CardDescription>
              {/* Microcopy reminder */}
              <div className="mt-2 flex items-start gap-2 text-sm text-black/60 bg-purple-50 border border-purple-100 rounded-lg p-2">
                <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Your agent learns from every response. Smarter questions. Better data. Automatically.</span>
              </div>
            </CardHeader>
          </Card>
          {/* Form Questions */}
          <div className="space-y-3 sm:space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="bg-[#7B3FE4]/5 border border-[#7B3FE4]/20 rounded-lg p-6 max-w-md mx-auto">
                  <BrainCircuit className="h-8 w-8 text-[#7B3FE4] mx-auto mb-3 opacity-50" />
                  <p className="text-black/60 mb-1 font-medium">No questions yet</p>
                  <p className="text-sm text-black/50">Use the AI Agent Brain panel on the right to generate questions</p>
                </div>
              </div>
            ) : (
              <>
                {questions.map((question, idx) => {
                  // Debug log
                  if (idx === 0) {
                    console.log('🔍 Rendering questions:', {
                      total: questions.length,
                      first: {
                        id: question.id,
                        type: question.type,
                        question: question.question?.substring(0, 50),
                        hasOptions: !!(question as MultipleChoiceQuestion).options,
                        hasScale: (question as RatingQuestion).scale !== undefined
                      }
                    });
                  }
                  
                  return (
                    <Card key={question.id || `q_${idx}`} className="relative bg-white/95 backdrop-blur-sm border border-black/10 shadow-sm rounded-xl transition-all hover:shadow-lg hover:border-[#7B3FE4]/20 p-4 sm:p-5 overflow-hidden group">
                      {/* Subtle gradient highlight on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FE4]/0 via-[#7B3FE4]/0 to-[#7B3FE4]/0 group-hover:from-[#7B3FE4]/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-300 pointer-events-none"></div>
                      <CardHeader className="pb-3 relative z-10">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                          <div className="flex items-center gap-2">
                            <div className="text-xs bg-gradient-to-r from-[#7B3FE4]/10 to-[#7B3FE4]/5 px-2.5 py-1.5 rounded-lg font-medium text-[#7B3FE4] border border-[#7B3FE4]/20 shadow-sm">
                              {question.type === QuestionType.MULTIPLE_CHOICE && 'Multiple Choice'}
                              {question.type === QuestionType.TEXT && 'Text'}
                              {question.type === QuestionType.RATING && 'Rating'}
                              {question.type === QuestionType.EMAIL && 'Email'}
                              {question.type === QuestionType.PHONE && 'Phone'}
                              {question.type === QuestionType.DATE && 'Date'}
                              {!question.type && 'Unknown'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch 
                                id={`required-${question.id}`} 
                                checked={question.required ?? true} 
                                onCheckedChange={(checked) => handleQuestionChange(question.id, 'required', checked)}
                                className="scale-110"
                              />
                              <Label htmlFor={`required-${question.id}`} className="text-xs">Required</Label>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="hover:bg-black/5 text-black/60 hover:text-black rounded-lg transition-colors">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="hover:bg-red-50 text-black/60 hover:text-red-600 rounded-lg transition-colors"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">{renderQuestionEditor(question)}</CardContent>
                    </Card>
                  );
                })}
              </>
            )}
            {/* Add Question Button */}
              <div className="p-4 sm:p-6 border border-dashed border-black/20 rounded-lg flex flex-col items-center justify-center gap-3 bg-white">
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                    className="gap-1 rounded-lg border border-black/10 hover:bg-[#7B3FE4]/5 hover:border-[#7B3FE4]/30 text-black shadow-sm transition-colors"
                  onClick={() => handleAddQuestion(QuestionType.MULTIPLE_CHOICE)}
                >
                  <AlignJustify className="h-4 w-4" />
                  Multiple Choice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                    className="gap-1 rounded-lg border border-black/10 hover:bg-[#7B3FE4]/5 hover:border-[#7B3FE4]/30 text-black shadow-sm transition-colors"
                  onClick={() => handleAddQuestion(QuestionType.TEXT)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                    className="gap-1 rounded-lg border border-black/10 hover:bg-[#7B3FE4]/5 hover:border-[#7B3FE4]/30 text-black shadow-sm transition-colors"
                  onClick={() => handleAddQuestion(QuestionType.RATING)}
                >
                  <BookOpen className="h-4 w-4" />
                  Rating
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                    className="gap-1 rounded-lg border border-black/10 hover:bg-[#7B3FE4]/5 hover:border-[#7B3FE4]/30 text-black shadow-sm transition-colors"
                  onClick={() => handleAddQuestion(QuestionType.EMAIL)}
                >
                  <Inbox className="h-4 w-4" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                    className="gap-1 rounded-lg border border-black/10 hover:bg-[#7B3FE4]/5 hover:border-[#7B3FE4]/30 text-black shadow-sm transition-colors"
                  onClick={() => handleAddQuestion(QuestionType.DATE)}
                >
                  <DollarSign className="h-4 w-4" />
                  Date
                </Button>
              </div>
              <p className="text-xs text-black/60 mt-2 flex items-center justify-center gap-1">
                <Plus className="h-3 w-3 text-[#7B3FE4]" />
                Choose a question type to add to your agent
              </p>
            </div>
          </div>
        </div>
          {/* Divider for desktop */}
          <div className="hidden lg:flex flex-col items-center justify-center px-2">
            <div className="h-full w-1 bg-black/10 rounded-full" style={{ minHeight: '400px' }} />
          </div>
          {/* AI Sidebar - sticky on desktop, always visible below on mobile */}
          <div className="lg:col-span-4 w-full z-30 mt-4 lg:mt-0">
            {/* Collapsible toggle for mobile (hidden, always show sidebar on mobile) */}
            {/* <div className="lg:hidden flex justify-end mb-2">
              <Button className="rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-md" size="sm" onClick={() => setAiSidebarOpen(!aiSidebarOpen)}>
                <BrainCircuit className="h-5 w-5" /> {aiSidebarOpen ? 'Hide AI Tools' : 'Show AI Tools'}
              </Button>
            </div> */}
            <Card className="relative bg-white border border-[#7B3FE4]/20 shadow-lg rounded-xl transition-all hover:shadow-xl hover:border-[#7B3FE4]/30 p-4 sm:p-6 overflow-hidden">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FE4]/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7B3FE4]/10 rounded-full blur-3xl -z-0"></div>
            <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-black mb-2">
                  <div className="relative">
                    <BrainCircuit className="h-5 w-5 text-[#7B3FE4]" />
                    <div className="absolute inset-0 bg-[#7B3FE4]/20 rounded-full blur-md animate-pulse"></div>
                  </div>
                  <span className="font-semibold">AI Agent Brain</span>
              </CardTitle>
              <CardDescription className="text-black/60">
                Train your survey agent by describing its purpose and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 relative z-10">
              <div>
                <Label htmlFor="prompt" className="text-black font-medium mb-2 block">Describe your agent's purpose</Label>
                <Textarea 
                  id="prompt" 
                  placeholder="e.g., Understand customer satisfaction with our new product launch and identify areas for improvement."
                    className="min-h-24 mt-1 bg-white/80 backdrop-blur-sm border border-black/10 focus:border-[#7B3FE4] focus:ring-2 focus:ring-[#7B3FE4]/20 rounded-lg shadow-sm transition-all text-base text-black placeholder:text-black/40"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-xs text-black/50 mt-1.5 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Be specific about what insights you want to gather
                </p>
              </div>
              <div>
                <Label htmlFor="ai-action" className="mb-2 block text-black font-medium">Agent Actions</Label>
                <div className="flex gap-2 flex-wrap">
                  <div 
                      className={`px-4 py-2.5 rounded-lg text-sm ${aiAction === AIActionType.ADD ? 'bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] text-white shadow-md shadow-[#7B3FE4]/30' : 'bg-white border border-black/10 hover:bg-[#7B3FE4]/5 hover:border-[#7B3FE4]/30 text-black'} cursor-pointer transition-all relative group flex-1 text-center font-medium`}
                    onClick={() => setAiAction(AIActionType.ADD)}
                    data-tooltip="Add new questions while keeping existing ones"
                  >
                    <span>Add Questions</span>
                    <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-xs rounded-lg whitespace-nowrap z-20 shadow-lg">
                      Add new questions while keeping existing ones
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"></div>
                    </div>
                  </div>
                  <div 
                    className={`px-4 py-2.5 rounded-lg text-sm ${
                      questions.length === 0 
                        ? 'bg-white border border-black/10 opacity-50 cursor-not-allowed text-black/40' 
                        : aiAction === AIActionType.REBUILD 
                            ? 'bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] text-white shadow-md shadow-[#7B3FE4]/30' 
                          : 'bg-white border border-black/10 hover:bg-[#7B3FE4]/5 hover:border-[#7B3FE4]/30 text-black cursor-pointer'
                      } transition-all relative group flex-1 text-center font-medium`}
                    onClick={() => questions.length > 0 && setAiAction(AIActionType.REBUILD)}
                    data-tooltip={questions.length === 0 ? "Need questions to rebuild" : "Replace all questions with new ones"}
                  >
                    <span>Rebuild Agent</span>
                    <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-xs rounded-lg whitespace-nowrap z-20 shadow-lg">
                      {questions.length === 0 ? "You need existing questions to use this option" : "Replace all questions with new ones"}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="tone" className="text-black">Select a tone</Label>
                <Select 
                  value={tone} 
                  onValueChange={(value: string) => setTone(value)}
                >
                    <SelectTrigger id="tone" className="mt-1 w-full bg-white border border-black/10 focus:border-[#7B3FE4] focus:ring-2 focus:ring-[#7B3FE4]/20 rounded-lg shadow-sm text-base text-black">
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
                          className={`px-3 py-2 border rounded-lg text-center cursor-pointer transition-colors font-medium shadow-sm text-base ${
                          questionCount === num 
                              ? 'bg-[#7B3FE4] text-white border-[#7B3FE4]' 
                              : 'bg-white hover:bg-[#7B3FE4]/5 border-black/10 text-black'
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
                  className="w-full gap-2 bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] hover:from-[#6B35D0] hover:to-[#5B2FC0] text-white font-semibold shadow-lg shadow-[#7B3FE4]/30 hover:shadow-xl hover:shadow-[#7B3FE4]/40 transition-all text-base py-3.5 relative overflow-hidden group"
                onClick={handleGenerateQuestions}
                disabled={isGenerating || !prompt}
                  size="lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin relative z-10" />
                    <span className="relative z-10">Generating Questions...</span>
                  </>
                ) : (
                  <>
                      <Lightbulb className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">
                      {aiAction === AIActionType.ADD && `Generate ${questionCount} Questions`}
                      {aiAction === AIActionType.REBUILD && `Rebuild Agent with ${questionCount} Questions`}
                    </span>
                  </>
                )}
              </Button>
              
              {/* AI Hints */}
              {aiAction === AIActionType.REBUILD && questions.length > 0 && (
                <div className="mt-3 p-3 bg-[#7B3FE4]/5 border border-[#7B3FE4]/20 rounded-lg">
                  <p className="text-xs text-black/70 leading-relaxed flex items-start gap-2">
                    <BrainCircuit className="h-3.5 w-3.5 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span><strong className="text-[#7B3FE4]">Smart Tip:</strong> Your agent automatically adapts after ~20 responses. It learns from user feedback and rebuilds questions to get even better data.</span>
                  </p>
                </div>
              )}
              
              {!isGenerating && prompt && (
                <div className="mt-2 p-2.5 bg-black/5 border border-black/10 rounded-lg">
                  <p className="text-xs text-black/60 leading-relaxed flex items-start gap-2">
                    <Inbox className="h-3 w-3 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                    <span>SmartFormAI analyzes your prompt and generates questions optimized for maximum response quality.</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
            <Card className="bg-white border border-black/10 shadow-sm rounded-lg p-2 sm:p-4 mt-4">
            <CardHeader>
              <CardTitle className="text-black">Agent Settings</CardTitle>
              <CardDescription className="text-black/60">
                Configure your agent's appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-progress" className="font-medium text-black">Show Progress</Label>
                  <p className="text-xs text-black/60">Display progress indicator</p>
                </div>
                  <Switch id="show-progress" checked={showProgress} onCheckedChange={setShowProgress} className="scale-110" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="custom-thank-you" className="font-medium text-black">Custom Thank You</Label>
                  <p className="text-xs text-black/60">Customize the thank you message</p>
                </div>
                  <Switch id="custom-thank-you" checked={customThankYou} onCheckedChange={setCustomThankYou} className="scale-110" />
              </div>
              {customThankYou && (
                <div className="mt-2">
                  <Label htmlFor="thank-you-message" className="font-medium text-black">Thank You Message</Label>
                  <Textarea
                    id="thank-you-message"
                      className="mt-1 bg-white border border-black/10 focus:border-[#7B3FE4] focus:ring-2 focus:ring-[#7B3FE4]/20 rounded-lg shadow-sm text-base text-black"
                    value={thankYouMessage}
                    onChange={e => setThankYouMessage(e.target.value)}
                    maxLength={500}
                    placeholder="Enter your custom thank you message..."
                  />
                  <div className="text-xs text-black/40 text-right">{thankYouMessage.length}/500</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Publish Modal */}
      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent className="p-0 bg-transparent border-0 shadow-none max-w-full w-full sm:max-w-md md:max-w-lg">
          <div className="relative w-full rounded-2xl shadow-lg bg-white border border-black/10 overflow-y-auto max-h-[90vh] p-0">
            {/* Jazzed up glassy modal with confetti shimmer */}
            <div className="relative rounded-t-2xl bg-[#7B3FE4] px-0 py-0 flex flex-col items-center justify-center text-center shadow-md overflow-hidden">
              {/* Big checkmark icon */}
              <div className="relative z-10 flex flex-col items-center justify-center py-8 w-full">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-lg border border-white/30">
                    <Check className="h-12 w-12 text-white drop-shadow-xl" />
              </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow mb-1">Your Agent is Live!</h2>
                <p className="text-base sm:text-lg text-white/90 font-medium mb-2">Share your agent and start collecting responses.</p>
              </div>
          </div>
          {/* Modal content */}
            <div className="px-2 py-4 sm:px-6 sm:py-6 bg-white rounded-b-2xl">
            <Tabs defaultValue="link" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white border-b border-black/10 rounded-t-lg overflow-hidden mb-4 text-xs sm:text-base">
                <TabsTrigger value="link" className="data-[state=active]:bg-[#7B3FE4] data-[state=active]:text-white flex items-center gap-2 text-black/60 data-[state=active]:text-white font-medium">
                  <Share2 className="h-4 w-4" /> Link
                </TabsTrigger>
                <TabsTrigger value="basic" className="data-[state=active]:bg-[#7B3FE4] data-[state=active]:text-white flex items-center gap-2 text-black/60 data-[state=active]:text-white font-medium">
                  <AlignJustify className="h-4 w-4" /> Basic Embed
                </TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-[#7B3FE4] data-[state=active]:text-white flex items-center gap-2 text-black/60 data-[state=active]:text-white font-medium">
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
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
      />
      
      {/* Post-Build Modal */}
      <PostBuildModal
        open={showPostBuildModal}
        onClose={() => setShowPostBuildModal(false)}
      />
    </DashboardLayout>
    </div>
    </div>
  );
}

export default FormBuilder;