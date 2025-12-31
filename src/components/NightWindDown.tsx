import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Moon } from 'lucide-react';

interface NightWindDownProps {
  onDismiss: () => void;
  onSendMessage: (message: string) => void;
}

export const NightWindDown: React.FC<NightWindDownProps> = ({
  onDismiss,
  onSendMessage,
}) => {
  const [step, setStep] = useState<'ask' | 'response' | 'done'>('ask');
  const [feeling, setFeeling] = useState<string>('');

  const handleFeelingSelect = (selected: string) => {
    setFeeling(selected);
    setStep('response');
    
    // Save to local storage for tracking
    const today = new Date().toISOString().split('T')[0];
    const windDownHistory = JSON.parse(localStorage.getItem('aura-winddown-history') || '[]');
    windDownHistory.push({ date: today, feeling: selected });
    localStorage.setItem('aura-winddown-history', JSON.stringify(windDownHistory.slice(-30)));
    localStorage.setItem('aura-winddown-date', today);
    
    // Auto dismiss after showing response
    setTimeout(() => {
      setStep('done');
      setTimeout(onDismiss, 1500);
    }, 2500);
  };

  const getResponseMessage = (feel: string) => {
    switch (feel) {
      case 'good':
        return "That's great to hear. Rest well 🤍";
      case 'okay':
        return "That's fair.\nShowing up even a little still counts.\nSleep well 🤍";
      case 'heavy':
        return "Some days are like that.\nTomorrow's a fresh start.\nRest well 🤍";
      default:
        return "Sleep well 🤍";
    }
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
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Moon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
            >
              {step === 'ask' && (
                <p className="text-foreground">
                  Before you sleep...<br />
                  how did today feel overall?
                </p>
              )}
              {step === 'response' && (
                <p className="text-foreground whitespace-pre-line">
                  {getResponseMessage(feeling)}
                </p>
              )}
              {step === 'done' && (
                <p className="text-foreground">Goodnight 🌙</p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Response Options */}
        {step === 'ask' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="ml-11 flex gap-2 flex-wrap"
          >
            <Button
              variant="outline"
              onClick={() => handleFeelingSelect('good')}
              className="rounded-full"
            >
              Good ✨
            </Button>
            <Button
              variant="outline"
              onClick={() => handleFeelingSelect('okay')}
              className="rounded-full"
            >
              Okay
            </Button>
            <Button
              variant="outline"
              onClick={() => handleFeelingSelect('heavy')}
              className="rounded-full"
            >
              Heavy
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
