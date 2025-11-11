import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchFormById } from '../firebase/formFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFirestore, collection, addDoc, updateDoc, doc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Logo } from '@/logo';

const SurveyPage: React.FC = () => {
  const db = getFirestore(getApp());
  const { formId } = useParams<{ formId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);
  const [started, setStarted] = useState(false);
  const [submittedState, setSubmittedState] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [current, setCurrent] = useState(0);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]); // ms per question
  const [questionStart, setQuestionStart] = useState<number | null>(null);
  const [surveyStart, setSurveyStart] = useState<number | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [device, setDevice] = useState<string>('');
  const [referral, setReferral] = useState<string>('');
  const [dropoutPoint, setDropoutPoint] = useState<number | null>(null);
  const questions = form?.questions || [];

  // Device detection
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) setDevice('Mobile');
    else if (/tablet/i.test(ua)) setDevice('Tablet');
    else setDevice('Desktop');
    setReferral(document.referrer || 'Direct');
  }, []);

  // Geolocation (browser API, fallback to null)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation(null),
        { timeout: 3000 }
      );
    } else {
      setLocation(null);
    }
  }, []);

  // Track view count (aggregate stat)
  useEffect(() => {
    if (formId && form) {
      const surveyDoc = doc(db, 'forms', formId);
      updateDoc(surveyDoc, { views: increment(1) });
    }
  }, [formId, form]);

  // Track question timing
  useEffect(() => {
    if (started && questionStart === null) {
      setSurveyStart(Date.now());
      setQuestionStart(Date.now());
      setQuestionTimes(Array(questions.length).fill(0));
    }
  }, [started, questions.length, questionStart]);

  // Helper: get completion status
  const getCompletionStatus = () => {
    if (Object.keys(answers).length === questions.length && questions.every(q => answers[q.id] !== undefined && answers[q.id] !== '')) {
      return 'complete';
    }
    return 'incomplete';
  };

  // Helper: skip rate
  const getSkipRate = () => {
    if (!questions.length) return 0;
    const skipped = questions.filter(q => answers[q.id] === undefined || answers[q.id] === '').length;
    return skipped / questions.length;
  };

  // Helper: dropout
  const getDropoutPoint = () => {
    if (getCompletionStatus() === 'complete') return null;
    for (let i = 0; i < questions.length; i++) {
      if (answers[questions[i].id] === undefined || answers[questions[i].id] === '') {
        return i;
      }
    }
    return null;
  };

  // Handle answer change and timing
  const handleChange = (id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  // Handle sharing
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: form?.title || 'SurveyAgent Survey',
        text: 'Check out this survey created with SurveyAgent',
        url: window.location.href
      }).catch(err => console.error('Share failed:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Survey link copied to clipboard!'))
        .catch(err => console.error('Copy failed:', err));
    }
  };

  // Handle next/submit (with timing)
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questionStart !== null) {
      setQuestionTimes(prev => {
        const newTimes = [...prev];
        newTimes[current] = (newTimes[current] || 0) + (Date.now() - questionStart);
        return newTimes;
      });
    }
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setQuestionStart(Date.now());
    } else {
      // SUBMISSION LOGIC
      const end = Date.now();
      const totalTime = surveyStart ? end - surveyStart : null;
      const completionStatus = getCompletionStatus();
      const skipRate = getSkipRate();
      const dropout = getDropoutPoint();
      const ownerId = form?.ownerId || null;
      
      // Validate that we have ownerId and formId
      if (!ownerId) {
        console.error('❌ Cannot save response: form has no ownerId', form);
        alert('Error: Unable to save response. Please contact support.');
        return;
      }
      
      if (!formId) {
        console.error('❌ Cannot save response: no formId');
        alert('Error: Unable to save response. Please contact support.');
        return;
      }
      
      // Format answers to include question text for each answer
      const formattedAnswers = {};
      questions.forEach((question, index) => {
        if (answers[question.id] !== undefined) {
          // Use a standardized format for all questions
          // Store as { question: "Question text", answer: "Answer value" }
          formattedAnswers[`q${index + 1}`] = {
            question: question.question,
            answer: answers[question.id]
          };
        }
      });
      
      // Log response data for debugging
      console.log('💾 Saving response:', {
        formId,
        ownerId,
        answerCount: Object.keys(formattedAnswers).length,
        completionStatus
      });
      
      const responseData = {
        formId,
        ownerId,
        answers: formattedAnswers, // Use the formatted answers
        completionStatus,
        skipRate,
        dropout,
        questionTimes,
        totalTime,
        completedAt: new Date().toISOString(),
        device,
        location,
        referral,
        timeOfDay: new Date().toLocaleTimeString(),
        createdAt: serverTimestamp(), // Add server timestamp for sorting
      };
      // Anonymous Auth: ensure user is authenticated
      const auth = getAuth();
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error('Anonymous sign-in failed', err);
        }
      }
      // Save to survey_responses
      const responseRef = await addDoc(collection(db, 'survey_responses'), responseData);
      console.log('✅ Response saved successfully:', responseRef.id);
      // Update aggregate stats
      try {
        if (formId) {
          const surveyDoc = doc(db, 'forms', formId);
          // Get current stats
          const surveySnap = await getDoc(surveyDoc);
          let stats = surveySnap.data();
          let totalCompletions = stats?.totalCompletions || 0;
          let totalSubmissions = stats?.totalSubmissions || 0;
          let totalTimeSum = stats?.totalTimeSum || 0;
          let views = stats?.views || 0;
          // Only count as completion if complete
          if (completionStatus === 'complete') {
            totalCompletions++;
          }
          totalSubmissions++;
          totalTimeSum += totalTime || 0;
          await updateDoc(surveyDoc, {
            totalCompletions,
            totalSubmissions,
            totalTimeSum,
            completionRate: totalCompletions / totalSubmissions,
            averageCompletionTime: totalSubmissions ? totalTimeSum / totalSubmissions : 0,
          });
        }
      } catch (err) {
        console.error('Failed to update aggregate stats', err);
      }
      setSubmittedState(true);
    }
  };

  useEffect(() => {
    const loadForm = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFormById(formId!);
        if (!data || !data.publishedLink) {
          setError('This survey is not published or does not exist.');
        } else {
          setForm(data);
        }
      } catch (err) {
        setError('Failed to load survey.');
      }
      setLoading(false);
    };
    if (formId) loadForm();
  }, [formId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-lg text-[#2E2E2E] opacity-70">Loading survey...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Card className="max-w-lg w-full border-0 shadow-xl">
          <CardHeader className="bg-[#0066CC] text-white rounded-t-lg">
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-[#2E2E2E]">{error}</CardContent>
        </Card>
      </div>
    );
  }
  if (!form) return null;

  const showProgress = typeof form.showProgress === 'boolean' ? form.showProgress : true;
  const formTitle = form.title;
  const customThankYou = form.customThankYou;
  const thankYouMessage = form.thankYouMessage;
  const q = questions[current];
  const isLast = current === questions.length - 1;
  const answered = q && (answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0e7ff] via-[#f0fdfa] to-[#f3e8ff] py-4 px-2 animate-fade-in">
      <div
        className="w-full max-w-3xl mx-auto rounded-2xl shadow-2xl p-0 overflow-hidden border border-white/30 relative backdrop-blur-lg bg-white/30 bg-clip-padding glassmorphic-card"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
          border: '1px solid rgba(255,255,255,0.25)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0066CC] via-[#00D084] to-[#8F00FF] opacity-80"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-[#00D084]/10 transform rotate-45 translate-x-10 -translate-y-10 rounded-md"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#8F00FF]/10 transform rotate-45 -translate-x-8 translate-y-8 rounded-md"></div>
        
        {/* Branding Header */}
        <div className="p-4 sm:p-6 flex items-center justify-between border-b border-white/20 bg-white/20 backdrop-blur-md">
          <div className="flex items-center gap-3 animate-fade-in-left min-w-0">
            <Logo size={28} />
            <span className="text-lg sm:text-xl font-bold text-[#0066CC] truncate">SurveyAgent</span>
            {/* Share button */}
            <button 
              onClick={handleShare}
              className="ml-2 px-2 py-1 text-xs sm:text-sm bg-[#0066CC]/10 hover:bg-[#0066CC]/20 text-[#0066CC] rounded-md flex items-center gap-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
          <div className="text-[10px] sm:text-xs text-[#2E2E2E]/60 tracking-wide animate-fade-in-right">Effortless, Beautiful Surveys</div>
        </div>
        
        <div className="flex flex-col h-[80vh] max-h-[800px] min-h-[400px] sm:min-h-[550px] relative">
          <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-2 sm:pb-4 flex-shrink-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2E2E2E] mb-2 tracking-tight break-words animate-fade-in-up">
              {formTitle || 'Survey'}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 sm:px-8 pb-4 sm:pb-8 flex flex-col min-w-0">
            {!started ? (
              <div className="flex flex-col items-center justify-center flex-1 animate-fade-in-up min-w-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 flex items-center justify-center bg-[#0066CC]/10 rounded-full animate-pulse">
                  <span className="text-4xl sm:text-5xl">📝</span>
                </div>
                <div className="text-xl sm:text-2xl font-semibold mb-2 text-[#2E2E2E] text-center">Ready to start the survey?</div>
                <div className="text-[#2E2E2E]/70 mb-6 sm:mb-8 text-center max-w-md text-sm sm:text-base">Click below to begin. You can only answer one question at a time.</div>
                <Button 
                  className="w-full max-w-xs py-2 sm:py-3 text-white bg-[#0066CC] hover:bg-[#0055AA] rounded-lg shadow-md transition-all duration-200 animate-fade-in-up"
                  onClick={() => setStarted(true)}
                >
                  Start Survey
                </Button>
              </div>
            ) : !submittedState ? (
              <form className="space-y-6 sm:space-y-8 flex-1 flex flex-col animate-fade-in-up min-w-0" onSubmit={handleNext}>
                {showProgress && (
                  <div className="flex items-center justify-between mb-2 animate-fade-in">
                    <div className="text-xs sm:text-sm text-[#2E2E2E]/70 font-medium">Question {current + 1} of {questions.length}</div>
                    <div className="w-32 sm:w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-2 bg-gradient-to-r from-[#0066CC] to-[#00D084] rounded-full transition-all duration-500" 
                        style={{ width: `${((current + 1) / questions.length) * 100}%` }} 
                      />
                    </div>
                  </div>
                )}
                
                {questions.length === 0 || !q ? (
                  <div className="text-center text-[#2E2E2E]/50 italic py-8 animate-fade-in">No questions to display.</div>
                ) : (
                  <div
                    key={q.id}
                    className="bg-white/40 border border-white/30 rounded-xl shadow-md p-4 sm:p-6 space-y-4 animate-fade-in-up backdrop-blur-md min-w-0"
                    style={{ boxShadow: '0 4px 24px 0 rgba(31,38,135,0.10)' }}
                  >
                    <label
                      className="block font-semibold text-[#2E2E2E] mb-3 sm:mb-4 text-base sm:text-lg tracking-tight animate-fade-in min-w-0"
                      style={{
                        fontSize:
                          q.question && q.question.length > 100
                            ? '1.05rem'
                            : q.question && q.question.length > 60
                            ? '1.125rem'
                            : '1.25rem',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        whiteSpace: 'pre-line',
                        width: '100%',
                        maxWidth: '100%',
                        display: 'block',
                      }}
                    >
                      {q.question} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {q.type === 'multiple_choice' && (
                      <div className="flex flex-col gap-2 sm:gap-3 mt-2 sm:mt-3 animate-fade-in-up">
                        {q.options &&
                          q.options.map((option: string, i: number) => (
                            <label
                              key={i}
                              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border ${
                                answers[q.id] === option 
                                  ? 'border-[#0066CC] bg-[#0066CC]/10' 
                                  : 'border-white/30 hover:border-[#00D084] hover:bg-[#00D084]/10'
                              } transition cursor-pointer text-sm sm:text-base min-w-0`}
                            >
                              <div className={`w-5 h-5 flex-shrink-0 rounded-full border-2 ${
                                answers[q.id] === option 
                                  ? 'border-[#0066CC] bg-white/80' 
                                  : 'border-gray-300 bg-white/60'
                              } flex items-center justify-center`}>
                                {answers[q.id] === option && (
                                  <div className="w-3 h-3 rounded-full bg-[#0066CC]"></div>
                                )}
                              </div>
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                className="sr-only"
                                checked={answers[q.id] === option}
                                onChange={() => handleChange(q.id, option)}
                                required={q.required}
                              />
                              <span className="break-words text-[#2E2E2E] min-w-0" style={{ maxWidth: '90%' }}>{option}</span>
                            </label>
                          ))}
                      </div>
                    )}
                    
                    {(q.type === 'text' || q.type === 'email' || q.type === 'phone' || q.type === 'date') && (
                      <div className="mt-1 sm:mt-2">
                        <Input
                          type={q.type === 'email' ? 'email' : q.type === 'date' ? 'date' : 'text'}
                          className="w-full rounded-lg border-white/30 bg-white/60 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 px-4 py-2 sm:py-3 text-[#2E2E2E] placeholder-gray-400 text-sm sm:text-base animate-fade-in backdrop-blur-md"
                          placeholder="Your answer..."
                          value={answers[q.id] || ''}
                          onChange={e => handleChange(q.id, e.target.value)}
                          required={q.required}
                        />
                      </div>
                    )}
                    
                    {q.type === 'rating' && (
                      <div className="flex gap-1 sm:gap-2 mt-3 sm:mt-4 justify-center animate-fade-in-up">
                        {Array.from({ length: q.scale }).map((_, i) => (
                          <label
                            key={i}
                            className={`flex items-center justify-center cursor-pointer ${
                              answers[q.id] === i + 1 
                                ? 'bg-[#0066CC]/90 text-white' 
                                : 'bg-white/60 text-[#2E2E2E] hover:bg-[#00D084]/20'
                            } w-8 sm:w-10 h-8 sm:h-10 rounded-md transition-all duration-200 font-semibold text-base sm:text-lg backdrop-blur-md`}
                          >
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              className="sr-only"
                              checked={answers[q.id] === i + 1}
                              onChange={() => handleChange(q.id, i + 1)}
                              required={q.required}
                            />
                            {i + 1}
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {q.type === 'rating' && (
                      <div className="flex justify-between text-[10px] sm:text-xs text-[#2E2E2E]/60 mt-1 sm:mt-2 px-1">
                        <span>Poor</span>
                        <span>Excellent</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-2 sm:pt-4 mt-auto animate-fade-in">
                  <Button
                    className={`w-full py-2 sm:py-3 rounded-lg shadow-md transition-all duration-200 ${
                      q?.required && !answered
                        ? 'bg-gray-300/60 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#0066CC]/90 to-[#00D084]/90 text-white hover:shadow-lg hover:translate-y-[-2px] backdrop-blur-md'
                    }`}
                    type="submit"
                    disabled={q?.required && !answered}
                  >
                    {isLast ? 'Submit' : 'Next Question'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 animate-fade-in-up min-w-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 flex items-center justify-center bg-[#00D084]/20 rounded-full animate-pulse">
                  <span className="text-4xl sm:text-5xl">🎉</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#0066CC] mb-3 sm:mb-4 text-center animate-fade-in-up">
                  {customThankYou && thankYouMessage && thankYouMessage.trim() !== '' ? thankYouMessage : 'Thank you for your response!'}
                </div>
                <div className="text-[#2E2E2E]/70 mb-6 sm:mb-8 text-center max-w-md text-sm sm:text-base animate-fade-in">Your answers have been successfully recorded.</div>
                {/* Create survey link */}
                <a 
                  href="https://surveyagent.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 sm:mt-6 px-4 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-[#8F00FF]/90 to-[#0066CC]/90 text-white rounded-lg shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200 animate-fade-in-up flex items-center gap-2"
                >
                  <Logo size={24} />
                  <span className="text-xs sm:text-base">Want to create a survey like this one?</span>
                </a>
                <div className="mt-4 sm:mt-6 text-[10px] sm:text-xs text-[#2E2E2E]/40 animate-fade-in-up">Powered by SurveyAgent</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Animations & Glassmorphism CSS */}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.6s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 0.7s cubic-bezier(.22,1,.36,1); }
        .animate-fade-in-left { animation: fadeInLeft 0.7s cubic-bezier(.22,1,.36,1); }
        .animate-fade-in-right { animation: fadeInRight 0.7s cubic-bezier(.22,1,.36,1); }
        .animate-pulse { animation: pulse 2s infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px);} to { opacity: 1; transform: none; } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(20px);} to { opacity: 1; transform: none; } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
        .glassmorphic-card {
          background: rgba(255,255,255,0.30);
          box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
          border-radius: 1.5rem;
          border: 1px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(16px);
        }
      `}</style>
    </div>
  );
};

export default SurveyPage;