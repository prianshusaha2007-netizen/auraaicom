import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle2, XCircle, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';

type TestState = 'idle' | 'testing' | 'success' | 'error';

interface MicrophoneTestProps {
  onTestComplete?: (success: boolean) => void;
}

export const MicrophoneTest: React.FC<MicrophoneTestProps> = ({ onTestComplete }) => {
  const [testState, setTestState] = useState<TestState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const testTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (testTimeoutRef.current) {
      clearTimeout(testTimeoutRef.current);
      testTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 128) * 100);
    
    setAudioLevel(normalizedLevel);
    animationRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startTest = useCallback(async () => {
    cleanup();
    setTestState('testing');
    setErrorMessage('');
    setAudioLevel(0);

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported on this device/browser');
      }

      // Try to get microphone access
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
      } catch (constraintError) {
        // Fallback to basic audio
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;

      // Set up audio analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);

      // Start monitoring audio levels
      updateAudioLevel();

      // Auto-complete test after 3 seconds
      testTimeoutRef.current = setTimeout(() => {
        cleanup();
        setTestState('success');
        onTestComplete?.(true);
      }, 3000);

    } catch (error: any) {
      cleanup();
      setTestState('error');
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        if (Capacitor.isNativePlatform()) {
          setErrorMessage('Microphone access denied. Please enable microphone in your device settings.');
        } else {
          setErrorMessage('Microphone access denied. Please allow access in your browser settings.');
        }
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone found. Please connect a microphone.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setErrorMessage('Microphone is in use by another app.');
      } else {
        setErrorMessage(error.message || 'Could not access microphone.');
      }
      
      onTestComplete?.(false);
    }
  }, [cleanup, updateAudioLevel, onTestComplete]);

  const stopTest = useCallback(() => {
    cleanup();
    setTestState('idle');
    setAudioLevel(0);
  }, [cleanup]);

  return (
    <div className="space-y-4">
      {/* Status display */}
      <div className={cn(
        'p-4 rounded-xl border-2 transition-all',
        testState === 'success' && 'border-green-500/50 bg-green-500/10',
        testState === 'error' && 'border-destructive/50 bg-destructive/10',
        testState === 'testing' && 'border-primary/50 bg-primary/10',
        testState === 'idle' && 'border-muted bg-muted/50'
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
            testState === 'success' && 'bg-green-500/20',
            testState === 'error' && 'bg-destructive/20',
            testState === 'testing' && 'bg-primary/20 animate-pulse',
            testState === 'idle' && 'bg-muted'
          )}>
            {testState === 'testing' ? (
              <Mic className="w-6 h-6 text-primary" />
            ) : testState === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : testState === 'error' ? (
              <XCircle className="w-6 h-6 text-destructive" />
            ) : (
              <MicOff className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold">
              {testState === 'testing' && 'Testing microphone...'}
              {testState === 'success' && 'Microphone works!'}
              {testState === 'error' && 'Test failed'}
              {testState === 'idle' && 'Microphone test'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {testState === 'testing' && 'Speak to see the audio level'}
              {testState === 'success' && 'Your microphone is ready for voice features'}
              {testState === 'error' && errorMessage}
              {testState === 'idle' && 'Check if your microphone works'}
            </p>
          </div>
        </div>

        {/* Audio level indicator */}
        {testState === 'testing' && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Audio Level</span>
            </div>
            <Progress value={audioLevel} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {audioLevel > 30 ? '🎤 Sound detected!' : 'Speak into your microphone...'}
            </p>
          </div>
        )}
      </div>

      {/* Action button */}
      <Button
        onClick={testState === 'testing' ? stopTest : startTest}
        variant={testState === 'testing' ? 'destructive' : 'default'}
        className="w-full rounded-xl"
        size="lg"
      >
        {testState === 'testing' ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Stop Test
          </>
        ) : testState === 'success' ? (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Test Again
          </>
        ) : testState === 'error' ? (
          <>
            <Mic className="w-5 h-5 mr-2" />
            Retry Test
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 mr-2" />
            Test Microphone
          </>
        )}
      </Button>

      {/* Help text */}
      {testState === 'error' && Capacitor.isNativePlatform() && (
        <p className="text-xs text-center text-muted-foreground">
          On mobile, go to Settings → Apps → AURA → Permissions → Microphone
        </p>
      )}
    </div>
  );
};
