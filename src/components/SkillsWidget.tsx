import { motion } from 'framer-motion';
import { 
  Dumbbell, 
  Video, 
  Palette, 
  Music, 
  Code, 
  Target,
  TrendingUp,
  Flame,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSkillsProgress, SkillType } from '@/hooks/useSkillsProgress';
import { useNavigate } from 'react-router-dom';

const SKILL_ICONS: Record<SkillType, React.ReactNode> = {
  gym: <Dumbbell className="h-4 w-4" />,
  coding: <Code className="h-4 w-4" />,
  video_editing: <Video className="h-4 w-4" />,
  graphic_design: <Palette className="h-4 w-4" />,
  music: <Music className="h-4 w-4" />,
  content_creation: <Video className="h-4 w-4" />,
  self_discipline: <Target className="h-4 w-4" />,
  general: <TrendingUp className="h-4 w-4" />,
};

const SKILL_COLORS: Record<SkillType, string> = {
  gym: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  coding: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  video_editing: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  graphic_design: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  music: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  content_creation: 'bg-red-500/10 text-red-600 dark:text-red-400',
  self_discipline: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  general: 'bg-primary/10 text-primary',
};

interface SkillsWidgetProps {
  compact?: boolean;
  onNavigate?: () => void;
}

export function SkillsWidget({ compact = false, onNavigate }: SkillsWidgetProps) {
  const navigate = useNavigate();
  const { getActiveSkills, hasActiveSkills } = useSkillsProgress();
  const activeSkills = getActiveSkills();

  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      navigate('/skills');
    }
  };

  if (!hasActiveSkills()) {
    return null;
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex gap-2 flex-wrap"
      >
        {activeSkills.slice(0, 3).map((skill) => (
          <Badge
            key={skill.id}
            variant="secondary"
            className={`${SKILL_COLORS[skill.type]} border-0 gap-1`}
          >
            {SKILL_ICONS[skill.type]}
            <span className="text-xs">{skill.displayName.split(' ')[0]}</span>
            {skill.currentStreak > 0 && (
              <span className="flex items-center gap-0.5 text-orange-500">
                <Flame className="h-3 w-3" />
                {skill.currentStreak}
              </span>
            )}
          </Badge>
        ))}
        {activeSkills.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{activeSkills.length - 3}
          </Badge>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card 
        className="cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Your Skills</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            {activeSkills.slice(0, 2).map((skill) => (
              <div key={skill.id} className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${SKILL_COLORS[skill.type]}`}>
                  {SKILL_ICONS[skill.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">
                      {skill.displayName}
                    </span>
                    {skill.currentStreak > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-orange-500">
                        <Flame className="h-3 w-3" />
                        {skill.currentStreak}
                      </span>
                    )}
                  </div>
                  <Progress 
                    value={Math.min(100, (skill.totalSessions / 10) * 100)} 
                    className="h-1 mt-1" 
                  />
                </div>
              </div>
            ))}
            {activeSkills.length > 2 && (
              <p className="text-xs text-muted-foreground text-center">
                +{activeSkills.length - 2} more skills
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Inline chat card for skill updates
interface SkillUpdateCardProps {
  skillType: SkillType;
  message: string;
  action?: 'started' | 'completed' | 'added' | 'paused';
}

export function SkillUpdateCard({ skillType, message, action }: SkillUpdateCardProps) {
  const actionColors = {
    started: 'border-l-green-500',
    completed: 'border-l-blue-500',
    added: 'border-l-primary',
    paused: 'border-l-amber-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-card rounded-lg border-l-4 ${action ? actionColors[action] : 'border-l-primary'} p-3`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-md ${SKILL_COLORS[skillType]}`}>
          {SKILL_ICONS[skillType]}
        </div>
        <span className="text-sm font-medium capitalize">
          {skillType.replace('_', ' ')}
        </span>
        {action && (
          <Badge variant="outline" className="text-[10px] capitalize ml-auto">
            {action}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{message}</p>
    </motion.div>
  );
}
