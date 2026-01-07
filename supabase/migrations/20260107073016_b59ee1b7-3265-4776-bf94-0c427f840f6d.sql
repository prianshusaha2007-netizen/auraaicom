-- Create referral_wallets table for tracking user earnings
CREATE TABLE public.referral_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_balance INTEGER NOT NULL DEFAULT 0, -- in paise (1/100 rupee)
  credit_balance INTEGER NOT NULL DEFAULT 0, -- internal credits
  total_referrals INTEGER NOT NULL DEFAULT 0,
  successful_referrals INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_wallet UNIQUE (user_id)
);

-- Create referrals table for tracking individual referrals
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  plan_type TEXT, -- basic, plus, pro (null if not subscribed yet)
  commission_amount INTEGER DEFAULT 0, -- in paise
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, reversed
  hold_until TIMESTAMP WITH TIME ZONE, -- 7-day anti-fraud hold
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_referral UNIQUE (referred_user_id)
);

-- Create referral_codes table (user can generate once they're paid)
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uses_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_referral_code UNIQUE (user_id)
);

-- Create withdrawals table for tracking cash withdrawals
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in paise
  upi_id TEXT,
  bank_details JSONB,
  status TEXT NOT NULL DEFAULT 'requested', -- requested, processing, paid, failed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.referral_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_wallets
CREATE POLICY "Users can view own wallet" ON public.referral_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.referral_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.referral_wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for referrals
CREATE POLICY "Users can view their referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_user_id);

-- RLS policies for referral_codes
CREATE POLICY "Users can view own referral code" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can lookup active codes" ON public.referral_codes
  FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can create own referral code" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral code" ON public.referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can request withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'AURRA' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_referral_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_referral_wallets_updated_at
  BEFORE UPDATE ON public.referral_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_wallet_updated_at();