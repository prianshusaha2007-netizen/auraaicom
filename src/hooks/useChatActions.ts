import { useCallback, useState } from 'react';
import { useFocusMode } from './useFocusMode';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Subscription tier info for chat responses
const SUBSCRIPTION_INFO = {
  core: {
    name: 'Core (Free)',
    features: ['50 daily messages', 'Basic routines', 'Simple reminders'],
    price: 'Free',
  },
  plus: {
    name: 'Plus',
    features: [
      'Unlimited messages',
      'Advanced skill mentoring',
      'Deep memory & life graph',
      'Priority support',
      'Custom voice options',
    ],
    price: '₹299/month',
  },
  pro: {
    name: 'Pro',
    features: [
      'Everything in Plus',
      'Real-time coaching sessions',
      'Advanced analytics',
      'API access',
      'Priority features',
    ],
    price: '₹599/month',
  },
};

// Focus mode presets for chat
const FOCUS_PRESETS = {
  quick: { duration: 15, label: '15 min quick focus' },
  standard: { duration: 25, label: '25 min pomodoro' },
  deep: { duration: 45, label: '45 min deep work' },
  marathon: { duration: 60, label: '60 min marathon' },
};

export interface ChatActionResult {
  handled: boolean;
  response?: string;
  action?: string;
  data?: any;
}

export const useChatActions = () => {
  const navigate = useNavigate();
  const { isActive, startSession, endSession, currentSession, formatTime, remainingTime } = useFocusMode();
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  // Detect focus mode intent from message
  const detectFocusIntent = useCallback((message: string): {
    isFocusIntent: boolean;
    action: 'start' | 'stop' | 'status' | 'help' | null;
    duration?: number;
    withMusic?: boolean;
  } => {
    const lowerMessage = message.toLowerCase();
    
    // Start focus patterns
    const startPatterns = [
      /(?:start|begin|enable|activate)\s+(?:focus|pomodoro|deep\s*work)\s*(?:mode)?/i,
      /(?:focus|pomodoro)\s+(?:mode\s+)?(?:start|on|chalu)/i,
      /(?:need|want)\s+(?:to\s+)?(?:focus|concentrate)/i,
      /let'?s?\s+(?:focus|concentrate)/i,
    ];
    
    // Stop focus patterns
    const stopPatterns = [
      /(?:stop|end|disable|exit)\s+(?:focus|pomodoro)\s*(?:mode)?/i,
      /(?:focus\s+)?(?:mode\s+)?(?:off|band|stop)/i,
      /(?:done|finished)\s+(?:focusing|with\s+focus)/i,
    ];
    
    // Status patterns
    const statusPatterns = [
      /(?:how\s+(?:much|long)|what'?s)\s+(?:my\s+)?(?:focus|remaining|left)/i,
      /focus\s+(?:status|time|timer)/i,
    ];
    
    // Check for stop
    if (stopPatterns.some(p => p.test(lowerMessage))) {
      return { isFocusIntent: true, action: 'stop' };
    }
    
    // Check for status
    if (statusPatterns.some(p => p.test(lowerMessage))) {
      return { isFocusIntent: true, action: 'status' };
    }
    
    // Check for start
    if (startPatterns.some(p => p.test(lowerMessage))) {
      // Extract duration if mentioned
      let duration = 25; // Default pomodoro
      const durationMatch = lowerMessage.match(/(\d+)\s*(?:min|minute|mins)/i);
      if (durationMatch) {
        duration = parseInt(durationMatch[1]);
      } else if (lowerMessage.includes('quick') || lowerMessage.includes('short')) {
        duration = 15;
      } else if (lowerMessage.includes('deep') || lowerMessage.includes('long')) {
        duration = 45;
      } else if (lowerMessage.includes('marathon')) {
        duration = 60;
      }
      
      // Check for music
      const withMusic = /(?:with\s+)?(?:music|ambient|sounds|beats)/i.test(lowerMessage);
      
      return { isFocusIntent: true, action: 'start', duration, withMusic };
    }
    
    return { isFocusIntent: false, action: null };
  }, []);

  // Detect subscription/upgrade intent
  const detectSubscriptionIntent = useCallback((message: string): {
    isSubscriptionIntent: boolean;
    action: 'info' | 'upgrade' | 'compare' | null;
  } => {
    const lowerMessage = message.toLowerCase();
    
    const infoPatterns = [
      /(?:what|tell\s+me)\s+(?:is|about)\s+(?:plus|premium|subscription)/i,
      /(?:plus|premium|pro)\s+(?:features|benefits|plan)/i,
      /(?:subscription|plan)\s+(?:info|details|options)/i,
      /what\s+(?:do\s+)?(?:i\s+)?get\s+(?:with|in)\s+(?:plus|premium)/i,
    ];
    
    const upgradePatterns = [
      /(?:upgrade|subscribe|get)\s+(?:to\s+)?(?:plus|premium|pro)/i,
      /(?:want|like)\s+(?:to\s+)?(?:upgrade|subscribe)/i,
      /(?:how\s+(?:do|can)\s+(?:i\s+)?)?(?:upgrade|subscribe)/i,
      /(?:buy|purchase)\s+(?:plus|premium|subscription)/i,
    ];
    
    const comparePatterns = [
      /(?:compare|difference|vs)\s+(?:plans?|tiers?|subscriptions?)/i,
      /(?:plus\s+vs\s+pro|pro\s+vs\s+plus)/i,
      /(?:which\s+plan|what\s+tier)/i,
    ];
    
    if (upgradePatterns.some(p => p.test(lowerMessage))) {
      return { isSubscriptionIntent: true, action: 'upgrade' };
    }
    if (comparePatterns.some(p => p.test(lowerMessage))) {
      return { isSubscriptionIntent: true, action: 'compare' };
    }
    if (infoPatterns.some(p => p.test(lowerMessage))) {
      return { isSubscriptionIntent: true, action: 'info' };
    }
    
    return { isSubscriptionIntent: false, action: null };
  }, []);

  // Handle focus mode action
  const handleFocusAction = useCallback((message: string): ChatActionResult => {
    const focusIntent = detectFocusIntent(message);
    
    if (!focusIntent.isFocusIntent) {
      return { handled: false };
    }
    
    switch (focusIntent.action) {
      case 'start':
        if (isActive) {
          return {
            handled: true,
            response: `You're already in focus mode. ${formatTime(remainingTime)} remaining.\n\nWant to continue, or end this session first?`,
            action: 'focus_already_active',
          };
        }
        
        const duration = focusIntent.duration || 25;
        startSession(duration, undefined, focusIntent.withMusic);
        
        return {
          handled: true,
          response: `Focus mode activated 🎯\n\n${duration} minute session started${focusIntent.withMusic ? ' with ambient music' : ''}.\n\nI'll keep quiet and let you work. Just say "end focus" when you're done.`,
          action: 'focus_started',
          data: { duration, withMusic: focusIntent.withMusic },
        };
        
      case 'stop':
        if (!isActive) {
          return {
            handled: true,
            response: "You're not in focus mode right now.\n\nWant to start a focus session?",
            action: 'focus_not_active',
          };
        }
        
        endSession(false);
        return {
          handled: true,
          response: "Focus session ended.\n\nNice work! Even a little focus counts. 🙂",
          action: 'focus_ended',
        };
        
      case 'status':
        if (isActive) {
          return {
            handled: true,
            response: `You're in focus mode.\n\n⏱️ ${formatTime(remainingTime)} remaining.\n\nKeep going — you've got this!`,
            action: 'focus_status',
          };
        }
        return {
          handled: true,
          response: "You're not in focus mode right now.\n\nSay \"start focus mode\" when you're ready to concentrate.",
          action: 'focus_status_inactive',
        };
        
      default:
        return { handled: false };
    }
  }, [isActive, startSession, endSession, formatTime, remainingTime, detectFocusIntent]);

  // Handle subscription action
  const handleSubscriptionAction = useCallback((message: string): ChatActionResult => {
    const subIntent = detectSubscriptionIntent(message);
    
    if (!subIntent.isSubscriptionIntent) {
      return { handled: false };
    }
    
    switch (subIntent.action) {
      case 'info':
        const plusInfo = SUBSCRIPTION_INFO.plus;
        return {
          handled: true,
          response: `**${plusInfo.name}** gives you:\n\n${plusInfo.features.map(f => `• ${f}`).join('\n')}\n\nAll for ${plusInfo.price}.\n\nWant to upgrade now?`,
          action: 'subscription_info',
        };
        
      case 'compare':
        return {
          handled: true,
          response: `**Plan Comparison:**\n\n**Core (Free)**\n${SUBSCRIPTION_INFO.core.features.map(f => `• ${f}`).join('\n')}\n\n**Plus (${SUBSCRIPTION_INFO.plus.price})**\n${SUBSCRIPTION_INFO.plus.features.map(f => `• ${f}`).join('\n')}\n\n**Pro (${SUBSCRIPTION_INFO.pro.price})**\n${SUBSCRIPTION_INFO.pro.features.map(f => `• ${f}`).join('\n')}\n\nWhich one sounds right for you?`,
          action: 'subscription_compare',
        };
        
      case 'upgrade':
        setShowUpgradeSheet(true);
        return {
          handled: true,
          response: `Great choice! 🎉\n\nI'm opening the upgrade options for you. Pick the plan that works best!`,
          action: 'subscription_upgrade',
          data: { openUpgradeSheet: true },
        };
        
      default:
        return { handled: false };
    }
  }, [detectSubscriptionIntent]);

  // Main handler for chat-based actions
  const handleChatAction = useCallback((message: string): ChatActionResult => {
    // Try focus mode first
    const focusResult = handleFocusAction(message);
    if (focusResult.handled) return focusResult;
    
    // Try subscription
    const subscriptionResult = handleSubscriptionAction(message);
    if (subscriptionResult.handled) return subscriptionResult;
    
    return { handled: false };
  }, [handleFocusAction, handleSubscriptionAction]);

  return {
    handleChatAction,
    handleFocusAction,
    handleSubscriptionAction,
    detectFocusIntent,
    detectSubscriptionIntent,
    showUpgradeSheet,
    setShowUpgradeSheet,
    focusState: {
      isActive,
      remainingTime,
      formatTime,
      currentSession,
    },
    SUBSCRIPTION_INFO,
    FOCUS_PRESETS,
  };
};
