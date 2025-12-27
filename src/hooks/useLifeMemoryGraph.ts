import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LifeMemory {
  id: string;
  user_id: string;
  memory_type: 'person' | 'goal' | 'habit' | 'emotional_pattern' | 'decision' | 'preference' | 'routine' | 'relationship';
  title: string;
  content: string;
  metadata: Record<string, any>;
  importance_score: number;
  last_referenced_at: string;
  created_at: string;
  updated_at: string;
}

interface ChatSummary {
  id: string;
  user_id: string;
  message_count: number;
  time_range_start: string;
  time_range_end: string;
  summary: string;
  emotional_trend: string | null;
  key_topics: string[];
  open_loops: string[];
  created_at: string;
}

export const useLifeMemoryGraph = () => {
  const [memories, setMemories] = useState<LifeMemory[]>([]);
  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Fetch life memories
  const fetchMemories = useCallback(async (type?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('life_memories')
        .select('*')
        .order('importance_score', { ascending: false })
        .order('last_referenced_at', { ascending: false });

      if (type) {
        query = query.eq('memory_type', type);
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      setMemories((data || []) as LifeMemory[]);
    } catch (error) {
      console.error('Error fetching life memories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch chat summaries
  const fetchSummaries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setSummaries((data || []) as ChatSummary[]);
    } catch (error) {
      console.error('Error fetching chat summaries:', error);
    }
  }, []);

  // Add a new life memory
  const addMemory = useCallback(async (memory: Omit<LifeMemory, 'id' | 'user_id' | 'last_referenced_at' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('life_memories')
        .insert({
          user_id: user.id,
          ...memory
        })
        .select()
        .single();

      if (error) throw error;
      setMemories(prev => [data as LifeMemory, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding life memory:', error);
      return null;
    }
  }, []);

  // Update memory reference time (when it's used in conversation)
  const touchMemory = useCallback(async (memoryId: string) => {
    try {
      const { error } = await supabase
        .from('life_memories')
        .update({ last_referenced_at: new Date().toISOString() })
        .eq('id', memoryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating memory reference:', error);
    }
  }, []);

  // Delete a memory
  const deleteMemory = useCallback(async (memoryId: string) => {
    try {
      const { error } = await supabase
        .from('life_memories')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;
      setMemories(prev => prev.filter(m => m.id !== memoryId));
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  }, []);

  // Trigger chat summarization
  const triggerSummarization = useCallback(async () => {
    setIsSummarizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      
      if (result.summarized) {
        console.log('Chat summarized:', result);
        // Refresh memories and summaries
        await Promise.all([fetchMemories(), fetchSummaries()]);
        return result;
      }
      
      return result;
    } catch (error) {
      console.error('Error triggering summarization:', error);
      return null;
    } finally {
      setIsSummarizing(false);
    }
  }, [fetchMemories, fetchSummaries]);

  // Get context for AI (recent memories + summaries for system prompt)
  const getMemoryContext = useCallback((): string => {
    if (memories.length === 0 && summaries.length === 0) return '';

    let context = '\n====================================\nLIFE CONTEXT (from memory graph)\n====================================\n';

    // Add important memories
    const importantMemories = memories.filter(m => m.importance_score >= 7).slice(0, 10);
    if (importantMemories.length > 0) {
      context += '\n**Key things to remember:**\n';
      importantMemories.forEach(m => {
        context += `- [${m.memory_type}] ${m.title}: ${m.content}\n`;
      });
    }

    // Add recent summaries for continuity
    if (summaries.length > 0) {
      const recentSummary = summaries[0];
      context += `\n**Recent conversation context:**\n`;
      context += `Summary: ${recentSummary.summary}\n`;
      if (recentSummary.emotional_trend) {
        context += `Emotional trend: ${recentSummary.emotional_trend}\n`;
      }
      if (recentSummary.open_loops && recentSummary.open_loops.length > 0) {
        context += `Open loops to follow up: ${recentSummary.open_loops.join(', ')}\n`;
      }
    }

    return context;
  }, [memories, summaries]);

  // Search memories by content
  const searchMemories = useCallback(async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('life_memories')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('importance_score', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as LifeMemory[];
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMemories();
    fetchSummaries();
  }, [fetchMemories, fetchSummaries]);

  return {
    memories,
    summaries,
    isLoading,
    isSummarizing,
    fetchMemories,
    fetchSummaries,
    addMemory,
    touchMemory,
    deleteMemory,
    triggerSummarization,
    getMemoryContext,
    searchMemories,
  };
};
