import React, { useState } from 'react';
import { 
  MessageSquare, 
  Mail, 
  CalendarPlus, 
  StickyNote, 
  Bell,
  Check,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const automations = [
  { id: 'whatsapp', icon: MessageSquare, label: 'Draft WhatsApp Message', color: 'text-green-500' },
  { id: 'email', icon: Mail, label: 'Draft Email', color: 'text-blue-500' },
  { id: 'calendar', icon: CalendarPlus, label: 'Create Calendar Event', color: 'text-orange-500' },
  { id: 'notes', icon: StickyNote, label: 'Save Notes', color: 'text-yellow-500' },
  { id: 'reminder', icon: Bell, label: 'Schedule Reminder', color: 'text-purple-500' },
];

export const AutomationModal: React.FC<AutomationModalProps> = ({ isOpen, onClose }) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  const handleSelect = (id: string) => {
    setSelectedAction(id);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    toast({
      title: "Action Scheduled",
      description: "AURA will perform this after your approval.",
    });
    setShowConfirmation(false);
    setSelectedAction(null);
    onClose();
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedAction(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-center aura-gradient-text">
            Automation Tasks
          </DialogTitle>
        </DialogHeader>
        
        {!showConfirmation ? (
          <div className="grid gap-3 py-4">
            {automations.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleSelect(action.id)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl',
                    'bg-muted/50 hover:bg-muted transition-all duration-200',
                    'border border-transparent hover:border-primary/20'
                  )}
                >
                  <div className={cn('p-2 rounded-lg bg-card', action.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{action.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Confirm Action</p>
              <p className="text-sm text-muted-foreground">
                AURA will perform this after your approval.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="rounded-full px-6"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="rounded-full px-6 aura-gradient"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
