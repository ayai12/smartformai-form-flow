import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Question } from './FormBuilder';


interface FormPreviewModalProps {
  open: boolean;
  onClose: () => void;
  formTitle: string;
  questions: Question[];
  showProgress?: boolean;
  customThankYou?: boolean;
  thankYouMessage?: string;
}

const FormPreviewModal: React.FC<FormPreviewModalProps> = ({ open, onClose, formTitle, questions, showProgress = true, customThankYou = false, thankYouMessage }) => {
  const [submitted, setSubmitted] = React.useState(false);
  const [answers, setAnswers] = React.useState<Record<string, any>>({});
  const [current, setCurrent] = React.useState(0);
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setCurrent(0);
      setAnswers({});
      setStarted(false);
    }
  }, [open]);

  const handleChange = (id: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setSubmitted(true);
    }
  };

  if (!open) return null;

  const q = questions[current];
  const isLast = current === questions.length - 1;
  const answered = q && (answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden rounded-2xl shadow-2xl border-0 bg-white">
        <DialogTitle className="sr-only">{formTitle || 'Survey'}</DialogTitle>
        <DialogDescription className="sr-only">This is a preview of your form. Complete the questions and submit to see the thank you message.</DialogDescription>
        <div className="flex flex-col h-[90vh] max-h-[900px] min-h-[600px]">
          <div className="px-16 pt-14 pb-4 flex-shrink-0">
            <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2 tracking-tight break-words">
              {formTitle || 'Survey'}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col">
            {!started ? (
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="text-6xl mb-4">📝</div>
                <div className="text-xl font-semibold mb-2 text-gray-800 text-center">Ready to start the survey?</div>
                <div className="text-gray-500 mb-8 text-center max-w-xs">Click below to begin. You can only answer one question at a time.</div>
                <Button className="w-full max-w-xs text-lg py-3 rounded-xl bg-gradient-to-r from-smartform-blue to-smartform-violet shadow-md hover:from-blue-700 hover:to-violet-700" onClick={() => setStarted(true)}>
                  Start Survey
                </Button>
              </div>
            ) : !submitted ? (
              <form className="space-y-8 flex-1 flex flex-col" onSubmit={handleNext}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">Question {current + 1} of {questions.length}</div>
                  {showProgress && (
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-2 bg-smartform-blue rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
                    </div>
                  )}
                </div>
                {questions.length === 0 || !q ? (
                  <div className="text-center text-gray-400 italic py-8">No questions to display.</div>
                ) : (
                  <div
  key={q.id}
  className="border border-gray-100 rounded-xl shadow-sm px-3 py-3 space-y-2 bg-white"
>
  <label
    className="block font-medium text-gray-900 mb-1 text-base sm:text-base md:text-base lg:text-base xl:text-base"
    style={{
      fontSize:
        q.question && q.question.length > 100
          ? '0.92rem'
          : q.question && q.question.length > 60
          ? '1rem'
          : '1.12rem',
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
    <div className="flex flex-col gap-2 mt-1">
      {q.options &&
        q.options.map((option, i) => (
          <label
            key={i}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-blue-50 transition cursor-pointer text-sm sm:text-base"
            style={{ fontSize: '0.97rem', lineHeight: '1.25' }}
          >
            <input
              type="radio"
              name={`q-${q.id}`}
              className="form-radio accent-smartform-blue w-4 h-4 sm:w-5 sm:h-5"
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
      className="w-full rounded-lg border border-gray-200 focus:border-smartform-blue focus:ring-2 focus:ring-blue-100 px-3 py-2 text-base bg-gray-50 placeholder-gray-400 text-sm sm:text-base"
      placeholder="Your answer..."
      value={answers[q.id] || ''}
      onChange={e => handleChange(q.id, e.target.value)}
      required={q.required}
      style={{ fontSize: '0.98rem' }}
    />
  )}
  {q.type === 'rating' && (
    <div
      className="flex gap-2 mt-1 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-100 scrollbar-track-transparent pb-1"
      style={{ maxWidth: '100%' }}
    >
      {Array.from({ length: q.scale }).map((_, i) => (
        <label
          key={i}
          className="flex flex-col items-center cursor-pointer min-w-[1.8rem] sm:min-w-[2.1rem]"
          style={{ fontSize: q.scale > 7 ? '0.85rem' : '1rem' }}
        >
          <input
            type="radio"
            name={`q-${q.id}`}
            className={`form-radio accent-smartform-blue ${q.scale > 7 ? 'w-5 h-5' : 'w-6 h-6'} mb-1`}
            checked={answers[q.id] === i + 1}
            onChange={() => handleChange(q.id, i + 1)}
            required={q.required}
          />
          <span className="text-gray-600">{i + 1}</span>
        </label>
      ))}
      <span className="text-xs text-gray-400 ml-2 flex-shrink-0" style={{ minWidth: '80px' }}>
        (1 = Poor, {q.scale} = Excellent)
      </span>
    </div>
  )}
</div>
                )}
                <div className="pt-4 pb-2 mt-auto">
                  <Button
                    className="w-full text-lg py-3 rounded-xl bg-gradient-to-r from-smartform-blue to-smartform-violet shadow-md hover:from-blue-700 hover:to-violet-700"
                    type="submit"
                    disabled={q?.required && !answered}
                  >
                    {isLast ? 'Submit' : 'Next'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="text-5xl mb-4">🎉</div>
                <div className="text-2xl font-bold text-smartform-blue mb-2">
                  {customThankYou && thankYouMessage && thankYouMessage.trim() !== '' ? thankYouMessage : 'Thank you for your response!'}
                </div>
                <div className="text-gray-500 mb-8 text-center">Your answers have been recorded.</div>
                <Button variant="outline" className="mt-2" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormPreviewModal;
