import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Clock,
  BellRing,
  BellOff,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/hooks/useNotifications';
import { useAura } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartReminderManagerProps {
  className?: string;
}

const quickReminders = [
  { text: 'Drink water 💧', delay: 30 },
  { text: 'Take a break 🧘', delay: 25 },
  { text: 'Stretch your body 🤸', delay: 45 },
  { text: 'Check posture 🪑', delay: 60 },
  { text: 'Eye rest - look away 👀', delay: 20 },
];

export const SmartReminderManager: React.FC<SmartReminderManagerProps> = ({ className }) => {
  const { reminders, addReminder, toggleReminder, deleteReminder } = useAura();
  const { permission, requestPermission, sendNotification, scheduleNotification } = useNotifications();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({ text: '', minutes: '30' });
  const [activeTimers, setActiveTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // Request notification permission on mount
  useEffect(() => {
    if (permission === 'default') {
      // Don't auto-request, let user click
    }
  }, [permission]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notifications enabled! You\'ll receive reminders even when the app is in background.');
    }
  };

  const handleAddReminder = () => {
    if (!newReminder.text.trim()) {
      toast.error('Please enter reminder text');
      return;
    }

    const minutes = parseInt(newReminder.minutes);
    const reminderTime = new Date(Date.now() + minutes * 60 * 1000);
    const timeString = reminderTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Add to context
    addReminder({ 
      text: newReminder.text, 
      time: timeString,
      active: true 
    });

    // Schedule notification
    if (permission === 'granted') {
      const scheduleAt = new Date(Date.now() + minutes * 60 * 1000);
      scheduleNotification({
        title: '⏰ AURA Reminder',
        body: newReminder.text,
        tag: `reminder-${Date.now()}`,
      }, scheduleAt);

      toast.success(`Reminder set for ${minutes} minutes from now!`);
    } else {
      toast.info('Reminder added! Enable notifications for alerts.');
    }

    setNewReminder({ text: '', minutes: '30' });
    setIsDialogOpen(false);
  };

  const handleQuickReminder = (text: string, delayMinutes: number) => {
    if (permission !== 'granted') {
      handleEnableNotifications();
      return;
    }

    const reminderTime = new Date(Date.now() + delayMinutes * 60 * 1000);
    const timeString = reminderTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    addReminder({ text, time: timeString, active: true });

    scheduleNotification({
      title: '⏰ AURA Reminder',
      body: text,
      tag: `quick-${Date.now()}`,
    }, reminderTime);

    toast.success(`"${text}" reminder set for ${delayMinutes} minutes!`);
  };

  const handleTestNotification = () => {
    sendNotification({
      title: '🎉 Test Notification',
      body: 'AURA notifications are working! You\'ll receive reminders here.',
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Notification Permission Card */}
      {permission !== 'granted' && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <BellOff className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Enable Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Get reminders even when app is in background
                </p>
              </div>
              <Button size="sm" onClick={handleEnableNotifications}>
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {permission === 'granted' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-500 text-sm"
        >
          <Check className="w-4 h-4" />
          <span>Notifications enabled</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto text-xs"
            onClick={handleTestNotification}
          >
            Test
          </Button>
        </motion.div>
      )}

      {/* Quick Reminders */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Quick Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickReminders.map((reminder) => (
              <Button
                key={reminder.text}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleQuickReminder(reminder.text, reminder.delay)}
              >
                {reminder.text} ({reminder.delay}m)
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Reminder */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full rounded-xl aura-gradient">
            <Plus className="w-4 h-4 mr-2" />
            Custom Reminder
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Set Reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              value={newReminder.text}
              onChange={(e) => setNewReminder({ ...newReminder, text: e.target.value })}
              placeholder="Remind me to..."
              className="rounded-xl"
            />
            <Select 
              value={newReminder.minutes} 
              onValueChange={(v) => setNewReminder({ ...newReminder, minutes: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="When?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">In 5 minutes</SelectItem>
                <SelectItem value="10">In 10 minutes</SelectItem>
                <SelectItem value="15">In 15 minutes</SelectItem>
                <SelectItem value="30">In 30 minutes</SelectItem>
                <SelectItem value="60">In 1 hour</SelectItem>
                <SelectItem value="120">In 2 hours</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddReminder} className="w-full rounded-xl aura-gradient">
              <Bell className="w-4 h-4 mr-2" />
              Set Reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Reminders */}
      {reminders.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BellRing className="w-4 h-4 text-primary" />
              Active Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <AnimatePresence>
              {reminders.map((reminder) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border border-border/50',
                    !reminder.active && 'opacity-50'
                  )}
                >
                  <Bell className={cn(
                    'w-4 h-4 shrink-0',
                    reminder.active ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{reminder.text}</p>
                    <p className="text-xs text-muted-foreground">{reminder.time}</p>
                  </div>
                  <Switch
                    checked={reminder.active}
                    onCheckedChange={() => toggleReminder(reminder.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteReminder(reminder.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
