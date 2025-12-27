-- Life Memory Graph table for typed memory nodes
CREATE TABLE public.life_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('person', 'goal', 'habit', 'emotional_pattern', 'decision', 'preference', 'routine', 'relationship')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  importance_score INTEGER DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
  last_referenced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat summaries table for compressed history
CREATE TABLE public.chat_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 50,
  time_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
  time_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
  summary TEXT NOT NULL,
  emotional_trend TEXT,
  key_topics TEXT[] DEFAULT '{}',
  open_loops TEXT[] DEFAULT '{}',
  extracted_memories UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.life_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies for life_memories
CREATE POLICY "Users can view own life memories"
  ON public.life_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own life memories"
  ON public.life_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own life memories"
  ON public.life_memories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own life memories"
  ON public.life_memories FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for chat_summaries
CREATE POLICY "Users can view own chat summaries"
  ON public.chat_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat summaries"
  ON public.chat_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat summaries"
  ON public.chat_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_life_memories_user_type ON public.life_memories(user_id, memory_type);
CREATE INDEX idx_life_memories_importance ON public.life_memories(user_id, importance_score DESC);
CREATE INDEX idx_life_memories_last_referenced ON public.life_memories(user_id, last_referenced_at DESC);
CREATE INDEX idx_chat_summaries_user ON public.chat_summaries(user_id, created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_life_memories_updated_at
  BEFORE UPDATE ON public.life_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();