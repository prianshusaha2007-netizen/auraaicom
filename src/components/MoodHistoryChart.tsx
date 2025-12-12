import React, { useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MoodEntry {
  date: string;
  mood: string;
  energy: string;
}

const moodToValue: Record<string, number> = {
  great: 5,
  good: 4,
  okay: 3,
  low: 2,
  stressed: 1,
};

const energyToValue: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const valueToMood: Record<number, string> = {
  5: '😊',
  4: '🙂',
  3: '😐',
  2: '😔',
  1: '😰',
};

export const MoodHistoryChart: React.FC = () => {
  const chartData = useMemo(() => {
    const moodHistory: MoodEntry[] = JSON.parse(localStorage.getItem('aura_mood_history') || '[]');
    
    // Generate last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dayStr = format(date, 'yyyy-MM-dd');
      
      // Find mood entry for this day
      const entry = moodHistory.find(e => {
        const entryDate = format(new Date(e.date), 'yyyy-MM-dd');
        return entryDate === dayStr;
      });
      
      days.push({
        day: format(date, 'EEE'),
        fullDate: format(date, 'MMM d'),
        mood: entry ? moodToValue[entry.mood] || 3 : null,
        energy: entry ? energyToValue[entry.energy] || 2 : null,
        moodLabel: entry?.mood || null,
        energyLabel: entry?.energy || null,
      });
    }
    
    return days;
  }, []);

  const averageMood = useMemo(() => {
    const validMoods = chartData.filter(d => d.mood !== null);
    if (validMoods.length === 0) return null;
    return validMoods.reduce((sum, d) => sum + (d.mood || 0), 0) / validMoods.length;
  }, [chartData]);

  const trend = useMemo(() => {
    const validMoods = chartData.filter(d => d.mood !== null);
    if (validMoods.length < 2) return 'neutral';
    
    const firstHalf = validMoods.slice(0, Math.floor(validMoods.length / 2));
    const secondHalf = validMoods.slice(Math.floor(validMoods.length / 2));
    
    const firstAvg = firstHalf.reduce((s, d) => s + (d.mood || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, d) => s + (d.mood || 0), 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 0.3) return 'up';
    if (secondAvg < firstAvg - 0.3) return 'down';
    return 'neutral';
  }, [chartData]);

  const hasData = chartData.some(d => d.mood !== null);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0].payload.mood !== null) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{data.fullDate}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{valueToMood[data.mood]}</span>
            <span className="text-xs text-muted-foreground capitalize">{data.moodLabel}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Energy: <span className="capitalize">{data.energyLabel}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Weekly Mood Trends</CardTitle>
          {hasData && (
            <div className="flex items-center gap-1 text-sm">
              {trend === 'up' && (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 text-xs">Improving</span>
                </>
              )}
              {trend === 'down' && (
                <>
                  <TrendingDown className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-500 text-xs">Declining</span>
                </>
              )}
              {trend === 'neutral' && (
                <>
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">Stable</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
            No mood data yet. Complete daily check-ins to see trends!
          </div>
        ) : (
          <>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    domain={[1, 5]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => valueToMood[value] || ''}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#moodGradient)"
                    connectNulls
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {averageMood && (
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Weekly Average</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{valueToMood[Math.round(averageMood)]}</span>
                  <span className="text-sm font-medium">{averageMood.toFixed(1)}/5</span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
