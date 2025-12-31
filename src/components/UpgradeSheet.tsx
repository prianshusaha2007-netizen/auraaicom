import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Check, Heart, Sparkles, Brain, Mic, Image, Zap, MessageCircle, Star, Rocket, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCredits } from '@/hooks/useCredits';
import { useAura } from '@/contexts/AuraContext';
import { useRelationshipEvolution, SubscriptionTier } from '@/hooks/useRelationshipEvolution';
import { toast } from 'sonner';

interface UpgradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIER_CONFIG: Record<SubscriptionTier, {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  price: string;
  color: string;
  tagline: string;
  features: { label: string; highlight?: boolean }[];
}> = {
  core: {
    name: 'AURRA Core',
    icon: Heart,
    price: 'Free',
    color: 'text-muted-foreground',
    tagline: 'A reliable presence',
    features: [
      { label: 'Daily conversations' },
      { label: 'Emotional support' },
      { label: 'Basic reminders & routines' },
      { label: 'Companion persona' },
      { label: 'Shorter sessions' },
    ],
  },
  plus: {
    name: 'AURRA Plus',
    icon: Star,
    price: '₹49–₹99/month',
    color: 'text-primary',
    tagline: 'Someone who really knows me',
    features: [
      { label: 'Unlimited conversations', highlight: true },
      { label: 'Best Friend (deep)', highlight: true },
      { label: 'Mentor & Coach (full)', highlight: true },
      { label: 'Creative partner mode' },
      { label: 'Longer reasoning' },
      { label: 'Full memory graph', highlight: true },
      { label: 'Voice replies' },
    ],
  },
  pro: {
    name: 'AURRA Pro',
    icon: Crown,
    price: '₹199–₹299/month',
    color: 'text-amber-500',
    tagline: 'A partner in growth',
    features: [
      { label: 'Everything in Plus', highlight: true },
      { label: 'Co-Founder / Thinking Partner', highlight: true },
      { label: 'Life planning & decision tracking' },
      { label: 'Skill acceleration paths' },
      { label: 'Priority responses' },
      { label: 'Advanced analytics', highlight: true },
    ],
  },
};

export const UpgradeSheet: React.FC<UpgradeSheetProps> = ({ open, onOpenChange }) => {
  const { upgradeToPremium } = useCredits();
  const { upgradeTier, recordUpgradePrompt, engagement } = useRelationshipEvolution();
  const { userProfile } = useAura();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('plus');

  const aiName = userProfile.aiName || 'AURRA';
  const currentTier = engagement?.subscriptionTier || 'core';

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'core') return;
    
    setIsUpgrading(true);
    
    // Simulate payment flow (in real app, integrate with payment provider)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const tierSuccess = await upgradeTier(tier);
    const creditsSuccess = await upgradeToPremium();
    
    if (tierSuccess && creditsSuccess) {
      await recordUpgradePrompt();
      toast.success(`Thank you 🤍 I'm here with you — without limits now.`);
      onOpenChange(false);
    } else {
      toast.error("Looks like that didn't go through. No worries — we can try again anytime.");
    }
    
    setIsUpgrading(false);
  };

  const getTierIndex = (tier: SubscriptionTier) => {
    return tier === 'core' ? 0 : tier === 'plus' ? 1 : 2;
  };

  const canUpgradeTo = (tier: SubscriptionTier) => {
    return getTierIndex(tier) > getTierIndex(currentTier);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-hidden">
        <SheetHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
          </div>
          <SheetTitle className="text-2xl font-bold">
            Go deeper with {aiName}
          </SheetTitle>
          <p className="text-muted-foreground text-sm mt-2">
            You've been building a rhythm here. Choose how far you want to go.
          </p>
        </SheetHeader>

        <div className="mt-4 space-y-4 overflow-y-auto max-h-[60vh] pb-4">
          {/* Tier Selection */}
          <div className="flex gap-2 justify-center mb-4">
            {(['core', 'plus', 'pro'] as SubscriptionTier[]).map((tier) => {
              const config = TIER_CONFIG[tier];
              const Icon = config.icon;
              const isSelected = selectedTier === tier;
              const isCurrent = currentTier === tier;
              
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                    isSelected 
                      ? "bg-primary/10 border-2 border-primary" 
                      : "bg-muted/50 border-2 border-transparent hover:bg-muted",
                    isCurrent && "ring-2 ring-offset-2 ring-green-500"
                  )}
                >
                  <Icon className={cn("w-5 h-5", config.color)} />
                  <span className={cn("text-xs font-medium", config.color)}>
                    {tier === 'core' ? 'Free' : tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] text-green-600 dark:text-green-400">Current</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Tier Details */}
          {(['core', 'plus', 'pro'] as SubscriptionTier[]).map((tier) => {
            const config = TIER_CONFIG[tier];
            const Icon = config.icon;
            const isVisible = selectedTier === tier;
            const isCurrent = currentTier === tier;
            const canUpgrade = canUpgradeTo(tier);
            
            if (!isVisible) return null;

            return (
              <div
                key={tier}
                className={cn(
                  "rounded-2xl border p-4 transition-all",
                  tier === 'pro' 
                    ? "border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5"
                    : tier === 'plus'
                    ? "border-2 border-primary bg-gradient-to-br from-primary/5 to-accent/5"
                    : "border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-5 h-5", config.color)} />
                  <span className={cn("text-sm font-semibold", config.color)}>
                    {config.name}
                  </span>
                  {tier === 'plus' && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 italic">
                  "{config.tagline}"
                </p>
                
                <div className="text-lg font-bold mb-3">{config.price}</div>
                
                <div className="space-y-2">
                  {config.features.map((feature, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        feature.highlight ? "text-foreground font-medium" : "text-muted-foreground"
                      )}
                    >
                      <Check className={cn(
                        "w-4 h-4 flex-shrink-0",
                        feature.highlight ? config.color : "text-muted-foreground/60"
                      )} />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>

                {/* Tier-specific CTA */}
                {tier !== 'core' && (
                  <div className="mt-4">
                    {isCurrent ? (
                      <div className="text-center text-sm text-green-600 dark:text-green-400 font-medium py-2">
                        ✓ This is your current plan
                      </div>
                    ) : canUpgrade ? (
                      <Button 
                        className={cn(
                          "w-full h-11 rounded-xl text-base font-semibold",
                          tier === 'pro' 
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                            : "bg-primary hover:bg-primary/90"
                        )}
                        onClick={() => handleUpgrade(tier)}
                        disabled={isUpgrading}
                      >
                        {isUpgrading ? (
                          <>
                            <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Unlock {config.name}
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        Upgrade to Plus first
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime · No pressure · Your data stays yours
          </p>
          <p className="text-[10px] text-center text-muted-foreground/70 mt-1">
            Upgrades never appear during emotional moments or late-night chats.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};