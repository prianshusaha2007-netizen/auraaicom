import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Filter, Brain, Dumbbell, BookOpen, Palette, Clock, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { format, subDays, isAfter, parseISO } from 'date-fns';

const focusTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  study: { icon: BookOpen, label: 'Study', color: 'bg-blue-500/20 text-blue-400' },
  coding: { icon: Brain, label: 'Coding', color: 'bg-purple-500/20 text-purple-400' },
  gym: { icon: Dumbbell, label: 'Gym', color: 'bg-orange-500/20 text-orange-400' },
  creative: { icon: Palette, label: 'Creative', color: 'bg-pink-500/20 text-pink-400' },
  quiet: { icon: Clock, label: 'Quiet Focus', color: 'bg-muted text-muted-foreground' },
};

const completionLabels: Record<string, { label: string; color: string }> = {
  yes: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  almost: { label: 'Almost', color: 'bg-yellow-500/20 text-yellow-400' },
  not_today: { label: 'Ended Early', color: 'bg-muted text-muted-foreground' },
};

export const FocusHistoryScreen = () => {
  const navigate = useNavigate();
  const { getFocusSessions } = useFocusSessions();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7');

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      const days = parseInt(dateFilter);
      const data = await getFocusSessions(days);
      setSessions(data);
      setLoading(false);
    };
    loadSessions();
  }, [dateFilter, getFocusSessions]);

  const filteredSessions = sessions.filter(session => {
    if (typeFilter !== 'all' && session.focus_type !== typeFilter) return false;
    return true;
  });

  const totalMinutes = filteredSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const completedCount = filteredSessions.filter(s => s.completed === 'yes').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Focus History</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{filteredSessions.length}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </div>
            <div className="text-xs text-muted-foreground">Total Time</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{completedCount}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="study">Study</SelectItem>
              <SelectItem value="coding">Coding</SelectItem>
              <SelectItem value="gym">Gym</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="quiet">Quiet Focus</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredSessions.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No focus sessions yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Start a focus session to see your history here
              </p>
            </Card>
          ) : (
            filteredSessions.map((session) => {
              const config = focusTypeConfig[session.focus_type] || focusTypeConfig.quiet;
              const Icon = config.icon;
              const completion = completionLabels[session.completed] || completionLabels.not_today;

              return (
                <Card key={session.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{config.label}</div>
                        {session.goal && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            {session.goal}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {session.duration_minutes} min
                          </Badge>
                          <Badge className={`text-xs ${completion.color}`}>
                            {completion.label}
                          </Badge>
                          {session.gym_sub_type && (
                            <Badge variant="outline" className="text-xs">
                              {session.gym_sub_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <div>{format(parseISO(session.created_at), 'MMM d')}</div>
                      <div>{format(parseISO(session.created_at), 'h:mm a')}</div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
