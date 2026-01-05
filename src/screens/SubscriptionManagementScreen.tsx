import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Crown, Sparkles, Zap, Star, Calendar, 
  CreditCard, AlertTriangle, CheckCircle, Clock, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCredits, TIER_DISPLAY, SubscriptionTier } from '@/hooks/useCredits';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isPast, differenceInDays } from 'date-fns';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  tier: string;
  created_at: string;
  completed_at: string | null;
}

const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  core: <Star className="h-5 w-5" />,
  basic: <Zap className="h-5 w-5" />,
  plus: <Sparkles className="h-5 w-5" />,
  pro: <Crown className="h-5 w-5" />,
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  core: 'from-muted to-muted/50',
  basic: 'from-blue-500/20 to-blue-600/10',
  plus: 'from-violet-500/20 to-purple-600/10',
  pro: 'from-amber-500/20 to-orange-600/10',
};

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  core: ['20 daily messages', 'Basic chat support', 'Light check-ins'],
  basic: ['60 daily messages', 'Focus sessions', 'Routine support', 'Mood tracking'],
  plus: ['150 daily messages', 'Priority responses', 'All focus modes', 'Memory features'],
  pro: ['Unlimited messages', 'All features', 'Power user mode', 'Priority support'],
};

export default function SubscriptionManagementScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, getCreditStatus, refreshCredits } = useCredits();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const creditStatus = getCreditStatus();

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subData) {
        setSubscription(subData);
      }

      // Fetch recent payments
      const { data: paymentData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (paymentData) {
        setPayments(paymentData);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.id || !subscription) return;
    
    setIsCancelling(true);
    try {
      // Update subscription status
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Insert cancellation chat message
      await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          sender: 'assistant',
          content: "I understand you've cancelled your subscription. Your current plan stays active until the expiry date. I'm still here whenever you need me 💙",
          chat_date: new Date().toISOString().split('T')[0],
        });

      toast.success('Subscription cancelled. Your plan remains active until expiry.');
      fetchData();
      refreshCredits();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getExpiryInfo = () => {
    if (!subscription?.expires_at) return null;
    
    const expiryDate = new Date(subscription.expires_at);
    const isExpired = isPast(expiryDate);
    const daysRemaining = differenceInDays(expiryDate, new Date());
    
    return { expiryDate, isExpired, daysRemaining };
  };

  const expiryInfo = getExpiryInfo();
  const tierDisplay = TIER_DISPLAY[tier];
  const isPaidTier = tier !== 'core';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">My Plan</h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">My Plan</h1>
      </div>

      <div className="space-y-4">
        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`bg-gradient-to-br ${TIER_COLORS[tier]} border-none overflow-hidden`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-background/50 rounded-full">
                    {TIER_ICONS[tier]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tierDisplay.name}</CardTitle>
                    <CardDescription>{tierDisplay.target}</CardDescription>
                  </div>
                </div>
                <Badge variant={isPaidTier ? 'default' : 'secondary'} className="text-sm">
                  {tierDisplay.price}/month
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                {TIER_FEATURES[tier].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Expiry Info */}
              {isPaidTier && expiryInfo && (
                <div className={`p-3 rounded-xl ${
                  expiryInfo.isExpired 
                    ? 'bg-destructive/10 border border-destructive/20' 
                    : expiryInfo.daysRemaining <= 7 
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : 'bg-muted/50'
                }`}>
                  <div className="flex items-center gap-2">
                    {expiryInfo.isExpired ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {expiryInfo.isExpired 
                        ? 'Plan expired'
                        : `Renews ${formatDistanceToNow(expiryInfo.expiryDate, { addSuffix: true })}`
                      }
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(expiryInfo.expiryDate, 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Today's Usage</CardTitle>
                <Badge variant="outline" className="font-normal">
                  <Clock className="h-3 w-3 mr-1" />
                  Resets at midnight
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Messages used</span>
                  <span className="font-medium">
                    {tier === 'pro' 
                      ? 'Unlimited' 
                      : `${Math.round(creditStatus.usagePercent)}%`
                    }
                  </span>
                </div>
                {tier !== 'pro' && (
                  <Progress 
                    value={creditStatus.usagePercent} 
                    className="h-2"
                  />
                )}
                {creditStatus.showSoftWarning && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Getting close to your daily limit. Consider upgrading for more.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Plan Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isPaidTier && (
                <Button 
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
                  onClick={() => navigate('/subscription')}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
              
              {isPaidTier && subscription?.status !== 'cancelled' && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/subscription')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Change Plan
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full text-muted-foreground">
                        Cancel Subscription
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>Your {tierDisplay.name} plan will remain active until {expiryInfo ? format(expiryInfo.expiryDate, 'MMMM d, yyyy') : 'the end of your billing period'}.</p>
                          <p className="text-sm">After that, you'll be moved to the free plan with limited daily messages.</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Plan</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleCancelSubscription}
                          disabled={isCancelling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {subscription?.status === 'cancelled' && (
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">
                    Your subscription is cancelled and will end on {expiryInfo ? format(expiryInfo.expiryDate, 'MMMM d') : 'the expiry date'}.
                  </p>
                  <Button 
                    className="mt-3"
                    onClick={() => navigate('/subscription')}
                  >
                    Reactivate Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment History */}
        <AnimatePresence>
          {payments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Payment History</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div 
                        key={payment.id}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-full ${
                            payment.status === 'completed' 
                              ? 'bg-green-500/10' 
                              : 'bg-amber-500/10'
                          }`}>
                            {payment.status === 'completed' ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {payment.tier} Plan
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(payment.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            ₹{(payment.amount / 100).toFixed(0)}
                          </p>
                          <Badge 
                            variant={payment.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Need help with billing?</h4>
                  <p className="text-xs text-muted-foreground">
                    Just ask me in chat! Say "billing help" or "payment issue" and I'll assist you.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
