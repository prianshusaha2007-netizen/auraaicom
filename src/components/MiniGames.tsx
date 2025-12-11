import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Gamepad2, RefreshCw, Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniGameProps {
  gameType: 'word-chain' | 'would-you-rather' | '20-questions';
  onClose: () => void;
}

// Word Chain Game
const WordChainGame: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentWord, setCurrentWord] = useState('apple');
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [usedWords, setUsedWords] = useState<string[]>(['apple']);
  const [message, setMessage] = useState('Start with a word beginning with "E"');
  const [gameOver, setGameOver] = useState(false);

  const handleSubmit = () => {
    const word = inputValue.toLowerCase().trim();
    
    if (!word) return;
    
    const lastLetter = currentWord[currentWord.length - 1].toLowerCase();
    const firstLetter = word[0].toLowerCase();
    
    if (firstLetter !== lastLetter) {
      setMessage(`Word must start with "${lastLetter.toUpperCase()}"!`);
      return;
    }
    
    if (usedWords.includes(word)) {
      setMessage('This word was already used!');
      return;
    }
    
    if (word.length < 3) {
      setMessage('Word must be at least 3 letters!');
      return;
    }

    // Valid word
    setUsedWords([...usedWords, word]);
    setCurrentWord(word);
    setScore(score + word.length);
    setInputValue('');
    setMessage(`Great! Now enter a word starting with "${word[word.length - 1].toUpperCase()}"`);
  };

  const resetGame = () => {
    setCurrentWord('apple');
    setInputValue('');
    setScore(0);
    setUsedWords(['apple']);
    setMessage('Start with a word beginning with "E"');
    setGameOver(false);
  };

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            Word Chain
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground mb-2">Current Word:</p>
          <p className="text-2xl font-bold text-primary capitalize">{currentWord}</p>
        </div>

        <p className="text-sm text-center mb-4 text-muted-foreground">{message}</p>

        <div className="flex gap-2 mb-4">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter your word..."
            className="flex-1"
          />
          <Button onClick={handleSubmit}>Go</Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold">Score: {score}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={resetGame}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          Words used: {usedWords.slice(-5).join(' → ')}
        </div>
      </CardContent>
    </Card>
  );
};

// Would You Rather Game
const WouldYouRatherGame: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const questions = [
    { a: 'Have the ability to fly', b: 'Be invisible at will' },
    { a: 'Never use social media again', b: 'Never watch movies again' },
    { a: 'Always be 10 minutes late', b: 'Always be 20 minutes early' },
    { a: 'Have unlimited money', b: 'Have unlimited time' },
    { a: 'Know all languages', b: 'Play all instruments' },
    { a: 'Live in the mountains', b: 'Live by the beach' },
    { a: 'Only eat pizza forever', b: 'Never eat pizza again' },
    { a: 'Be a famous singer', b: 'Be a famous actor' },
    { a: 'Travel back in time', b: 'Travel to the future' },
    { a: 'Read minds', b: 'Control time' },
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [stats, setStats] = useState({ a: 0, b: 0 });

  const handleChoice = (choice: 'a' | 'b') => {
    setAnswered(choice);
    setStats(prev => ({ ...prev, [choice]: prev[choice] + 1 }));
  };

  const nextQuestion = () => {
    setCurrentQuestion((prev) => (prev + 1) % questions.length);
    setAnswered(null);
  };

  const q = questions[currentQuestion];

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            Would You Rather
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-4">
          Question {currentQuestion + 1} of {questions.length}
        </p>

        <div className="space-y-3">
          <Button
            variant={answered === 'a' ? 'default' : 'outline'}
            className={cn('w-full h-auto py-4 text-wrap', answered === 'a' && 'ring-2 ring-primary')}
            onClick={() => handleChoice('a')}
            disabled={answered !== null}
          >
            {q.a}
          </Button>
          
          <p className="text-center text-muted-foreground text-sm">OR</p>
          
          <Button
            variant={answered === 'b' ? 'default' : 'outline'}
            className={cn('w-full h-auto py-4 text-wrap', answered === 'b' && 'ring-2 ring-primary')}
            onClick={() => handleChoice('b')}
            disabled={answered !== null}
          >
            {q.b}
          </Button>
        </div>

        {answered && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Great choice! 🎉
            </p>
            <Button onClick={nextQuestion}>Next Question</Button>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-muted-foreground">
          Your picks: Option A ({stats.a}) | Option B ({stats.b})
        </div>
      </CardContent>
    </Card>
  );
};

// 20 Questions Game
const TwentyQuestionsGame: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const things = [
    { name: 'elephant', hints: ['animal', 'large', 'gray', 'trunk', 'africa'] },
    { name: 'pizza', hints: ['food', 'round', 'italian', 'cheese', 'toppings'] },
    { name: 'guitar', hints: ['instrument', 'strings', 'music', 'wooden', 'acoustic'] },
    { name: 'smartphone', hints: ['device', 'electronic', 'portable', 'screen', 'apps'] },
    { name: 'bicycle', hints: ['vehicle', 'wheels', 'pedals', 'exercise', 'two'] },
  ];

  const [currentThing, setCurrentThing] = useState(things[Math.floor(Math.random() * things.length)]);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [hintsRevealed, setHintsRevealed] = useState<string[]>([]);
  const [guess, setGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const askQuestion = () => {
    if (questionsAsked >= 20) {
      setGameState('lost');
      return;
    }

    const unrevealedHints = currentThing.hints.filter(h => !hintsRevealed.includes(h));
    if (unrevealedHints.length > 0) {
      const randomHint = unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)];
      setHintsRevealed([...hintsRevealed, randomHint]);
    }
    setQuestionsAsked(questionsAsked + 1);
  };

  const makeGuess = () => {
    if (guess.toLowerCase().trim() === currentThing.name) {
      setGameState('won');
    } else {
      setQuestionsAsked(questionsAsked + 1);
      if (questionsAsked >= 19) {
        setGameState('lost');
      }
    }
    setGuess('');
  };

  const resetGame = () => {
    setCurrentThing(things[Math.floor(Math.random() * things.length)]);
    setQuestionsAsked(0);
    setHintsRevealed([]);
    setGuess('');
    setGameState('playing');
  };

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            20 Questions
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {gameState === 'playing' && (
          <>
            <p className="text-center text-sm text-muted-foreground mb-4">
              I'm thinking of something. Ask questions to figure it out!
            </p>

            <div className="text-center mb-4">
              <p className="text-lg font-semibold">
                Questions: {questionsAsked}/20
              </p>
            </div>

            {hintsRevealed.length > 0 && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Hints revealed:</p>
                <div className="flex flex-wrap gap-2">
                  {hintsRevealed.map((hint, i) => (
                    <span key={i} className="px-2 py-1 bg-primary/10 rounded-full text-xs capitalize">
                      {hint}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={askQuestion} className="w-full mb-4" disabled={questionsAsked >= 20}>
              Ask a Question (Get a Hint)
            </Button>

            <div className="flex gap-2">
              <Input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && makeGuess()}
                placeholder="Make your guess..."
                className="flex-1"
              />
              <Button onClick={makeGuess} disabled={!guess.trim()}>Guess</Button>
            </div>
          </>
        )}

        {gameState === 'won' && (
          <div className="text-center py-4">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-lg font-bold text-green-500 mb-2">You got it!</p>
            <p className="text-muted-foreground mb-4">
              It was "{currentThing.name}" in {questionsAsked} questions!
            </p>
            <Button onClick={resetGame}>Play Again</Button>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="text-center py-4">
            <p className="text-4xl mb-2">😅</p>
            <p className="text-lg font-bold text-orange-500 mb-2">Out of questions!</p>
            <p className="text-muted-foreground mb-4">
              It was "{currentThing.name}"
            </p>
            <Button onClick={resetGame}>Try Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const MiniGame: React.FC<MiniGameProps> = ({ gameType, onClose }) => {
  switch (gameType) {
    case 'word-chain':
      return <WordChainGame onClose={onClose} />;
    case 'would-you-rather':
      return <WouldYouRatherGame onClose={onClose} />;
    case '20-questions':
      return <TwentyQuestionsGame onClose={onClose} />;
    default:
      return null;
  }
};
