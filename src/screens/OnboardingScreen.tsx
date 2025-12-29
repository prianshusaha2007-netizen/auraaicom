import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuraOrb } from '@/components/AuraOrb';
import { useAura } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';

type StepType = 'intro' | 'text' | 'options' | 'multiSelect' | 'time';

interface Step {
  id: string;
  title: string;
  subtitle: string;
  type: StepType;
  field?: string;
  placeholder?: string;
  inputType?: string;
  options?: string[];
  maxSelect?: number;
  optional?: boolean;
}

// Simplified onboarding - soft, human, not interrogative
const steps: Step[] = [
  {
    id: 'welcome',
    title: "Hey. I'm AURRA.",
    subtitle: "Good to have you here.",
    type: 'intro',
  },
  {
    id: 'name',
    title: "What should I call you?",
    subtitle: "Just your name is enough",
    type: 'text',
    field: 'name',
    placeholder: "Your name",
  },
  {
    id: 'purpose',
    title: "What would you like me to be for you?",
    subtitle: "Choose what feels right",
    type: 'multiSelect',
    field: 'goals',
    options: ['Thinking partner', 'Daily support', 'Learning & growth', 'Just exploring'],
    maxSelect: 2,
  },
  {
    id: 'tone',
    title: "How should I talk to you?",
    subtitle: "I'll adapt to match your vibe",
    type: 'options',
    field: 'tonePreference',
    options: ['Calm & gentle', 'Playful & fun', 'Direct & clear', 'Adapt to my mood'],
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
    professions: [] as string[],
    goals: [] as string[],
    languages: ['English'] as string[],
    wakeTime: '07:00',
    sleepTime: '23:00',
    tonePreference: '',
  });

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      // Map goals to more detailed format for backend
      const goalMapping: Record<string, string> = {
        'Thinking partner': 'Work & Productivity',
        'Daily support': 'Mental Wellness',
        'Learning & growth': 'Study & Learning',
        'Just exploring': 'Creativity & Content',
      };
      
      const mappedGoals = formData.goals.map(g => goalMapping[g] || g);
      
      updateUserProfile({ 
        ...formData,
        goals: mappedGoals,
        onboardingComplete: true 
      });
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
      const fieldKey = step.field as keyof typeof formData;
      const current = formData[fieldKey] as string[];
      const maxSelect = step.maxSelect;
      
      if (current.includes(option)) {
        setFormData({ ...formData, [step.field!]: current.filter(o => o !== option) });
      } else if (!maxSelect || current.length < maxSelect) {
        setFormData({ ...formData, [step.field!]: [...current, option] });
      }
    } else {
      setFormData({ ...formData, [step.field!]: option });
    }
  };

  const canProceed = () => {
    if (step.type === 'intro') return true;
    if (step.optional) return true;
    if (step.type === 'multiSelect') {
      return (formData[step.field as keyof typeof formData] as string[]).length > 0;
    }
    return !!formData[step.field as keyof typeof formData];
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress - minimal, not distracting */}
      <div className="p-6 pt-8">
        <div className="flex gap-2 max-w-xs mx-auto">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex-1 h-1 rounded-full transition-all duration-500',
                index <= currentStep ? 'bg-primary' : 'bg-muted/50'
              )}
            />
          ))}
        </div>
      </div>

      {/* Content - centered, calm */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm animate-fade-in" key={currentStep}>
          {/* Orb - breathing, alive */}
          <div className="flex justify-center mb-8">
            <AuraOrb size={step.type === 'intro' ? 'xl' : 'lg'} />
          </div>

          {/* Text - clear, human */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-semibold mb-3">{step.title}</h1>
            <p className="text-muted-foreground text-sm">{step.subtitle}</p>
          </div>

          {/* Input Area - simple, spacious */}
          <div className="space-y-3">
            {step.type === 'text' && (
              <Input
                value={formData[step.field as keyof typeof formData] as string}
                onChange={(e) => setFormData({ ...formData, [step.field!]: e.target.value })}
                placeholder={step.placeholder}
                type={step.inputType || 'text'}
                className="text-center text-lg py-6 h-14 border-muted/50 focus:border-primary/50"
                autoFocus
              />
            )}

            {step.type === 'time' && (
              <Input
                type="time"
                value={formData[step.field as keyof typeof formData] as string}
                onChange={(e) => setFormData({ ...formData, [step.field!]: e.target.value })}
                className="text-center text-lg py-6 h-14 border-muted/50"
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
                        'p-4 rounded-2xl border transition-all duration-200 text-left',
                        'hover:bg-muted/30 active:scale-[0.98]',
                        isSelected
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border/50'
                      )}
                    >
                      <span className={cn(
                        'font-medium',
                        isSelected && 'text-primary'
                      )}>{option}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation - large, thumb-friendly */}
      <div className="p-6 pb-8 flex gap-3">
        {!isFirstStep && (
          <Button
            variant="ghost"
            size="lg"
            onClick={handleBack}
            className="px-6"
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
            'flex-1 h-14',
            !canProceed() && 'opacity-50'
          )}
        >
          {isLastStep ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Continue
            </>
          ) : isFirstStep ? (
            "Continue"
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
