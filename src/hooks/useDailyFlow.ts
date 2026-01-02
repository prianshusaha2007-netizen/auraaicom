import { useState, useEffect, useCallback } from 'react';
import { hasGreetedToday, markGreetingShown } from '@/utils/dailyGreeting';
import { supabase } from '@/integrations/supabase/client';

interface DailyFlowState {
  showPreferences: boolean;
  showMorningBriefing: boolean;
  showWindDown: boolean;
  showRoutineOnboarding: boolean;
  isFirstTimeUser: boolean;
  currentDayChat: string;
  hasGreetedToday: boolean;
  isNewDay: boolean;
}

export const useDailyFlow = () => {
  const [state, setState] = useState<DailyFlowState>({
    showPreferences: false,
    showMorningBriefing: false,
    showWindDown: false,
    showRoutineOnboarding: false,
    isFirstTimeUser: false,
    currentDayChat: '',
    hasGreetedToday: hasGreetedToday(),
    isNewDay: false,
  });

  // Check daily flow conditions
  useEffect(() => {
    const checkDailyFlow = async () => {
      const now = new Date();
      const hour = now.getHours();
      const today = now.toISOString().split('T')[0];
      
      // Check if first-time user (no preferences completed)
      const hasCompletedPrefs = localStorage.getItem('aura-preferences-complete');
      const isFirstTime = !hasCompletedPrefs;
      
      // Check if routine onboarding is needed
      const hasCompletedRoutineOnboarding = localStorage.getItem('aurra-routine-onboarding-complete');
      const shouldShowRoutineOnboarding = !hasCompletedRoutineOnboarding && !isFirstTime;
      
      // Check morning briefing (5am-11am, once per day)
      const lastMorningBriefing = localStorage.getItem('aura-morning-briefing-date');
      const shouldShowMorning = hour >= 5 && hour < 11 && lastMorningBriefing !== today && !isFirstTime && !shouldShowRoutineOnboarding;
      
      // Check wind-down (9pm-2am, once per day)
      const lastWindDown = localStorage.getItem('aura-winddown-date');
      const shouldShowWindDown = (hour >= 21 || hour < 2) && lastWindDown !== today && !isFirstTime;
      
      // DAILY CHAT MODEL: Check if this is a new day
      const lastChatDate = localStorage.getItem('aura-chat-date');
      const isNewDay = lastChatDate !== today;
      
      if (isNewDay) {
        // Archive previous day's chats in database
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Archive all active chats that are not today
            await supabase
              .from('daily_chats')
              .update({ 
                status: 'archived',
                archived_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .eq('status', 'active')
              .neq('chat_date', today);

            // Create today's chat if it doesn't exist
            const { data: existingChat } = await supabase
              .from('daily_chats')
              .select('id')
              .eq('user_id', user.id)
              .eq('chat_date', today)
              .maybeSingle();

            if (!existingChat) {
              await supabase
                .from('daily_chats')
                .insert({
                  user_id: user.id,
                  chat_date: today,
                  status: 'active',
                  message_count: 0
                });
            }
          }
        } catch (error) {
          console.error('Error managing daily chats:', error);
        }
      }
      
      localStorage.setItem('aura-chat-date', today);
      
      setState({
        showPreferences: isFirstTime,
        showMorningBriefing: shouldShowMorning,
        showWindDown: shouldShowWindDown,
        showRoutineOnboarding: shouldShowRoutineOnboarding,
        isFirstTimeUser: isFirstTime,
        currentDayChat: today,
        hasGreetedToday: hasGreetedToday(),
        isNewDay,
      });
    };
    
    checkDailyFlow();
    
    // Re-check every hour
    const interval = setInterval(checkDailyFlow, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const dismissPreferences = useCallback(() => {
    localStorage.setItem('aura-preferences-complete', 'true');
    setState(prev => ({ ...prev, showPreferences: false, isFirstTimeUser: false }));
  }, []);

  const dismissMorningBriefing = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('aura-morning-briefing-date', today);
    setState(prev => ({ ...prev, showMorningBriefing: false }));
  }, []);

  const dismissWindDown = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('aura-winddown-date', today);
    setState(prev => ({ ...prev, showWindDown: false }));
  }, []);

  const dismissRoutineOnboarding = useCallback(() => {
    localStorage.setItem('aurra-routine-onboarding-complete', 'true');
    setState(prev => ({ ...prev, showRoutineOnboarding: false }));
  }, []);

  // Adjust tomorrow's routine based on tonight's feeling
  const adjustTomorrowRoutine = useCallback((intensity: 'lighter' | 'same' | 'heavier') => {
    const adjustment = {
      date: new Date().toISOString(),
      intensity,
      applied: false,
    };
    localStorage.setItem('aurra-tomorrow-adjustment', JSON.stringify(adjustment));
  }, []);

  // Debug/simulation functions
  const triggerMorningFlow = useCallback(() => {
    setState(prev => ({ ...prev, showMorningBriefing: true }));
  }, []);

  const triggerNightFlow = useCallback(() => {
    setState(prev => ({ ...prev, showWindDown: true, isFirstTimeUser: false }));
  }, []);

  const triggerFirstTimeFlow = useCallback(() => {
    localStorage.removeItem('aura-preferences-complete');
    setState(prev => ({ ...prev, showPreferences: true, isFirstTimeUser: true }));
  }, []);

  const triggerRoutineOnboarding = useCallback(() => {
    localStorage.removeItem('aurra-routine-onboarding-complete');
    setState(prev => ({ ...prev, showRoutineOnboarding: true }));
  }, []);

  const resetAllFlowState = useCallback(() => {
    localStorage.removeItem('aura-preferences-complete');
    localStorage.removeItem('aura-morning-briefing-date');
    localStorage.removeItem('aura-winddown-date');
    localStorage.removeItem('aura-morning-flow-date');
    localStorage.removeItem('aura-winddown-history');
    localStorage.removeItem('aura-last-greeting-date');
    localStorage.removeItem('aurra-routine-onboarding-complete');
    localStorage.removeItem('aurra-tomorrow-adjustment');
    setState({
      showPreferences: false,
      showMorningBriefing: false,
      showWindDown: false,
      showRoutineOnboarding: false,
      isFirstTimeUser: false,
      currentDayChat: new Date().toISOString().split('T')[0],
      hasGreetedToday: false,
      isNewDay: false,
    });
  }, []);

  // Function to mark greeting as shown
  const markGreeting = useCallback(() => {
    markGreetingShown();
    setState(prev => ({ ...prev, hasGreetedToday: true }));
  }, []);

  return {
    ...state,
    dismissPreferences,
    dismissMorningBriefing,
    dismissWindDown,
    dismissRoutineOnboarding,
    adjustTomorrowRoutine,
    markGreeting,
    // Debug functions
    triggerMorningFlow,
    triggerNightFlow,
    triggerFirstTimeFlow,
    triggerRoutineOnboarding,
    resetAllFlowState,
  };
};
