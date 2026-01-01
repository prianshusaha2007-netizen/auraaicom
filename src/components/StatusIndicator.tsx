import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type AuraStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

interface StatusIndicatorProps {
  status: AuraStatus;
  className?: string;
}

const statusConfig: Record<AuraStatus, { label: string; color: string; pulse: boolean }> = {
  idle: {
    label: 'Here with you',
    color: 'bg-muted-foreground/50',
    pulse: false,
  },
  listening: {
    label: 'Listening',
    color: 'bg-green-500',
    pulse: true,
  },
  thinking: {
    label: 'Thinking...',
    color: 'bg-primary',
    pulse: true,
  },
  speaking: {
    label: 'Speaking',
    color: 'bg-violet-500',
    pulse: true,
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className }) => {
  const config = statusConfig[status];
  
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Status dot */}
      <div className="relative">
        <motion.div
          className={cn("w-2 h-2 rounded-full", config.color)}
          animate={config.pulse ? { scale: [1, 1.2, 1] } : undefined}
          transition={config.pulse ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : undefined}
        />
        {/* Pulse ring for active states */}
        {config.pulse && (
          <motion.div
            className={cn("absolute inset-0 w-2 h-2 rounded-full", config.color)}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </div>
      
      {/* Status text */}
      <motion.span
        key={config.label}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-muted-foreground"
      >
        {config.label}
      </motion.span>
    </div>
  );
};
