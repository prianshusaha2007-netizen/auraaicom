import { useState, useCallback } from 'react';

export interface StoryState {
  isActive: boolean;
  genre: string;
  title: string;
  currentPart: number;
  choices: string[];
  storyContext: string;
}

const storyGenres = [
  'adventure',
  'mystery',
  'fantasy',
  'romance',
  'horror',
  'sci-fi',
  'comedy',
  'thriller',
  'moral',
  'bedtime',
];

const storyTriggers = [
  'tell me a story',
  'start a story',
  'story sunao',
  'kahani sunao',
  'ek kahani',
  'interactive story',
  'bedtime story',
  'adventure story',
  'mystery story',
  'fantasy story',
  'horror story',
  'love story',
  'romantic story',
  'sci-fi story',
  'funny story',
  'moral story',
  'thriller story',
  'let\'s play story',
  'story game',
  'choose your adventure',
];

const storyPromptTemplates: Record<string, string> = {
  adventure: `You are now telling an interactive adventure story. Create an exciting adventure with brave heroes, dangerous quests, and thrilling moments. After each part, give the user 2-3 choices that will change the story direction.`,
  mystery: `You are now telling an interactive mystery story. Create a suspenseful mystery with clues, suspects, and plot twists. After each part, give the user 2-3 choices to investigate different leads.`,
  fantasy: `You are now telling an interactive fantasy story. Create a magical world with wizards, mythical creatures, and epic quests. After each part, give the user 2-3 choices that affect the magical journey.`,
  romance: `You are now telling an interactive romance story. Create a heartfelt love story with emotional moments and romantic tension. After each part, give the user 2-3 choices about the relationship.`,
  horror: `You are now telling an interactive horror story. Create a creepy, suspenseful tale with scary moments (but not too graphic). After each part, give the user 2-3 choices about how to survive.`,
  'sci-fi': `You are now telling an interactive sci-fi story. Create a futuristic tale with advanced technology, space exploration, or dystopian worlds. After each part, give the user 2-3 choices.`,
  comedy: `You are now telling an interactive comedy story. Create a funny tale with witty dialogue, silly situations, and humorous characters. Keep it light and fun. After each part, give the user 2-3 choices.`,
  thriller: `You are now telling an interactive thriller story. Create a tense, fast-paced story with danger and suspense. After each part, give the user 2-3 choices about the next move.`,
  moral: `You are now telling an interactive moral story. Create a tale with life lessons and meaningful themes. Make it suitable for all ages. After each part, give the user 2-3 choices that teach values.`,
  bedtime: `You are now telling a calming bedtime story. Create a gentle, soothing tale perfect for relaxation. Keep it peaceful and positive. Make it progressively calming to help the listener relax.`,
};

export const useStorytellingMode = () => {
  const [storyState, setStoryState] = useState<StoryState>({
    isActive: false,
    genre: '',
    title: '',
    currentPart: 0,
    choices: [],
    storyContext: '',
  });

  const detectStoryIntent = useCallback((text: string): { isStory: boolean; genre: string } => {
    const lowerText = text.toLowerCase().trim();
    
    // Check for story triggers
    const hasStoryTrigger = storyTriggers.some(trigger => 
      lowerText.includes(trigger.toLowerCase())
    );
    
    // Detect genre
    let detectedGenre = 'adventure'; // default
    for (const genre of storyGenres) {
      if (lowerText.includes(genre)) {
        detectedGenre = genre;
        break;
      }
    }
    
    // Check for specific Hindi story types
    if (lowerText.includes('darawani') || lowerText.includes('bhootni')) {
      detectedGenre = 'horror';
    } else if (lowerText.includes('romantic') || lowerText.includes('love') || lowerText.includes('pyar')) {
      detectedGenre = 'romance';
    } else if (lowerText.includes('funny') || lowerText.includes('mazaak') || lowerText.includes('comedy')) {
      detectedGenre = 'comedy';
    } else if (lowerText.includes('bedtime') || lowerText.includes('neend') || lowerText.includes('sone se pehle')) {
      detectedGenre = 'bedtime';
    } else if (lowerText.includes('moral') || lowerText.includes('seekh')) {
      detectedGenre = 'moral';
    }
    
    return { isStory: hasStoryTrigger, genre: detectedGenre };
  }, []);

  const startStory = useCallback((genre: string) => {
    setStoryState({
      isActive: true,
      genre,
      title: '',
      currentPart: 1,
      choices: [],
      storyContext: storyPromptTemplates[genre] || storyPromptTemplates.adventure,
    });
  }, []);

  const endStory = useCallback(() => {
    setStoryState({
      isActive: false,
      genre: '',
      title: '',
      currentPart: 0,
      choices: [],
      storyContext: '',
    });
  }, []);

  const makeChoice = useCallback((choice: string) => {
    setStoryState(prev => ({
      ...prev,
      currentPart: prev.currentPart + 1,
      storyContext: prev.storyContext + `\n\nUser chose: "${choice}". Continue the story based on this choice.`,
    }));
    return choice;
  }, []);

  const getStorySystemPrompt = useCallback((genre: string, context: string): string => {
    const basePrompt = storyPromptTemplates[genre] || storyPromptTemplates.adventure;
    
    return `${basePrompt}

STORYTELLING RULES:
1. Tell the story in 2nd person ("You walk into the forest...")
2. Create vivid, immersive descriptions
3. Mix Hindi/English naturally based on user's language
4. Keep each part to 3-4 paragraphs max
5. End each part with a cliffhanger or decision point
6. Format choices clearly like:
   🔹 Choice A: [description]
   🔹 Choice B: [description]
   🔹 Choice C: [description] (optional)
7. Make the user feel like the hero of the story
8. React dramatically to their choices
9. Remember previous choices and build on them
10. Use emojis sparingly for atmosphere: ⚔️ 🌙 ✨ 🔮 💀 ❤️

${context ? `\nStory Context:\n${context}` : ''}

START THE STORY NOW! Make it engaging from the first line.`;
  }, []);

  const generateStoryStartMessage = useCallback((genre: string): string => {
    const messages: Record<string, string[]> = {
      adventure: [
        "Ooh adventure story! 🗡️ Let's goooo! Ready for an epic quest?",
        "Arre yaar, adventure mood hai? Perfect! Chal shuru karte hain! ⚔️",
        "Adventure time! Get ready, you're about to become a hero! 🦸",
      ],
      mystery: [
        "Mystery! 🔍 I love these. Something strange is about to happen...",
        "Ooh detective mode ON! Ready to solve a mystery? 🕵️",
        "Chal, ek rahasya suljhate hain... are you ready? 🔮",
      ],
      fantasy: [
        "Fantasy! ✨ Magic, dragons, adventure... Let's go!",
        "Jadoo ki duniya mein chalte hain? Ready for some magic? 🧙‍♂️",
        "Welcome to a world where anything is possible! 🐉",
      ],
      romance: [
        "Aww, love story! ❤️ Get ready for some feels...",
        "Pyar ki kahani sunni hai? Let's make it beautiful! 💕",
        "Romance mode activated! Prepare your heart... 💝",
      ],
      horror: [
        "Horror! 😱 Are you sure? It's going to get creepy...",
        "Darawani kahani? Okay, but don't blame me if you can't sleep! 👻",
        "Lights off, headphones on... let's get scared together! 💀",
      ],
      'sci-fi': [
        "Sci-fi! 🚀 Future awaits! Ready to explore the cosmos?",
        "Welcome to the future! Tech, space, and mysteries await! 🌌",
        "Initiating sci-fi story mode... 3, 2, 1... 🤖",
      ],
      comedy: [
        "Haha let's have some fun! 😂 Ready to laugh?",
        "Comedy time! Get ready for some mazaak! 🎭",
        "Warning: Excessive laughter may occur! 😆",
      ],
      thriller: [
        "Thriller! 😰 Things are about to get intense...",
        "Heart racing already? It's about to get worse! 🎬",
        "Buckle up, this is going to be a wild ride! ⚡",
      ],
      moral: [
        "Moral story! 📚 Let's learn something meaningful...",
        "Seedhi baat, let's make this story count! ✨",
        "A story that'll stay with you... ready? 🌟",
      ],
      bedtime: [
        "Bedtime story! 🌙 Let's calm down and relax...",
        "Shhhh... close your eyes and listen... 💤",
        "Time for a peaceful journey... 🌟",
      ],
    };
    
    const genreMessages = messages[genre] || messages.adventure;
    return genreMessages[Math.floor(Math.random() * genreMessages.length)];
  }, []);

  return {
    storyState,
    detectStoryIntent,
    startStory,
    endStory,
    makeChoice,
    getStorySystemPrompt,
    generateStoryStartMessage,
    storyGenres,
  };
};
