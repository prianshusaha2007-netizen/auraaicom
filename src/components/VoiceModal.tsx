import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, MicOff, Phone, Volume2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AuraOrb } from './AuraOrb';
import { AudioWaveform } from './AudioWaveform';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, userName = 'there' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleMessage = useCallback((event: any) => {
    console.log('Voice event:', event.type);
  }, []);

  const handleSpeakingChange = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking);
    if (chatRef.current) {
      setAnalyser(speaking ? chatRef.current.getOutputAnalyser() : chatRef.current.getInputAnalyser());
    }
  }, []);

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setTranscript(text);
      // Clear transcript after a delay
      setTimeout(() => setTranscript(''), 5000);
    }
  }, []);

  const startConversation = async () => {
    setIsConnecting(true);
    try {
      chatRef.current = new RealtimeChat(
        handleMessage,
        handleSpeakingChange,
        handleTranscript
      );
      await chatRef.current.init(undefined, userName);
      setIsConnected(true);
      setTranscript('');
      
      setTimeout(() => {
        if (chatRef.current) {
          setAnalyser(chatRef.current.getInputAnalyser());
        }
      }, 500);
      
      toast.success('Connected — speak naturally');
    } catch (error) {
      console.error('Error starting voice:', error);
      toast.error('Could not start voice mode');
    } finally {
      setIsConnecting(false);
    }
  };

  const endConversation = useCallback(() => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
    setTranscript('');
    setAnalyser(null);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    // Toggle the audio track
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
  }, [isMuted]);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      endConversation();
    };
  }, [endConversation]);

  useEffect(() => {
    if (!isOpen && isConnected) {
      endConversation();
    }
  }, [isOpen, isConnected, endConversation]);

  const handleClose = useCallback(() => {
    endConversation();
    onClose();
  }, [endConversation, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-background border-border p-0 overflow-hidden [&>button]:hidden">
        <div className="relative min-h-[500px] flex flex-col">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-accent/5" />
          
          {/* Animated background orbs */}
          <AnimatePresence>
            {isConnected && (
              <>
                <motion.div
                  className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-primary/10 blur-3xl"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-accent/10 blur-3xl"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-8">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-muted-foreground"
              onClick={handleClose}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Status text */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-lg font-medium text-foreground mb-1">
                {isConnecting ? 'Connecting...' : 
                 isConnected ? (isSpeaking ? 'AURRA is speaking' : 'Listening...') : 
                 'Voice Mode'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isConnected 
                  ? (isSpeaking ? 'Wait for AURRA to finish' : 'Speak naturally')
                  : 'Have a natural conversation with AURRA'}
              </p>
            </motion.div>

            {/* Main orb */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <AuraOrb 
                size="xl" 
                isThinking={isConnecting} 
                className={isSpeaking ? 'animate-pulse' : ''}
              />
            </motion.div>

            {/* Audio Waveform */}
            <AnimatePresence>
              {isConnected && (
                <motion.div
                  className="mt-6 w-full max-w-xs"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: 0.2 }}
                >
                  <AudioWaveform 
                    analyser={analyser} 
                    isActive={isConnected} 
                    mode={isSpeaking ? 'speaking' : 'listening'}
                    className="mx-auto"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transcript display */}
            <AnimatePresence>
              {transcript && (
                <motion.p
                  className="mt-4 text-sm text-muted-foreground text-center max-w-xs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  "{transcript}"
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="relative px-6 pb-8">
            <motion.div
              className="flex items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {!isConnected ? (
                <Button
                  size="lg"
                  className="rounded-full h-14 px-8 aura-gradient text-primary-foreground gap-2"
                  onClick={startConversation}
                  disabled={isConnecting}
                >
                  <Mic className="w-5 h-5" />
                  {isConnecting ? 'Connecting...' : 'Start Talking'}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-12 w-12"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <MicOff className="w-5 h-5 text-destructive" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                  
                  <Button
                    size="icon"
                    className="rounded-full h-14 w-14 bg-destructive hover:bg-destructive/90"
                    onClick={handleClose}
                  >
                    <Phone className="w-5 h-5 rotate-[135deg]" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-12 w-12"
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
