import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, Play, Pause, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRoutineBlocks, RoutineBlock } from '@/hooks/useRoutineBlocks';
import { useRoutineVisualization } from '@/hooks/useRoutineVisualization';

interface RoutineWidgetProps {
  onViewRoutine?: () => void;
  onViewVisual?: () => void;
  className?: string;
}

export const RoutineWidget: React.FC<RoutineWidgetProps> = ({
  onViewRoutine,
  onViewVisual,
  className,
}) => {
  const { blocks, activeBlock } = useRoutineBlocks();
  const { routineVisual } = useRoutineVisualization();

  // Get today's blocks sorted by start time
  const todayBlocks = useMemo(() => {
    const today = new Date().getDay();
    return blocks
      .filter(b => b.isActive && b.days.includes(today))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [blocks]);

  // Get current time for comparison
  const now = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  // Find current and next block
  const { currentBlock, nextBlock, upcomingBlocks } = useMemo(() => {
    let current: RoutineBlock | null = null;
    let next: RoutineBlock | null = null;
    const upcoming: RoutineBlock[] = [];

    for (const block of todayBlocks) {
      if (now >= block.startTime && now <= block.endTime) {
        current = block;
      } else if (now < block.startTime) {
        if (!next) next = block;
        if (upcoming.length < 3) upcoming.push(block);
      }
    }

    return { currentBlock: current, nextBlock: next, upcomingBlocks: upcoming };
  }, [todayBlocks, now]);

  // Calculate time until next block
  const timeUntilNext = useMemo(() => {
    if (!nextBlock) return null;
    const [nextHour, nextMin] = nextBlock.startTime.split(':').map(Number);
    const nowDate = new Date();
    const nextDate = new Date();
    nextDate.setHours(nextHour, nextMin, 0, 0);
    
    const diffMs = nextDate.getTime() - nowDate.getTime();
    if (diffMs < 0) return null;
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, [nextBlock]);

  // Format time for display
  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  if (todayBlocks.length === 0 && !routineVisual) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full", className)}
    >
      <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-border/50">
        {/* Header with visual preview */}
        <div className="relative">
          {routineVisual ? (
            <div 
              className="h-20 bg-cover bg-center cursor-pointer group"
              style={{ backgroundImage: `url(${routineVisual.imageUrl})` }}
              onClick={onViewVisual}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-between px-4">
                <div>
                  <p className="text-xs text-muted-foreground">Today's Routine</p>
                  <p className="text-sm font-medium text-foreground">
                    {todayBlocks.length} blocks scheduled
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="h-7 rounded-full gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewVisual?.();
                  }}
                >
                  <Eye className="w-3 h-3" />
                  View
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Today's Routine</span>
              </div>
            </div>
          )}
        </div>

        {/* Current Block */}
        <AnimatePresence mode="wait">
          {currentBlock && (
            <motion.div
              key="current"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 bg-primary/5 border-b border-border/30"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                  "bg-gradient-to-br",
                  currentBlock.color
                )}>
                  {currentBlock.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                      Now
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                  <p className="text-sm font-medium truncate">{currentBlock.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(currentBlock.startTime)} - {formatTime(currentBlock.endTime)}
                  </p>
                </div>
                {activeBlock && (
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary">
                      {activeBlock.remainingMinutes}m
                    </p>
                    <p className="text-xs text-muted-foreground">left</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Block */}
        {nextBlock && (
          <div className="px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm opacity-70",
                "bg-gradient-to-br",
                nextBlock.color
              )}>
                {nextBlock.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {timeUntilNext ? `In ${timeUntilNext}` : 'Up next'}
                </p>
                <p className="text-sm font-medium truncate">{nextBlock.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatTime(nextBlock.startTime)}
              </p>
            </div>
          </div>
        )}

        {/* Upcoming blocks preview */}
        {upcomingBlocks.length > 1 && (
          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {upcomingBlocks.slice(1, 4).map((block, i) => (
              <div 
                key={block.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 shrink-0"
              >
                <span className="text-xs">{block.icon}</span>
                <span className="text-xs text-muted-foreground">{formatTime(block.startTime)}</span>
              </div>
            ))}
            {todayBlocks.length > 4 && (
              <span className="text-xs text-muted-foreground shrink-0">
                +{todayBlocks.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
            onClick={onViewRoutine}
          >
            <span>View full routine</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
