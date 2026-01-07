import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCredits } from './useCredits';
import { toast } from 'sonner';

export interface ReferralWallet {
  id: string;
  user_id: string;
  cash_balance: number; // in paise
  credit_balance: number;
  total_referrals: number;
  successful_referrals: number;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  plan_type: string | null;
  commission_amount: number;
  status: 'pending' | 'confirmed' | 'reversed';
  hold_until: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface Withdrawal {
  id: string;
  amount: number;
  upi_id: string | null;
  status: 'requested' | 'processing' | 'paid' | 'failed';
  created_at: string;
  processed_at: string | null;
}

// Commission rates (10%)
const COMMISSION_RATES: Record<string, number> = {
  basic: 990,  // ₹9.90 in paise
  plus: 1990,  // ₹19.90 in paise
  pro: 2990,   // ₹29.90 in paise
};

const CREDITS_PER_REFERRAL = 5;
const MINIMUM_WITHDRAWAL = 10000; // ₹100 in paise
const HOLD_DAYS = 7;

export function useReferrals() {
  const { user } = useAuth();
  const { tier } = useCredits();
  const [wallet, setWallet] = useState<ReferralWallet | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isPaidUser = tier !== 'core';
  const canRefer = isPaidUser;

  // Fetch wallet and referral code
  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch or create wallet
      const { data: walletData, error: walletError } = await supabase
        .from('referral_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Error fetching wallet:', walletError);
      }

      if (walletData) {
        setWallet(walletData as ReferralWallet);
      } else {
        // Create wallet for user
        const { data: newWallet } = await supabase
          .from('referral_wallets')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (newWallet) setWallet(newWallet as ReferralWallet);
      }

      // Fetch referral code (only for paid users)
      if (isPaidUser) {
        const { data: codeData } = await supabase
          .from('referral_codes')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (codeData) {
          setReferralCode(codeData.code);
        }
      }

      // Fetch referrals
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsData) {
        setReferrals(referralsData as Referral[]);
      }

      // Fetch withdrawals
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (withdrawalsData) {
        setWithdrawals(withdrawalsData as Withdrawal[]);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isPaidUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate referral code (only for paid users)
  const generateReferralCode = useCallback(async (): Promise<string | null> => {
    if (!user?.id || !isPaidUser) {
      toast.error('Upgrade to a paid plan to unlock referrals');
      return null;
    }

    try {
      // Check if code already exists
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        setReferralCode(existing.code);
        return existing.code;
      }

      // Generate new code using the database function
      const { data: newCodeData, error: fnError } = await supabase
        .rpc('generate_referral_code');

      if (fnError) throw fnError;

      const newCode = newCodeData as string;

      // Insert the code
      const { error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: user.id,
          code: newCode,
        });

      if (insertError) throw insertError;

      setReferralCode(newCode);
      toast.success('Your referral code is ready!');
      return newCode;
    } catch (error) {
      console.error('Error generating referral code:', error);
      toast.error('Failed to generate referral code');
      return null;
    }
  }, [user?.id, isPaidUser]);

  // Apply referral code during signup
  const applyReferralCode = useCallback(async (code: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Look up the code
      const { data: codeData, error: lookupError } = await supabase
        .from('referral_codes')
        .select('user_id')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (lookupError || !codeData) {
        toast.error('Invalid referral code');
        return false;
      }

      // Don't allow self-referral
      if (codeData.user_id === user.id) {
        toast.error("You can't use your own referral code");
        return false;
      }

      // Check if user already has a referral
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_user_id', user.id)
        .maybeSingle();

      if (existingReferral) {
        toast.error('You already used a referral code');
        return false;
      }

      // Create the referral (pending until payment)
      const { error: insertError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: codeData.user_id,
          referred_user_id: user.id,
          referral_code: code.toUpperCase(),
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Update referral code uses count
      await supabase
        .from('referral_codes')
        .update({ uses_count: (await supabase.from('referral_codes').select('uses_count').eq('code', code.toUpperCase()).single()).data?.uses_count + 1 || 1 })
        .eq('code', code.toUpperCase());

      toast.success('Referral code applied! Bonus unlocks after your first payment.');
      return true;
    } catch (error) {
      console.error('Error applying referral code:', error);
      toast.error('Failed to apply referral code');
      return false;
    }
  }, [user?.id]);

  // Confirm referral after successful payment (called from payment flow)
  const confirmReferral = useCallback(async (referredUserId: string, planType: string): Promise<boolean> => {
    try {
      const commission = COMMISSION_RATES[planType] || 0;
      const holdUntil = new Date();
      holdUntil.setDate(holdUntil.getDate() + HOLD_DAYS);

      // Update referral to confirmed
      const { data: referralData, error: updateError } = await supabase
        .from('referrals')
        .update({
          plan_type: planType,
          commission_amount: commission,
          status: 'confirmed',
          hold_until: holdUntil.toISOString(),
          confirmed_at: new Date().toISOString(),
        })
        .eq('referred_user_id', referredUserId)
        .eq('status', 'pending')
        .select('referrer_id')
        .single();

      if (updateError || !referralData) return false;

      // Update referrer's wallet
      const { data: currentWallet } = await supabase
        .from('referral_wallets')
        .select('*')
        .eq('user_id', referralData.referrer_id)
        .single();

      if (currentWallet) {
        await supabase
          .from('referral_wallets')
          .update({
            cash_balance: (currentWallet.cash_balance || 0) + commission,
            credit_balance: (currentWallet.credit_balance || 0) + CREDITS_PER_REFERRAL,
            successful_referrals: (currentWallet.successful_referrals || 0) + 1,
          })
          .eq('user_id', referralData.referrer_id);
      }

      return true;
    } catch (error) {
      console.error('Error confirming referral:', error);
      return false;
    }
  }, []);

  // Request withdrawal
  const requestWithdrawal = useCallback(async (upiId: string): Promise<boolean> => {
    if (!user?.id || !wallet) return false;

    if (wallet.cash_balance < MINIMUM_WITHDRAWAL) {
      toast.error('Minimum withdrawal is ₹100');
      return false;
    }

    // Check for confirmed earnings past hold period
    const now = new Date();
    const { data: confirmedReferrals } = await supabase
      .from('referrals')
      .select('commission_amount')
      .eq('referrer_id', user.id)
      .eq('status', 'confirmed')
      .lt('hold_until', now.toISOString());

    const availableBalance = confirmedReferrals?.reduce((sum, r) => sum + (r.commission_amount || 0), 0) || 0;

    if (availableBalance < MINIMUM_WITHDRAWAL) {
      toast.error('Earnings still in 7-day hold period');
      return false;
    }

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: availableBalance,
          upi_id: upiId,
          status: 'requested',
        });

      if (error) throw error;

      // Update wallet balance
      await supabase
        .from('referral_wallets')
        .update({
          cash_balance: wallet.cash_balance - availableBalance,
        })
        .eq('user_id', user.id);

      toast.success('Withdrawal requested! You\'ll receive it within 3-5 business days.');
      fetchData();
      return true;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast.error('Failed to request withdrawal');
      return false;
    }
  }, [user?.id, wallet, fetchData]);

  // Get referral link
  const getReferralLink = useCallback((code: string): string => {
    return `${window.location.origin}/auth?ref=${code}`;
  }, []);

  // Copy referral code
  const copyReferralCode = useCallback(async () => {
    if (!referralCode) return;
    
    try {
      await navigator.clipboard.writeText(getReferralLink(referralCode));
      toast.success('Referral link copied!');
    } catch {
      toast.error('Failed to copy');
    }
  }, [referralCode, getReferralLink]);

  return {
    wallet,
    referralCode,
    referrals,
    withdrawals,
    isLoading,
    canRefer,
    isPaidUser,
    generateReferralCode,
    applyReferralCode,
    confirmReferral,
    requestWithdrawal,
    getReferralLink,
    copyReferralCode,
    refreshData: fetchData,
    minimumWithdrawal: MINIMUM_WITHDRAWAL / 100, // in rupees
    creditsPerReferral: CREDITS_PER_REFERRAL,
  };
}
