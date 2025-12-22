import { useCallback } from 'react';

interface ReminderIntent {
  isReminder: boolean;
  title: string;
  timeText: string;
  confidence: number;
}

// Patterns that indicate a reminder intent
const reminderPatterns = [
  /remind\s+me\s+(?:to\s+)?(.+?)(?:\s+(?:in|at|by|tomorrow|today))/i,
  /set\s+(?:a\s+)?reminder\s+(?:to\s+)?(.+?)(?:\s+(?:in|at|by|for))/i,
  /don'?t\s+let\s+me\s+forget\s+(?:to\s+)?(.+?)(?:\s+(?:in|at|by))?/i,
  /wake\s+me\s+up\s+(?:at\s+)?(.+)/i,
  /alarm\s+(?:for|at)\s+(.+)/i,
  /(.+?)\s+(?:yaad|remind)\s+(?:kar|karna|dena)/i,  // Hindi
  /(.+?)\s+(?:at|in)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d+\s*(?:minute|hour|min|hr)s?)/i,
];

// Time extraction patterns
const timePatterns = {
  inMinutes: /in\s+(\d+)\s*(?:minute|min|m)\s*s?/i,
  inHours: /in\s+(\d+)\s*(?:hour|hr|h)\s*s?/i,
  atTime: /at\s+(\d{1,2}(?::\d{2})?)\s*(am|pm)?/i,
  tomorrow: /tomorrow/i,
  today: /today/i,
  tonight: /tonight/i,
  morning: /(?:in\s+the\s+)?morning/i,
  evening: /(?:in\s+the\s+)?evening/i,
  night: /(?:at\s+)?night/i,
};

// Keywords that strongly suggest reminder intent
const reminderKeywords = [
  'remind', 'reminder', 'alarm', 'wake up', 'wake me',
  'don\'t forget', 'dont forget', 'remember to',
  'schedule', 'set timer', 'notify me',
  'yaad', 'remind karo', 'reminder set', 'bata dena',
  'alert me', 'ping me', 'tell me to'
];

// Keywords for health/habit reminders
const healthKeywords = [
  'water', 'drink', 'medicine', 'pill', 'tablet',
  'workout', 'exercise', 'gym', 'walk', 'run',
  'stretch', 'meditation', 'yoga', 'sleep', 'eat'
];

export const useReminderIntentDetection = () => {
  const detectReminderIntent = useCallback((text: string): ReminderIntent => {
    const lowerText = text.toLowerCase().trim();
    
    // Check for explicit reminder keywords
    const hasReminderKeyword = reminderKeywords.some(kw => lowerText.includes(kw));
    const hasHealthKeyword = healthKeywords.some(kw => lowerText.includes(kw));
    
    // Check for time indicators
    const hasTimeIndicator = Object.values(timePatterns).some(pattern => 
      pattern.test(lowerText)
    );
    
    // Try to match reminder patterns
    let title = '';
    let timeText = '';
    let matchedPattern = false;
    
    for (const pattern of reminderPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        matchedPattern = true;
        title = match[1]?.trim() || text;
        break;
      }
    }
    
    // Extract time text
    if (timePatterns.inMinutes.test(lowerText)) {
      const match = lowerText.match(timePatterns.inMinutes);
      timeText = match ? `in ${match[1]} minutes` : '';
    } else if (timePatterns.inHours.test(lowerText)) {
      const match = lowerText.match(timePatterns.inHours);
      timeText = match ? `in ${match[1]} hours` : '';
    } else if (timePatterns.atTime.test(lowerText)) {
      const match = lowerText.match(timePatterns.atTime);
      timeText = match ? `at ${match[1]}${match[2] || ''}` : '';
    } else if (timePatterns.tomorrow.test(lowerText)) {
      timeText = 'tomorrow';
    } else if (timePatterns.tonight.test(lowerText)) {
      timeText = 'tonight';
    } else if (timePatterns.morning.test(lowerText)) {
      timeText = 'in the morning';
    } else if (timePatterns.evening.test(lowerText)) {
      timeText = 'in the evening';
    }
    
    // Clean up title
    if (!title && (hasReminderKeyword || hasHealthKeyword)) {
      title = text
        .replace(/remind\s+me\s+(?:to\s+)?/gi, '')
        .replace(/set\s+(?:a\s+)?reminder\s+(?:to\s+)?/gi, '')
        .replace(/in\s+\d+\s*(?:minute|hour|min|hr|m|h)s?/gi, '')
        .replace(/at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, '')
        .replace(/tomorrow|today|tonight/gi, '')
        .trim();
    }
    
    // Calculate confidence
    let confidence = 0;
    if (hasReminderKeyword) confidence += 40;
    if (hasTimeIndicator) confidence += 30;
    if (matchedPattern) confidence += 20;
    if (hasHealthKeyword && hasTimeIndicator) confidence += 10;
    
    const isReminder = confidence >= 50 || (hasReminderKeyword && hasTimeIndicator);
    
    return {
      isReminder,
      title: title || text.slice(0, 50),
      timeText,
      confidence: Math.min(confidence, 100),
    };
  }, []);

  const generateReminderConfirmation = useCallback((title: string, timeText: string): string => {
    const confirmations = [
      `Done! I'll remind you to ${title} ${timeText}. 🔔`,
      `Got it. ${title} - ${timeText}. I won't forget! ✨`,
      `Okay, reminder set: ${title}. I'll nudge you ${timeText}. 👍`,
      `All set! "${title}" - ${timeText}. Leave it to me. 🙌`,
      `Noted! I'll remind you ${timeText} to ${title}. ⏰`,
    ];
    return confirmations[Math.floor(Math.random() * confirmations.length)];
  }, []);

  return {
    detectReminderIntent,
    generateReminderConfirmation,
  };
};
