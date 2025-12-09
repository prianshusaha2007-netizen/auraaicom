import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  profession: string;
  languages: string[];
  wakeTime: string;
  sleepTime: string;
  tonePreference: string;
  onboardingComplete: boolean;
}

export interface Memory {
  id: string;
  category: string;
  content: string;
  createdAt: Date;
}

export interface RoutineBlock {
  id: string;
  title: string;
  time: string;
  type: 'study' | 'work' | 'rest' | 'sleep' | 'exercise' | 'meal';
  completed: boolean;
}

export interface Reminder {
  id: string;
  text: string;
  time: string;
  active: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'aura';
  timestamp: Date;
  language?: string;
}

interface AuraContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  memories: Memory[];
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => void;
  deleteMemory: (id: string) => void;
  routineBlocks: RoutineBlock[];
  addRoutineBlock: (block: Omit<RoutineBlock, 'id'>) => void;
  toggleRoutineComplete: (id: string) => void;
  deleteRoutineBlock: (id: string) => void;
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateChatMessage: (id: string, content: string) => void;
  clearChatHistory: () => void;
  clearAllMemories: () => void;
  isLoading: boolean;
}

const defaultUserProfile: UserProfile = {
  name: '',
  age: '',
  gender: '',
  profession: '',
  languages: [],
  wakeTime: '07:00',
  sleepTime: '23:00',
  tonePreference: 'mixed',
  onboardingComplete: false,
};

const AuraContext = createContext<AuraContextType | undefined>(undefined);

export const AuraProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('aura-theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [routineBlocks, setRoutineBlocks] = useState<RoutineBlock[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', text: 'Drink water 💧', time: '09:00', active: true },
    { id: '2', text: 'Take a short break', time: '11:00', active: true },
    { id: '3', text: 'Lunch time 🍽️', time: '13:00', active: true },
  ]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Load profile from database
  useEffect(() => {
    if (!user) {
      setUserProfile(defaultUserProfile);
      setChatMessages([]);
      setIsLoading(false);
      return;
    }

    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // Load profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setUserProfile({
            name: profile.name || '',
            age: profile.age?.toString() || '',
            gender: profile.gender || '',
            profession: profile.profession || '',
            languages: profile.languages || [],
            wakeTime: profile.wake_time || '07:00',
            sleepTime: profile.sleep_time || '23:00',
            tonePreference: profile.tone_preference || 'mixed',
            onboardingComplete: true,
          });
        } else {
          setUserProfile(defaultUserProfile);
        }

        // Load chat messages
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (messages) {
          setChatMessages(
            messages.map((msg) => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender as 'user' | 'aura',
              timestamp: new Date(msg.created_at),
            }))
          );
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('aura-theme', theme);
  }, [theme]);

  // Save memories/routines/reminders to local storage (can be moved to DB later)
  useEffect(() => {
    localStorage.setItem('aura-memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('aura-routine', JSON.stringify(routineBlocks));
  }, [routineBlocks]);

  useEffect(() => {
    localStorage.setItem('aura-reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Load local storage data on mount
  useEffect(() => {
    const savedMemories = localStorage.getItem('aura-memories');
    const savedRoutine = localStorage.getItem('aura-routine');
    const savedReminders = localStorage.getItem('aura-reminders');

    if (savedMemories) setMemories(JSON.parse(savedMemories));
    if (savedRoutine) setRoutineBlocks(JSON.parse(savedRoutine));
    if (savedReminders) setReminders(JSON.parse(savedReminders));
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const updateUserProfile = useCallback(
    async (profile: Partial<UserProfile>) => {
      const newProfile = { ...userProfile, ...profile };
      setUserProfile(newProfile);

      if (user && profile.onboardingComplete) {
        try {
          const { error } = await supabase.from('profiles').upsert({
            id: user.id,
            name: newProfile.name,
            age: newProfile.age ? parseInt(newProfile.age) : null,
            gender: newProfile.gender || null,
            profession: newProfile.profession || null,
            languages: newProfile.languages,
            wake_time: newProfile.wakeTime,
            sleep_time: newProfile.sleepTime,
            tone_preference: newProfile.tonePreference,
          });

          if (error) throw error;
        } catch (error) {
          console.error('Error saving profile:', error);
          toast.error('Could not save profile');
        }
      }
    },
    [user, userProfile]
  );

  const addMemory = (memory: Omit<Memory, 'id' | 'createdAt'>) => {
    setMemories((prev) => [...prev, { ...memory, id: Date.now().toString(), createdAt: new Date() }]);
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const addRoutineBlock = (block: Omit<RoutineBlock, 'id'>) => {
    setRoutineBlocks((prev) => [...prev, { ...block, id: Date.now().toString() }]);
  };

  const toggleRoutineComplete = (id: string) => {
    setRoutineBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b)));
  };

  const deleteRoutineBlock = (id: string) => {
    setRoutineBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const addReminder = (reminder: Omit<Reminder, 'id'>) => {
    setReminders((prev) => [...prev, { ...reminder, id: Date.now().toString() }]);
  };

  const toggleReminder = (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const addChatMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'timestamp'>): string => {
      const id = crypto.randomUUID();
      const timestamp = new Date();
      setChatMessages((prev) => [...prev, { ...message, id, timestamp }]);

      // Save to database
      if (user) {
        supabase
          .from('chat_messages')
          .insert({
            id,
            user_id: user.id,
            content: message.content,
            sender: message.sender,
          })
          .then(({ error }) => {
            if (error) console.error('Error saving message:', error);
          });
      }

      return id;
    },
    [user]
  );

  const updateChatMessage = useCallback(
    (id: string, content: string) => {
      setChatMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, content } : msg)));

      // Update in database
      if (user) {
        supabase
          .from('chat_messages')
          .update({ content })
          .eq('id', id)
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error('Error updating message:', error);
          });
      }
    },
    [user]
  );

  const clearChatHistory = useCallback(async () => {
    setChatMessages([]);
    if (user) {
      const { error } = await supabase.from('chat_messages').delete().eq('user_id', user.id);
      if (error) console.error('Error clearing messages:', error);
    }
  }, [user]);

  const clearAllMemories = () => setMemories([]);

  return (
    <AuraContext.Provider
      value={{
        theme,
        toggleTheme,
        userProfile,
        updateUserProfile,
        memories,
        addMemory,
        deleteMemory,
        routineBlocks,
        addRoutineBlock,
        toggleRoutineComplete,
        deleteRoutineBlock,
        reminders,
        addReminder,
        toggleReminder,
        deleteReminder,
        chatMessages,
        addChatMessage,
        updateChatMessage,
        clearChatHistory,
        clearAllMemories,
        isLoading,
      }}
    >
      {children}
    </AuraContext.Provider>
  );
};

export const useAura = () => {
  const context = useContext(AuraContext);
  if (!context) throw new Error('useAura must be used within AuraProvider');
  return context;
};
