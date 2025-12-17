import React, { useState, useMemo } from 'react';
import { History, MessageCircle, Trash2, Calendar, Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAura } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface GroupedMessages {
  label: string;
  messages: {
    id: string;
    preview: string;
    timestamp: Date;
    sender: 'user' | 'aura';
  }[];
}

export const ChatHistoryScreen: React.FC = () => {
  const { chatMessages, clearChatHistory } = useAura();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return chatMessages;
    const query = searchQuery.toLowerCase();
    return chatMessages.filter(msg => 
      msg.content.toLowerCase().includes(query)
    );
  }, [chatMessages, searchQuery]);

  const groupMessagesByDate = (): GroupedMessages[] => {
    const groups: Record<string, GroupedMessages['messages']> = {};
    
    filteredMessages.forEach((msg) => {
      const date = new Date(msg.timestamp);
      let label: string;
      
      if (isToday(date)) {
        label = 'Today';
      } else if (isYesterday(date)) {
        label = 'Yesterday';
      } else if (isThisWeek(date)) {
        label = 'This Week';
      } else {
        label = format(date, 'MMMM yyyy');
      }
      
      if (!groups[label]) groups[label] = [];
      groups[label].push({
        id: msg.id,
        preview: msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : ''),
        timestamp: date,
        sender: msg.sender,
      });
    });

    return Object.entries(groups).map(([label, messages]) => ({
      label,
      messages: messages.reverse(),
    }));
  };

  const handleClearHistory = () => {
    clearChatHistory();
    toast({
      title: "Chat history cleared",
      description: "All your previous conversations have been deleted.",
    });
  };

  const groupedMessages = groupMessagesByDate();
  const totalMessages = filteredMessages.length;

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="p-4 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Chat History</h1>
          </div>
          {chatMessages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearHistory}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-card border-border/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          {searchQuery 
            ? `${totalMessages} results for "${searchQuery}"` 
            : `${chatMessages.length} messages in conversation`
          }
        </p>
      </div>

      <div className="p-4 space-y-6">
        {groupedMessages.length > 0 ? (
          groupedMessages.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">{group.label}</h3>
              </div>
              <div className="space-y-2">
                {group.messages.map((msg) => (
                  <Card 
                    key={msg.id}
                    className={cn(
                      'border-border/50 hover:border-primary/30 transition-colors',
                      msg.sender === 'user' && 'border-l-2 border-l-primary'
                    )}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'p-2 rounded-full shrink-0',
                          msg.sender === 'user' 
                            ? 'bg-primary/10' 
                            : 'bg-accent/10'
                        )}>
                          <MessageCircle className={cn(
                            'w-4 h-4',
                            msg.sender === 'user' 
                              ? 'text-primary' 
                              : 'text-accent'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-medium capitalize text-muted-foreground">
                              {msg.sender === 'user' ? 'You' : 'AURA'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(msg.timestamp, 'h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 line-clamp-2">
                            {msg.preview}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              {searchQuery ? (
                <Search className="w-8 h-8 text-muted-foreground" />
              ) : (
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-semibold mb-2">
              {searchQuery ? 'No results found' : 'No conversations yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? `Try searching for something else` 
                : 'Start chatting with AURA to see your history here'
              }
            </p>
          </div>
        )}

        {/* Stats Card */}
        {chatMessages.length > 0 && !searchQuery && (
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{chatMessages.length}</p>
                  <p className="text-xs text-muted-foreground">Total Messages</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {chatMessages.filter(m => m.sender === 'user').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Your Messages</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {chatMessages.filter(m => m.sender === 'aura').length}
                  </p>
                  <p className="text-xs text-muted-foreground">AURA Replies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
