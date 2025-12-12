import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calendar,
  Smile,
  Frown,
  Meh,
  Zap,
  Flame,
  Wind,
  CloudRain,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  energy: string;
  stress: string;
  analysis: string;
  timestamp: Date;
}

const moodConfig = {
  happy: { label: 'Happy', icon: Smile, color: '#22c55e', value: 5 },
  calm: { label: 'Calm', icon: Wind, color: '#3b82f6', value: 4 },
  neutral: { label: 'Neutral', icon: Meh, color: '#eab308', value: 3 },
  stressed: { label: 'Stressed', icon: Flame, color: '#f97316', value: 2 },
  sad: { label: 'Sad', icon: Frown, color: '#a855f7', value: 1 },
  anxious: { label: 'Anxious', icon: CloudRain, color: '#6b7280', value: 1 },
};

const energyConfig = {
  low: { label: 'Low', color: '#ef4444', value: 1 },
  medium: { label: 'Medium', color: '#eab308', value: 2 },
  high: { label: 'High', color: '#22c55e', value: 3 },
};

const stressConfig = {
  low: { label: 'Low', color: '#22c55e', value: 1 },
  medium: { label: 'Medium', color: '#eab308', value: 2 },
  high: { label: 'High', color: '#ef4444', value: 3 },
};

interface MoodAnalyticsDashboardProps {
  onBack?: () => void;
}

export const MoodAnalyticsDashboard: React.FC<MoodAnalyticsDashboardProps> = ({ onBack }) => {
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const saved = localStorage.getItem('aura-mood-history');
    if (saved) {
      const history = JSON.parse(saved).map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }));
      setMoodHistory(history);
    }
  }, []);

  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoff = timeRange === 'week' 
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return moodHistory.filter(e => new Date(e.timestamp) >= cutoff);
  }, [moodHistory, timeRange]);

  const trendData = useMemo(() => {
    const grouped: Record<string, MoodEntry[]> = {};
    filteredData.forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    });

    return Object.entries(grouped).map(([date, entries]) => {
      const avgMood = entries.reduce((sum, e) => sum + (moodConfig[e.mood as keyof typeof moodConfig]?.value || 3), 0) / entries.length;
      const avgEnergy = entries.reduce((sum, e) => sum + (energyConfig[e.energy as keyof typeof energyConfig]?.value || 2), 0) / entries.length;
      const avgStress = entries.reduce((sum, e) => sum + (stressConfig[e.stress as keyof typeof stressConfig]?.value || 2), 0) / entries.length;
      
      return {
        date,
        mood: avgMood,
        energy: avgEnergy,
        stress: avgStress,
      };
    }).reverse();
  }, [filteredData]);

  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(entry => {
      counts[entry.mood] = (counts[entry.mood] || 0) + 1;
    });
    
    return Object.entries(counts).map(([mood, count]) => ({
      name: moodConfig[mood as keyof typeof moodConfig]?.label || mood,
      value: count,
      color: moodConfig[mood as keyof typeof moodConfig]?.color || '#6b7280',
    }));
  }, [filteredData]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;

    const moodCounts: Record<string, number> = {};
    const energyCounts: Record<string, number> = {};
    const stressCounts: Record<string, number> = {};
    
    filteredData.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      energyCounts[entry.energy] = (energyCounts[entry.energy] || 0) + 1;
      stressCounts[entry.stress] = (stressCounts[entry.stress] || 0) + 1;
    });

    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
    const dominantEnergy = Object.entries(energyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium';
    const dominantStress = Object.entries(stressCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium';

    const avgMoodValue = filteredData.reduce((sum, e) => sum + (moodConfig[e.mood as keyof typeof moodConfig]?.value || 3), 0) / filteredData.length;
    
    // Calculate trend (comparing first half to second half)
    const midpoint = Math.floor(filteredData.length / 2);
    const firstHalf = filteredData.slice(midpoint);
    const secondHalf = filteredData.slice(0, midpoint);
    
    const firstHalfAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, e) => sum + (moodConfig[e.mood as keyof typeof moodConfig]?.value || 3), 0) / firstHalf.length 
      : 3;
    const secondHalfAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, e) => sum + (moodConfig[e.mood as keyof typeof moodConfig]?.value || 3), 0) / secondHalf.length 
      : 3;
    
    const trend = secondHalfAvg - firstHalfAvg;

    return {
      totalCheckins: filteredData.length,
      dominantMood,
      dominantEnergy,
      dominantStress,
      avgMoodValue,
      trend,
      positiveDays: filteredData.filter(e => ['happy', 'calm'].includes(e.mood)).length,
      lowStressDays: filteredData.filter(e => e.stress === 'low').length,
    };
  }, [filteredData]);

  const getInsights = () => {
    if (!stats || stats.totalCheckins < 3) return [];
    
    const insights = [];
    
    if (stats.trend > 0.3) {
      insights.push({ 
        type: 'positive', 
        text: 'Your mood has been improving! Keep up what you\'re doing.',
        icon: TrendingUp 
      });
    } else if (stats.trend < -0.3) {
      insights.push({ 
        type: 'concern', 
        text: 'Your mood seems to be declining. Consider self-care activities.',
        icon: TrendingDown 
      });
    }

    const positivePercentage = (stats.positiveDays / stats.totalCheckins) * 100;
    if (positivePercentage > 60) {
      insights.push({
        type: 'positive',
        text: `${Math.round(positivePercentage)}% of your days were positive. That's great!`,
        icon: Smile
      });
    }

    const lowStressPercentage = (stats.lowStressDays / stats.totalCheckins) * 100;
    if (lowStressPercentage < 30) {
      insights.push({
        type: 'concern',
        text: 'You\'ve had high stress levels recently. Try relaxation techniques.',
        icon: Flame
      });
    }

    return insights;
  };

  if (moodHistory.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
        <p className="text-muted-foreground text-sm">
          Start doing daily check-ins to see your mood analytics here!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="p-4 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Mood Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">Your emotional wellness insights</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Time Range Tabs */}
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as 'week' | 'month')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.totalCheckins}</p>
                <p className="text-xs text-muted-foreground">Check-ins</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  {stats.trend > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : stats.trend < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  ) : (
                    <Meh className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="text-lg font-bold">
                    {stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Mood Trend</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-lg font-bold capitalize">{stats.dominantMood}</p>
                <p className="text-xs text-muted-foreground">Dominant Mood</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-lg font-bold">{stats.positiveDays}</p>
                <p className="text-xs text-muted-foreground">Positive Days</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Mood Trend Chart */}
        {trendData.length > 1 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Mood Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      domain={[0, 5]} 
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Energy & Stress Bars */}
        {trendData.length > 1 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Energy & Stress Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      domain={[0, 3]}
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="energy" fill="#22c55e" name="Energy" />
                    <Bar dataKey="stress" fill="#ef4444" name="Stress" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mood Distribution Pie */}
        {moodDistribution.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Mood Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      dataKey="value"
                    >
                      {moodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {moodDistribution.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-xs">{entry.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights */}
        {getInsights().length > 0 && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {getInsights().map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg',
                      insight.type === 'positive' ? 'bg-green-500/10' : 'bg-orange-500/10'
                    )}
                  >
                    <Icon className={cn(
                      'w-5 h-5 shrink-0 mt-0.5',
                      insight.type === 'positive' ? 'text-green-500' : 'text-orange-500'
                    )} />
                    <p className="text-sm">{insight.text}</p>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
