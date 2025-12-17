import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Clock, Target, Lightbulb, ChevronRight, BarChart3, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ActivityPattern {
  activity: string;
  frequency: number;
  avgTime: string;
  trend: 'up' | 'down' | 'stable';
  score: number;
}

interface ScheduleRecommendation {
  time: string;
  activity: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface WeeklyAnalysis {
  patterns: ActivityPattern[];
  recommendations: ScheduleRecommendation[];
  productivityScore: number;
  consistencyScore: number;
  topInsight: string;
}

export const WeeklyRoutineAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<WeeklyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    if (user) {
      analyzeRoutine();
    }
  }, [user]);

  const analyzeRoutine = async () => {
    setIsLoading(true);
    try {
      // Fetch user data for analysis
      const [habitsRes, routinesRes, moodRes, hydrationRes] = await Promise.all([
        supabase.from('habit_completions').select('*').eq('user_id', user?.id).gte('completed_at', getWeekStart()),
        supabase.from('routines').select('*').eq('user_id', user?.id),
        supabase.from('mood_checkins').select('*').eq('user_id', user?.id).gte('created_at', getWeekStart()),
        supabase.from('hydration_logs').select('*').eq('user_id', user?.id).gte('created_at', getWeekStart()),
      ]);

      const habits = habitsRes.data || [];
      const routines = routinesRes.data || [];
      const moods = moodRes.data || [];
      const hydration = hydrationRes.data || [];

      // Generate analysis based on actual data
      const patterns: ActivityPattern[] = [
        {
          activity: 'Habit Completions',
          frequency: habits.length,
          avgTime: 'Morning',
          trend: habits.length > 5 ? 'up' : habits.length > 2 ? 'stable' : 'down',
          score: Math.min(100, habits.length * 10),
        },
        {
          activity: 'Mood Check-ins',
          frequency: moods.length,
          avgTime: 'Evening',
          trend: moods.length >= 5 ? 'up' : 'stable',
          score: Math.min(100, moods.length * 15),
        },
        {
          activity: 'Hydration Logs',
          frequency: hydration.length,
          avgTime: 'Throughout day',
          trend: hydration.length > 10 ? 'up' : 'stable',
          score: Math.min(100, hydration.length * 5),
        },
        {
          activity: 'Routine Tasks',
          frequency: routines.filter(r => r.completed).length,
          avgTime: 'Varies',
          trend: routines.filter(r => r.completed).length > 3 ? 'up' : 'stable',
          score: Math.min(100, routines.filter(r => r.completed).length * 20),
        },
      ];

      const recommendations: ScheduleRecommendation[] = generateRecommendations(patterns, moods);
      
      const productivityScore = Math.round(patterns.reduce((acc, p) => acc + p.score, 0) / patterns.length);
      const consistencyScore = calculateConsistency(habits, moods, hydration);

      setAnalysis({
        patterns,
        recommendations,
        productivityScore,
        consistencyScore,
        topInsight: generateTopInsight(patterns, productivityScore),
      });
    } catch (error) {
      console.error('Error analyzing routine:', error);
      toast.error('Failed to analyze routine');
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  const calculateConsistency = (habits: any[], moods: any[], hydration: any[]) => {
    const daysWithActivity = new Set([
      ...habits.map(h => h.completed_at?.split('T')[0]),
      ...moods.map(m => m.created_at?.split('T')[0]),
      ...hydration.map(h => h.created_at?.split('T')[0]),
    ]).size;
    return Math.min(100, Math.round((daysWithActivity / 7) * 100));
  };

  const generateRecommendations = (patterns: ActivityPattern[], moods: any[]): ScheduleRecommendation[] => {
    const recommendations: ScheduleRecommendation[] = [];
    
    const habitPattern = patterns.find(p => p.activity === 'Habit Completions');
    if (habitPattern && habitPattern.score < 50) {
      recommendations.push({
        time: '07:00 AM',
        activity: 'Complete morning habits',
        reason: 'Your habit completion is low. Starting early builds momentum.',
        priority: 'high',
      });
    }

    const hydrationPattern = patterns.find(p => p.activity === 'Hydration Logs');
    if (hydrationPattern && hydrationPattern.score < 60) {
      recommendations.push({
        time: 'Every 2 hours',
        activity: 'Drink water',
        reason: 'Your hydration tracking is below optimal. Set reminders!',
        priority: 'high',
      });
    }

    const moodPattern = patterns.find(p => p.activity === 'Mood Check-ins');
    if (moodPattern && moodPattern.score < 50) {
      recommendations.push({
        time: '09:00 PM',
        activity: 'Evening mood reflection',
        reason: 'Tracking mood helps identify patterns and improve wellbeing.',
        priority: 'medium',
      });
    }

    recommendations.push({
      time: '06:30 AM',
      activity: 'Morning routine',
      reason: 'Consistent wake times improve overall energy and productivity.',
      priority: 'medium',
    });

    recommendations.push({
      time: '02:00 PM',
      activity: 'Short break & stretch',
      reason: 'Afternoon breaks boost focus and reduce mental fatigue.',
      priority: 'low',
    });

    return recommendations;
  };

  const generateTopInsight = (patterns: ActivityPattern[], score: number): string => {
    if (score >= 80) {
      return "🔥 You're crushing it! Your routine is well-balanced and consistent.";
    } else if (score >= 60) {
      return "👍 Good progress! Focus on hydration and evening routines to level up.";
    } else if (score >= 40) {
      return "💪 Room to grow! Start with one habit and build consistency.";
    } else {
      return "🌱 Let's build your routine together! Small steps lead to big changes.";
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    return <span className="w-4 h-4 text-muted-foreground">—</span>;
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (priority === 'medium') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-green-500/10 text-green-500 border-green-500/20';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3">
          <BarChart3 className="w-5 h-5 animate-pulse text-primary" />
          <span className="text-muted-foreground">Analyzing your routine...</span>
        </div>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Weekly Analysis</h2>
        </div>
        <Button variant="outline" size="sm" onClick={analyzeRoutine}>
          <Sparkles className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Top Insight */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
          <p className="text-sm">{analysis.topInsight}</p>
        </div>
      </Card>

      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Productivity</span>
          </div>
          <p className="text-2xl font-bold text-primary">{analysis.productivityScore}%</p>
          <Progress value={analysis.productivityScore} className="h-1.5 mt-2" />
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Consistency</span>
          </div>
          <p className="text-2xl font-bold text-primary">{analysis.consistencyScore}%</p>
          <Progress value={analysis.consistencyScore} className="h-1.5 mt-2" />
        </Card>
      </div>

      {/* Activity Patterns */}
      <Card className="p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Activity Patterns
        </h3>
        <div className="space-y-3">
          {analysis.patterns.map((pattern, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {getTrendIcon(pattern.trend)}
                <div>
                  <p className="text-sm font-medium">{pattern.activity}</p>
                  <p className="text-xs text-muted-foreground">{pattern.avgTime}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{pattern.frequency}x</p>
                <p className="text-xs text-muted-foreground">this week</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Schedule Recommendations */}
      <Card className="p-4">
        <button
          onClick={() => setShowRecommendations(!showRecommendations)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Personalized Schedule
          </h3>
          <ChevronRight className={`w-4 h-4 transition-transform ${showRecommendations ? 'rotate-90' : ''}`} />
        </button>
        
        {showRecommendations && (
          <div className="mt-4 space-y-3">
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                  {rec.time}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{rec.activity}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
