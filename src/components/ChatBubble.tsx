import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatBubbleProps {
  content: string;
  sender: 'user' | 'aura';
  timestamp: Date;
  className?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  sender,
  timestamp,
  className
}) => {
  const isUser = sender === 'user';

  return (
    <div 
      className={cn(
        'flex w-full animate-slide-up',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div className={cn(
        'max-w-[85%] px-4 py-3 rounded-2xl',
        isUser 
          ? 'bg-aura-bubble-user text-primary-foreground rounded-br-md' 
          : 'bg-aura-bubble-ai text-aura-bubble-ai-text rounded-bl-md'
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        <p className={cn(
          'text-[10px] mt-1.5',
          isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {format(new Date(timestamp), 'h:mm a')}
        </p>
      </div>
    </div>
  );
};
