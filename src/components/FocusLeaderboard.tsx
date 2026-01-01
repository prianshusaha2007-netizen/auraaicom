import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Target, Users, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FocusSessionResult {
  type: string;
  duration: number;
  completed: 'yes' | 'almost' | 'not_today';
  timestamp: string;
}

export const PersonalStreaks: React.FC<{ className?: string }> = ({ className }) => {
  const sessions = useMemo(() => {
    const stored = localStorage.getItem('aurra-focus-results');
    if (!stored) return [];
    try {
      return JSON.parse(stored) as FocusSessionResult[];
    } catch {
      return [];
    }
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Calculate streak
    const daySet = new Set<string>();
    sessions.forEach(s => {
      const date = new Date(s.timestamp);
      daySet.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    });
    
    let streak = 0;
    let checkDate = new Date(today);
    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (daySet.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Weekly counts
    const weekSessions = sessions.filter(s => new Date(s.timestamp) >= weekAgo);
    const focusDays = new Set(weekSessions.map(s => {
      const d = new Date(s.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })).size;
    
    const gymSessions = weekSessions.filter(s => s.type === 'gym').length;
    const studySessions = weekSessions.filter(s => s.type === 'study').length;
    
    return { streak, focusDays, gymSessions, studySessions, totalSessions: weekSessions.length };
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <Card className={cn("bg-card/50 border-border/30", className)}>
        <CardContent className="py-6 text-center">
          <Trophy className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Start focusing to build your streak!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-3", className)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium">Your Progress</span>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3">
        You're building your own rhythm. Keep showing up.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
          <CardContent className="p-3 text-center">
            <Flame className="w-5 h-5 mx-auto text-orange-500 mb-1" />
            <span className="text-xl font-bold">{stats.streak}</span>
            <p className="text-xs text-muted-foreground">day streak</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 mx-auto text-violet-500 mb-1" />
            <span className="text-xl font-bold">{stats.focusDays}</span>
            <p className="text-xs text-muted-foreground">days this week</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/30">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground mb-2">This week</p>
          <div className="flex items-center justify-between text-sm">
            <span>📚 Study: {stats.studySessions}</span>
            <span>🏋️ Gym: {stats.gymSessions}</span>
            <span>🎯 Total: {stats.totalSessions}</span>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-center text-muted-foreground/70 mt-2">
        Consistent this week ✨
      </p>
    </motion.div>
  );
};

// Compact version for More menu
export const CompactLeaderboard: React.FC = () => {
  const sessions = useMemo(() => {
    const stored = localStorage.getItem('aurra-focus-results');
    if (!stored) return [];
    try {
      return JSON.parse(stored) as FocusSessionResult[];
    } catch {
      return [];
    }
  }, []);

  const streak = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daySet = new Set<string>();
    sessions.forEach(s => {
      const date = new Date(s.timestamp);
      daySet.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    });
    
    let count = 0;
    let checkDate = new Date(today);
    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (daySet.has(key)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [sessions]);

  if (sessions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Flame className="w-3 h-3 text-orange-500" />
      <span>{streak} day streak</span>
    </div>
  );
};
