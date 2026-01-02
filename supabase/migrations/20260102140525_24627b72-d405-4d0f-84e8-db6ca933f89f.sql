-- Add chat_date column to chat_messages for daily chat grouping
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS chat_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Add index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_date 
ON public.chat_messages(user_id, chat_date);

-- Create daily_chats table for tracking daily chat sessions
CREATE TABLE IF NOT EXISTS public.daily_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chat_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  summary_id UUID REFERENCES public.chat_summaries(id) ON DELETE SET NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, chat_date)
);

-- Enable RLS on daily_chats
ALTER TABLE public.daily_chats ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_chats
CREATE POLICY "Users can view own daily chats" 
ON public.daily_chats FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily chats" 
ON public.daily_chats FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily chats" 
ON public.daily_chats FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily chats" 
ON public.daily_chats FOR DELETE 
USING (auth.uid() = user_id);