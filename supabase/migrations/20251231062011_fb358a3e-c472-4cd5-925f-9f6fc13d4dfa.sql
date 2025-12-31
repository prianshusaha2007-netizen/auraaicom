-- Create user_engagement table to track relationship evolution
CREATE TABLE public.user_engagement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_interaction_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_interaction_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_messages INTEGER NOT NULL DEFAULT 0,
  total_days_active INTEGER NOT NULL DEFAULT 1,
  mood_shares INTEGER NOT NULL DEFAULT 0,
  skill_sessions INTEGER NOT NULL DEFAULT 0,
  routines_created INTEGER NOT NULL DEFAULT 0,
  emotional_conversations INTEGER NOT NULL DEFAULT 0,
  relationship_phase TEXT NOT NULL DEFAULT 'introduction' CHECK (relationship_phase IN ('introduction', 'familiarity', 'trusted', 'companion')),
  subscription_tier TEXT NOT NULL DEFAULT 'core' CHECK (subscription_tier IN ('core', 'plus', 'pro')),
  upgrade_prompted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_engagement ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own engagement" ON public.user_engagement
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own engagement" ON public.user_engagement
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own engagement" ON public.user_engagement
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_engagement_updated_at
  BEFORE UPDATE ON public.user_engagement
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();