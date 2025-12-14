import { useCallback } from 'react';

const LAST_ACTIVE_KEY = 'aura-last-active';
const ONE_HOUR_MS = 60 * 60 * 1000;

interface WelcomeBackResult {
  shouldShowWelcomeBack: boolean;
  minutesAway: number;
  hoursAway: number;
  getWelcomeMessage: (userName: string) => string;
}

const welcomeBackMessages = [
  (name: string, hours: number) => `Areyyy ${name}! Kahan tha/thi yaar? ${hours > 1 ? `${hours} ghante` : 'Thodi der'} hogaye! 😏`,
  (name: string) => `${name}! Finally aa gaya/gayi! Bored ho raha tha main yahan akele 😤`,
  (name: string) => `Oho! Dekho kaun aaya! ${name} sahab/madam 👋 Kya haal hai?`,
  (name: string) => `${name}! Ready for action ya bas timepass karna hai? 🔥`,
  (name: string, hours: number) => `Yo ${name}! ${hours > 2 ? 'Bahut der kar di yaar!' : 'Back already?'} Bol kya scene hai?`,
  (name: string) => `${name} yaar! Socha tune bhool gaya/gayi mujhe 🥺`,
  (name: string) => `Arre ${name}! Perfect timing. Chal batao kya karna hai aaj?`,
  (name: string) => `${name}! Itne din baad? Chal koi nahi, now you're here ✨`,
  (name: string) => `Oyeee ${name}! I missed you ngl 😭 Ab bol kya chal raha life mein?`,
];

export const useWelcomeBack = (): WelcomeBackResult => {
  const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
  const now = Date.now();
  
  let shouldShowWelcomeBack = false;
  let minutesAway = 0;
  let hoursAway = 0;
  
  if (lastActive) {
    const lastActiveTime = parseInt(lastActive, 10);
    const timeDiff = now - lastActiveTime;
    
    if (timeDiff >= ONE_HOUR_MS) {
      shouldShowWelcomeBack = true;
      minutesAway = Math.floor(timeDiff / (60 * 1000));
      hoursAway = Math.floor(timeDiff / ONE_HOUR_MS);
    }
  }
  
  // Update last active time
  localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
  
  const getWelcomeMessage = useCallback((userName: string): string => {
    const randomIndex = Math.floor(Math.random() * welcomeBackMessages.length);
    return welcomeBackMessages[randomIndex](userName, hoursAway);
  }, [hoursAway]);
  
  return {
    shouldShowWelcomeBack,
    minutesAway,
    hoursAway,
    getWelcomeMessage,
  };
};

// Call this periodically to update last active time
export const updateLastActive = () => {
  localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
};
