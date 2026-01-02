import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface DailyChat {
  id: string;
  chat_date: string;
  status: 'active' | 'archived';
  message_count: number;
  summary_id: string | null;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'aura';
  timestamp: Date;
  chat_date: string;
}

interface ArchivedChat {
  id: string;
  chat_date: string;
  messages: ChatMessage[];
  summary?: string;
  is_readonly: true;
}

export const useDailyChat = () => {
  const { user } = useAuth();
  const [todayMessages, setTodayMessages] = useState<ChatMessage[]>([]);
  const [currentDailyChat, setCurrentDailyChat] = useState<DailyChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  // Get today's date in user's timezone
  const getTodayDate = useCallback(() => {
    return format(new Date(), 'yyyy-MM-dd');
  }, []);

  // Initialize or get today's chat session
  const initializeDailyChat = useCallback(async () => {
    if (!user || initRef.current) return;
    initRef.current = true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const today = getTodayDate();
      
      // Check if today's chat exists
      const { data: existingChat, error: fetchError } = await supabase
        .from('daily_chats')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingChat) {
        // Resume today's active chat
        setCurrentDailyChat(existingChat as DailyChat);
      } else {
        // Archive yesterday's chat if exists
        await archivePreviousChats();
        
        // Create new daily chat
        const { data: newChat, error: insertError } = await supabase
          .from('daily_chats')
          .insert({
            user_id: user.id,
            chat_date: today,
            status: 'active',
            message_count: 0
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setCurrentDailyChat(newChat as DailyChat);
      }

      // Load today's messages only
      const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_date', today)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      setTodayMessages(
        (messages || []).map((msg) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender as 'user' | 'aura',
          timestamp: new Date(msg.created_at),
          chat_date: msg.chat_date
        }))
      );

    } catch (err) {
      console.error('Error initializing daily chat:', err);
      setError('Failed to initialize chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, getTodayDate]);

  // Archive all previous (non-today) active chats
  const archivePreviousChats = useCallback(async () => {
    if (!user) return;
    
    const today = getTodayDate();
    
    try {
      const { error } = await supabase
        .from('daily_chats')
        .update({ 
          status: 'archived',
          archived_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .neq('chat_date', today);

      if (error) throw error;
    } catch (err) {
      console.error('Error archiving previous chats:', err);
    }
  }, [user, getTodayDate]);

  // Add a message to today's chat
  const addMessage = useCallback(async (content: string, sender: 'user' | 'aura'): Promise<string | null> => {
    if (!user) return null;
    
    const today = getTodayDate();
    const id = crypto.randomUUID();
    const timestamp = new Date();

    // Optimistic update
    const newMessage: ChatMessage = { id, content, sender, timestamp, chat_date: today };
    setTodayMessages((prev) => [...prev, newMessage]);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          id,
          user_id: user.id,
          content,
          sender,
          chat_date: today
        });

      if (error) throw error;

      // Update message count
      if (currentDailyChat) {
        await supabase
          .from('daily_chats')
          .update({ message_count: (currentDailyChat.message_count || 0) + 1 })
          .eq('id', currentDailyChat.id);
      }

      return id;
    } catch (err) {
      console.error('Error saving message:', err);
      // Rollback optimistic update
      setTodayMessages((prev) => prev.filter((m) => m.id !== id));
      return null;
    }
  }, [user, currentDailyChat, getTodayDate]);

  // Update a message
  const updateMessage = useCallback(async (id: string, content: string) => {
    if (!user) return;

    setTodayMessages((prev) => 
      prev.map((msg) => (msg.id === id ? { ...msg, content } : msg))
    );

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ content })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating message:', err);
    }
  }, [user]);

  // Delete a message
  const deleteMessage = useCallback(async (id: string) => {
    if (!user) return;

    const prevMessages = [...todayMessages];
    setTodayMessages((prev) => prev.filter((msg) => msg.id !== id));

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting message:', err);
      setTodayMessages(prevMessages);
    }
  }, [user, todayMessages]);

  // Clear today's chat
  const clearTodayChat = useCallback(async () => {
    if (!user) return;
    
    const today = getTodayDate();
    setTodayMessages([]);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)
        .eq('chat_date', today);

      if (error) throw error;

      // Reset message count
      if (currentDailyChat) {
        await supabase
          .from('daily_chats')
          .update({ message_count: 0 })
          .eq('id', currentDailyChat.id);
      }
    } catch (err) {
      console.error('Error clearing today chat:', err);
    }
  }, [user, currentDailyChat, getTodayDate]);

  // Get archived chat by date (read-only)
  const getArchivedChat = useCallback(async (chatDate: string): Promise<ArchivedChat | null> => {
    if (!user) return null;

    try {
      // Get daily chat info
      const { data: dailyChat, error: chatError } = await supabase
        .from('daily_chats')
        .select('*, chat_summaries(summary)')
        .eq('user_id', user.id)
        .eq('chat_date', chatDate)
        .maybeSingle();

      if (chatError) throw chatError;
      if (!dailyChat) return null;

      // Get messages for that date
      const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_date', chatDate)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      return {
        id: dailyChat.id,
        chat_date: chatDate,
        messages: (messages || []).map((msg) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender as 'user' | 'aura',
          timestamp: new Date(msg.created_at),
          chat_date: msg.chat_date
        })),
        summary: (dailyChat as any).chat_summaries?.summary,
        is_readonly: true
      };
    } catch (err) {
      console.error('Error fetching archived chat:', err);
      return null;
    }
  }, [user]);

  // Get list of all daily chats for history
  const getChatHistory = useCallback(async (): Promise<DailyChat[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('daily_chats')
        .select('*')
        .eq('user_id', user.id)
        .order('chat_date', { ascending: false });

      if (error) throw error;
      return (data || []) as DailyChat[];
    } catch (err) {
      console.error('Error fetching chat history:', err);
      return [];
    }
  }, [user]);

  // Initialize on mount
  useEffect(() => {
    if (user) {
      initializeDailyChat();
    } else {
      setTodayMessages([]);
      setCurrentDailyChat(null);
      setIsLoading(false);
      initRef.current = false;
    }
  }, [user, initializeDailyChat]);

  // Reset init ref when user changes
  useEffect(() => {
    initRef.current = false;
  }, [user?.id]);

  return {
    todayMessages,
    currentDailyChat,
    isLoading,
    error,
    addMessage,
    updateMessage,
    deleteMessage,
    clearTodayChat,
    getArchivedChat,
    getChatHistory,
    getTodayDate,
    refreshChat: initializeDailyChat
  };
};
