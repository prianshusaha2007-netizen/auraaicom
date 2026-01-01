import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeContext } from './useRealtimeContext';

export interface WeatherSuggestion {
  id: string;
  type: 'hydration' | 'indoor' | 'outdoor' | 'comfort';
  message: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Hook for weather-based proactive suggestions
 * AURRA offers hydration reminders on hot days, indoor activities when raining, etc.
 */
export const useWeatherSuggestions = (context: RealtimeContext) => {
  const [activeSuggestion, setActiveSuggestion] = useState<WeatherSuggestion | null>(null);
  const [suggestionHistory, setSuggestionHistory] = useState<string[]>([]);
  const lastSuggestionTimeRef = useRef<number>(0);
  
  // Minimum time between suggestions (30 minutes)
  const SUGGESTION_COOLDOWN = 30 * 60 * 1000;
  
  /**
   * Generate weather-based suggestions based on current context
   */
  const generateSuggestions = useCallback((): WeatherSuggestion[] => {
    const suggestions: WeatherSuggestion[] = [];
    
    if (!context.hasWeather) return suggestions;
    
    const { temperature, isHot, isCold, isRaining, humidity, timeOfDay } = context;
    
    // Hot weather → Hydration reminders
    if (isHot && temperature !== null) {
      if (temperature > 35) {
        suggestions.push({
          id: 'hydration-extreme',
          type: 'hydration',
          message: `It's ${Math.round(temperature)}°C outside — really hot. Make sure you're drinking plenty of water today. 💧`,
          icon: '🥵',
          priority: 'high',
        });
      } else if (temperature > 30) {
        suggestions.push({
          id: 'hydration-hot',
          type: 'hydration',
          message: `Warm day at ${Math.round(temperature)}°C. A good time to stay hydrated. 💧`,
          icon: '☀️',
          priority: 'medium',
        });
      }
    }
    
    // Rainy weather → Indoor activity suggestions
    if (isRaining) {
      const indoorIdeas = [
        "Perfect weather for reading or catching up on that series you've been meaning to watch.",
        "Rainy day vibes — maybe a good time for some indoor stretching or meditation?",
        "The rain's keeping things cozy. A good day for focused work or a creative project.",
        "Looks rainy outside. Great excuse to stay in and recharge.",
      ];
      
      suggestions.push({
        id: 'indoor-rain',
        type: 'indoor',
        message: indoorIdeas[Math.floor(Math.random() * indoorIdeas.length)] + ' 🌧️',
        icon: '🌧️',
        priority: 'low',
      });
    }
    
    // Cold weather
    if (isCold && temperature !== null) {
      suggestions.push({
        id: 'cold-weather',
        type: 'comfort',
        message: `It's ${Math.round(temperature)}°C — quite chilly. Stay warm! ❄️`,
        icon: '🧊',
        priority: 'low',
      });
    }
    
    // High humidity + hot = extra hydration needed
    if (humidity !== null && humidity > 70 && isHot) {
      suggestions.push({
        id: 'humidity-hydration',
        type: 'hydration',
        message: "High humidity today — you might be sweating more than you realize. Extra water would help. 💦",
        icon: '💦',
        priority: 'medium',
      });
    }
    
    // Nice weather → Outdoor suggestion (only in afternoon/evening)
    if (!isRaining && !isHot && !isCold && temperature !== null && (timeOfDay === 'afternoon' || timeOfDay === 'evening')) {
      if (temperature >= 18 && temperature <= 28) {
        suggestions.push({
          id: 'outdoor-nice',
          type: 'outdoor',
          message: `Beautiful ${Math.round(temperature)}°C outside. Maybe take a short walk if you have time? 🌳`,
          icon: '🌤️',
          priority: 'low',
        });
      }
    }
    
    return suggestions;
  }, [context]);
  
  /**
   * Get the next suggestion that hasn't been shown recently
   */
  const getNextSuggestion = useCallback((): WeatherSuggestion | null => {
    const now = Date.now();
    
    // Check cooldown
    if (now - lastSuggestionTimeRef.current < SUGGESTION_COOLDOWN) {
      return null;
    }
    
    const suggestions = generateSuggestions();
    
    // Filter out recently shown suggestions
    const newSuggestions = suggestions.filter(s => !suggestionHistory.includes(s.id));
    
    if (newSuggestions.length === 0) {
      // Reset history if we've shown all suggestions
      if (suggestions.length > 0) {
        setSuggestionHistory([]);
        return suggestions[0];
      }
      return null;
    }
    
    // Prioritize high priority suggestions
    const highPriority = newSuggestions.filter(s => s.priority === 'high');
    if (highPriority.length > 0) return highPriority[0];
    
    const mediumPriority = newSuggestions.filter(s => s.priority === 'medium');
    if (mediumPriority.length > 0) return mediumPriority[0];
    
    return newSuggestions[0];
  }, [generateSuggestions, suggestionHistory]);
  
  /**
   * Trigger a weather-based suggestion
   * Returns the suggestion message if one is available
   */
  const triggerSuggestion = useCallback((): string | null => {
    const suggestion = getNextSuggestion();
    
    if (!suggestion) return null;
    
    setActiveSuggestion(suggestion);
    setSuggestionHistory(prev => [...prev, suggestion.id]);
    lastSuggestionTimeRef.current = Date.now();
    
    return suggestion.message;
  }, [getNextSuggestion]);
  
  /**
   * Dismiss the current suggestion
   */
  const dismissSuggestion = useCallback(() => {
    setActiveSuggestion(null);
  }, []);
  
  /**
   * Check if weather conditions warrant a proactive suggestion
   */
  const shouldProactivelySuggest = useCallback((): boolean => {
    if (!context.hasWeather) return false;
    
    // High priority conditions
    if (context.isHot && context.temperature !== null && context.temperature > 32) return true;
    if (context.isRaining) return true;
    
    return false;
  }, [context]);
  
  /**
   * Get all current weather-based suggestions
   */
  const getAllSuggestions = useCallback((): WeatherSuggestion[] => {
    return generateSuggestions();
  }, [generateSuggestions]);
  
  // Auto-check for proactive suggestions when weather data loads
  useEffect(() => {
    if (!context.hasWeather || context.isLoading) return;
    
    // Check stored time to avoid suggesting on every page load
    const lastCheck = localStorage.getItem('aurra-weather-suggestion-time');
    const now = Date.now();
    
    if (lastCheck && now - parseInt(lastCheck) < SUGGESTION_COOLDOWN) {
      return;
    }
    
    // Only suggest for high-priority conditions on app load
    if (context.isHot && context.temperature !== null && context.temperature > 32) {
      localStorage.setItem('aurra-weather-suggestion-time', now.toString());
    }
  }, [context.hasWeather, context.isLoading, context.isHot, context.temperature]);
  
  return {
    activeSuggestion,
    triggerSuggestion,
    dismissSuggestion,
    shouldProactivelySuggest,
    getAllSuggestions,
  };
};
