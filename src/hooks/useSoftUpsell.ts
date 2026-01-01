import { useState, useEffect, useCallback } from 'react';

interface LimitHistory {
  date: string;
  hitLimit: boolean;
}

/**
 * Hook to manage soft upsell prompts for free users
 * Shows a gentle upsell after 3+ days of hitting the limit
 */
export const useSoftUpsell = () => {
  const [showNightUpsell, setShowNightUpsell] = useState(false);
  const [consecutiveLimitDays, setConsecutiveLimitDays] = useState(0);

  // Load limit history on mount
  useEffect(() => {
    const history = getLimitHistory();
    const consecutive = countConsecutiveLimitDays(history);
    setConsecutiveLimitDays(consecutive);
  }, []);

  /**
   * Get limit history from localStorage
   */
  const getLimitHistory = (): LimitHistory[] => {
    try {
      const stored = localStorage.getItem('aurra-limit-history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  /**
   * Save that the user hit their limit today
   */
  const recordLimitHit = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const history = getLimitHistory();
    
    // Check if already recorded today
    if (history.some(h => h.date === today && h.hitLimit)) {
      return;
    }
    
    // Add today's record
    const updatedHistory = [
      ...history.filter(h => h.date !== today),
      { date: today, hitLimit: true }
    ].slice(-30); // Keep last 30 days
    
    localStorage.setItem('aurra-limit-history', JSON.stringify(updatedHistory));
    
    // Update consecutive count
    const consecutive = countConsecutiveLimitDays(updatedHistory);
    setConsecutiveLimitDays(consecutive);
  }, []);

  /**
   * Count consecutive days the user hit their limit (ending today or yesterday)
   */
  const countConsecutiveLimitDays = (history: LimitHistory[]): number => {
    if (history.length === 0) return 0;
    
    const today = new Date();
    let count = 0;
    let checkDate = new Date(today);
    
    // Check up to 30 days back
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const record = history.find(h => h.date === dateStr);
      
      if (record?.hitLimit) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // If today doesn't have a hit, check if yesterday started a streak
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Streak broken
        break;
      }
    }
    
    return count;
  };

  /**
   * Check if we should show the night upsell
   * Conditions:
   * - It's after 9 PM
   * - User has hit limit 3+ consecutive days
   * - Haven't shown upsell in the last 3 days
   */
  const checkNightUpsell = useCallback((): boolean => {
    const hour = new Date().getHours();
    if (hour < 21) return false; // Only after 9 PM
    
    // Check consecutive days
    if (consecutiveLimitDays < 3) return false;
    
    // Check if we've shown upsell recently
    const lastUpsellDate = localStorage.getItem('aurra-last-upsell-date');
    if (lastUpsellDate) {
      const daysSinceUpsell = Math.floor(
        (Date.now() - new Date(lastUpsellDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceUpsell < 3) return false;
    }
    
    return true;
  }, [consecutiveLimitDays]);

  /**
   * Trigger the night upsell if conditions are met
   * Returns the upsell message or null
   */
  const triggerNightUpsell = useCallback((): string | null => {
    if (!checkNightUpsell()) return null;
    
    // Mark as shown
    localStorage.setItem('aurra-last-upsell-date', new Date().toISOString());
    setShowNightUpsell(true);
    
    return "You've been using AURRA a lot lately.\nIf it's helping, I can stay more available for you. 🙂";
  }, [checkNightUpsell]);

  /**
   * Dismiss the upsell
   */
  const dismissNightUpsell = useCallback(() => {
    setShowNightUpsell(false);
  }, []);

  /**
   * Get soft upsell message based on context
   */
  const getSoftLimitMessage = useCallback((): string => {
    if (consecutiveLimitDays >= 3) {
      return "I can still chat, but I'll be a bit limited today 🙂\nIf you want deeper help anytime, you can unlock more access.";
    }
    return "I can still chat, but I'll be a bit limited today 🙂";
  }, [consecutiveLimitDays]);

  return {
    showNightUpsell,
    consecutiveLimitDays,
    recordLimitHit,
    triggerNightUpsell,
    dismissNightUpsell,
    checkNightUpsell,
    getSoftLimitMessage,
  };
};
