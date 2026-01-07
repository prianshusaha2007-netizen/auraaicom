import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Gift, 
  Wallet, 
  Copy, 
  Share2, 
  Users, 
  IndianRupee,
  Sparkles,
  Clock,
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useReferrals } from '@/hooks/useReferrals';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const ReferralsScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    wallet,
    referralCode,
    referrals,
    withdrawals,
    isLoading,
    canRefer,
    isPaidUser,
    generateReferralCode,
    requestWithdrawal,
    getReferralLink,
    copyReferralCode,
    minimumWithdrawal,
    creditsPerReferral,
  } = useReferrals();

  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const cashBalanceRupees = (wallet?.cash_balance || 0) / 100;
  const canWithdraw = cashBalanceRupees >= minimumWithdrawal;

  const handleGenerateCode = async () => {
    await generateReferralCode();
  };

  const handleShare = async () => {
    if (!referralCode) return;
    
    const shareData = {
      title: 'Join AURRA',
      text: `Hey! I've been using AURRA as my personal AI companion. Use my code ${referralCode} to sign up!`,
      url: getReferralLink(referralCode),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyReferralCode();
      }
    } catch {
      copyReferralCode();
    }
  };

  const handleWithdraw = async () => {
    if (!upiId.trim()) {
      toast.error('Please enter your UPI ID');
      return;
    }

    setIsWithdrawing(true);
    const success = await requestWithdrawal(upiId);
    setIsWithdrawing(false);
    
    if (success) {
      setShowWithdrawDialog(false);
      setUpiId('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return 'bg-green-500/10 text-green-600';
      case 'pending':
      case 'requested':
      case 'processing':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'reversed':
      case 'failed':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Referrals & Earnings</h1>
            <p className="text-xs text-muted-foreground">
              Invite friends, earn rewards
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Upgrade prompt for free users */}
        {!isPaidUser && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Unlock Referrals</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upgrade to ₹99+ plan to start earning from referrals. Get 10% commission on every friend who subscribes!
                  </p>
                  <Button onClick={() => navigate('/subscription')} size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="w-5 h-5" />
              Your Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Cash Balance</p>
                <p className="text-2xl font-bold flex items-center">
                  <IndianRupee className="w-5 h-5" />
                  {cashBalanceRupees.toFixed(2)}
                </p>
                {cashBalanceRupees > 0 && cashBalanceRupees < minimumWithdrawal && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Min ₹{minimumWithdrawal} to withdraw
                  </p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Bonus Credits</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {wallet?.credit_balance || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  For deeper AI usage
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                disabled={!canWithdraw}
                onClick={() => setShowWithdrawDialog(true)}
              >
                Withdraw
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/subscription')}
              >
                View Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral Code Card */}
        {canRefer && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="w-5 h-5" />
                Your Referral Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referralCode ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 p-3 rounded-lg bg-muted font-mono text-lg text-center font-bold tracking-wider">
                      {referralCode}
                    </div>
                    <Button variant="outline" size="icon" onClick={copyReferralCode}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <Button onClick={handleShare} className="w-full">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share with Friends
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate your unique code to start earning
                  </p>
                  <Button onClick={handleGenerateCode}>
                    <Gift className="w-4 h-4 mr-2" />
                    Generate Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* How it Works */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">1</div>
              <div>
                <p className="font-medium">Share your code</p>
                <p className="text-sm text-muted-foreground">Send your referral link to friends</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">2</div>
              <div>
                <p className="font-medium">Friend subscribes</p>
                <p className="text-sm text-muted-foreground">When they pay for any plan (₹99/199/299)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">3</div>
              <div>
                <p className="font-medium">You earn 10%</p>
                <p className="text-sm text-muted-foreground">₹9.90 to ₹29.90 per referral + {creditsPerReferral} bonus credits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5" />
              Your Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{wallet?.total_referrals || 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-green-600">{wallet?.successful_referrals || 0}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
            </div>

            {referrals.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {referrals.slice(0, 5).map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">
                          {referral.plan_type ? `${referral.plan_type.charAt(0).toUpperCase() + referral.plan_type.slice(1)} Plan` : 'Pending signup'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(referral.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        {referral.commission_amount > 0 && (
                          <p className="text-sm font-medium">₹{(referral.commission_amount / 100).toFixed(2)}</p>
                        )}
                        <Badge className={cn("text-xs", getStatusColor(referral.status))}>
                          {referral.status === 'confirmed' && <Check className="w-3 h-3 mr-1" />}
                          {referral.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {referral.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Withdrawals History */}
        {withdrawals.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">₹{(withdrawal.amount / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge className={cn("text-xs", getStatusColor(withdrawal.status))}>
                      {withdrawal.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Earnings are held for 7 days to prevent fraud. If a referred user cancels or refunds, the commission is reversed.
          </p>
        </div>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Earnings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Available to withdraw: <span className="font-bold text-foreground">₹{cashBalanceRupees.toFixed(2)}</span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">UPI ID</label>
              <Input
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={isWithdrawing}>
              {isWithdrawing ? 'Processing...' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralsScreen;
