import React, { useEffect, useState } from 'react';
import { 
  User, 
  Brain, 
  Heart, 
  Zap, 
  MessageCircle, 
  Moon, 
  Sun,
  Clock,
  Target,
  Palette
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAura } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';

interface PersonalityTrait {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

export const PersonalityProfileScreen: React.FC = () => {
  const { userProfile, memories } = useAura();
  const [moodHistory, setMoodHistory] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('aura-mood-history');
    if (saved) setMoodHistory(JSON.parse(saved));
  }, []);

  // Analyze patterns from mood history
  const getMostCommonMood = () => {
    if (moodHistory.length < 3) return 'Learning...';
    const moodCounts: Record<string, number> = {};
    moodHistory.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    return Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Balanced';
  };

  const getEnergyPattern = () => {
    if (moodHistory.length < 3) return 'Analyzing...';
    const lowCount = moodHistory.filter(e => e.energy === 'low').length;
    const highCount = moodHistory.filter(e => e.energy === 'high').length;
    if (highCount > lowCount * 1.5) return 'High Energy';
    if (lowCount > highCount * 1.5) return 'Calm & Steady';
    return 'Balanced';
  };

  const getChronotype = () => {
    const wakeHour = parseInt(userProfile.wakeTime?.split(':')[0] || '7');
    const sleepHour = parseInt(userProfile.sleepTime?.split(':')[0] || '23');
    if (wakeHour <= 6) return 'Early Bird';
    if (sleepHour >= 24 || sleepHour <= 1) return 'Night Owl';
    return 'Balanced Sleeper';
  };

  const getCommunicationStyle = () => {
    switch (userProfile.tonePreference) {
      case 'soft': return 'Gentle & Empathetic';
      case 'playful': return 'Fun & Casual';
      case 'motivational': return 'Driven & Inspiring';
      default: return 'Adaptable';
    }
  };

  const getProductivityStyle = () => {
    const profession = userProfile.profession?.toLowerCase() || '';
    if (profession.includes('student')) return 'Learning-Focused';
    if (profession.includes('business') || profession.includes('entrepreneur')) return 'Goal-Oriented';
    if (profession.includes('freelancer')) return 'Self-Directed';
    if (profession.includes('fitness')) return 'Discipline-Driven';
    return 'Flexible & Adaptive';
  };

  const personalityTraits: PersonalityTrait[] = [
    {
      label: 'Personality Type',
      value: getMostCommonMood() === 'happy' ? 'Optimist' 
           : getMostCommonMood() === 'calm' ? 'The Zen Master'
           : getMostCommonMood() === 'stressed' ? 'The Achiever'
           : getMostCommonMood() === 'sad' ? 'The Deep Thinker'
           : 'The Explorer',
      icon: Brain,
      color: 'text-purple-500',
      description: 'Based on your mood patterns and daily check-ins'
    },
    {
      label: 'Mood Style',
      value: getMostCommonMood().charAt(0).toUpperCase() + getMostCommonMood().slice(1),
      icon: Heart,
      color: 'text-pink-500',
      description: 'Your most common emotional state'
    },
    {
      label: 'Energy Pattern',
      value: getEnergyPattern(),
      icon: Zap,
      color: 'text-yellow-500',
      description: 'How you typically feel throughout the day'
    },
    {
      label: 'Communication Style',
      value: getCommunicationStyle(),
      icon: MessageCircle,
      color: 'text-blue-500',
      description: 'How you prefer to interact'
    },
    {
      label: 'Chronotype',
      value: getChronotype(),
      icon: getChronotype() === 'Night Owl' ? Moon : Sun,
      color: 'text-orange-500',
      description: 'Your natural sleep-wake pattern'
    },
    {
      label: 'Productivity Style',
      value: getProductivityStyle(),
      icon: Target,
      color: 'text-green-500',
      description: 'Based on your profession and habits'
    },
  ];

  // Generate personality summary
  const generateSummary = () => {
    const chronotype = getChronotype();
    const mood = getMostCommonMood();
    const energy = getEnergyPattern();
    const style = getCommunicationStyle().toLowerCase();
    
    return `You are a ${mood.toLowerCase()}, ${style} ${chronotype.toLowerCase()} who prefers ${energy.toLowerCase()} energy levels. Your approach to life is ${getProductivityStyle().toLowerCase()}, and you value meaningful connections with others.`;
  };

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="p-4 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Personality Profile</h1>
        </div>
        <p className="text-sm text-muted-foreground">AURA's understanding of you</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
          <CardContent className="pt-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {userProfile.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <h2 className="text-xl font-bold">{userProfile.name || 'Friend'}</h2>
            <p className="text-muted-foreground">{userProfile.profession || 'Explorer'}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm">
              <span>{userProfile.age ? `${userProfile.age} years` : ''}</span>
              {userProfile.age && userProfile.languages?.length > 0 && <span>•</span>}
              <span>{userProfile.languages?.join(', ')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Personality Summary */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Your Personality Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed italic">
              "{generateSummary()}"
            </p>
          </CardContent>
        </Card>

        {/* Personality Traits Grid */}
        <div className="grid grid-cols-2 gap-3">
          {personalityTraits.map((trait, index) => {
            const Icon = trait.icon;
            return (
              <Card 
                key={index}
                className="border-border/50 hover:border-primary/30 transition-colors"
              >
                <CardContent className="pt-4">
                  <div className={cn('p-2 rounded-lg bg-muted/50 w-fit mb-3', trait.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{trait.label}</p>
                  <p className="font-semibold">{trait.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Your Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{userProfile.wakeTime || '7:00'}</p>
                <p className="text-xs text-muted-foreground">Wake Time</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-primary">{userProfile.sleepTime || '23:00'}</p>
                <p className="text-xs text-muted-foreground">Sleep Time</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-primary">{moodHistory.length}</p>
                <p className="text-xs text-muted-foreground">Check-ins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memories Count */}
        {memories.length > 0 && (
          <Card className="border-border/50">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{memories.length} Memories Saved</p>
                <p className="text-sm text-muted-foreground">AURA remembers what matters to you</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
