import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Moon, Calendar, Sparkles, Heart } from 'lucide-react';
import { useSoftUpsell } from '@/hooks/useSoftUpsell';

interface NightWindDownProps {
  onDismiss: () => void;
  onSendMessage: (message: string) => void;
}

export const NightWindDown: React.FC<NightWindDownProps> = ({
  onDismiss,
  onSendMessage,
}) => {
  const [step, setStep] = useState<'ask' | 'response' | 'upsell' | 'done'>('ask');
  const [feeling, setFeeling] = useState<string>('');
  const { triggerNightUpsell, consecutiveLimitDays, dismissNightUpsell } = useSoftUpsell();
  const [upsellMessage, setUpsellMessage] = useState<string | null>(null);

  // Check if we should show upsell after the main flow
  useEffect(() => {
    if (step === 'response' && consecutiveLimitDays >= 3) {
      const msg = triggerNightUpsell();
      if (msg) {
        setUpsellMessage(msg);
      }
    }
  }, [step, consecutiveLimitDays, triggerNightUpsell]);

  const handleAction = (action: 'reflect' | 'rest' | 'plan') => {
    switch (action) {
      case 'reflect':
        onSendMessage("I'd like to reflect on today");
        break;
      case 'rest':
        // Show soft response before dismissing
        setStep('response');
        setTimeout(() => {
          if (upsellMessage) {
            setStep('upsell');
          } else {
            setStep('done');
            setTimeout(onDismiss, 1500);
          }
        }, 2000);
        break;
      case 'plan':
        onSendMessage("Help me plan tomorrow");
        break;
    }
  };

  const handleUpsellAction = (action: 'see_plans' | 'not_now') => {
    dismissNightUpsell();
    if (action === 'see_plans') {
      onSendMessage("Show my subscription and credits");
    } else {
      setStep('done');
      setTimeout(onDismiss, 1500);
    }
  };

  const getResponseMessage = () => {
    const hour = new Date().getHours();
    if (hour >= 22) {
      return "Rest well tonight. Tomorrow's a fresh start. 🌙";
    }
    return "Take care. I'll be here when you need me. 🤍";
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <Moon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
            >
              {step === 'ask' && (
                <div>
                  <p className="text-foreground font-medium mb-1">
                    Before you wind down... 🌙
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Today felt productive, even if tiring.
                    <br />Want to reflect or just rest?
                  </p>
                </div>
              )}
              {step === 'response' && (
                <p className="text-foreground whitespace-pre-line">
                  {getResponseMessage()}
                </p>
              )}
              {step === 'upsell' && (
                <div>
                  <p className="text-foreground whitespace-pre-line mb-3">
                    {upsellMessage}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs"
                      onClick={() => handleUpsellAction('see_plans')}
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      See plans
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-xs text-muted-foreground"
                      onClick={() => handleUpsellAction('not_now')}
                    >
                      Not now
                    </Button>
                  </div>
                </div>
              )}
              {step === 'done' && (
                <p className="text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Goodnight 🌙
                </p>
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
              onClick={() => handleAction('reflect')}
              className="rounded-full"
            >
              Quick reflection
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('rest')}
              className="rounded-full"
            >
              Just rest
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('plan')}
              className="rounded-full flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              Plan tomorrow
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
