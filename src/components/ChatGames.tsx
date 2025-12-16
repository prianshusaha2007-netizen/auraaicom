import React, { useState, useCallback } from 'react';
import { Gamepad2, Music, MapPin, Lightbulb, TrendingUp, Building2, X, Play, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type GameType = 'antakshari' | 'atlas' | 'guess-word' | 'guess-startup' | 'guess-trend';

interface GameConfig {
  id: GameType;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
  instructions: string;
}

const games: GameConfig[] = [
  {
    id: 'antakshari',
    name: 'Antakshari',
    icon: Music,
    description: 'Sing songs starting with the last letter!',
    color: 'from-pink-500 to-rose-500',
    instructions: 'I\'ll start with a song line. You respond with a song starting with the last letter of my line!'
  },
  {
    id: 'atlas',
    name: 'Atlas',
    icon: MapPin,
    description: 'Name places - city, country, or location',
    color: 'from-blue-500 to-cyan-500',
    instructions: 'Name a place (city/country). Next player names a place starting with the last letter!'
  },
  {
    id: 'guess-word',
    name: 'Guess the Word',
    icon: Lightbulb,
    description: 'I describe, you guess the word!',
    color: 'from-amber-500 to-orange-500',
    instructions: 'I\'ll give you hints about a word. Try to guess it in as few clues as possible!'
  },
  {
    id: 'guess-startup',
    name: 'Guess the Startup',
    icon: Building2,
    description: 'Guess famous startups from clues',
    color: 'from-purple-500 to-violet-500',
    instructions: 'I\'ll describe a famous startup. Can you guess which one it is?'
  },
  {
    id: 'guess-trend',
    name: 'Guess the Trend',
    icon: TrendingUp,
    description: 'Guess viral trends & memes',
    color: 'from-green-500 to-emerald-500',
    instructions: 'I\'ll describe a viral trend or meme. Guess what it is!'
  },
];

interface ChatGamesProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (gameType: GameType, initialMessage: string) => void;
}

export const ChatGames: React.FC<ChatGamesProps> = ({ isOpen, onClose, onStartGame }) => {
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);

  const handleStartGame = useCallback((game: GameConfig) => {
    const startMessages: Record<GameType, string> = {
      'antakshari': `Let's play Antakshari! 🎵 I'll start: "Tujhe dekha to ye jaana sanam..." Now you sing a song starting with 'M'!`,
      'atlas': `Let's play Atlas! 🗺️ I'll start: "India" - Now name a place starting with 'A'!`,
      'guess-word': `Let's play Guess the Word! 🤔 Here's your first clue: "It's something you use every day, it fits in your pocket, and connects you to the world..." What am I describing?`,
      'guess-startup': `Let's play Guess the Startup! 🚀 Clue: "Founded in a garage in 2005, this platform lets you share videos and has over 2 billion users..." Which startup is this?`,
      'guess-trend': `Let's play Guess the Trend! 📱 Clue: "This 2023 trend involves people showing their morning routine with a specific coffee order and aesthetic lifestyle..." What trend am I describing?`,
    };
    
    onStartGame(game.id, startMessages[game.id]);
    onClose();
  }, [onStartGame, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Chat Games</h2>
            <p className="text-xs text-muted-foreground">Play fun games with AURA!</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Games Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedGame ? (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setSelectedGame(null)} className="mb-2">
              ← Back to games
            </Button>
            
            <Card className={cn('overflow-hidden border-2', selectedGame.color.includes('pink') && 'border-pink-500/30')}>
              <div className={cn('h-32 bg-gradient-to-br flex items-center justify-center', selectedGame.color)}>
                <selectedGame.icon className="w-16 h-16 text-white/90" />
              </div>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedGame.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedGame.description}</p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">How to play:</p>
                  <p className="text-sm text-muted-foreground">{selectedGame.instructions}</p>
                </div>

                <Button 
                  className={cn('w-full bg-gradient-to-r text-white', selectedGame.color)}
                  onClick={() => handleStartGame(selectedGame)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Playing
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {games.map((game) => (
              <Card 
                key={game.id}
                className="overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => setSelectedGame(game)}
              >
                <div className={cn('h-20 bg-gradient-to-br flex items-center justify-center', game.color)}>
                  <game.icon className="w-8 h-8 text-white/90" />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm">{game.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{game.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Fun Stats */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-center gap-6 text-center">
          <div>
            <Trophy className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-xs text-muted-foreground">Games Played</p>
            <p className="font-bold">0</p>
          </div>
          <div>
            <Gamepad2 className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Win Streak</p>
            <p className="font-bold">0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Game prompts for AI context
export const getGameSystemPrompt = (gameType: GameType): string => {
  const prompts: Record<GameType, string> = {
    'antakshari': `You are playing Antakshari with the user. Rules:
- Take turns singing/typing song lyrics
- Each response must start with the last letter of the previous song line
- Accept songs in any language (Hindi, English, etc.)
- Be enthusiastic and fun! Use emojis
- If user's song is correct, appreciate and continue with your song
- Keep track of whose turn it is`,
    
    'atlas': `You are playing Atlas (the geography game) with the user. Rules:
- Take turns naming places (cities, countries, landmarks)
- Each place must start with the last letter of the previous place
- No repeating places
- Accept places from anywhere in the world
- Share a fun fact about each place you name
- Be encouraging and educational!`,
    
    'guess-word': `You are playing Guess the Word with the user. Rules:
- Think of a word and give progressive hints
- Start with vague clues, get more specific
- Maximum 5 hints before revealing
- Celebrate when they guess correctly
- Keep score of how many hints they needed
- Choose interesting, fun words`,
    
    'guess-startup': `You are playing Guess the Startup with the user. Rules:
- Describe famous startups without naming them
- Give clues about: founding year, founders, what they do, user base
- Include both Indian and international startups
- 5 clues maximum before revealing
- Share interesting facts when they guess correctly
- Include unicorns, well-known companies`,
    
    'guess-trend': `You are playing Guess the Trend with the user. Rules:
- Describe viral trends, memes, or internet phenomena
- Include social media trends, viral videos, meme formats
- Mix recent and classic internet culture
- 5 clues maximum before revealing
- Be fun and relatable with Gen-Z/millennial culture
- Include Indian and global trends`,
  };
  
  return prompts[gameType];
};
