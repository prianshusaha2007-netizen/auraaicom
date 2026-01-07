import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChatReminderMessage {
  type: 'reminder_set' | 'reminder_fired';
  title: string;
  time?: string;
}

/**
 * Hook for handling reminder delivery through chat messages.
 * This ensures reminders are ALWAYS delivered in chat, regardless of notification permissions.
 */
export function useChatReminders(
  addChatMessage: (msg: { content: string; sender: 'user' | 'aura' }) => void
) {
  const { user } = useAuth();
  const firedRemindersRef = useRef<Set<string>>(new Set());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Deliver reminder confirmation in chat
  const confirmReminderInChat = useCallback((title: string, timeText: string) => {
    const confirmations = [
      `Got it 🙂 I'll remind you ${timeText}.`,
      `Sure! I'll remind you ${timeText}: "${title}"`,
      `Reminder set! I'll ping you ${timeText} 💫`,
      `Done! "${title}" — ${timeText}`,
    ];
    const message = confirmations[Math.floor(Math.random() * confirmations.length)];
    addChatMessage({ content: message, sender: 'aura' });
  }, [addChatMessage]);

  // Deliver reminder in chat when it fires
  const fireReminderInChat = useCallback((title: string) => {
    const messages = [
      `Hey 🙂 you asked me to remind you: ${title}`,
      `Reminder time! ${title}`,
      `Just a gentle nudge — ${title} ✨`,
      `Time for: ${title}! You got this 💪`,
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    addChatMessage({ content: message, sender: 'aura' });
  }, [addChatMessage]);

  // Check for due reminders and fire them in chat
  const checkDueReminders = useCallback(async () => {
    if (!user?.id) return;

    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Fetch active reminders that are due
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .lte('time', now.toISOString())
        .gte('time', fiveMinutesAgo.toISOString());

      if (error) throw error;

      for (const reminder of reminders || []) {
        // Skip if already fired in this session
        if (firedRemindersRef.current.has(reminder.id)) continue;

        // Mark as fired
        firedRemindersRef.current.add(reminder.id);

        // Deliver in chat (MANDATORY)
        fireReminderInChat(reminder.text);

        // Mark as inactive in database
        await supabase
          .from('reminders')
          .update({ active: false })
          .eq('id', reminder.id);
      }
    } catch (error) {
      console.error('[ChatReminders] Error checking reminders:', error);
    }
  }, [user?.id, fireReminderInChat]);

  // Set up periodic check for due reminders
  useEffect(() => {
    if (!user?.id) return;

    // Initial check
    checkDueReminders();

    // Check every 30 seconds
    checkIntervalRef.current = setInterval(checkDueReminders, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [user?.id, checkDueReminders]);

  // Format time for display
  const formatTimeForChat = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);

    if (diffMins < 1) return 'right now';
    if (diffMins === 1) return 'in 1 minute';
    if (diffMins < 60) return `in ${diffMins} minutes`;
    if (diffHours === 1) return 'in 1 hour';
    if (diffHours < 24) return `in ${diffHours} hours`;
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === tomorrow.toDateString()) {
      return `tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    
    return `on ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }, []);

  return {
    confirmReminderInChat,
    fireReminderInChat,
    formatTimeForChat,
    checkDueReminders,
  };
}
