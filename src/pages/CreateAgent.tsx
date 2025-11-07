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
import { BrainCircuit, Loader2, Sparkles, Lock, CreditCard } from 'lucide-react';
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
        setUserPlan('free'); // Default to free on error
        setUserCredits(0);
        setIsNewUser(true); // Assume new user on error
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
          
          // Clear saved data
          localStorage.removeItem('pending_agent_data');
          
          // Auto-trigger agent creation if data was saved
          if (data.agentName && data.goal) {
            setIsBuildingAgent(true);
            // Wait a bit for state to update, then create agent
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
    // Check if user is authenticated
    if (!user?.uid) {
      // Save form data to localStorage
      localStorage.setItem('pending_agent_data', JSON.stringify({
        agentName,
        goal,
        personality,
        additionalPrompt
      }));
      setShowSignupModal(true);
      return;
    }

    // Validation
    if (!agentName.trim()) {
      showAlert('Error', 'Please enter an agent name.', 'error');
      return;
    }
    if (!goal.trim()) {
      showAlert('Error', 'Please describe your agent\'s goal or topic.', 'error');
      return;
    }

    // Skip credit checks during onboarding - backend auto-assigns 8 credits
    // ALWAYS skip for new users (0 agents) or during onboarding flow
    // Double-check agent count inline to avoid race conditions
    let shouldSkipCreditCheck = isOnboardingFlow || isNewUser;
    
    if (!shouldSkipCreditCheck) {
      // Double-check agent count to be safe
      try {
        const db = getFirestore();
        const agentsQuery = query(
          collection(db, 'agents'),
          where('userId', '==', user.uid)
        );
        const agentsSnap = await getDocs(agentsQuery);
        const agentCount = agentsSnap.docs.length;
        shouldSkipCreditCheck = agentCount === 0; // Skip if user has 0 agents
      } catch (error) {
        console.error('Error checking agent count for credit check:', error);
        // On error, assume new user and skip credit check
        shouldSkipCreditCheck = true;
      }
    }
    
    // Only check credits for existing users who are NOT in onboarding flow
    if (!shouldSkipCreditCheck) {
    const actionCheck = await canPerformAction(user.uid, CREDIT_COSTS.TRAIN_AGENT);
    if (!actionCheck.allowed) {
      setShowUpgradeModal(true);
      return;
      }
    }

    // Show loading screen
    setShowAnimation(true);
    setIsCreating(true);

    try {
      // Build system prompt
      const systemPrompt = `You are ${agentName}, a ${personality} AI survey agent. Goal: ${goal}.`;
      const fullPrompt = additionalPrompt.trim() 
        ? `${systemPrompt}\n\nAdditional instructions: ${additionalPrompt}`
        : systemPrompt;
      
      // Call the existing chat API endpoint - DO NOT deduct credits yet!
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
      
      // Check for errors first
      if (data.error) {
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
      }
      
      // Validate questions array
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        console.error('Invalid response from API:', data);
        throw new Error(data.error || 'No questions were generated. Please try again.');
      }
      
      console.log(`✅ Received ${data.questions.length} questions from API`);

      // ALWAYS deduct credits after successful agent creation
      // New users get 8 credits from backend, so they can afford the 3 credits for creating an agent
      const deductionResult = await deductCredits(user.uid, CREDIT_COSTS.TRAIN_AGENT, 'Train Agent');
      if (!deductionResult.success) {
        console.error('Failed to deduct credits after successful generation:', deductionResult.message);
        showAlert('Warning', 'Agent created but credit deduction failed. Please contact support.', 'warning');
      }

      // Convert backend question format to frontend format
      const mappedQuestions = data.questions.map((q: any, idx: number) => {
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
          console.log('🔍 Raw question object from API (CreateAgent):', JSON.stringify(q, null, 2));
          console.log('🔍 Question object keys:', Object.keys(q));
        }
        
        // Parse question type - handle variations
        let type = 'text';
        const qType = (q.type || '').toLowerCase();
        if (qType === 'multiple choice' || qType === 'multiple_choice') {
          type = 'multiple_choice';
        } else if (qType === 'rating') {
          type = 'rating';
        } else if (qType === 'text box' || qType === 'text' || qType === 'textbox') {
          type = 'text';
        }
        
        // Parse options - ensure it's an array
        let options = undefined;
        if (type === 'multiple_choice' && q.options) {
          options = Array.isArray(q.options) ? q.options : [];
        }
        
        // Parse scale - convert to number (length of scale array)
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
        
        // Generate unique ID using timestamp + index + random
        const uniqueId = `q_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`;
        
        const mappedQuestion = {
          id: uniqueId,
          type,
          question: questionText.trim() || `Question ${idx + 1}`,
          required: true,
          options,
          scale,
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
      console.log('📋 Sample question:', mappedQuestions[0] ? {
        id: mappedQuestions[0].id,
        type: mappedQuestions[0].type,
        question: mappedQuestions[0].question?.substring(0, 50),
        hasOptions: !!mappedQuestions[0].options,
        optionsCount: mappedQuestions[0].options?.length
      } : 'No questions');

      // Create survey document in forms collection
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

      // Save agent to Firestore with surveyId reference
      // Clean up the data to remove undefined values (Firestore doesn't allow undefined)
      const agentData: any = {
        userId: user.uid,
        name: agentName,
        goal: goal || '',
        personality: personality || 'Professional',
        createdAt: serverTimestamp(),
        generatedPrompt: fullPrompt,
        surveyId: surveyId,
        questions: mappedQuestions.map(q => {
          // Remove undefined values from questions
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

      // Remove any undefined values from the top level
      Object.keys(agentData).forEach(key => {
        if (agentData[key] === undefined) {
          delete agentData[key];
        }
      });

      const agentDocRef = await addDoc(collection(db, 'agents'), agentData);
      
      setIsBuildingAgent(false);
      
      // Success toast - show after agent is built (during onboarding or for new users)
      if (isOnboardingFlow || isNewUser) {
        toast.success('🎉 Your agent has been built successfully! The necessary credits were automatically used from your free balance.');
      } else {
      showAlert('Success', `Agent "${agentName}" created successfully!`, 'success');
      }
      
      // Mark that agent was successfully built for post-build modal
      localStorage.setItem('agent_built_successfully', 'true');
      
      // Navigate to the form builder with the agent's questions after short delay
      setTimeout(() => {
        setShowAnimation(false);
        setIsBuildingAgent(false);
        localStorage.removeItem('onboarding_active');
      navigate(`/builder/${surveyId}?agentId=${agentDocRef.id}`);
      }, 2500);
      
    } catch (error: any) {
      console.error('Error creating agent:', error);
      // Show detailed error message
      const errorMessage = error.message || 'Failed to create agent. Please try again.';
      showAlert('Error', errorMessage, 'error');
      // Credits were NOT deducted since generation failed - this is correct behavior
      setShowAnimation(false);
      setIsBuildingAgent(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignupSuccess = () => {
    // After successful signup, form data will be restored from localStorage
    // and agent creation will be triggered automatically
    setShowSignupModal(false);
  };

  const content = (
    <>
      <div className="min-h-screen bg-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="relative">
                <div className="bg-gradient-to-br from-[#7B3FE4]/10 to-[#7B3FE4]/5 p-5 rounded-2xl border border-[#7B3FE4]/20 shadow-sm">
                  <BrainCircuit className="h-10 w-10 text-[#7B3FE4]" />
                </div>
                <div className="absolute inset-0 bg-[#7B3FE4]/20 rounded-2xl blur-xl animate-pulse opacity-40"></div>
              </div>
            </div>
            <h1 className="text-4xl font-semibold text-black mb-3">
              Create Your First AI Agent
            </h1>
            <p className="text-lg text-black/60 max-w-2xl mx-auto leading-relaxed">
              In just 3 simple steps, you'll have an intelligent survey agent ready to collect insights
            </p>
          </div>

          {/* Simple Steps Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#7B3FE4] text-white flex items-center justify-center font-semibold text-sm">1</div>
              <span className="text-sm font-medium text-black">Tell us what you need</span>
            </div>
            <div className="w-12 h-0.5 bg-black/10"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black/10 text-black/40 flex items-center justify-center font-semibold text-sm">2</div>
              <span className="text-sm text-black/40">AI creates questions</span>
            </div>
            <div className="w-12 h-0.5 bg-black/10"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black/10 text-black/40 flex items-center justify-center font-semibold text-sm">3</div>
              <span className="text-sm text-black/40">Review & deploy</span>
            </div>
          </div>

          {/* Main Form Card */}
          <Card className="bg-white border border-black/10 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-5 bg-gradient-to-br from-[#7B3FE4]/5 to-white border-b border-black/10">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-black">
                <div className="bg-[#7B3FE4]/10 p-2 rounded-lg border border-[#7B3FE4]/20">
                  <Sparkles className="h-5 w-5 text-[#7B3FE4]" />
                </div>
                Step 1: Set Up Your Agent
              </CardTitle>
              <CardDescription className="text-black/60 mt-2">
                Don't worry - this takes less than 2 minutes!
              </CardDescription>
            </CardHeader>
            
            {/* Credit Info Banner - Hide during onboarding, only show for existing users */}
            {!loadingPlan && userPlan === 'free' && !isNewUser && !isOnboardingFlow && user?.uid && (
              <div className="mx-6 mb-5">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-black/80 mb-2">
                        <span className="font-semibold">Good news!</span> You have <span className="font-bold text-[#7B3FE4]">{userCredits} credits</span>. 
                        {userCredits >= 3 ? (
                          <span> That's enough to create your first agent!</span>
                        ) : (
                          <span> You'll need 3 credits to create an agent.</span>
                        )}
                      </p>
                      {userCredits < 3 && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => navigate('/pricing')}
                            variant="outline"
                            size="sm"
                            className="border-blue-300 hover:bg-blue-50 text-blue-700 gap-1.5 text-xs h-8"
                          >
                            <CreditCard className="h-3 w-3" />
                            Get Credits
                          </Button>
                          <Button
                            onClick={handleUpgrade}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-8"
                          >
                            <Sparkles className="h-3 w-3" />
                            Upgrade to Pro
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <CardContent className="space-y-6 px-6 py-6">
              {/* Agent Name */}
              <div className="space-y-2.5">
                <Label htmlFor="agentName" className="text-base font-semibold text-black">
                  What should we call your agent?
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="agentName"
                  placeholder="e.g., Customer Feedback Agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="text-base border-black/10 focus:border-[#7B3FE4] focus:ring-2 focus:ring-[#7B3FE4]/20 h-12"
                  disabled={isCreating}
                />
                <p className="text-sm text-black/50">
                  Pick a name that helps you remember what this agent does
                </p>
              </div>

              {/* Goal/Topic - Single line input */}
              <div className="space-y-2.5">
                <Label htmlFor="goal" className="text-base font-semibold text-black">
                  What do you want to learn?
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="goal"
                  placeholder="e.g., Find out what customers think about our new mobile app"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="text-base border-black/10 focus:border-[#7B3FE4] focus:ring-2 focus:ring-[#7B3FE4]/20 h-12"
                  disabled={isCreating}
                />
                <p className="text-sm text-black/50">
                  Be specific - the more details you give, the better questions we'll create
                </p>
              </div>

              {/* Personality */}
              <div className="space-y-2.5">
                <Label htmlFor="personality" className="text-base font-semibold text-black">
                  How should your agent talk?
                </Label>
                <Select
                  value={personality}
                  onValueChange={setPersonality}
                  disabled={isCreating}
                >
                  <SelectTrigger id="personality" className="text-base border-black/10 focus:border-[#7B3FE4] focus:ring-2 focus:ring-[#7B3FE4]/20 h-12">
                    <SelectValue placeholder="Pick a style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">
                      <div className="flex flex-col py-1">
                        <span className="font-medium text-black">Professional</span>
                        <span className="text-xs text-black/50 mt-0.5">Best for: Business surveys, formal feedback</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Friendly">
                      <div className="flex flex-col py-1">
                        <span className="font-medium text-black">Friendly</span>
                        <span className="text-xs text-black/50 mt-0.5">Best for: Customer satisfaction, casual polls</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Playful">
                      <div className="flex flex-col py-1">
                        <span className="font-medium text-black">Playful</span>
                        <span className="text-xs text-black/50 mt-0.5">Best for: Fun events, creative projects</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Researcher">
                      <div className="flex flex-col py-1">
                        <span className="font-medium text-black">Researcher</span>
                        <span className="text-xs text-black/50 mt-0.5">Best for: Academic studies, detailed analysis</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-black/50">
                  This affects how questions are worded. Don't worry - you can change it later!
                </p>
              </div>

              {/* Additional Prompt (optional) */}
              <div className="space-y-2.5">
                <Label htmlFor="additionalPrompt" className="text-base font-semibold text-black">
                  Extra details
                  <span className="text-black/40 font-normal ml-1 text-sm">(Skip if you're not sure)</span>
                </Label>
                <Textarea
                  id="additionalPrompt"
                  placeholder="e.g., Focus on users aged 25-45, ask about mobile vs desktop experience, include questions about pricing..."
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                  className="min-h-24 text-base border-black/10 focus:border-[#7B3FE4] focus:ring-2 focus:ring-[#7B3FE4]/20 resize-none"
                  disabled={isCreating}
                />
                <p className="text-sm text-black/50">
                  Add anything else that might help us create better questions. This is optional!
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-black/10 my-6"></div>

              {/* Create Button */}
              <div className="space-y-3">
                <Button
                  onClick={handleCreateAgent}
                  disabled={isCreating || !agentName.trim() || !goal.trim()}
                  className="w-full bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] hover:from-[#6B35D0] hover:to-[#5B2FC0] text-white font-semibold py-6 text-lg shadow-lg shadow-[#7B3FE4]/30 hover:shadow-xl hover:shadow-[#7B3FE4]/40 transition-all relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin relative z-10" />
                      <span className="relative z-10">Creating your agent...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10">Build Agent</span>
                    </>
                  )}
                </Button>
                {(!agentName.trim() || !goal.trim()) && (
                  <p className="text-xs text-black/50 text-center">
                    Fill in the name and goal above to continue
                  </p>
                )}
              </div>

              {/* Simple Info Box */}
              <div className="bg-gradient-to-br from-[#7B3FE4]/5 to-transparent border border-[#7B3FE4]/20 rounded-lg p-5 mt-6">
                <h4 className="font-semibold text-black mb-3 text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#7B3FE4]" />
                  What happens next?
                </h4>
                <div className="space-y-3 text-sm text-black/70">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#7B3FE4]/10 border border-[#7B3FE4]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#7B3FE4] font-semibold text-xs">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-black mb-0.5">AI generates questions</p>
                      <p className="text-black/60">We'll create smart questions based on what you told us</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#7B3FE4]/10 border border-[#7B3FE4]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#7B3FE4] font-semibold text-xs">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-black mb-0.5">You review & customize</p>
                      <p className="text-black/60">Edit questions, add more, or change anything you want</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#7B3FE4]/10 border border-[#7B3FE4]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#7B3FE4] font-semibold text-xs">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-black mb-0.5">Share & collect responses</p>
                      <p className="text-black/60">Get a link to share, then watch responses come in real-time</p>
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
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
              <BrainCircuit className="h-16 w-16 text-[#7B3FE4] mx-auto animate-pulse" />
              <div className="absolute inset-0 bg-[#7B3FE4]/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <p className="text-2xl font-semibold text-black">
                Training your AI Agent…
              </p>
              <p className="text-base text-black/60">
                Giving it intelligence, memory, and purpose.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Signup Modal */}
      <SignupModal
        open={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleSignupSuccess}
      />
      
      {/* Free Tier Modal */}
      <UpgradeModal 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
};

export default CreateAgent;

