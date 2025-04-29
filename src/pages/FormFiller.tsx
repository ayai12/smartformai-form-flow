import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Question } from './FormBuilder';

interface FormFillerProps {
  formTitle: string;
  questions: Question[];
  showProgress?: boolean;
  customThankYou?: boolean;
  thankYouMessage?: string;
  onSubmit?: (answers: Record<string, any>) => Promise<void> | void;
}

const FormFiller: React.FC<FormFillerProps> = ({
  formTitle,
  questions,
  showProgress = true,
  customThankYou = false,
  thankYouMessage = 'Thank you for your submission!',
  onSubmit,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (id: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setLoading(true);
      if (onSubmit) {
        await onSubmit(answers);
      }
      setSubmitted(true);
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
        <h2 className="text-2xl font-bold text-center mb-4">{customThankYou ? thankYouMessage : 'Thank you for your submission!'}</h2>
      </div>
    );
  }

  const q = questions[current];
  const isLast = current === questions.length - 1;
  const answered = q && (answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null);

  return (
    <form className="flex flex-col items-center w-full max-w-lg mx-auto py-10" onSubmit={handleNext}>
      <h2 className="text-2xl font-bold text-center mb-6">{formTitle}</h2>
      {showProgress && (
        <div className="mb-4 text-sm text-gray-500">Question {current + 1} of {questions.length}</div>
      )}
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>{q.question}</CardTitle>
        </CardHeader>
        <CardContent>
          {q.type === 'multiple_choice' && q.options && (
            <div className="space-y-2">
              {q.options.map((option, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    className="form-radio accent-smartform-blue w-4 h-4"
                    checked={answers[q.id] === option}
                    onChange={() => handleChange(q.id, option)}
                    required={q.required}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}
          {q.type === 'text' && (
            <Textarea
              value={answers[q.id] || ''}
              onChange={e => handleChange(q.id, e.target.value)}
              placeholder="Enter your answer"
              required={q.required}
            />
          )}
          {q.type === 'email' && (
            <Input
              type="email"
              value={answers[q.id] || ''}
              onChange={e => handleChange(q.id, e.target.value)}
              placeholder="Enter your email"
              required={q.required}
            />
          )}
          {q.type === 'phone' && (
            <Input
              type="tel"
              value={answers[q.id] || ''}
              onChange={e => handleChange(q.id, e.target.value)}
              placeholder="Enter your phone number"
              required={q.required}
            />
          )}
          {q.type === 'date' && (
            <Input
              type="date"
              value={answers[q.id] || ''}
              onChange={e => handleChange(q.id, e.target.value)}
              required={q.required}
            />
          )}
          {q.type === 'rating' && (
            <div className="flex gap-2 mt-2">
              {Array.from({ length: q.scale }).map((_, i) => (
                <label key={i} className="flex flex-col items-center cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    className="form-radio accent-smartform-blue w-6 h-6"
                    checked={answers[q.id] === i + 1}
                    onChange={() => handleChange(q.id, i + 1)}
                    required={q.required}
                  />
                  <span className="text-xs mt-1">{i + 1}</span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Button type="submit" className="w-full" disabled={!answered || loading}>
        {isLast ? (loading ? 'Submitting...' : 'Submit') : 'Next'}
      </Button>
    </form>
  );
};

export default FormFiller;
