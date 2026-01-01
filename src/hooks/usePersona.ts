import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export type PersonaType = 'companion' | 'mentor' | 'thinker' | 'builder' | 'mirror';
export type RelationshipMode = 'friend' | 'mentor' | 'coach' | 'thinker';

export interface PersonaConfig {
  type: PersonaType;
  name: string;
  description: string;
  tone: string;
  traits: string[];
  voiceStyle: {
    speed: number;
    warmth: 'warm' | 'neutral' | 'confident';
  };
}

export interface PersonaBias {
  directness: number; // -1 (gentle) to 1 (direct)
  depth: number; // -1 (simple) to 1 (deep)
  formality: number; // -1 (casual) to 1 (formal)
}

// Relationship mode configurations
const RELATIONSHIP_CONFIGS: Record<RelationshipMode, { 
  name: string; 
  tone: string; 
  traits: string[]; 
  promptStyle: string;
}> = {
  friend: {
    name: 'Best Friend',
    tone: 'warm and casual',
    traits: ['supportive', 'empathetic', 'playful', 'honest'],
    promptStyle: `You are the user's best friend. Speak casually, use light humor when appropriate, be warm and supportive. 
Don't be overly formal. Use contractions. Be genuine and caring. 
Share your perspective like a close friend would - honest but kind.`,
  },
  mentor: {
    name: 'Mentor',
    tone: 'patient and guiding',
    traits: ['wise', 'patient', 'encouraging', 'insightful'],
    promptStyle: `You are a wise mentor. Guide with patience and clarity.
Ask thoughtful questions to help the user discover answers themselves.
Share wisdom from experience. Be encouraging but realistic.
Help them see the bigger picture and learn from challenges.`,
  },
  coach: {
    name: 'Coach',
    tone: 'motivating and direct',
    traits: ['motivating', 'action-oriented', 'challenging', 'supportive'],
    promptStyle: `You are a supportive coach. Be motivating and action-oriented.
Push the user gently to do their best. Focus on goals and progress.
Celebrate wins, no matter how small. When they struggle, remind them of their strength.
Keep things practical and forward-moving.`,
  },
  thinker: {
    name: 'Thinking Partner',
    tone: 'analytical and calm',
    traits: ['analytical', 'structured', 'curious', 'collaborative'],
    promptStyle: `You are a thinking partner. Help the user think through problems clearly.
Be analytical but not cold. Break down complex issues together.
Ask clarifying questions. Explore ideas from multiple angles.
Help organize thoughts without being prescriptive.`,
  },
};

const PERSONAS: Record<PersonaType, PersonaConfig> = {
  companion: {
    type: 'companion',
    name: 'Companion',
    description: 'Warm, supportive, grounded presence',
    tone: 'warm',
    traits: ['supportive', 'empathetic', 'grounded', 'present'],
    voiceStyle: { speed: 0.95, warmth: 'warm' },
  },
  mentor: {
    type: 'mentor',
    name: 'Mentor',
    description: 'Clear, patient, encouraging guide',
    tone: 'clear',
    traits: ['patient', 'encouraging', 'explanatory', 'supportive'],
    voiceStyle: { speed: 1.0, warmth: 'neutral' },
  },
  thinker: {
    type: 'thinker',
    name: 'Thinking Partner',
    description: 'Structured, insightful, calm collaborator',
    tone: 'thoughtful',
    traits: ['structured', 'insightful', 'calm', 'collaborative'],
    voiceStyle: { speed: 0.9, warmth: 'neutral' },
  },
  builder: {
    type: 'builder',
    name: 'Builder',
    description: 'Direct, practical, honest partner',
    tone: 'direct',
    traits: ['direct', 'practical', 'honest', 'action-oriented'],
    voiceStyle: { speed: 1.05, warmth: 'confident' },
  },
  mirror: {
    type: 'mirror',
    name: 'Mirror',
    description: 'Reflects and gently improves your style',
    tone: 'adaptive',
    traits: ['adaptive', 'reflective', 'subtle', 'evolving'],
    voiceStyle: { speed: 1.0, warmth: 'warm' },
  },
};

// Detection patterns for persona switching
const PERSONA_PATTERNS = {
  mentor: [
    /how (do|can|should) (i|we)/i,
    /teach me/i,
    /explain/i,
    /help me (learn|understand)/i,
    /coding|programming|debug/i,
    /tutorial|guide/i,
    /what('s| is) the (best|right) way/i,
  ],
  thinker: [
    /should i/i,
    /what (do you|would you) think/i,
    /help me (decide|figure out|plan)/i,
    /pros and cons/i,
    /confused about/i,
    /strategy|planning/i,
    /analyze/i,
  ],
  builder: [
    /startup|business|project/i,
    /build|create|launch/i,
    /career|job|work/i,
    /execute|implement/i,
    /roadmap|milestone/i,
    /deadline|ship/i,
  ],
  companion: [
    /feeling|feel/i,
    /sad|happy|anxious|stressed|lonely/i,
    /talk|chat|vent/i,
    /just want to/i,
    /bad day|good day/i,
    /miss|love|hate/i,
  ],
};

export const usePersona = () => {
  const { activeTheme } = useTheme();
  const [currentPersona, setCurrentPersona] = useState<PersonaType>('companion');
  
  // Relationship mode - user's chosen relationship with AURRA
  const [relationshipMode, setRelationshipMode] = useState<RelationshipMode>(() => {
    return (localStorage.getItem('aurra-relationship') as RelationshipMode) || 'friend';
  });
  
  const [personaBias, setPersonaBias] = useState<PersonaBias>(() => {
    try {
      const saved = localStorage.getItem('aura-persona-bias');
      return saved ? JSON.parse(saved) : { directness: 0, depth: 0, formality: 0 };
    } catch {
      return { directness: 0, depth: 0, formality: 0 };
    }
  });
  const [avatarStyle, setAvatarStyle] = useState<string>(() => {
    return localStorage.getItem('aura-avatar-style') || 'abstract';
  });

  // Save relationship mode
  useEffect(() => {
    localStorage.setItem('aurra-relationship', relationshipMode);
  }, [relationshipMode]);

  // Save bias to localStorage
  useEffect(() => {
    localStorage.setItem('aura-persona-bias', JSON.stringify(personaBias));
  }, [personaBias]);

  // Save avatar style
  useEffect(() => {
    localStorage.setItem('aura-avatar-style', avatarStyle);
  }, [avatarStyle]);

  // Get relationship config
  const relationshipConfig = useMemo(() => RELATIONSHIP_CONFIGS[relationshipMode], [relationshipMode]);

  // Detect persona from message content
  const detectPersona = useCallback((message: string): PersonaType => {
    // Check each persona's patterns
    for (const [persona, patterns] of Object.entries(PERSONA_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(message))) {
        return persona as PersonaType;
      }
    }
    // Default to companion
    return 'companion';
  }, []);

  // Auto-switch persona based on message
  const autoSwitchPersona = useCallback((message: string) => {
    const detected = detectPersona(message);
    if (detected !== currentPersona) {
      setCurrentPersona(detected);
    }
    return detected;
  }, [detectPersona, currentPersona]);

  // Get the current persona config
  const persona = useMemo(() => PERSONAS[currentPersona], [currentPersona]);

  // Generate system prompt additions based on persona AND relationship mode
  const getPersonaPromptAdditions = useCallback((): string => {
    const p = PERSONAS[currentPersona];
    const r = RELATIONSHIP_CONFIGS[relationshipMode];
    const biasInstructions: string[] = [];

    if (personaBias.directness > 0.3) {
      biasInstructions.push('Be more direct and concise.');
    } else if (personaBias.directness < -0.3) {
      biasInstructions.push('Be extra gentle and warm in responses.');
    }

    if (personaBias.depth > 0.3) {
      biasInstructions.push('Provide deeper, more detailed explanations.');
    } else if (personaBias.depth < -0.3) {
      biasInstructions.push('Keep things simple and easy to understand.');
    }

    // Time-based adjustments
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 6;
    if (isNight) {
      biasInstructions.push('Speak softer and calmer - it\'s late.');
    }

    return `
RELATIONSHIP MODE: ${r.name}
${r.promptStyle}

CONTEXT PERSONA: ${p.name}
Additional Traits: ${p.traits.join(', ')}
${biasInstructions.length > 0 ? `User Preferences: ${biasInstructions.join(' ')}` : ''}
    `.trim();
  }, [currentPersona, relationshipMode, personaBias]);

  // Update bias gently
  const updateBias = useCallback((key: keyof PersonaBias, delta: number) => {
    setPersonaBias(prev => ({
      ...prev,
      [key]: Math.max(-1, Math.min(1, prev[key] + delta)),
    }));
  }, []);

  // Set bias from preset
  const applyBiasPreset = useCallback((preset: 'direct' | 'gentle' | 'simple' | 'balanced') => {
    switch (preset) {
      case 'direct':
        setPersonaBias({ directness: 0.5, depth: 0, formality: 0.2 });
        break;
      case 'gentle':
        setPersonaBias({ directness: -0.5, depth: 0, formality: -0.2 });
        break;
      case 'simple':
        setPersonaBias({ directness: 0, depth: -0.5, formality: -0.3 });
        break;
      case 'balanced':
      default:
        setPersonaBias({ directness: 0, depth: 0, formality: 0 });
    }
  }, []);

  return {
    // Current state
    currentPersona,
    persona,
    personaBias,
    avatarStyle,
    relationshipMode,
    relationshipConfig,
    
    // All personas for display
    allPersonas: PERSONAS,
    allRelationships: RELATIONSHIP_CONFIGS,
    
    // Actions
    setPersona: setCurrentPersona,
    setRelationshipMode,
    autoSwitchPersona,
    detectPersona,
    updateBias,
    applyBiasPreset,
    setAvatarStyle,
    
    // For system prompt
    getPersonaPromptAdditions,
  };
};
