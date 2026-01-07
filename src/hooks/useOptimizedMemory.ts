import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Optimized Memory System for AURRA
 * 
 * Core principles:
 * 1. Use summarized memory, not raw chats
 * 2. Inject only relevant memory
 * 3. Load yesterday + life summary, not everything
 * 4. Cache aggressively to minimize latency
 */

interface LifeMemorySummary {
  goals: string[];
  habits: string[];
  studyFocus: string[];
  communicationStyle: string;
  moodPattern: string;
  preferences: string[];
}

interface DaySummary {
  date: string;
  summary: string;
  topics: string[];
  emotionalState: string;
  openLoops: string[];
}

interface MemoryContext {
  lifeSummary: LifeMemorySummary;
  yesterdaySummary: DaySummary | null;
  recentPatterns: string[];
  activeGoals: string[];
  isLoaded: boolean;
}

// Cache TTL: 24 hours for life summary, 6 hours for yesterday
const LIFE_CACHE_TTL = 24 * 60 * 60 * 1000;
const YESTERDAY_CACHE_TTL = 6 * 60 * 60 * 1000;

export const useOptimizedMemory = () => {
  const [memoryContext, setMemoryContext] = useState<MemoryContext>({
    lifeSummary: {
      goals: [],
      habits: [],
      studyFocus: [],
      communicationStyle: 'balanced',
      moodPattern: 'neutral',
      preferences: [],
    },
    yesterdaySummary: null,
    recentPatterns: [],
    activeGoals: [],
    isLoaded: false,
  });
  
  const lifeCacheRef = useRef<{ data: LifeMemorySummary; timestamp: number } | null>(null);
  const yesterdayCacheRef = useRef<{ data: DaySummary | null; timestamp: number } | null>(null);
  const isLoadingRef = useRef(false);

  /**
   * Build life memory summary from database
   * This is the "master context" that persists across days
   */
  const buildLifeSummary = useCallback(async (): Promise<LifeMemorySummary> => {
    // Check cache first
    if (lifeCacheRef.current) {
      const age = Date.now() - lifeCacheRef.current.timestamp;
      if (age < LIFE_CACHE_TTL) {
        return lifeCacheRef.current.data;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return memoryContext.lifeSummary;

      // Fetch important life memories
      const { data: memories } = await supabase
        .from('life_memories')
        .select('memory_type, title, content, importance_score')
        .eq('user_id', user.id)
        .gte('importance_score', 5)
        .order('importance_score', { ascending: false })
        .limit(20);

      // Build summary from memories
      const goals: string[] = [];
      const habits: string[] = [];
      const studyFocus: string[] = [];
      const preferences: string[] = [];
      let communicationStyle = 'balanced';
      let moodPattern = 'neutral';

      memories?.forEach(m => {
        if (m.memory_type === 'goal') goals.push(m.title);
        else if (m.memory_type === 'habit') habits.push(m.title);
        else if (m.memory_type === 'preference') preferences.push(m.content);
        else if (m.memory_type === 'emotional_pattern') moodPattern = m.content;
      });

      // Fetch recent chat summaries for patterns
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data: summaries } = await supabase
        .from('chat_summaries')
        .select('key_topics, emotional_trend')
        .eq('user_id', user.id)
        .gte('created_at', twoWeeksAgo.toISOString())
        .limit(10);

      // Extract study/focus patterns
      summaries?.forEach(s => {
        s.key_topics?.forEach((topic: string) => {
          if (/study|learn|course|class|subject/i.test(topic)) {
            studyFocus.push(topic);
          }
        });
      });

      const lifeSummary: LifeMemorySummary = {
        goals: [...new Set(goals)].slice(0, 5),
        habits: [...new Set(habits)].slice(0, 5),
        studyFocus: [...new Set(studyFocus)].slice(0, 3),
        communicationStyle,
        moodPattern,
        preferences: [...new Set(preferences)].slice(0, 5),
      };

      // Cache it
      lifeCacheRef.current = { data: lifeSummary, timestamp: Date.now() };
      
      return lifeSummary;
    } catch (error) {
      console.error('Error building life summary:', error);
      return memoryContext.lifeSummary;
    }
  }, [memoryContext.lifeSummary]);

  /**
   * Get yesterday's summary
   */
  const getYesterdaySummary = useCallback(async (): Promise<DaySummary | null> => {
    // Check cache first
    if (yesterdayCacheRef.current) {
      const age = Date.now() - yesterdayCacheRef.current.timestamp;
      if (age < YESTERDAY_CACHE_TTL) {
        return yesterdayCacheRef.current.data;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: summaries } = await supabase
        .from('chat_summaries')
        .select('*')
        .eq('user_id', user.id)
        .gte('time_range_start', `${yesterdayStr}T00:00:00`)
        .lte('time_range_end', `${yesterdayStr}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (summaries && summaries.length > 0) {
        const s = summaries[0];
        const daySummary: DaySummary = {
          date: yesterdayStr,
          summary: s.summary,
          topics: s.key_topics || [],
          emotionalState: s.emotional_trend || 'neutral',
          openLoops: s.open_loops || [],
        };

        // Cache it
        yesterdayCacheRef.current = { data: daySummary, timestamp: Date.now() };
        
        return daySummary;
      }

      yesterdayCacheRef.current = { data: null, timestamp: Date.now() };
      return null;
    } catch (error) {
      console.error('Error fetching yesterday summary:', error);
      return null;
    }
  }, []);

  /**
   * Load all memory context (call once on app load)
   * This loads in parallel and doesn't block the UI
   */
  const loadMemoryContext = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      const [lifeSummary, yesterdaySummary] = await Promise.all([
        buildLifeSummary(),
        getYesterdaySummary(),
      ]);

      setMemoryContext({
        lifeSummary,
        yesterdaySummary,
        recentPatterns: [],
        activeGoals: lifeSummary.goals,
        isLoaded: true,
      });
    } catch (error) {
      console.error('Error loading memory context:', error);
      setMemoryContext(prev => ({ ...prev, isLoaded: true }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [buildLifeSummary, getYesterdaySummary]);

  /**
   * Get compact context for AI injection
   * This is what gets sent to the backend - SUMMARIZED, not raw
   */
  const getContextForAI = useCallback((): string => {
    if (!memoryContext.isLoaded) return '';

    const parts: string[] = [];
    const { lifeSummary, yesterdaySummary } = memoryContext;

    // Life context (implicit, never quoted)
    if (lifeSummary.goals.length > 0) {
      parts.push(`Active goals: ${lifeSummary.goals.join(', ')}`);
    }
    if (lifeSummary.habits.length > 0) {
      parts.push(`Regular habits: ${lifeSummary.habits.join(', ')}`);
    }
    if (lifeSummary.studyFocus.length > 0) {
      parts.push(`Study focus: ${lifeSummary.studyFocus.join(', ')}`);
    }
    if (lifeSummary.moodPattern !== 'neutral') {
      parts.push(`Mood pattern: ${lifeSummary.moodPattern}`);
    }

    // Yesterday context (if exists)
    if (yesterdaySummary) {
      parts.push(`Yesterday: ${yesterdaySummary.summary}`);
      if (yesterdaySummary.openLoops.length > 0) {
        parts.push(`Pending: ${yesterdaySummary.openLoops.slice(0, 2).join(', ')}`);
      }
    }

    return parts.join('\n');
  }, [memoryContext]);

  /**
   * Determine if this is a "deep" request requiring more context
   * Used for fast-path vs deep-path routing
   */
  const isDeepRequest = useCallback((message: string): boolean => {
    const lowerMsg = message.toLowerCase();
    
    // Deep patterns: study, coding, explain, teach, long-form
    const deepPatterns = [
      /explain|teach|help me (understand|learn)/i,
      /how (does|do|to)|what (is|are)/i,
      /debug|fix|code|programming/i,
      /step by step|in detail|detailed/i,
      /summarize|analyze|compare/i,
    ];
    
    return deepPatterns.some(p => p.test(lowerMsg)) || message.length > 100;
  }, []);

  /**
   * Get response path recommendation
   */
  const getResponsePath = useCallback((message: string): 'fast' | 'deep' => {
    return isDeepRequest(message) ? 'deep' : 'fast';
  }, [isDeepRequest]);

  // Load context on mount
  useEffect(() => {
    loadMemoryContext();
  }, [loadMemoryContext]);

  return {
    memoryContext,
    loadMemoryContext,
    getContextForAI,
    getResponsePath,
    isDeepRequest,
    isReady: memoryContext.isLoaded,
  };
};
