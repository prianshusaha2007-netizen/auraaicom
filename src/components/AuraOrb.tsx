import React from 'react';
import { cn } from '@/lib/utils';

interface AuraOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  xl: 'w-40 h-40',
};

export const AuraOrb: React.FC<AuraOrbProps> = ({ 
  size = 'lg', 
  isThinking = false,
  className 
}) => {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Outer glow ring */}
      <div 
        className={cn(
          'absolute rounded-full opacity-30',
          sizeClasses[size],
          'bg-gradient-to-br from-aura-orb-inner to-aura-orb-outer',
          'blur-xl',
          isThinking ? 'animate-pulse' : 'animate-breathe'
        )}
        style={{ transform: 'scale(1.5)' }}
      />
      
      {/* Middle glow */}
      <div 
        className={cn(
          'absolute rounded-full opacity-50',
          sizeClasses[size],
          'bg-gradient-to-br from-aura-orb-inner via-aura-orb-outer to-aura-orb-inner',
          'blur-md',
          isThinking ? 'animate-pulse' : 'animate-breathe'
        )}
        style={{ transform: 'scale(1.2)', animationDelay: '0.2s' }}
      />
      
      {/* Main orb */}
      <div 
        className={cn(
          'relative rounded-full',
          sizeClasses[size],
          'bg-gradient-to-br from-aura-orb-inner via-primary to-aura-orb-outer',
          'shadow-lg',
          isThinking ? 'animate-pulse' : 'animate-breathe animate-pulse-glow'
        )}
        style={{ animationDelay: '0.1s' }}
      >
        {/* Inner highlight */}
        <div 
          className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent"
        />
        
        {/* Core light */}
        <div 
          className="absolute inset-1/4 rounded-full bg-white/20 blur-sm"
        />
      </div>

      {/* Thinking indicator */}
      {isThinking && (
        <div className="absolute -bottom-8 flex gap-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-thinking" style={{ animationDelay: '0s' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-thinking" style={{ animationDelay: '0.2s' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-thinking" style={{ animationDelay: '0.4s' }} />
        </div>
      )}
    </div>
  );
};
