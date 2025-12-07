import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuraOrb } from '@/components/AuraOrb';
import { useAura } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';

const steps = [
  {
    id: 'welcome',
    title: "Hi, I'm AURA",
    subtitle: "Can we get to know each other?",
    type: 'intro',
  },
  {
    id: 'name',
    title: "What's your name?",
    subtitle: "I'd love to know what to call you",
    type: 'text',
    field: 'name',
    placeholder: "Your name",
  },
  {
    id: 'age',
    title: "How old are you?",
    subtitle: "This helps me understand you better",
    type: 'text',
    field: 'age',
    placeholder: "Your age",
    inputType: 'number',
  },
  {
    id: 'gender',
    title: "How do you identify?",
    subtitle: "Optional - skip if you prefer",
    type: 'options',
    field: 'gender',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
  },
  {
    id: 'profession',
    title: "What do you do?",
    subtitle: "Your daily life context helps me assist you",
    type: 'options',
    field: 'profession',
    options: ['Student', 'Working Professional', 'Business Owner', 'Homemaker', 'Other'],
  },
  {
    id: 'languages',
    title: "What languages do you speak?",
    subtitle: "I can talk in multiple languages",
    type: 'multiSelect',
    field: 'languages',
    options: ['English', 'Hindi', 'Bengali', 'Hinglish'],
  },
  {
    id: 'wakeTime',
    title: "When do you usually wake up?",
    subtitle: "I'll adjust my energy to match yours",
    type: 'time',
    field: 'wakeTime',
  },
  {
    id: 'sleepTime',
    title: "When do you usually sleep?",
    subtitle: "So I know when to be calming",
    type: 'time',
    field: 'sleepTime',
  },
  {
    id: 'tone',
    title: "How should I talk to you?",
    subtitle: "Choose your preferred communication style",
    type: 'options',
    field: 'tonePreference',
    options: ['Soft & Gentle', 'Playful & Fun', 'Motivating & Energetic', 'Mixed - Adapt to mood'],
  },
];

export const OnboardingScreen: React.FC = () => {
  const { updateUserProfile } = useAura();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    profession: '',
    languages: [] as string[],
    wakeTime: '07:00',
    sleepTime: '23:00',
    tonePreference: '',
  });

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      updateUserProfile({ ...formData, onboardingComplete: true });
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (step.type === 'multiSelect') {
      const current = formData[step.field as keyof typeof formData] as string[];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      setFormData({ ...formData, [step.field!]: updated });
    } else {
      setFormData({ ...formData, [step.field!]: option });
    }
  };

  const canProceed = () => {
    if (step.type === 'intro') return true;
    if (step.field === 'gender') return true; // Optional
    if (step.type === 'multiSelect') {
      return (formData[step.field as keyof typeof formData] as string[]).length > 0;
    }
    return !!formData[step.field as keyof typeof formData];
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress */}
      <div className="p-4">
        <div className="flex gap-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex-1 h-1 rounded-full transition-all duration-300',
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in" key={currentStep}>
          {/* Orb */}
          <div className="flex justify-center mb-8">
            <AuraOrb size={step.type === 'intro' ? 'xl' : 'lg'} />
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2 aura-gradient-text">{step.title}</h1>
            <p className="text-muted-foreground">{step.subtitle}</p>
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            {step.type === 'text' && (
              <Input
                value={formData[step.field as keyof typeof formData] as string}
                onChange={(e) => setFormData({ ...formData, [step.field!]: e.target.value })}
                placeholder={step.placeholder}
                type={step.inputType || 'text'}
                className="text-center text-lg py-6 rounded-xl"
              />
            )}

            {step.type === 'time' && (
              <Input
                type="time"
                value={formData[step.field as keyof typeof formData] as string}
                onChange={(e) => setFormData({ ...formData, [step.field!]: e.target.value })}
                className="text-center text-lg py-6 rounded-xl"
              />
            )}

            {(step.type === 'options' || step.type === 'multiSelect') && (
              <div className="grid gap-3">
                {step.options?.map((option) => {
                  const isSelected = step.type === 'multiSelect'
                    ? (formData[step.field as keyof typeof formData] as string[]).includes(option)
                    : formData[step.field as keyof typeof formData] === option;
                  
                  return (
                    <button
                      key={option}
                      onClick={() => handleOptionSelect(option)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option}</span>
                        {isSelected && <Check className="w-5 h-5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 flex gap-3">
        {!isFirstStep && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleBack}
            className="rounded-full px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!canProceed()}
          className={cn(
            'flex-1 rounded-full aura-gradient',
            !canProceed() && 'opacity-50'
          )}
        >
          {isLastStep ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Start with AURA
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
