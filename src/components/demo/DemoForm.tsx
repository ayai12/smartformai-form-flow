
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FormStep {
  id: string;
  type: 'welcome' | 'multiple-choice' | 'rating' | 'text' | 'thank-you';
  question: string;
  description?: string;
  options?: string[];
  placeholder?: string;
}

const DemoForm: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const formSteps: FormStep[] = [
    {
      id: 'welcome',
      type: 'welcome',
      question: 'Customer Satisfaction Survey',
      description: 'Help us improve your experience by sharing your feedback. This will take less than 2 minutes.',
    },
    {
      id: 'visit-frequency',
      type: 'multiple-choice',
      question: 'How often do you visit our coffee shop?',
      options: [
        'This is my first time',
        'Occasionally (once a month)',
        'Regularly (once a week)',
        'Frequently (multiple times a week)'
      ],
    },
    {
      id: 'overall-rating',
      type: 'rating',
      question: 'How would you rate your overall experience?',
    },
    {
      id: 'staff-friendliness',
      type: 'rating',
      question: 'How would you rate our staff friendliness?',
    },
    {
      id: 'favorite-item',
      type: 'text',
      question: 'What is your favorite item on our menu?',
      placeholder: 'E.g., Cappuccino, Blueberry Muffin, etc.',
    },
    {
      id: 'improvement',
      type: 'text',
      question: 'Is there anything we could improve?',
      placeholder: 'Your feedback helps us get better',
    },
    {
      id: 'thank-you',
      type: 'thank-you',
      question: 'Thanks for your feedback!',
      description: 'We appreciate your time and will use your feedback to improve our services.',
    },
  ];

  const currentStep = formSteps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < formSteps.length - 1) {
      setLoading(true);
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex + 1);
        setLoading(false);
      }, 400);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleAnswerChange = (value: any) => {
    setAnswers({
      ...answers,
      [currentStep.id]: value,
    });
  };

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-smartform-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-smartform-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">{currentStep.question}</h3>
            <p className="text-gray-600 mb-8">{currentStep.description}</p>
            <Button className="bg-smartform-blue hover:bg-blue-700" onClick={handleNext}>
              Start Survey
            </Button>
          </div>
        );
        
      case 'multiple-choice':
        return (
          <div>
            <h3 className="text-xl font-bold mb-6">{currentStep.question}</h3>
            <div className="space-y-3">
              {currentStep.options?.map((option, index) => (
                <div 
                  key={index}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    answers[currentStep.id] === option
                      ? 'border-smartform-blue bg-smartform-blue/5'
                      : 'border-gray-200 hover:border-smartform-blue/50 hover:bg-gray-50'
                  }`}
                  onClick={() => handleAnswerChange(option)}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full mr-3 flex-shrink-0 ${
                      answers[currentStep.id] === option
                        ? 'bg-smartform-blue'
                        : 'border border-gray-300'
                    }`}>
                      {answers[currentStep.id] === option && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'rating':
        return (
          <div>
            <h3 className="text-xl font-bold mb-6">{currentStep.question}</h3>
            <div className="flex justify-center space-x-4 mb-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  className={`w-12 h-12 rounded-full text-lg font-medium transition-all ${
                    answers[currentStep.id] === rating
                      ? 'bg-smartform-blue text-white transform scale-110'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => handleAnswerChange(rating)}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div>
            <h3 className="text-xl font-bold mb-6">{currentStep.question}</h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-smartform-blue focus:border-transparent"
              placeholder={currentStep.placeholder}
              value={answers[currentStep.id] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
            />
          </div>
        );
        
      case 'thank-you':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-smartform-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-smartform-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">{currentStep.question}</h3>
            <p className="text-gray-600 mb-8">{currentStep.description}</p>
            <Button 
              variant="outline" 
              className="border-smartform-blue text-smartform-blue hover:bg-smartform-blue hover:text-white"
              onClick={() => setCurrentStepIndex(0)}
            >
              Start Over
            </Button>
          </div>
        );
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See SmartFormAI in Action</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Try our interactive demo to experience the power of conversational forms.
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-xl">
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-smartform-blue to-smartform-violet flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
                <span className="ml-2 font-medium">SmartFormAI</span>
              </div>
              <div className="text-sm text-gray-500">
                {currentStepIndex + 1} of {formSteps.length}
              </div>
            </div>
            
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
            
            {currentStep.type !== 'welcome' && currentStep.type !== 'thank-you' && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg flex justify-between">
                <Button 
                  variant="ghost" 
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                >
                  Back
                </Button>
                <Button 
                  className="bg-smartform-blue hover:bg-blue-700"
                  onClick={handleNext}
                  disabled={loading || !answers[currentStep.id]}
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            )}
          </Card>
          
          <div className="mt-12 text-center">
            <p className="text-gray-500 mb-4">Want to create your own intelligent form like this?</p>
            <Button className="bg-smartform-green hover:bg-green-600" asChild>
              <Link to="/signup">Create Your Form Free</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoForm;
