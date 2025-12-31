import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAura } from '@/contexts/AuraContext';

interface FirstTimePreferencesProps {
  onComplete: () => void;
  onSendMessage: (message: string) => void;
}

type PreferenceStep = 'intro' | 'wake' | 'activities' | 'style' | 'reminder' | 'done';

const ACTIVITY_OPTIONS = [
  { id: 'college', label: 'College/School' },
  { id: 'work', label: 'Work' },
  { id: 'gym', label: 'Gym' },
  { id: 'coding', label: 'Coding' },
  { id: 'music', label: 'Music' },
  { id: 'reading', label: 'Reading' },
  { id: 'meditation', label: 'Meditation' },
];

export const FirstTimePreferences: React.FC<FirstTimePreferencesProps> = ({
  onComplete,
  onSendMessage,
}) => {
  const { userProfile, updateUserProfile } = useAura();
  const [step, setStep] = useState<PreferenceStep>('intro');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [activities, setActivities] = useState<string[]>([]);
  const [style, setStyle] = useState<'chill' | 'structured'>('chill');
  const [reminderStyle, setReminderStyle] = useState<'gentle' | 'direct'>('gentle');
  const [isTyping, setIsTyping] = useState(true);

  // Check if first time
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const hasCompletedPrefs = localStorage.getItem('aura-preferences-complete');
    if (!hasCompletedPrefs && userProfile.onboardingComplete) {
      setShouldShow(true);
    }
  }, [userProfile.onboardingComplete]);

  // Typing animation
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 1500);
    return () => clearTimeout(timer);
  }, [step]);

  const handleConfirm = () => {
    setStep('wake');
  };

  const handleWakeSubmit = () => {
    updateUserProfile({ wakeTime });
    setStep('activities');
  };

  const toggleActivity = (id: string) => {
    setActivities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleActivitiesSubmit = () => {
    // Save activities to profile
    updateUserProfile({ 
      professions: activities 
    });
    setStep('style');
  };

  const handleStyleSubmit = (selected: 'chill' | 'structured') => {
    setStyle(selected);
    updateUserProfile({ 
      tonePreference: selected === 'chill' ? 'casual' : 'supportive' 
    });
    setStep('reminder');
  };

  const handleReminderSubmit = (selected: 'gentle' | 'direct') => {
    setReminderStyle(selected);
    // Mark preferences as complete
    localStorage.setItem('aura-preferences-complete', 'true');
    localStorage.setItem('aura-reminder-style', selected);
    setStep('done');
    
    // Auto-complete after brief delay
    setTimeout(() => {
      onComplete();
      // Send a natural follow-up message
      onSendMessage("I'm ready to start");
    }, 2000);
  };

  const handleSkip = () => {
    localStorage.setItem('aura-preferences-complete', 'true');
    onComplete();
  };

  if (!shouldShow) return null;

  const messages: Record<PreferenceStep, string> = {
    intro: `Morning 🙂\nBefore we start — mind if I ask a couple quick things so I don't guess wrong?`,
    wake: `What time do you usually wake up?`,
    activities: `And what are the main things in your day right now?\nYou can pick a few.`,
    style: `Got it.\nHow strict do you want me to be — chill or structured?`,
    reminder: `Last one — want reminders gentle or direct?`,
    done: `Cool.\nI'll keep things flexible and calm.\nYou can change anything anytime.`,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4 pb-6"
      >
        {/* AURRA Message */}
        <div className="flex gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
            A
          </div>
          <div className="flex-1">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
            >
              {isTyping ? (
                <div className="flex gap-1 py-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <p className="text-foreground whitespace-pre-line">{messages[step]}</p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Response Options */}
        {!isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="ml-11"
          >
            {step === 'intro' && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleConfirm}
                  className="rounded-full"
                >
                  Sure
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="rounded-full text-muted-foreground"
                >
                  Skip for now
                </Button>
              </div>
            )}

            {step === 'wake' && (
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="rounded-full px-4 py-2 bg-muted/50 border border-border text-foreground"
                />
                <Button onClick={handleWakeSubmit} className="rounded-full">
                  Continue
                </Button>
              </div>
            )}

            {step === 'activities' && (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {ACTIVITY_OPTIONS.map(opt => (
                    <Button
                      key={opt.id}
                      variant={activities.includes(opt.id) ? 'default' : 'outline'}
                      onClick={() => toggleActivity(opt.id)}
                      className="rounded-full"
                      size="sm"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                {activities.length > 0 && (
                  <Button onClick={handleActivitiesSubmit} className="rounded-full">
                    Continue
                  </Button>
                )}
              </div>
            )}

            {step === 'style' && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={style === 'chill' ? 'default' : 'outline'}
                  onClick={() => handleStyleSubmit('chill')}
                  className="rounded-full"
                >
                  Chill
                </Button>
                <Button
                  variant={style === 'structured' ? 'default' : 'outline'}
                  onClick={() => handleStyleSubmit('structured')}
                  className="rounded-full"
                >
                  Structured
                </Button>
              </div>
            )}

            {step === 'reminder' && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => handleReminderSubmit('gentle')}
                  className="rounded-full"
                >
                  Gentle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReminderSubmit('direct')}
                  className="rounded-full"
                >
                  Direct
                </Button>
              </div>
            )}

            {step === 'done' && (
              <div className="text-muted-foreground text-sm">
                Starting your day...
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
