import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LiveClockProps {
  city?: string | null;
  className?: string;
  showIcon?: boolean;
}

/**
 * Live updating clock component for AURRA header
 * Updates every minute, shows local time in 12-hour format
 */
export const LiveClock = ({ city, className = '', showIcon = true }: LiveClockProps) => {
  const [time, setTime] = useState<string>('');
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setTime(timeStr);
    };
    
    // Update immediately
    updateTime();
    
    // Update every minute
    const interval = setInterval(updateTime, 60000);
    
    // Also update on visibility change (when tab becomes active)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateTime();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (!time) return null;

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      {showIcon && <Clock className="w-3 h-3" />}
      <span>{time}</span>
      {city && (
        <>
          <span className="opacity-50">•</span>
          <span className="truncate max-w-[60px]">{city}</span>
        </>
      )}
    </div>
  );
};
