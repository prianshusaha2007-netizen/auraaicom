import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Smile, 
  Meh, 
  Frown, 
  Zap, 
  Battery, 
  BatteryLow,
  Flame,
  Wind,
  CloudRain,
  Calendar,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MoodHistoryChart } from '@/components/MoodHistoryChart';
import { MoodAnalyticsDashboard } from '@/components/MoodAnalyticsDashboard';

interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  energy: string;
  stress: string;
  analysis: string;
  timestamp: Date;
}

const moodOptions = [
  { id: 'happy', label: 'Happy', icon: Smile, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'calm', label: 'Calm', icon: Wind, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { id: 'stressed', label: 'Stressed', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'sad', label: 'Sad', icon: Frown, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'anxious', label: 'Anxious', icon: CloudRain, color: 'text-gray-500', bg: 'bg-gray-500/10' },
];

const energyOptions = [
  { id: 'low', label: 'Low', icon: BatteryLow, color: 'text-red-500' },
  { id: 'medium', label: 'Medium', icon: Battery, color: 'text-yellow-500' },
  { id: 'high', label: 'High', icon: Zap, color: 'text-green-500' },
];

const stressOptions = [
  { id: 'low', label: 'Low', color: 'text-green-500', bg: 'bg-green-500' },
  { id: 'medium', label: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500' },
  { id: 'high', label: 'High', color: 'text-red-500', bg: 'bg-red-500' },
];

export const MoodCheckInScreen: React.FC = () => {
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);
  const [selectedStress, setSelectedStress] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('aura-mood-history');
    if (saved) {
      const history = JSON.parse(saved);
      setMoodHistory(history);
      
      // Check if already checked in today
      const today = new Date().toDateString();
      const todayEntry = history.find((e: MoodEntry) => new Date(e.timestamp).toDateString() === today);
      if (todayEntry) {
        setHasCheckedInToday(true);
        setSelectedMood(todayEntry.mood);
        setSelectedEnergy(todayEntry.energy);
        setSelectedStress(todayEntry.stress);
        setAnalysis(todayEntry.analysis);
        setShowResult(true);
      }
    }
  }, []);

  const generateAnalysis = (mood: string, energy: string, stress: string): string => {
    const analyses: Record<string, Record<string, string>> = {
      happy: {
        high: "You're radiating positive energy today! Perfect time to tackle challenging tasks.",
        medium: "You're in a good mood with balanced energy. Great day for steady progress!",
        low: "Happy but a bit tired? Take it easy and ride that good mood wave. 🌊"
      },
      calm: {
        high: "Zen mode activated with high energy! You're in the zone for deep work.",
        medium: "Peaceful and balanced - ideal state for creative thinking.",
        low: "Calm and restful energy. Listen to your body, maybe take it slow today."
      },
      neutral: {
        high: "Lots of energy but feeling neutral - channel that into something exciting!",
        medium: "Steady and stable today. Good for routine tasks and planning.",
        low: "Taking it easy today? That's perfectly fine. Small wins count too!"
      },
      stressed: {
        high: "High energy but stressed? Try some physical activity to release tension.",
        medium: "Feeling some pressure - break tasks into smaller pieces.",
        low: "Stressed and tired is tough. Prioritize self-care today. 💜"
      },
      sad: {
        high: "Sad but energetic? Channel that energy into something you love.",
        medium: "It's okay to feel down. Reach out to someone or do something comforting.",
        low: "Feeling low today. Be gentle with yourself - this will pass. 🤗"
      },
      anxious: {
        high: "Anxious energy is hard. Try grounding exercises or a short walk.",
        medium: "Anxiety can be managed - take deep breaths and focus on one thing at a time.",
        low: "Feeling anxious and tired. Rest is important. You're doing your best."
      }
    };

    const stressAddition = stress === 'high' 
      ? " Consider some stress-relief activities today."
      : stress === 'medium' 
        ? " Keep an eye on your stress levels."
        : " Great stress management!";

    return (analyses[mood]?.[energy] || "Thanks for checking in! AURA is learning about you.") + stressAddition;
  };

  const handleSubmit = () => {
    if (!selectedMood || !selectedEnergy || !selectedStress) {
      toast({
        title: "Please complete all selections",
        description: "Select your mood, energy, and stress levels",
      });
      return;
    }

    const analysisText = generateAnalysis(selectedMood, selectedEnergy, selectedStress);
    setAnalysis(analysisText);

    const entry: MoodEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      mood: selectedMood,
      energy: selectedEnergy,
      stress: selectedStress,
      analysis: analysisText,
      timestamp: new Date(),
    };

    const updatedHistory = [entry, ...moodHistory.slice(0, 29)]; // Keep last 30 entries
    setMoodHistory(updatedHistory);
    localStorage.setItem('aura-mood-history', JSON.stringify(updatedHistory));
    
    setShowResult(true);
    setHasCheckedInToday(true);

    toast({
      title: "Check-in complete! 💜",
      description: "AURA has learned more about how you're feeling today.",
    });
  };

  const resetCheckIn = () => {
    setSelectedMood(null);
    setSelectedEnergy(null);
    setSelectedStress(null);
    setShowResult(false);
    setHasCheckedInToday(false);
    
    // Remove today's entry
    const today = new Date().toDateString();
    const filtered = moodHistory.filter(e => new Date(e.timestamp).toDateString() !== today);
    setMoodHistory(filtered);
    localStorage.setItem('aura-mood-history', JSON.stringify(filtered));
  };

  if (showAnalytics) {
    return <MoodAnalyticsDashboard onBack={() => setShowAnalytics(false)} />;
  }

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="p-4 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Daily Check-In</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAnalytics(true)}
            className="rounded-full"
          >
            <BarChart3 className="w-5 h-5 text-primary" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">How are you feeling today?</p>
      </div>

      <div className="p-4 space-y-6">
        {!showResult ? (
          <>
            {/* Mood Selection */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Smile className="w-5 h-5 text-primary" />
                  How's your mood?
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {moodOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedMood(option.id)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                          selectedMood === option.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className={cn('p-2 rounded-full', option.bg)}>
                          <Icon className={cn('w-6 h-6', option.color)} />
                        </div>
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Energy Level */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Energy Level
                </h3>
                <div className="flex gap-3">
                  {energyOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedEnergy(option.id)}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                          selectedEnergy === option.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <Icon className={cn('w-8 h-8', option.color)} />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stress Level */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Stress Level
                </h3>
                <div className="flex gap-3">
                  {stressOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedStress(option.id)}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                        selectedStress === option.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className={cn('w-8 h-4 rounded-full', option.bg)} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSubmit} 
              className="w-full py-6 text-lg rounded-xl"
              disabled={!selectedMood || !selectedEnergy || !selectedStress}
            >
              Complete Check-In
            </Button>
          </>
        ) : (
          <>
            {/* Analysis Result */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-3">
                    {moodOptions.find(m => m.id === selectedMood) && 
                      React.createElement(moodOptions.find(m => m.id === selectedMood)!.icon, {
                        className: cn('w-8 h-8', moodOptions.find(m => m.id === selectedMood)!.color)
                      })
                    }
                  </div>
                  <h3 className="text-lg font-bold mb-2">Today's Analysis</h3>
                </div>
                <p className="text-center text-muted-foreground leading-relaxed">
                  {analysis}
                </p>
                
                <div className="flex gap-4 mt-6 pt-4 border-t border-border">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Mood</p>
                    <p className="font-semibold capitalize">{selectedMood}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Energy</p>
                    <p className="font-semibold capitalize">{selectedEnergy}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Stress</p>
                    <p className="font-semibold capitalize">{selectedStress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              variant="outline" 
              onClick={resetCheckIn} 
              className="w-full"
            >
              Update Today's Check-In
            </Button>

            {/* Weekly Mood Chart */}
            <MoodHistoryChart />

            {/* Mood History List */}
            {moodHistory.length > 1 && (
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Recent Check-ins
                  </h3>
                  <div className="space-y-3">
                    {moodHistory.slice(1, 8).map((entry) => {
                      const moodData = moodOptions.find(m => m.id === entry.mood);
                      return (
                        <div 
                          key={entry.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                        >
                          <div className={cn('p-2 rounded-full', moodData?.bg)}>
                            {moodData && React.createElement(moodData.icon, {
                              className: cn('w-4 h-4', moodData.color)
                            })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize">{entry.mood}</p>
                            <p className="text-xs text-muted-foreground">{entry.date}</p>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 rounded-full bg-muted capitalize">
                              {entry.energy}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};
