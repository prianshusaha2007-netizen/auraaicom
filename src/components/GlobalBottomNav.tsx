import React from 'react';
import { Home, Sparkles, Settings, Menu, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

interface GlobalBottomNavProps {
  onMenuClick: () => void;
  className?: string;
}

const navItems = [
  { id: 'home', icon: Home, label: 'Chat', path: '/' },
  { id: 'skills', icon: Sparkles, label: 'Skills', path: '/skills' },
  { id: 'memories', icon: Brain, label: 'Memories', path: '/memories' },
  { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
];

export const GlobalBottomNav: React.FC<GlobalBottomNavProps> = ({
  onMenuClick,
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-card/90 backdrop-blur-xl border-t border-border/30',
        'safe-area-inset-bottom',
        className
      )}
    >
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200',
                active 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'relative p-2 rounded-xl transition-all duration-200',
                active && 'bg-primary/10'
              )}>
                <Icon className={cn('w-5 h-5', active && 'scale-110')} />
                {active && (
                  <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md -z-10" />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                active && 'font-semibold'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <div className="p-2 rounded-xl">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </motion.nav>
  );
};
