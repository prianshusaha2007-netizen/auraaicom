import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceReminderInputProps {
  onTranscription: (text: string) => void;
  onCancel?: () => void;
  isFullScreen?: boolean;
  placeholder?: string;
}

export const VoiceReminderInput: React.FC<VoiceReminderInputProps> = ({
  onTranscription,
  onCancel,
  isFullScreen = false,
  placeholder = "Listening... Say something like 'Remind me to call mom in 30 minutes'"
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Also supports Hindi with 'hi-IN'
    
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setTranscript(finalTranscript || interimTranscript);
      
      if (finalTranscript) {
        setIsProcessing(true);
        setTimeout(() => {
          onTranscription(finalTranscript);
          setIsProcessing(false);
          setIsListening(false);
          setTranscript('');
        }, 500);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission denied');
      } else if (event.error === 'no-speech') {
        toast.info('No speech detected. Try again?');
      } else {
        toast.error('Could not recognize speech');
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  }, [onTranscription]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    // The SpeechRecognition will auto-stop
  }, []);

  if (isFullScreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex flex-col items-center justify-center p-6"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={onCancel}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Animated orb */}
          <motion.div
            className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center mb-8",
              isListening 
                ? "bg-primary/20 animate-pulse" 
                : "bg-muted"
            )}
            animate={isListening ? {
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 0 0 rgba(var(--primary), 0.4)',
                '0 0 0 20px rgba(var(--primary), 0)',
                '0 0 0 0 rgba(var(--primary), 0)',
              ]
            } : {}}
            transition={{ duration: 1.5, repeat: isListening ? Infinity : 0 }}
          >
            {isProcessing ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : isListening ? (
              <Mic className="w-12 h-12 text-primary" />
            ) : (
              <MicOff className="w-12 h-12 text-muted-foreground" />
            )}
          </motion.div>

          {/* Status text */}
          <motion.p
            key={transcript || 'placeholder'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-lg max-w-md"
          >
            {isProcessing ? (
              <span className="text-primary">Processing...</span>
            ) : transcript ? (
              <span className="text-foreground">"{transcript}"</span>
            ) : isListening ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <span className="text-muted-foreground">Tap to start speaking</span>
            )}
          </motion.p>

          {/* Action button */}
          <Button
            size="lg"
            className={cn(
              "mt-8 rounded-full px-8",
              isListening ? "bg-destructive hover:bg-destructive/90" : "aura-gradient"
            )}
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Speaking
              </>
            )}
          </Button>

          {/* Examples */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-3">Try saying:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                '"Remind me to call mom in 30 minutes"',
                '"Wake me up at 7 tomorrow"',
                '"Water reminder every hour"',
              ].map((example, i) => (
                <span
                  key={i}
                  className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground"
                >
                  {example}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Compact inline version
  return (
    <Button
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      className="rounded-full"
      onClick={isListening ? stopListening : startListening}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isListening ? (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Mic className="w-4 h-4" />
        </motion.div>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
};
