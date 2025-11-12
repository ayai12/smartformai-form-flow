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
import api from '@/lib/axios';

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
  
  // Initialize onboarding flow state based on localStorage and URL params
  const [isOnboardingFlow, setIsOnboardingFlow] = useState(() => {
    const promptParam = new URLSearchParams(window.location.search).get('prompt');
    const onboardingActive = localStorage.getItem('onboarding_active') === 'true';
    // If user is authenticated and no prompt param, don't start in onboarding mode
    if (user && !promptParam) {
      return false;
    }
    return !!(onboardingActive || promptParam);
  });

  // Load prompt from URL params or localStorage (onboarding flow)
  useEffect(() => {
    const promptParam = searchParams.get('prompt');
    const onboardingActive = localStorage.getItem('onboarding_active') === 'true';
    const savedPrompt = localStorage.getItem('onboarding_prompt');
    
    // Debug logging
    console.log('🔍 Onboarding check:', { 
      onboardingActive, 
      promptParam: !!promptParam, 
      savedPrompt: !!savedPrompt,
      userLoggedIn: !!user
    });
    
    // If user is authenticated and accessing directly (no prompt param), clear onboarding state
    if (user && !promptParam && onboardingActive) {
      console.log('🧹 Clearing onboarding state for authenticated user');
      localStorage.removeItem('onboarding_active');
      localStorage.removeItem('onboarding_prompt');
      setIsOnboardingFlow(false);
      return;
    }
    
    // Set onboarding flow if either localStorage flag is set OR there's a prompt param (coming from hero)
    if (onboardingActive || promptParam) {
      console.log('✅ Setting onboarding flow to true');
      setIsOnboardingFlow(true);
    } else {
      console.log('✅ Setting onboarding flow to false');
      setIsOnboardingFlow(false);
    }
    
    if (promptParam) {
      setGoal(decodeURIComponent(promptParam));
    } else if (savedPrompt) {
      setGoal(savedPrompt);
    }
  }, [searchParams, user]);

  const handleCreateAgent = async () => {
    if (!user) {
      setShowSignupModal(true);
      return;
    }

    if (!agentName.trim() || !goal.trim()) {
      showAlert('Error', 'Please provide both an agent name and a goal before continuing.', 'error');
      return;
    }

    if (agentName.length < 3) {
      showAlert('Error', 'Agent name must be at least 3 characters long.', 'error');
      return;
    }

    try {
      setIsCreating(true);

      // Ensure we have the latest plan/credits info
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const plan = userData?.plan || 'free';

      if (plan !== 'pro') {
        const permission = await canPerformAction(user.uid, CREDIT_COSTS.GENERATE_AGENT, 'GENERATE_AGENT');

        if (!permission.allowed) {
          setShowUpgradeModal(true);
          toast.error(permission.message || 'Upgrade required to build more agents.');
          setIsCreating(false);
          return;
        }
      }

      const trimmedAgentName = agentName.trim();
      const trimmedGoal = goal.trim();
      const trimmedAdditionalPrompt = additionalPrompt?.trim() || '';

      const toneMap: Record<string, string> = {
        Professional: 'business',
        Friendly: 'friendly',
        Casual: 'casual',
        Academic: 'academic',
      };

      const promptSegments = [
        `Design an intelligent survey agent called "${trimmedAgentName}".`,
        `Primary goal: ${trimmedGoal}`,
        `Voice/personality to emulate: ${personality}.`,
        trimmedAdditionalPrompt
          ? `Additional creative direction or constraints: ${trimmedAdditionalPrompt}`
          : '',
        'Return a JSON object with a "questions" array. Each question must include the question text and appropriate metadata (type, options, scale, etc.).',
        'Questions should feel cohesive, on-brand for the requested personality, and cover the goal comprehensively. Aim for 8 thoughtful questions mixing qualitative and quantitative formats.',
      ].filter(Boolean);

      const aiPrompt = promptSegments.join('\n\n');

      const generatePayload = {
        agentName: trimmedAgentName,
        goal: trimmedGoal,
        personality,
        additionalPrompt: trimmedAdditionalPrompt,
      };

      const authToken = await user.getIdToken();

      const chatPayload = {
        prompt: aiPrompt,
        tone: toneMap[personality] ?? 'business',
        questionCount: 8,
        action: 'add',
        userId: user.uid,
      };

      console.log('🚀 Making API call to /chat with payload:', chatPayload);
      
      const response = await api.post('chat', chatPayload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('📡 API Response received:', response);
      console.log('📊 Response data:', response.data);

      const data = response.data;
      
      // Debug: Log the actual questions structure
      console.log('🔍 Questions from API:', {
        hasQuestions: !!data.questions,
        isArray: Array.isArray(data.questions),
        length: data.questions?.length,
        firstQuestion: data.questions?.[0],
        allQuestions: data.questions
      });

      if (!data || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        console.error('❌ API returned empty or invalid questions:', {
          hasData: !!data,
          hasQuestions: !!data?.questions,
          isArray: Array.isArray(data?.questions),
          questionsLength: data?.questions?.length,
          fullData: data
        });
        throw new Error('The AI did not return any questions. Please try again.');
      }

      const agentPayload = {
        name: generatePayload.agentName,
        goal: generatePayload.goal,
        personality,
        additionalPrompt: generatePayload.additionalPrompt,
        questions: data.questions,
        generatedPrompt: aiPrompt,
        userId: user.uid,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalResponses: 0,
        plan,
      };

      console.log('💾 Saving agent to Firestore:', {
        questionsCount: agentPayload.questions.length,
        questionsPreview: agentPayload.questions.slice(0, 2),
        agentName: agentPayload.name
      });

      const agentsRef = collection(db, 'agents');
      const agentDoc = await addDoc(agentsRef, agentPayload);
      
      console.log('✅ Agent saved with ID:', agentDoc.id);

      if (plan !== 'pro') {
        const deduction = await deductCredits(user.uid, CREDIT_COSTS.GENERATE_AGENT, 'Generate Agent', 'GENERATE_AGENT');
        if (!deduction.success) {
          console.warn('Failed to deduct credits after generating agent:', deduction.message);
        }
      }

      localStorage.setItem('agent_built_successfully', 'true');
      toast.success(`${generatePayload.agentName} is ready!`);

      navigate(`/builder/new?agentId=${agentDoc.id}`, {
        state: {
          agentId: agentDoc.id,
          agentName: generatePayload.agentName,
          isNewAgent: true,
        },
        replace: true,
      });
    } catch (error: any) {
      console.error('❌ Error creating agent:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        response: error?.response,
        responseData: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText
      });
      
      let message = 'Failed to create agent. Please try again.';
      
      if (error?.response?.data?.error) {
        message = error.response.data.error;
      } else if (error?.response?.status === 429) {
        message = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error?.response?.status === 500) {
        message = 'Server error. Please try again in a moment.';
      } else if (error?.message) {
        message = error.message;
      }
      
      showAlert('Error', message, 'error');
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignupSuccess = () => {
    setShowSignupModal(false);
  };

  // Debug logging for render
  console.log('🎨 Rendering CreateAgent:', { 
    isOnboardingFlow, 
    user: !!user,
    userEmail: user?.email 
  });

  const content = (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#7B3FE4]/[0.02] to-white py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center mb-4 sm:mb-6 relative">
            <div className="absolute inset-0 bg-[#7B3FE4]/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-[#7B3FE4] to-[#6B35D0] p-4 sm:p-6 rounded-3xl shadow-2xl shadow-[#7B3FE4]/30 transform hover:scale-105 transition-transform duration-300">
              <BrainCircuit className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-4 bg-gradient-to-r from-black to-black/80 bg-clip-text px-2">
            Create Your Survey Agent
          </h1>
          <p className="text-lg sm:text-xl text-black/70 max-w-2xl mx-auto leading-relaxed mb-2 px-4">
            Tell us what you want to learn, and we'll create intelligent survey questions in seconds
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-2xl rounded-3xl overflow-hidden mx-2 sm:mx-0">
          <CardHeader className="bg-gradient-to-r from-[#7B3FE4]/5 to-[#6B35D0]/5 border-b border-white/20 p-4 sm:p-8">
            <CardTitle className="text-xl sm:text-2xl font-bold text-black">Build Your AI Agent</CardTitle>
            <CardDescription className="text-sm sm:text-base text-black/60">
              Provide some details and we'll create a smart survey agent for you
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              {/* Agent Name */}
              <div className="space-y-3">
                <Label htmlFor="agentName" className="text-sm sm:text-base font-semibold text-black flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-[#7B3FE4]" />
                  What should we call your AI agent?
                </Label>
                <Input
                  id="agentName"
                  placeholder="e.g., Customer Feedback Survey Agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-[#7B3FE4] focus:ring-[#7B3FE4] rounded-xl bg-white/90 backdrop-blur-sm transition-all duration-300"
                  disabled={isCreating}
                />
              </div>

              {/* Goal/Topic */}
              <div className="space-y-3">
                <Label htmlFor="goal" className="text-sm sm:text-base font-semibold text-black flex items-center gap-2">
                  <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#7B3FE4]" />
                  What do you want to learn or achieve?
                </Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., I want to understand what features customers like most about our mobile app, and what improvements they'd like to see. Focus on users aged 25-45 who use the app at least weekly."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base border-2 border-gray-200 focus:border-[#7B3FE4] focus:ring-[#7B3FE4] rounded-xl bg-white/90 backdrop-blur-sm transition-all duration-300 resize-none"
                  disabled={isCreating}
                />
              </div>

              {/* Personality Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <Label className="text-sm sm:text-base font-semibold text-black flex items-center gap-2">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-[#7B3FE4]" />
                    Agent Personality
                  </Label>
                  <Select value={personality} onValueChange={setPersonality} disabled={isCreating}>
                    <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-200 focus:border-[#7B3FE4] focus:ring-[#7B3FE4] rounded-xl bg-white/90 backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Academic">Academic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Create Button */}
            <div className="space-y-4">
              <Button
                onClick={handleCreateAgent}
                disabled={isCreating || !agentName.trim() || !goal.trim()}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-[#7B3FE4] to-[#6B35D0] hover:from-[#6B35D0] hover:to-[#5A2BC0] text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    <span className="relative z-10">Creating Your Survey Agent...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="relative z-10">Create My Survey Agent</span>
                    <ArrowRight className="h-5 w-5 ml-2 sm:ml-3 relative z-10" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <>
      {/* Main Content - Use minimal layout only for onboarding flow */}
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
