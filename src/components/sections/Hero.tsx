import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/logo';
import { Brain, Infinity, Shield, ArrowRight, Zap } from 'lucide-react';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [userPrompt, setUserPrompt] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const placeholders = [
    'Launch an autonomous market research agent',
    'Let AI rebuild our pricing research survey',
    'Turn customer feedback into self-improving studies',
    'Automate our user research loop',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f6f0ff] via-white to-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-gradient-to-br from-purple-200/60 via-pink-100 to-white blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(123,63,228,0.08), transparent 55%), radial-gradient(circle at 80% 10%, rgba(255,192,203,0.09), transparent 50%), linear-gradient(120deg, rgba(123,63,228,0.06), rgba(255,255,255,0) 60%)",
        }}
      />
      <div className="container relative mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <div className="mb-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white/70 px-5 py-2 shadow-sm backdrop-blur">
              <Logo size={30} />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">SmartFormAI</p>
                <p className="text-xs font-medium text-gray-500">Autonomous market research, end-to-end</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <span className="inline-flex items-center rounded-full border border-purple-100 bg-purple-50/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-purple-600">
              Built for modern insight teams
            </span>
            <h1 className="text-4xl font-satoshi font-semibold leading-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">The world’s first</span>
              <span className="block font-poppins text-4xl font-semibold text-[#2E2E2E] sm:text-5xl md:text-[3.4rem]">
                fully autonomous,{` `}
                <span className="relative inline-block pb-1">
                  <span className="relative z-10">survey-driven</span>
                  <span
                    className="absolute left-0 h-1 w-full rounded-full bg-[#7B3FE4]/50"
                    style={{ bottom: '-6px' }}
                  />
                </span>
              </span>
              <span className="block bg-gradient-to-r from-[#7B3FE4] via-[#5a45d7] to-[#2E2E2E] bg-clip-text text-transparent">
                market research engine
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
             Tell SurveyAgent what you want to learn — it creates the survey, collects responses, and explains the results through AI. Smarter insights, no manual work.
            </p>
          </div>

          <div className="mt-10 w-full max-w-3xl">
            <div className="rounded-2xl border border-black/5 bg-white/90 p-6 shadow-xl backdrop-blur">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">Describe the insight you’re chasing</p>
                  <span className="text-xs font-medium text-purple-600">New prompt ideas rotate in every few seconds</span>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      type="text"
                      placeholder={placeholders[placeholderIndex]}
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && userPrompt.trim()) {
                          navigate(`/train-agent?prompt=${encodeURIComponent(userPrompt.trim())}`);
                        }
                      }}
                      aria-label="Describe your market research goal"
                      className="h-12 rounded-xl border-black/10 bg-white text-sm font-medium text-gray-900 placeholder:text-gray-500 sm:text-base"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (userPrompt.trim()) {
                        localStorage.setItem('onboarding_prompt', userPrompt.trim());
                        localStorage.setItem('onboarding_active', 'true');
                        navigate(`/train-agent?prompt=${encodeURIComponent(userPrompt.trim())}`);
                      }
                    }}
                    disabled={!userPrompt.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E2E2E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-base"
                    size="lg"
                  >
                    <Infinity className="h-4 w-4" />
                    <span>Build My Agent</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-left text-xs text-gray-500 sm:text-sm">
                    Try prompts like “Interview churned customers about onboarding” or “Pressure-test our pricing with CFOs”.
                  </p>
                  <span className="text-xs font-medium text-gray-400">Live orchestration powered by SmartFormAI</span>
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-400">
              No login required · Try free · No credit card needed
            </p>
          </div>

          <div className="mt-14 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-6 text-left shadow-sm backdrop-blur">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Brain className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-gray-900">AI-generated questionnaires</p>
              <p className="mt-2 text-sm text-gray-600">
                Guided surveys tailored to your audience, scored and iterated automatically.
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-6 text-left shadow-sm backdrop-blur">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Zap className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Real-time analytics</p>
              <p className="mt-2 text-sm text-gray-600">
                Watch response quality, trends, and opportunities emerge as results stream in.
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-6 text-left shadow-sm backdrop-blur">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Shield className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Privacy-first workflows</p>
              <p className="mt-2 text-sm text-gray-600">
                Enterprise-grade security with audit trails and opt-in consent handling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

