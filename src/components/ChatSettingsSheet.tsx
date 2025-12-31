import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAura, RelationshipStyle, AurraGender } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  GraduationCap, 
  Brain, 
  Sparkles,
  Users,
  CheckSquare,
  Star
} from 'lucide-react';

interface ChatSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RELATIONSHIP_OPTIONS: {
  id: RelationshipStyle;
  icon: typeof Heart;
  label: string;
  description: string;
  color: string;
  recommended?: boolean;
}[] = [
  { 
    id: 'best_friend', 
    icon: Star, 
    label: 'Best Friend', 
    description: 'Supportive, honest, and always on your side.',
    color: 'text-yellow-500',
    recommended: true
  },
  { 
    id: 'companion', 
    icon: Heart, 
    label: 'Companion', 
    description: 'For when you just want someone there.',
    color: 'text-pink-500'
  },
  { 
    id: 'thinking_partner', 
    icon: Brain, 
    label: 'Thinking Partner', 
    description: 'For planning, decisions, and clarity.',
    color: 'text-purple-500'
  },
  { 
    id: 'mentor', 
    icon: GraduationCap, 
    label: 'Mentor', 
    description: 'For learning and self-improvement.',
    color: 'text-blue-500'
  },
  { 
    id: 'assistant', 
    icon: CheckSquare, 
    label: 'Personal Assistant', 
    description: 'For getting things done efficiently.',
    color: 'text-green-500'
  },
];

const GENDER_OPTIONS: {
  id: AurraGender;
  label: string;
}[] = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'feminine', label: 'Feminine' },
  { id: 'masculine', label: 'Masculine' },
];

const RESPONSE_STYLES = [
  { id: 'short', label: 'Short & calm' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'detailed', label: 'Detailed (only when needed)' },
];

export const ChatSettingsSheet: React.FC<ChatSettingsSheetProps> = ({ open, onOpenChange }) => {
  const { userProfile, updateUserProfile } = useAura();
  
  // AI Name state
  const [useCustomName, setUseCustomName] = useState(
    userProfile.aiName && userProfile.aiName !== 'AURRA'
  );
  const [customName, setCustomName] = useState(userProfile.aiName || 'AURRA');
  
  // Relationship style (new)
  const [relationshipStyle, setRelationshipStyle] = useState<RelationshipStyle>(
    userProfile.relationshipStyle || 'best_friend'
  );
  
  // AURRA gender (new)
  const [aurraGender, setAurraGender] = useState<AurraGender>(
    userProfile.aurraGender || 'neutral'
  );
  
  // Response style
  const [responseStyle, setResponseStyle] = useState(
    userProfile.responseStyle || 'balanced'
  );
  
  // Humor toggle
  const [askBeforeJoking, setAskBeforeJoking] = useState(
    userProfile.askBeforeJoking !== false
  );
  
  // Memory permissions
  const [memoryPermissions, setMemoryPermissions] = useState({
    goals: userProfile.memoryPermissions?.goals !== false,
    preferences: userProfile.memoryPermissions?.preferences !== false,
    emotional: userProfile.memoryPermissions?.emotional !== false,
  });

  // Auto-save on changes
  useEffect(() => {
    const aiName = useCustomName ? customName : 'AURRA';
    
    updateUserProfile({
      aiName,
      relationshipStyle,
      aurraGender,
      responseStyle,
      askBeforeJoking,
      memoryPermissions,
    });
    
    // Also persist to localStorage for immediate access
    localStorage.setItem('aurra-ai-name', aiName);
    localStorage.setItem('aurra-chat-settings', JSON.stringify({
      relationshipStyle,
      aurraGender,
      responseStyle,
      askBeforeJoking,
      memoryPermissions,
    }));
  }, [useCustomName, customName, relationshipStyle, aurraGender, responseStyle, askBeforeJoking, memoryPermissions]);

  const handleCustomNameChange = (name: string) => {
    if (name.length <= 15) {
      setCustomName(name);
    }
  };

  const handleMemoryToggle = (key: keyof typeof memoryPermissions) => {
    setMemoryPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const currentAiName = useCustomName ? customName : 'AURRA';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Relationship & Presence
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-8 pb-8">
          {/* Section 1: Relationship Style (Main Feature) */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">How do you want me to show up for you?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                This doesn't change who I am — it just shapes how I talk and support you.
              </p>
            </div>
            
            <RadioGroup 
              value={relationshipStyle} 
              onValueChange={(v) => setRelationshipStyle(v as RelationshipStyle)}
              className="space-y-2"
            >
              {RELATIONSHIP_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.id}
                    htmlFor={`relationship-${option.id}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      relationshipStyle === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value={option.id} id={`relationship-${option.id}`} className="sr-only" />
                    <div className={cn("p-2 rounded-lg bg-muted", option.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium flex items-center gap-2">
                        {option.label}
                        {option.recommended && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            Recommended
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    {relationshipStyle === option.id && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </label>
                );
              })}
            </RadioGroup>
            
            <p className="text-xs text-muted-foreground/70 italic">
              You can change this anytime. I'll still adapt naturally.
            </p>
          </div>

          {/* Section 2: AURRA's Gender */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">How would you like me to sound?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                This only affects voice, wording, and emotional tone — not intelligence.
              </p>
            </div>
            
            <RadioGroup 
              value={aurraGender} 
              onValueChange={(v) => setAurraGender(v as AurraGender)}
              className="flex gap-2"
            >
              {GENDER_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  htmlFor={`gender-${option.id}`}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm",
                    aurraGender === option.id
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={option.id} id={`gender-${option.id}`} className="sr-only" />
                  {option.label}
                  {option.id === 'neutral' && aurraGender !== option.id && (
                    <span className="text-[10px] text-muted-foreground">(default)</span>
                  )}
                </label>
              ))}
            </RadioGroup>
            
            <p className="text-xs text-muted-foreground/70 italic">
              You can change this anytime.
            </p>
          </div>

          {/* Section 3: AI Name */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">What should I call myself?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Giving me a name can make our conversations feel more personal.
              </p>
            </div>
            
            <RadioGroup 
              value={useCustomName ? 'custom' : 'aurra'} 
              onValueChange={(v) => setUseCustomName(v === 'custom')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="aurra" id="name-aurra" />
                <Label htmlFor="name-aurra" className="text-sm cursor-pointer">
                  AURRA <span className="text-muted-foreground">(default)</span>
                </Label>
              </div>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="custom" id="name-custom" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="name-custom" className="text-sm cursor-pointer">
                    Custom name
                  </Label>
                  {useCustomName && (
                    <Input
                      value={customName === 'AURRA' ? '' : customName}
                      onChange={(e) => handleCustomNameChange(e.target.value)}
                      placeholder="e.g., Nova, Alex..."
                      className="h-9 rounded-xl"
                      maxLength={15}
                    />
                  )}
                </div>
              </div>
            </RadioGroup>
            
            <p className="text-xs text-muted-foreground/70 italic">
              I'll use this name gently — only in emotional or reassuring moments.
            </p>
          </div>

          {/* Section 4: Response Style */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Response style</h3>
            
            <RadioGroup 
              value={responseStyle} 
              onValueChange={setResponseStyle}
              className="space-y-2"
            >
              {RESPONSE_STYLES.map((style) => (
                <div key={style.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={style.id} id={`style-${style.id}`} />
                  <Label htmlFor={`style-${style.id}`} className="text-sm cursor-pointer">
                    {style.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Section 5: Humor Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Humor & Lightness</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  I'll only use humor when you're okay with it.
                </p>
              </div>
              <Switch
                checked={askBeforeJoking}
                onCheckedChange={setAskBeforeJoking}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ask before joking
            </p>
          </div>

          {/* Section 6: Memory Permissions */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">What should I remember?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                You can change this anytime.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="memory-goals" 
                  checked={memoryPermissions.goals}
                  onCheckedChange={() => handleMemoryToggle('goals')}
                />
                <Label htmlFor="memory-goals" className="text-sm cursor-pointer">
                  Goals & routines
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="memory-preferences" 
                  checked={memoryPermissions.preferences}
                  onCheckedChange={() => handleMemoryToggle('preferences')}
                />
                <Label htmlFor="memory-preferences" className="text-sm cursor-pointer">
                  Preferences & habits
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="memory-emotional" 
                  checked={memoryPermissions.emotional}
                  onCheckedChange={() => handleMemoryToggle('emotional')}
                />
                <Label htmlFor="memory-emotional" className="text-sm cursor-pointer">
                  Emotional patterns
                </Label>
              </div>
            </div>
          </div>

          {/* Subtle footer note */}
          <p className="text-xs text-center text-muted-foreground/60 pt-4">
            Changes apply instantly · {currentAiName} adapts quietly
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};