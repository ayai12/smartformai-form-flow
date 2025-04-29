import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchFormById } from '../firebase/formFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFirestore, collection, addDoc, updateDoc, doc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

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
      const responseData = {
        formId,
        ownerId,
        answers,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-500">Loading survey...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>{error}</CardContent>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-smartform-blue/70 via-white to-smartform-violet/60 py-10 animate-fade-in">
      <div className="max-w-3xl w-full mx-auto bg-white rounded-3xl shadow-2xl p-0 overflow-hidden border-0 relative">
        {/* Branding Header */}
        <div className="absolute left-0 right-0 top-0 flex flex-col items-center z-10 pointer-events-none select-none">
          <div className="flex items-center gap-2 mt-8 animate-fade-in-down">
            <img src="/logo192.png" alt="SmartFormAI Logo" className="h-10 w-10 drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 8px #3b82f6aa)' }} />
            <span className="text-3xl font-black text-smartform-blue tracking-tight bg-gradient-to-r from-smartform-blue to-smartform-violet bg-clip-text text-transparent animate-gradient-move">SmartFormAI</span>
          </div>
          <span className="text-xs text-gray-400 mt-1 tracking-widest animate-fade-in-up">Effortless, Beautiful Surveys</span>
        </div>
        <div className="flex flex-col h-[90vh] max-h-[900px] min-h-[600px] relative">
          <div className="px-16 pt-24 pb-4 flex-shrink-0">
            <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-2 tracking-tight break-words animate-fade-in-up">
              {formTitle || 'Survey'}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col">
            {!started ? (
              <div className="flex flex-col items-center justify-center flex-1 animate-fade-in-up">
                <div className="text-7xl mb-4 animate-bounce">📝</div>
                <div className="text-2xl font-semibold mb-2 text-gray-800 text-center">Ready to start the survey?</div>
                <div className="text-gray-500 mb-8 text-center max-w-xs">Click below to begin. You can only answer one question at a time.</div>
                <Button className="w-full max-w-xs text-xl py-4 rounded-2xl bg-gradient-to-r from-smartform-blue to-smartform-violet shadow-lg hover:scale-105 hover:from-blue-700 hover:to-violet-700 transition-all duration-200 animate-fade-in" onClick={() => setStarted(true)}>
                  Start Survey
                </Button>
              </div>
            ) : !submittedState ? (
              <form className="space-y-10 flex-1 flex flex-col animate-fade-in-up" onSubmit={handleNext}>
                <div className="flex items-center justify-between mb-4 animate-fade-in">
                  <div className="text-base text-gray-500 font-semibold tracking-wide">Question {current + 1} of {questions.length}</div>
                  {showProgress && (
                    <div className="w-40 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner animate-grow-bar">
                      <div className="h-3 bg-gradient-to-r from-smartform-blue to-smartform-violet rounded-full transition-all duration-500" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
                    </div>
                  )}
                </div>
                {questions.length === 0 || !q ? (
                  <div className="text-center text-gray-400 italic py-8 animate-fade-in">No questions to display.</div>
                ) : (
                  <div
                    key={q.id}
                    className="border border-gray-100 rounded-2xl shadow-md px-6 py-7 space-y-4 bg-gradient-to-br from-white via-blue-50 to-violet-50 animate-fade-in-up"
                  >
                    <label
                      className="block font-bold text-gray-900 mb-2 text-lg tracking-tight animate-fade-in"
                      style={{
                        fontSize:
                          q.question && q.question.length > 100
                            ? '1.05rem'
                            : q.question && q.question.length > 60
                            ? '1.18rem'
                            : '1.32rem',
                        lineHeight: '1.35',
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
                      <div className="flex flex-col gap-3 mt-2 animate-fade-in-up">
                        {q.options &&
                          q.options.map((option: string, i: number) => (
                            <label
                              key={i}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100/40 transition cursor-pointer text-base font-medium animate-fade-in"
                              style={{ fontSize: '1.05rem', lineHeight: '1.25' }}
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                className="form-radio accent-smartform-blue w-5 h-5 shadow-sm"
                                checked={answers[q.id] === option}
                                onChange={() => handleChange(q.id, option)}
                                required={q.required}
                              />
                              <span className="break-words" style={{ maxWidth: '85%' }}>{option}</span>
                            </label>
                          ))}
                      </div>
                    )}
                    {(q.type === 'text' || q.type === 'email' || q.type === 'phone' || q.type === 'date') && (
                      <Input
                        type={q.type === 'email' ? 'email' : q.type === 'date' ? 'date' : 'text'}
                        className="w-full rounded-xl border border-gray-200 focus:border-smartform-blue focus:ring-2 focus:ring-blue-100 px-4 py-3 text-lg bg-white placeholder-gray-400 text-base animate-fade-in"
                        placeholder="Your answer..."
                        value={answers[q.id] || ''}
                        onChange={e => handleChange(q.id, e.target.value)}
                        required={q.required}
                        style={{ fontSize: '1.05rem' }}
                      />
                    )}
                    {q.type === 'rating' && (
                      <div
                        className="flex gap-3 mt-2 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-100 scrollbar-track-transparent pb-1 animate-fade-in-up"
                        style={{ maxWidth: '100%' }}
                      >
                        {Array.from({ length: q.scale }).map((_, i) => (
                          <label
                            key={i}
                            className="flex flex-col items-center cursor-pointer min-w-[2.2rem] sm:min-w-[2.5rem]"
                            style={{ fontSize: q.scale > 7 ? '1rem' : '1.18rem' }}
                          >
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              className={`form-radio accent-smartform-blue ${q.scale > 7 ? 'w-6 h-6' : 'w-7 h-7'} mb-1 shadow-sm`}
                              checked={answers[q.id] === i + 1}
                              onChange={() => handleChange(q.id, i + 1)}
                              required={q.required}
                            />
                            <span className="text-gray-600 font-semibold">{i + 1}</span>
                          </label>
                        ))}
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0" style={{ minWidth: '80px' }}>
                          (1 = Poor, {q.scale} = Excellent)
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="pt-4 pb-2 mt-auto animate-fade-in">
                  <Button
                    className="w-full text-xl py-4 rounded-2xl bg-gradient-to-r from-smartform-blue to-smartform-violet shadow-lg hover:scale-105 hover:from-blue-700 hover:to-violet-700 transition-all duration-200 animate-fade-in"
                    type="submit"
                    disabled={q?.required && !answered}
                  >
                    {isLast ? 'Submit' : 'Next'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 animate-fade-in-up">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <div className="text-3xl font-black text-smartform-blue mb-2 animate-fade-in-up">
                  {customThankYou && thankYouMessage && thankYouMessage.trim() !== '' ? thankYouMessage : 'Thank you for your response!'}
                </div>
                <div className="text-gray-500 mb-8 text-center animate-fade-in">Your answers have been recorded.</div>
                <div className="mt-2 text-xs text-gray-400 animate-fade-in-up">Powered by SmartFormAI</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Animations CSS */}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.7s ease; }
        .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(.22,1,.36,1); }
        .animate-fade-in-down { animation: fadeInDown 0.8s cubic-bezier(.22,1,.36,1); }
        .animate-bounce { animation: bounce 1.2s infinite alternate; }
        .animate-gradient-move { background-size: 300% 300%; animation: gradientMove 3s ease-in-out infinite; }
        .animate-grow-bar { animation: growBar 0.5s cubic-bezier(.22,1,.36,1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(32px);} to { opacity: 1; transform: none; } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-24px);} to { opacity: 1; transform: none; } }
        @keyframes bounce { 0% { transform: translateY(0); } 100% { transform: translateY(-10px); } }
        @keyframes gradientMove { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes growBar { from { width: 0; } to { width: 100%; } }
      `}</style>
    </div>
  );
};

export default SurveyPage;
