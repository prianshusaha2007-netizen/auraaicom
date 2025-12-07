import React from 'react';
import { X, Mic, Volume2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AuraOrb } from './AuraOrb';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'speak' | 'listen';
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, mode }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-center aura-gradient-text">
            {mode === 'speak' ? 'Speak to AURA' : 'AURA is speaking'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-8 py-8">
          <AuraOrb size="xl" isThinking={mode === 'speak'} />
          
          <div className="text-center space-y-2">
            {mode === 'speak' ? (
              <>
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span className="text-sm font-medium">Hold to talk</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Voice mode coming soon...
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span className="text-sm font-medium">Playing response</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Text-to-speech coming soon...
                </p>
              </>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={onClose}
            className="rounded-full px-8"
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
