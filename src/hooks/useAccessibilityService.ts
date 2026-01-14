import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// App identifiers for Android automation
export const SUPPORTED_APPS = {
  whatsapp: { id: 'com.whatsapp', name: 'WhatsApp', icon: '💬' },
  instagram: { id: 'com.instagram.android', name: 'Instagram', icon: '📸' },
  linkedin: { id: 'com.linkedin.android', name: 'LinkedIn', icon: '💼' },
  spotify: { id: 'com.spotify.music', name: 'Spotify', icon: '🎵' },
  youtube: { id: 'com.google.android.youtube', name: 'YouTube', icon: '▶️' },
  chrome: { id: 'com.android.chrome', name: 'Chrome', icon: '🌐' },
  maps: { id: 'com.google.android.apps.maps', name: 'Maps', icon: '🗺️' },
  calendar: { id: 'com.google.android.calendar', name: 'Calendar', icon: '📅' },
  camera: { id: 'com.android.camera', name: 'Camera', icon: '📷' },
  messages: { id: 'com.google.android.apps.messaging', name: 'Messages', icon: '💬' },
  blinkit: { id: 'com.grofers.customerapp', name: 'Blinkit', icon: '🛒' },
  swiggy: { id: 'in.swiggy.android', name: 'Swiggy', icon: '🍔' },
  zepto: { id: 'com.zeptoconsumerapp', name: 'Zepto', icon: '⚡' },
  phone: { id: 'com.android.dialer', name: 'Phone', icon: '📞' },
  contacts: { id: 'com.android.contacts', name: 'Contacts', icon: '👤' },
} as const;

export type AppId = keyof typeof SUPPORTED_APPS;

export interface AccessibilityAction {
  type: 'open_app' | 'click' | 'type' | 'scroll' | 'swipe' | 'search' | 'send' | 'play' | 'pause';
  target?: string;
  value?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  coordinates?: { x: number; y: number };
}

export interface AccessibilityPermissions {
  accessibilityService: boolean;
  overlay: boolean;
  notificationListener: boolean;
  backgroundExecution: boolean;
  batteryOptimization: boolean;
  exactAlarm: boolean;
  autostart: boolean;
}

export interface AccessibilityServiceState {
  isAvailable: boolean;
  isEnabled: boolean;
  permissions: AccessibilityPermissions;
}

// Declare global window types for native plugin
declare global {
  interface Window {
    AURRAAccessibility?: {
      checkStatus: () => Promise<AccessibilityServiceState>;
      requestAccessibility: () => Promise<boolean>;
      requestOverlay: () => Promise<boolean>;
      openApp: (options: { packageName: string }) => Promise<boolean>;
      click: (options: { x: number; y: number }) => Promise<boolean>;
      typeText: (options: { text: string }) => Promise<boolean>;
      scroll: (options: { direction: string }) => Promise<boolean>;
      swipe: (options: { startX: number; startY: number; endX: number; endY: number; duration: number }) => Promise<boolean>;
      search: (options: { query: string }) => Promise<boolean>;
      sendMessage: (options: { contact: string; message: string; appPackage: string }) => Promise<boolean>;
      mediaControl: (options: { action: string }) => Promise<boolean>;
      playSpotify: (options: { query?: string }) => Promise<boolean>;
    };
  }
}

export const useAccessibilityService = () => {
  const [isNative] = useState(Capacitor.isNativePlatform());
  const [serviceState, setServiceState] = useState<AccessibilityServiceState>({
    isAvailable: false,
    isEnabled: false,
    permissions: {
      accessibilityService: false,
      overlay: false,
      notificationListener: false,
      backgroundExecution: false,
      batteryOptimization: false,
      exactAlarm: false,
      autostart: false,
    },
  });
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  // Check if accessibility service is available
  const checkServiceStatus = useCallback(async (): Promise<AccessibilityServiceState> => {
    if (!isNative) {
      return serviceState;
    }

    try {
      if (window.AURRAAccessibility) {
        const status = await window.AURRAAccessibility.checkStatus();
        setServiceState(status);
        return status;
      }
    } catch (error) {
      console.log('Accessibility service not available:', error);
    }

    return serviceState;
  }, [isNative, serviceState]);

  // Request accessibility service permission
  const requestAccessibilityPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      console.log('[Stub] Would open accessibility settings on Android');
      return false;
    }

    try {
      if (window.AURRAAccessibility) {
        return await window.AURRAAccessibility.requestAccessibility();
      }
    } catch (error) {
      console.error('Error requesting accessibility:', error);
    }
    return false;
  }, [isNative]);

  // Request overlay permission
  const requestOverlayPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      console.log('[Stub] Would open overlay settings on Android');
      return false;
    }

    try {
      if (window.AURRAAccessibility) {
        return await window.AURRAAccessibility.requestOverlay();
      }
    } catch (error) {
      console.error('Error requesting overlay:', error);
    }
    return false;
  }, [isNative]);

  // Open an app by package name
  const openApp = useCallback(async (appId: AppId): Promise<boolean> => {
    const app = SUPPORTED_APPS[appId];
    const logEntry = `Opening ${app.name}...`;
    setExecutionLog(prev => [...prev, logEntry]);

    if (!isNative) {
      console.log(`[Stub] Would open app: ${app.id}`);
      setTimeout(() => {
        setExecutionLog(prev => [...prev, `✓ ${app.name} opened`]);
      }, 500);
      return true;
    }

    try {
      if (window.AURRAAccessibility) {
        const result = await window.AURRAAccessibility.openApp({ packageName: app.id });
        setExecutionLog(prev => [...prev, `✓ ${app.name} opened`]);
        return result;
      }
    } catch (error) {
      setExecutionLog(prev => [...prev, `✗ Failed to open ${app.name}`]);
      console.error('Error opening app:', error);
    }
    return false;
  }, [isNative]);

  // Perform click action
  const performClick = useCallback(async (x: number, y: number): Promise<boolean> => {
    setExecutionLog(prev => [...prev, `Clicking at (${x}, ${y})...`]);

    if (!isNative) {
      console.log(`[Stub] Would click at: ${x}, ${y}`);
      return true;
    }

    try {
      if (window.AURRAAccessibility) {
        return await window.AURRAAccessibility.click({ x, y });
      }
    } catch (error) {
      console.error('Error performing click:', error);
    }
    return false;
  }, [isNative]);

  // Type text
  const typeText = useCallback(async (text: string): Promise<boolean> => {
    setExecutionLog(prev => [...prev, `Typing: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`]);

    if (!isNative) {
      console.log(`[Stub] Would type: ${text}`);
      return true;
    }

    try {
      if (window.AURRAAccessibility) {
        return await window.AURRAAccessibility.typeText({ text });
      }
    } catch (error) {
      console.error('Error typing text:', error);
    }
    return false;
  }, [isNative]);

  // Scroll action
  const performScroll = useCallback(async (direction: 'up' | 'down' | 'left' | 'right'): Promise<boolean> => {
    setExecutionLog(prev => [...prev, `Scrolling ${direction}...`]);

    if (!isNative) {
      console.log(`[Stub] Would scroll: ${direction}`);
      return true;
    }

    try {
      if (window.AURRAAccessibility) {
        return await window.AURRAAccessibility.scroll({ direction });
      }
    } catch (error) {
      console.error('Error scrolling:', error);
    }
    return false;
  }, [isNative]);

  // Swipe action
  const performSwipe = useCallback(async (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number = 300
  ): Promise<boolean> => {
    setExecutionLog(prev => [...prev, `Swiping...`]);

    if (!isNative) {
      console.log(`[Stub] Would swipe from (${startX}, ${startY}) to (${endX}, ${endY})`);
      return true;
    }

    try {
      if (window.AURRAAccessibility) {
        return await window.AURRAAccessibility.swipe({ startX, startY, endX, endY, duration });
      }
    } catch (error) {
      console.error('Error swiping:', error);
    }
    return false;
  }, [isNative]);

  // Search in current app
  const searchInApp = useCallback(async (query: string): Promise<boolean> => {
    setExecutionLog(prev => [...prev, `Searching: "${query}"...`]);

    if (!isNative) {
      console.log(`[Stub] Would search for: ${query}`);
      setTimeout(() => {
        setExecutionLog(prev => [...prev, `✓ Search completed`]);
      }, 500);
      return true;
    }

    try {
      if (window.AURRAAccessibility) {
        return await window.AURRAAccessibility.search({ query });
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
    return false;
  }, [isNative]);

  // Send message
  const sendMessage = useCallback(async (contact: string, message: string, app: AppId = 'whatsapp'): Promise<boolean> => {
    setExecutionLog(prev => [...prev, `Opening ${SUPPORTED_APPS[app].name}...`]);
    
    if (!isNative) {
      console.log(`[Stub] Would send message to ${contact}: ${message}`);
      setTimeout(() => setExecutionLog(prev => [...prev, `Finding ${contact}...`]), 500);
      setTimeout(() => setExecutionLog(prev => [...prev, `Typing message...`]), 1000);
      setTimeout(() => setExecutionLog(prev => [...prev, `✓ Message sent to ${contact}`]), 1500);
      return true;
    }

    try {
      if (window.AURRAAccessibility) {
        return await window.AURRAAccessibility.sendMessage({ 
          contact, 
          message, 
          appPackage: SUPPORTED_APPS[app].id 
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
    return false;
  }, [isNative]);

  // Media controls
  const controlMedia = useCallback(async (action: 'play' | 'pause' | 'next' | 'previous'): Promise<boolean> => {
    setExecutionLog(prev => [...prev, `Media: ${action}`]);

    if (!isNative) {
      console.log(`[Stub] Would ${action} media`);
      return true;
    }

    try {
      if (window.AURRAAccessibility) {
        return await window.AURRAAccessibility.mediaControl({ action });
      }
    } catch (error) {
      console.error('Error controlling media:', error);
    }
    return false;
  }, [isNative]);

  // Play music on Spotify
  const playSpotify = useCallback(async (query?: string): Promise<boolean> => {
    setExecutionLog(prev => [...prev, `Opening Spotify...`]);
    
    if (!isNative) {
      if (query) {
        setTimeout(() => setExecutionLog(prev => [...prev, `Searching: "${query}"...`]), 500);
        setTimeout(() => setExecutionLog(prev => [...prev, `✓ Playing "${query}"`]), 1000);
      } else {
        setTimeout(() => setExecutionLog(prev => [...prev, `✓ Resuming playback`]), 500);
      }
      return true;
    }

    try {
      if (window.AURRAAccessibility) {
        return await window.AURRAAccessibility.playSpotify({ query });
      }
    } catch (error) {
      console.error('Error playing Spotify:', error);
    }
    return false;
  }, [isNative]);

  // Clear execution log
  const clearLog = useCallback(() => {
    setExecutionLog([]);
  }, []);

  // Execute a sequence of actions
  const executeWorkflow = useCallback(async (actions: AccessibilityAction[]): Promise<boolean> => {
    setExecutionLog(prev => [...prev, `Starting workflow (${actions.length} actions)...`]);
    
    for (const action of actions) {
      switch (action.type) {
        case 'open_app':
          if (action.target && action.target in SUPPORTED_APPS) {
            await openApp(action.target as AppId);
          }
          break;
        case 'click':
          if (action.coordinates) {
            await performClick(action.coordinates.x, action.coordinates.y);
          }
          break;
        case 'type':
          if (action.value) {
            await typeText(action.value);
          }
          break;
        case 'scroll':
          await performScroll(action.direction || 'down');
          break;
        case 'swipe':
          await performSwipe(500, 800, 500, 400);
          break;
        case 'search':
          if (action.value) {
            await searchInApp(action.value);
          }
          break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setExecutionLog(prev => [...prev, `✓ Workflow completed`]);
    return true;
  }, [openApp, performClick, typeText, performScroll, performSwipe, searchInApp]);

  return {
    isNative,
    serviceState,
    executionLog,
    checkServiceStatus,
    requestAccessibilityPermission,
    requestOverlayPermission,
    openApp,
    performClick,
    typeText,
    performScroll,
    performSwipe,
    searchInApp,
    sendMessage,
    controlMedia,
    playSpotify,
    executeWorkflow,
    clearLog,
    SUPPORTED_APPS,
  };
};
