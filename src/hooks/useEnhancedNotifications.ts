import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

export const useEnhancedNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
          setServiceWorkerReady(true);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notifications not supported in this browser');
      return false;
    }

    if (permission === 'granted') return true;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notifications enabled! 🔔');
        return true;
      } else {
        toast.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, [isSupported, permission]);

  const showNotification = useCallback(async (options: NotificationOptions) => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      // Try to use service worker for persistent notifications
      if (serviceWorkerReady) {
        const registration = await navigator.serviceWorker.ready;
        // Use any type for extended notification options (service worker supports more options)
        const notificationOptions: any = {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: options.tag || `aura-${Date.now()}`,
          data: options.data,
          requireInteraction: options.requireInteraction ?? true,
        };
        await registration.showNotification(options.title, notificationOptions);
      } else {
        // Fallback to regular notification
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          tag: options.tag || `aura-${Date.now()}`,
          requireInteraction: options.requireInteraction ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
      // Ultimate fallback - show in-app toast
      toast(options.title, { description: options.body });
    }
  }, [permission, requestPermission, serviceWorkerReady]);

  const scheduleNotification = useCallback((
    options: NotificationOptions,
    delayMs: number
  ): NodeJS.Timeout => {
    return setTimeout(() => {
      showNotification(options);
    }, delayMs);
  }, [showNotification]);

  const scheduleAtTime = useCallback((
    options: NotificationOptions,
    targetTime: Date
  ): NodeJS.Timeout | null => {
    const now = new Date();
    const delayMs = targetTime.getTime() - now.getTime();
    
    if (delayMs <= 0) {
      // Time already passed, show immediately
      showNotification(options);
      return null;
    }
    
    return scheduleNotification(options, delayMs);
  }, [scheduleNotification, showNotification]);

  return {
    isSupported,
    permission,
    serviceWorkerReady,
    requestPermission,
    showNotification,
    scheduleNotification,
    scheduleAtTime,
  };
};
