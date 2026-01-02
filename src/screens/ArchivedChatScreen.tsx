import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, Calendar, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { useDailyChat } from '@/hooks/useDailyChat';
import { SplitChatBubble } from '@/components/SplitChatBubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ArchivedMessage {
  id: string;
  content: string;
  sender: 'user' | 'aura';
  timestamp: Date;
}

interface ArchivedChatData {
  id: string;
  chat_date: string;
  messages: ArchivedMessage[];
  summary?: string;
  is_readonly: true;
}

export const ArchivedChatScreen: React.FC = () => {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const { getArchivedChat } = useDailyChat();
  const [archivedChat, setArchivedChat] = useState<ArchivedChatData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadArchivedChat = async () => {
      if (!date) {
        navigate('/chat-history');
        return;
      }

      setIsLoading(true);
      const chat = await getArchivedChat(date);
      if (!chat) {
        navigate('/chat-history');
        return;
      }
      setArchivedChat(chat as ArchivedChatData);
      setIsLoading(false);
    };

    loadArchivedChat();
  }, [date, getArchivedChat, navigate]);

  const formattedDate = date ? format(parseISO(date), 'EEEE, MMMM d, yyyy') : '';

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading archived chat...</div>
      </div>
    );
  }

  if (!archivedChat) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/chat-history')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h1 className="text-base font-semibold">{formattedDate}</h1>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Lock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Archived Chat (Read-only)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            <MessageCircle className="w-3 h-3" />
            <span>{archivedChat.messages.length} messages</span>
          </div>
        </div>

        {/* Summary banner if available */}
        {archivedChat.summary && (
          <div className="px-4 pb-3">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Daily Summary</p>
              <p className="text-sm text-foreground">{archivedChat.summary}</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div ref={scrollRef} className="py-4 space-y-4">
          {archivedChat.messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No messages on this day</p>
            </div>
          ) : (
            archivedChat.messages.map((message, index) => (
              <SplitChatBubble
                key={message.id}
                content={message.content}
                sender={message.sender}
                timestamp={message.timestamp}
                isLatest={index === archivedChat.messages.length - 1}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Disabled input area */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border/50 p-4">
        <div className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-muted/50 border border-border/50"
        )}>
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            This is an archived chat. Start a new conversation today.
          </span>
        </div>
        <Button
          className="w-full mt-3"
          onClick={() => navigate('/')}
        >
          Go to Today's Chat
        </Button>
      </div>
    </div>
  );
};

export default ArchivedChatScreen;
