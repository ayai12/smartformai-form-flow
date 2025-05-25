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
        title: form?.title || 'SmartFormAI Survey',
        text: 'Check out this survey created with SmartFormAI',
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
      await addDoc(collection(db, 'survey_responses'), responseData);
      // Update aggregate stats
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
    <div className="min-h-screen flex items-center justify-center bg-white py-10 animate-fade-in">
      <div className="max-w-3xl w-full mx-auto bg-white rounded-xl shadow-lg p-0 overflow-hidden border border-gray-100 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0066CC] via-[#00D084] to-[#8F00FF]"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-[#00D084]/10 transform rotate-45 translate-x-10 -translate-y-10 rounded-md"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#8F00FF]/10 transform rotate-45 -translate-x-8 translate-y-8 rounded-md"></div>
        
        {/* Branding Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4 animate-fade-in-left">
            <Logo size={32} />
            <span className="text-xl font-bold text-[#0066CC]">SmartFormAI</span>
            
            {/* Share button */}
            <button 
              onClick={handleShare}
              className="ml-2 px-3 py-1 text-sm bg-[#0066CC]/10 hover:bg-[#0066CC]/20 text-[#0066CC] rounded-md flex items-center gap-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
          <div className="text-xs text-[#2E2E2E]/60 tracking-wide animate-fade-in-right">Effortless, Beautiful Surveys</div>
        </div>
        
        <div className="flex flex-col h-[85vh] max-h-[800px] min-h-[550px] relative">
          <div className="px-8 pt-8 pb-4 flex-shrink-0">
            <h2 className="text-3xl font-bold text-[#2E2E2E] mb-2 tracking-tight break-words animate-fade-in-up">
              {formTitle || 'Survey'}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col">
            {!started ? (
              <div className="flex flex-col items-center justify-center flex-1 animate-fade-in-up">
                <div className="w-24 h-24 mb-6 flex items-center justify-center bg-[#0066CC]/10 rounded-full animate-pulse">
                  <span className="text-5xl">📝</span>
                </div>
                <div className="text-2xl font-semibold mb-2 text-[#2E2E2E] text-center">Ready to start the survey?</div>
                <div className="text-[#2E2E2E]/70 mb-8 text-center max-w-md">Click below to begin. You can only answer one question at a time.</div>
                <Button 
                  className="w-full max-w-xs py-3 text-white bg-[#0066CC] hover:bg-[#0055AA] rounded-lg shadow-md transition-all duration-200 animate-fade-in-up"
                  onClick={() => setStarted(true)}
                >
                  Start Survey
                </Button>
              </div>
            ) : !submittedState ? (
              <form className="space-y-8 flex-1 flex flex-col animate-fade-in-up" onSubmit={handleNext}>
                {showProgress && (
                  <div className="flex items-center justify-between mb-2 animate-fade-in">
                    <div className="text-sm text-[#2E2E2E]/70 font-medium">Question {current + 1} of {questions.length}</div>
                    <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
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
                    className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4 animate-fade-in-up"
                  >
                    <label
                      className="block font-semibold text-[#2E2E2E] mb-4 text-lg tracking-tight animate-fade-in"
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
                      <div className="flex flex-col gap-3 mt-3 animate-fade-in-up">
                        {q.options &&
                          q.options.map((option: string, i: number) => (
                            <label
                              key={i}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                answers[q.id] === option 
                                  ? 'border-[#0066CC] bg-[#0066CC]/5' 
                                  : 'border-gray-200 hover:border-[#00D084] hover:bg-[#00D084]/5'
                              } transition cursor-pointer text-base`}
                            >
                              <div className={`w-5 h-5 flex-shrink-0 rounded-full border-2 ${
                                answers[q.id] === option 
                                  ? 'border-[#0066CC] bg-white' 
                                  : 'border-gray-300 bg-white'
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
                              <span className="break-words text-[#2E2E2E]" style={{ maxWidth: '90%' }}>{option}</span>
                            </label>
                          ))}
                      </div>
                    )}
                    
                    {(q.type === 'text' || q.type === 'email' || q.type === 'phone' || q.type === 'date') && (
                      <div className="mt-2">
                        <Input
                          type={q.type === 'email' ? 'email' : q.type === 'date' ? 'date' : 'text'}
                          className="w-full rounded-lg border-gray-200 focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 px-4 py-3 text-[#2E2E2E] bg-white placeholder-gray-400 text-base animate-fade-in"
                          placeholder="Your answer..."
                          value={answers[q.id] || ''}
                          onChange={e => handleChange(q.id, e.target.value)}
                          required={q.required}
                        />
                      </div>
                    )}
                    
                    {q.type === 'rating' && (
                      <div className="flex gap-2 mt-4 justify-center animate-fade-in-up">
                        {Array.from({ length: q.scale }).map((_, i) => (
                          <label
                            key={i}
                            className={`flex items-center justify-center cursor-pointer ${
                              answers[q.id] === i + 1 
                                ? 'bg-[#0066CC] text-white' 
                                : 'bg-gray-100 text-[#2E2E2E] hover:bg-[#00D084]/20'
                            } w-10 h-10 rounded-md transition-all duration-200 font-semibold text-lg`}
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
                      <div className="flex justify-between text-xs text-[#2E2E2E]/60 mt-2 px-1">
                        <span>Poor</span>
                        <span>Excellent</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-4 mt-auto animate-fade-in">
                  <Button
                    className={`w-full py-3 rounded-lg shadow-md transition-all duration-200 ${
                      q?.required && !answered
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#0066CC] to-[#00D084] text-white hover:shadow-lg hover:translate-y-[-2px]'
                    }`}
                    type="submit"
                    disabled={q?.required && !answered}
                  >
                    {isLast ? 'Submit' : 'Next Question'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 animate-fade-in-up">
                <div className="w-24 h-24 mb-6 flex items-center justify-center bg-[#00D084]/20 rounded-full animate-pulse">
                  <span className="text-5xl">🎉</span>
                </div>
                <div className="text-2xl font-bold text-[#0066CC] mb-4 text-center animate-fade-in-up">
                  {customThankYou && thankYouMessage && thankYouMessage.trim() !== '' ? thankYouMessage : 'Thank you for your response!'}
                </div>
                <div className="text-[#2E2E2E]/70 mb-8 text-center max-w-md animate-fade-in">Your answers have been successfully recorded.</div>
                
                {/* Create survey link */}
                <a 
                  href="https://smartformai.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-6 px-5 py-3 bg-gradient-to-r from-[#8F00FF] to-[#0066CC] text-white rounded-lg shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200 animate-fade-in-up flex items-center gap-2"
                >
                  <Logo size={28} />
                  Want to create a survey like this one?
                </a>
                
                <div className="mt-6 text-xs text-[#2E2E2E]/40 animate-fade-in-up">Powered by SmartFormAI</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Animations CSS */}
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
      `}</style>
    </div>
  );
};

export default SurveyPage;
