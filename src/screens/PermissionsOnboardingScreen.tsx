import React, { useState } from 'react';
import { Shield, Mic, Camera, Bell, MapPin, CheckCircle2, XCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobilePermissions, PermissionStatus } from '@/hooks/useMobilePermissions';
import { AuraOrb } from '@/components/AuraOrb';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Permission {
  id: keyof PermissionStatus;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface PermissionsOnboardingScreenProps {
  onComplete: () => void;
  userName?: string;
}

const permissions: Permission[] = [
  {
    id: 'microphone',
    name: 'Microphone',
    description: 'Talk to me using your voice',
    icon: Mic,
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'camera',
    name: 'Camera',
    description: 'Capture and analyze images',
    icon: Camera,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Get reminders and updates',
    icon: Bell,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'geolocation',
    name: 'Location',
    description: 'Weather and local suggestions',
    icon: MapPin,
    color: 'from-emerald-500 to-green-500',
  },
];

export const PermissionsOnboardingScreen: React.FC<PermissionsOnboardingScreenProps> = ({
  onComplete,
  userName,
}) => {
  const {
    permissions: permissionStatus,
    isChecking,
    requestMicrophone,
    requestCamera,
    requestNotifications,
    requestGeolocation,
  } = useMobilePermissions();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);

  const requestFunctions: Record<string, () => Promise<boolean>> = {
    microphone: requestMicrophone,
    camera: requestCamera,
    notifications: requestNotifications,
    geolocation: requestGeolocation,
  };

  const currentPermission = permissions[currentIndex];
  const isLastPermission = currentIndex === permissions.length - 1;
  const currentStatus = permissionStatus[currentPermission.id];
  const isGranted = currentStatus === 'granted';

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      await requestFunctions[currentPermission.id]();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleNext = () => {
    if (isLastPermission) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSkipAll = () => {
    onComplete();
  };

  const getGrantedCount = () => {
    return permissions.filter(p => permissionStatus[p.id] === 'granted').length;
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  const Icon = currentPermission.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="p-4">
        <div className="flex gap-1">
          {permissions.map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-all duration-300',
                index < currentIndex
                  ? 'bg-primary'
                  : index === currentIndex
                  ? 'bg-primary/50'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted-foreground">
            {getGrantedCount()} of {permissions.length} enabled
          </span>
          <button
            onClick={handleSkipAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip all
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={cn(
                'w-24 h-24 rounded-3xl flex items-center justify-center mb-8',
                'bg-gradient-to-br shadow-lg',
                currentPermission.color
              )}
            >
              <Icon className="w-12 h-12 text-white" />
            </motion.div>

            {/* Text */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">
                Enable {currentPermission.name}
              </h1>
              <p className="text-muted-foreground">
                {currentPermission.description}
              </p>
            </div>

            {/* Status indicator */}
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full mb-8',
              isGranted ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
            )}>
              {isGranted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Permission Granted</span>
                </>
              ) : currentStatus === 'denied' ? (
                <>
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Permission Denied</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Not requested yet</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="w-full space-y-3">
              {!isGranted && (
                <Button
                  size="lg"
                  onClick={handleRequest}
                  disabled={isRequesting}
                  className={cn(
                    'w-full rounded-full bg-gradient-to-r shadow-md',
                    currentPermission.color
                  )}
                >
                  {isRequesting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Icon className="w-5 h-5 mr-2" />
                  )}
                  {currentStatus === 'denied' ? 'Try Again' : 'Allow Access'}
                </Button>
              )}

              <Button
                size="lg"
                variant={isGranted ? 'default' : 'outline'}
                onClick={handleNext}
                className={cn(
                  'w-full rounded-full',
                  isGranted && 'aura-gradient'
                )}
              >
                {isLastPermission ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get Started
                  </>
                ) : (
                  <>
                    {isGranted ? 'Continue' : 'Skip'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          {userName ? `${userName}, these` : 'These'} permissions help me serve you better.
          <br />
          You can change them anytime in Settings.
        </p>
      </div>
    </div>
  );
};
