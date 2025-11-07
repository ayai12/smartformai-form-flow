import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../components/AlertProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BrainCircuit, Loader2, Sparkles, Lock, CreditCard, Lightbulb, Wand2, CheckCircle2, ArrowRight, HelpCircle, Zap, Briefcase, Smile, PartyPopper, GraduationCap } from 'lucide-react';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { canPerformAction, deductCredits, CREDIT_COSTS } from '@/firebase/credits';
import { toast } from 'sonner';
import UpgradeModal from '@/components/UpgradeModal';
import SignupModal from '@/components/SignupModal';
import MinimalNav from '@/components/MinimalNav';

const CreateAgent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [agentName, setAgentName] = useState('');
  const [goal, setGoal] = useState('');
  const [personality, setPersonality] = useState('Professional');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isBuildingAgent, setIsBuildingAgent] = useState(false);
  const [isOnboardingFlow, setIsOnboardingFlow] = useState(false);

  // Load prompt from URL params or localStorage (onboarding flow)
  useEffect(() => {
    const promptParam = searchParams.get('prompt');
    const onboardingActive = localStorage.getItem('onboarding_active') === 'true';
    const savedPrompt = localStorage.getItem('onboarding_prompt');
    
    if (onboardingActive) {
      setIsOnboardingFlow(true);
    }
    
    if (promptParam) {
      setGoal(decodeURIComponent(promptParam));
    } else if (savedPrompt) {
      setGoal(savedPrompt);
    }
  }, [searchParams]);

  // Check user's subscription plan and if they're a new user
  useEffect(() => {
    const checkPlan = async () => {
      if (!user?.uid) {
        setLoadingPlan(false);
        return;
      }

      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setUserPlan(userData?.plan || 'free');
        setUserCredits(userData?.credits ?? 0);
        
        // Check if user is new (has no agents)
        const agentsQuery = query(
          collection(db, 'agents'),
          where('userId', '==', user.uid)
        );
        const agentsSnap = await getDocs(agentsQuery);
        setIsNewUser(agentsSnap.docs.length === 0);
      } catch (error) {
        console.error('Error checking user plan:', error);
        setUserPlan('free');
        setUserCredits(0);
        setIsNewUser(true);
      } finally {
        setLoadingPlan(false);
      }
    };

    checkPlan();
  }, [user]);

  // Restore form data from localStorage after sign-in
  useEffect(() => {
    if (user?.uid && !isCreating) {
      const savedData = localStorage.getItem('pending_agent_data');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          setAgentName(data.agentName || '');
          setGoal(data.goal || '');
          setPersonality(data.personality || 'Professional');
          setAdditionalPrompt(data.additionalPrompt || '');
          
          localStorage.removeItem('pending_agent_data');
          
          if (data.agentName && data.goal) {
            setIsBuildingAgent(true);
            setTimeout(() => {
              handleCreateAgent();
            }, 500);
          }
        } catch (error) {
          console.error('Error restoring saved data:', error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleCreateAgent = async () => {
    if (!user?.uid) {
      localStorage.setItem('pending_agent_data', JSON.stringify({
        agentName,
        goal,
        personality,
        additionalPrompt
      }));
      setShowSignupModal(true);
      return;
    }

    if (!agentName.trim()) {
      showAlert('Error', 'Please enter an agent name.', 'error');
      return;
    }
    if (!goal.trim()) {
      showAlert('Error', 'Please describe your agent\'s goal or topic.', 'error');
      return;
    }

    let shouldSkipCreditCheck = isOnboardingFlow || isNewUser;
    
    if (!shouldSkipCreditCheck) {
      try {
        const db = getFirestore();
        const agentsQuery = query(
          collection(db, 'agents'),
          where('userId', '==', user.uid)
        );
        const agentsSnap = await getDocs(agentsQuery);
        const agentCount = agentsSnap.docs.length;
        shouldSkipCreditCheck = agentCount === 0;
      } catch (error) {
        console.error('Error checking agent count for credit check:', error);
        shouldSkipCreditCheck = true;
      }
    }
    
    if (!shouldSkipCreditCheck) {
    const actionCheck = await canPerformAction(user.uid, CREDIT_COSTS.TRAIN_AGENT);
    if (!actionCheck.allowed) {
      setShowUpgradeModal(true);
      return;
      }
    }

    setShowAnimation(true);
    setIsCreating(true);

    try {
      const systemPrompt = `You are ${agentName}, a ${personality} AI survey agent. Goal: ${goal}.`;
      const fullPrompt = additionalPrompt.trim() 
        ? `${systemPrompt}\n\nAdditional instructions: ${additionalPrompt}`
        : systemPrompt;
      
      const apiUrl = import.meta.env.PROD 
        ? 'https://us-central1-smartformai-51e03.cloudfunctions.net/api/chat'
        : 'http://localhost:3000/chat';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: fullPrompt,
          tone: personality.toLowerCase(),
          questionCount: 5,
          action: 'add',
          userId: user.uid
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Failed to generate agent questions');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
      }
      
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        console.error('Invalid response from API:', data);
        throw new Error(data.error || 'No questions were generated. Please try again.');
      }
      
      console.log(`✅ Received ${data.questions.length} questions from API`);

      const deductionResult = await deductCredits(user.uid, CREDIT_COSTS.TRAIN_AGENT, 'Train Agent');
      if (!deductionResult.success) {
        console.error('Failed to deduct credits after successful generation:', deductionResult.message);
        showAlert('Warning', 'Agent created but credit deduction failed. Please contact support.', 'warning');
      }

      const mappedQuestions = data.questions.map((q: any, idx: number) => {
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
          const firstStringValue = Object.values(q).find((v: any) => typeof v === 'string' && v.length > 10);
          if (firstStringValue) {
            questionText = firstStringValue as string;
            console.log(`⚠️ Question ${idx + 1}: Using first string value as question: ${(firstStringValue as string).substring(0, 50)}`);
          }
        }
        
        if (idx === 0) {
          console.log('🔍 Raw question object from API (CreateAgent):', JSON.stringify(q, null, 2));
          console.log('🔍 Question object keys:', Object.keys(q));
        }
        
        let type = 'text';
        const qType = (q.type || '').toLowerCase();
        if (qType === 'multiple choice' || qType === 'multiple_choice') {
          type = 'multiple_choice';
        } else if (qType === 'rating') {
          type = 'rating';
        } else if (qType === 'text box' || qType === 'text' || qType === 'textbox') {
          type = 'text';
        }
        
        let options = undefined;
        if (type === 'multiple_choice' && q.options) {
          options = Array.isArray(q.options) ? q.options : [];
        }
        
        let scale = undefined;
        if (type === 'rating' && q.scale) {
          if (Array.isArray(q.scale)) {
            scale = q.scale.length;
          } else if (typeof q.scale === 'number') {
            scale = q.scale;
          } else if (typeof q.scale === 'string') {
            scale = parseInt(q.scale) || 5;
          }
        }
        
        const uniqueId = `q_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`;
        
        const mappedQuestion = {
          id: uniqueId,
          type,
          question: questionText.trim() || `Question ${idx + 1}`,
          required: true,
          options,
          scale,
        };
        
        if (!questionText.trim()) {
          console.error(`❌ Question ${idx + 1} has no question text! Raw object:`, JSON.stringify(q, null, 2));
        } else {
          if (idx === 0) {
            console.log(`✅ Successfully parsed question: "${questionText.substring(0, 50)}..."`);
          }
        }
        
        return mappedQuestion;
      });
      
      console.log(`✅ Mapped ${mappedQuestions.length} questions to frontend format`);

      const db = getFirestore();
      const surveyId = window.crypto?.randomUUID?.() || Math.random().toString(36).substr(2, 9);
      
      const { saveFormToFirestore } = await import('../firebase/formSave');
      await saveFormToFirestore({
        formId: surveyId,
        title: agentName,
        questions: mappedQuestions,
        tone: personality.toLowerCase(),
        prompt: fullPrompt,
        publishedLink: `/survey/${surveyId}`,
        published: 'draft',
      });

      const agentData: any = {
        userId: user.uid,
        name: agentName,
        goal: goal || '',
        personality: personality || 'Professional',
        createdAt: serverTimestamp(),
        generatedPrompt: fullPrompt,
        surveyId: surveyId,
        questions: mappedQuestions.map(q => {
          const cleanQuestion: any = {
            id: q.id,
            type: q.type,
            question: q.question,
            required: q.required,
          };
          if (q.options !== undefined && q.options !== null) {
            cleanQuestion.options = q.options;
          }
          if (q.scale !== undefined && q.scale !== null) {
            cleanQuestion.scale = q.scale;
          }
          return cleanQuestion;
        }),
      };

      Object.keys(agentData).forEach(key => {
        if (agentData[key] === undefined) {
          delete agentData[key];
        }
      });

      const agentDocRef = await addDoc(collection(db, 'agents'), agentData);
      
      setIsBuildingAgent(false);
      
      if (isOnboardingFlow || isNewUser) {
        toast.success('🎉 Your agent has been built successfully! The necessary credits were automatically used from your free balance.');
      } else {
      showAlert('Success', `Agent "${agentName}" created successfully!`, 'success');
      }
      
      localStorage.setItem('agent_built_successfully', 'true');
      
      setTimeout(() => {
        setShowAnimation(false);
        setIsBuildingAgent(false);
        localStorage.removeItem('onboarding_active');
      navigate(`/builder/${surveyId}?agentId=${agentDocRef.id}`);
      }, 2500);
      
    } catch (error: any) {
      console.error('Error creating agent:', error);
      const errorMessage = error.message || 'Failed to create agent. Please try again.';
      showAlert('Error', errorMessage, 'error');
      setShowAnimation(false);
      setIsBuildingAgent(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignupSuccess = () => {
    setShowSignupModal(false);
  };

  const examples = [
    { name: "Customer Feedback Agent", goal: "Find out what customers think about our new mobile app features" },
    { name: "Employee Satisfaction", goal: "Understand how happy our team is with the new work-from-home policy" },
    { name: "Product Research", goal: "Discover what features users want most in our next software update" },
  ];

  const content = (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#7B3FE4]/[0.02] to-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-[#7B3FE4]/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0] p-6 rounded-3xl shadow-2xl shadow-[#7B3FE4]/30 transform hover:scale-105 transition-transform duration-300">
                <BrainCircuit className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-black mb-4 bg-gradient-to-r from-black to-black/80 bg-clip-text">
              Create Your Survey Agent
            </h1>
            <p className="text-xl text-black/70 max-w-2xl mx-auto leading-relaxed mb-2">
              Tell us what you want to learn, and we'll create intelligent survey questions in seconds
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-black/50">
              <Zap className="h-4 w-4 text-[#7B3FE4]" />
              <span>Takes less than 2 minutes</span>
              <span>•</span>
              <span>No technical skills needed</span>
            </div>
          </div>

          {/* Progress Steps - Visual */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-[#7B3FE4]/30">
                  1
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="text-left">
                <p className="font-semibold text-black text-sm">Tell us your goal</p>
                <p className="text-xs text-black/50">What do you want to learn?</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-black/20" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-black/5 text-black/40 flex items-center justify-center font-bold text-lg border-2 border-black/10">
                2
              </div>
              <div className="text-left">
                <p className="font-medium text-black/60 text-sm">AI creates questions</p>
                <p className="text-xs text-black/40">Smart & relevant</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-black/20" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-black/5 text-black/40 flex items-center justify-center font-bold text-lg border-2 border-black/10">
                3
              </div>
              <div className="text-left">
                <p className="font-medium text-black/60 text-sm">Review & share</p>
                <p className="text-xs text-black/40">Start collecting data</p>
              </div>
            </div>
          </div>

          {/* Credit Info Banner */}
            {!loadingPlan && userPlan === 'free' && !isNewUser && !isOnboardingFlow && user?.uid && (
            <div className="mb-6">
              <Card className="bg-white border border-black/10 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0] p-3 rounded-xl shadow-lg">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-black mb-1">
                        You have <span className="text-[#7B3FE4] font-bold text-lg">{userCredits} credits</span>
                      </p>
                      {userCredits >= 3 ? (
                        <p className="text-sm text-black/70">✅ Enough to create your survey agent! (3 credits needed)</p>
                      ) : (
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-sm text-black/70">You need 3 credits to create a survey agent.</p>
                          <Button
                            onClick={() => navigate('/pricing')}
                            size="sm"
                            className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white h-8 text-xs"
                          >
                            Get Credits
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Form Card */}
          <Card className="bg-white border border-black/10 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 bg-gradient-to-br from-[#7B3FE4]/5 via-white to-white border-b border-black/10">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0] p-3 rounded-xl shadow-lg">
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-black mb-1">
                    Agent Details
                  </CardTitle>
                  <CardDescription className="text-black/60 text-base">
                    Fill in the basics - we'll handle the rest
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8">
              {/* Agent Name */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="agentName" className="text-base font-semibold text-black">
                    Survey Agent Name
                  </Label>
                  <span className="text-red-500 text-lg">*</span>
                  <div className="group relative">
                    <HelpCircle className="h-4 w-4 text-black/40 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-black text-white text-xs rounded-lg shadow-xl z-10">
                      Give your survey agent a memorable name. This helps you identify it later in your dashboard.
                    </div>
                  </div>
                </div>
                <Input
                  id="agentName"
                  placeholder="e.g., Customer Feedback Survey Agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="text-base border-2 border-black/10 focus:border-[#7B3FE4] focus:ring-4 focus:ring-[#7B3FE4]/20 h-14 transition-all"
                  disabled={isCreating}
                />
                <div className="flex items-start gap-2 text-sm text-black/60">
                  <Lightbulb className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <p>Pick something descriptive like "Product Feedback" or "Employee Survey"</p>
                </div>
              </div>

              {/* Goal/Topic */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                <Label htmlFor="goal" className="text-base font-semibold text-black">
                  What do you want to learn?
                </Label>
                  <span className="text-red-500 text-lg">*</span>
                  <div className="group relative">
                    <HelpCircle className="h-4 w-4 text-black/40 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-black text-white text-xs rounded-lg shadow-xl z-10">
                      Be specific! The more details you provide, the better questions we'll generate. Include context about your audience, topic, and what insights you're seeking.
                    </div>
                  </div>
                </div>
                <Textarea
                  id="goal"
                  placeholder="e.g., I want to understand what features customers like most about our mobile app, and what improvements they'd like to see. Focus on users aged 25-45 who use the app at least weekly."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="text-base border-2 border-black/10 focus:border-[#7B3FE4] focus:ring-4 focus:ring-[#7B3FE4]/20 min-h-32 resize-none transition-all"
                  disabled={isCreating}
                />
                <div className="flex items-start gap-2 text-sm text-black/60">
                  <Lightbulb className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <p>Include details like: your target audience, specific topics, and what you hope to discover</p>
                </div>
                
                {/* Example Goals */}
                <div className="bg-gradient-to-br from-[#7B3FE4]/5 to-transparent border border-[#7B3FE4]/20 rounded-xl p-4 mt-4">
                  <p className="text-xs font-semibold text-black/70 mb-3 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-[#7B3FE4]" />
                    Example goals:
                  </p>
                  <div className="space-y-2">
                    {examples.map((ex, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setGoal(ex.goal);
                          if (!agentName) setAgentName(ex.name);
                        }}
                        className="w-full text-left p-3 rounded-lg bg-white/60 hover:bg-white border border-black/10 hover:border-[#7B3FE4]/30 transition-all group"
                      >
                        <p className="font-medium text-black text-sm mb-1">{ex.name}</p>
                        <p className="text-xs text-black/60 group-hover:text-black/80">{ex.goal}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personality */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                <Label htmlFor="personality" className="text-base font-semibold text-black">
                    Communication Style
                </Label>
                  <div className="group relative">
                    <HelpCircle className="h-4 w-4 text-black/40 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-black text-white text-xs rounded-lg shadow-xl z-10">
                      This affects how questions are worded. You can always change it later when editing questions.
                    </div>
                  </div>
                </div>
                
                {/* Visual Style Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPersonality('Professional')}
                    disabled={isCreating}
                    className={`relative p-5 rounded-xl border-2 transition-all text-left group ${
                      personality === 'Professional'
                        ? 'border-[#7B3FE4] bg-gradient-to-br from-[#7B3FE4]/10 to-[#7B3FE4]/5 shadow-lg shadow-[#7B3FE4]/20'
                        : 'border-black/10 hover:border-[#7B3FE4]/30 hover:bg-[#7B3FE4]/5 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        personality === 'Professional'
                          ? 'bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0]'
                          : 'bg-black/5 group-hover:bg-[#7B3FE4]/10'
                      } transition-colors`}>
                        <Briefcase className={`h-6 w-6 ${
                          personality === 'Professional' ? 'text-white' : 'text-black/60 group-hover:text-[#7B3FE4]'
                        } transition-colors`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-black">Professional</span>
                          {personality === 'Professional' && (
                            <CheckCircle2 className="h-4 w-4 text-[#7B3FE4]" />
                          )}
                        </div>
                        <p className="text-xs text-black/60 leading-relaxed">
                          Business surveys, formal feedback, corporate research
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPersonality('Friendly')}
                  disabled={isCreating}
                    className={`relative p-5 rounded-xl border-2 transition-all text-left group ${
                      personality === 'Friendly'
                        ? 'border-[#7B3FE4] bg-gradient-to-br from-[#7B3FE4]/10 to-[#7B3FE4]/5 shadow-lg shadow-[#7B3FE4]/20'
                        : 'border-black/10 hover:border-[#7B3FE4]/30 hover:bg-[#7B3FE4]/5 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        personality === 'Friendly'
                          ? 'bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0]'
                          : 'bg-black/5 group-hover:bg-[#7B3FE4]/10'
                      } transition-colors`}>
                        <Smile className={`h-6 w-6 ${
                          personality === 'Friendly' ? 'text-white' : 'text-black/60 group-hover:text-[#7B3FE4]'
                        } transition-colors`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-black">Friendly</span>
                          {personality === 'Friendly' && (
                            <CheckCircle2 className="h-4 w-4 text-[#7B3FE4]" />
                          )}
                        </div>
                        <p className="text-xs text-black/60 leading-relaxed">
                          Customer satisfaction, casual polls, community feedback
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPersonality('Playful')}
                    disabled={isCreating}
                    className={`relative p-5 rounded-xl border-2 transition-all text-left group ${
                      personality === 'Playful'
                        ? 'border-[#7B3FE4] bg-gradient-to-br from-[#7B3FE4]/10 to-[#7B3FE4]/5 shadow-lg shadow-[#7B3FE4]/20'
                        : 'border-black/10 hover:border-[#7B3FE4]/30 hover:bg-[#7B3FE4]/5 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        personality === 'Playful'
                          ? 'bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0]'
                          : 'bg-black/5 group-hover:bg-[#7B3FE4]/10'
                      } transition-colors`}>
                        <PartyPopper className={`h-6 w-6 ${
                          personality === 'Playful' ? 'text-white' : 'text-black/60 group-hover:text-[#7B3FE4]'
                        } transition-colors`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-black">Playful</span>
                          {personality === 'Playful' && (
                            <CheckCircle2 className="h-4 w-4 text-[#7B3FE4]" />
                          )}
                        </div>
                        <p className="text-xs text-black/60 leading-relaxed">
                          Fun events, creative projects, engaging audiences
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPersonality('Researcher')}
                    disabled={isCreating}
                    className={`relative p-5 rounded-xl border-2 transition-all text-left group ${
                      personality === 'Researcher'
                        ? 'border-[#7B3FE4] bg-gradient-to-br from-[#7B3FE4]/10 to-[#7B3FE4]/5 shadow-lg shadow-[#7B3FE4]/20'
                        : 'border-black/10 hover:border-[#7B3FE4]/30 hover:bg-[#7B3FE4]/5 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        personality === 'Researcher'
                          ? 'bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0]'
                          : 'bg-black/5 group-hover:bg-[#7B3FE4]/10'
                      } transition-colors`}>
                        <GraduationCap className={`h-6 w-6 ${
                          personality === 'Researcher' ? 'text-white' : 'text-black/60 group-hover:text-[#7B3FE4]'
                        } transition-colors`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-black">Researcher</span>
                          {personality === 'Researcher' && (
                            <CheckCircle2 className="h-4 w-4 text-[#7B3FE4]" />
                          )}
                        </div>
                        <p className="text-xs text-black/60 leading-relaxed">
                          Academic studies, detailed analysis, scientific surveys
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
                
                <div className="flex items-start gap-2 text-sm text-black/60 pt-2">
                  <Lightbulb className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <p>This sets the tone for your questions. Don't worry - you can edit everything later!</p>
                </div>
              </div>

              {/* Additional Prompt */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                <Label htmlFor="additionalPrompt" className="text-base font-semibold text-black">
                    Extra Instructions
                </Label>
                  <span className="text-xs text-black/40 font-normal">(Optional)</span>
                </div>
                <Textarea
                  id="additionalPrompt"
                  placeholder="e.g., Include questions about pricing, focus on mobile users, ask about their favorite features, and make sure to include a rating question..."
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                  className="text-base border-2 border-black/10 focus:border-[#7B3FE4] focus:ring-4 focus:ring-[#7B3FE4]/20 min-h-24 resize-none transition-all"
                  disabled={isCreating}
                />
                <div className="flex items-start gap-2 text-sm text-black/60">
                  <Lightbulb className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <p>Add any specific requirements, question types, or topics you want included. This is completely optional!</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-black/10 my-8"></div>

              {/* Create Button */}
              <div className="space-y-4">
                <Button
                  onClick={handleCreateAgent}
                  disabled={isCreating || !agentName.trim() || !goal.trim()}
                  className="w-full bg-gradient-to-r from-[#7B3FE4] via-[#6B35D0] to-[#7B3FE4] hover:from-[#6B35D0] hover:via-[#5B2FC0] hover:to-[#6B35D0] text-white font-bold py-7 text-lg shadow-2xl shadow-[#7B3FE4]/40 hover:shadow-[#7B3FE4]/50 transition-all duration-300 relative overflow-hidden group"
                  size="lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-3 animate-spin relative z-10" />
                      <span className="relative z-10">Creating Your Survey Agent...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6 mr-3 relative z-10" />
                      <span className="relative z-10">Create My Survey Agent</span>
                      <ArrowRight className="h-5 w-5 ml-3 relative z-10 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                {(!agentName.trim() || !goal.trim()) && (
                  <p className="text-sm text-black/50 text-center flex items-center justify-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Fill in the survey agent name and goal above to continue
                  </p>
                )}
              </div>

              {/* What Happens Next */}
              <div className="bg-gradient-to-br from-[#7B3FE4]/5 via-purple-50/50 to-transparent border-2 border-[#7B3FE4]/20 rounded-2xl p-6 mt-8">
                <h4 className="font-bold text-black mb-4 text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#7B3FE4]" />
                  What happens next?
                </h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0] text-white flex items-center justify-center font-bold text-sm shadow-lg flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-black mb-1">AI generates smart questions</p>
                      <p className="text-sm text-black/70">Our AI analyzes your goal and creates relevant, well-structured questions automatically</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0] text-white flex items-center justify-center font-bold text-sm shadow-lg flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-black mb-1">You review & customize</p>
                      <p className="text-sm text-black/70">Edit questions, add more, remove ones you don't like, or change anything you want</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0] text-white flex items-center justify-center font-bold text-sm shadow-lg flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-black mb-1">Share & collect responses</p>
                      <p className="text-sm text-black/70">Get a shareable link and start collecting responses in real-time. View analytics as data comes in</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );

  return (
    <>
      {isOnboardingFlow ? (
        <div className="min-h-screen bg-white">
          <MinimalNav />
          {content}
        </div>
      ) : (
        <DashboardLayout>
          {content}
        </DashboardLayout>
      )}
      
      {/* Building Agent Loading Screen */}
      {(showAnimation || isBuildingAgent) && (
        <div className="fixed inset-0 bg-gradient-to-br from-white via-[#7B3FE4]/5 to-white z-50 flex items-center justify-center">
          <div className="text-center space-y-8 max-w-md px-8">
            <div className="relative">
              <div className="absolute inset-0 bg-[#7B3FE4]/30 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0] p-8 rounded-3xl shadow-2xl">
                <BrainCircuit className="h-20 w-20 text-white mx-auto animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-black">
                Training Your Survey Agent…
              </h2>
              <p className="text-lg text-black/70 leading-relaxed">
                Our AI is analyzing your requirements and creating intelligent, relevant questions just for you.
              </p>
              <div className="flex items-center justify-center gap-2 pt-4">
                <Loader2 className="h-5 w-5 text-[#7B3FE4] animate-spin" />
                <span className="text-sm text-black/60">This usually takes 10-20 seconds</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <SignupModal
        open={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleSignupSuccess}
      />
      
      <UpgradeModal 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
};

export default CreateAgent;
