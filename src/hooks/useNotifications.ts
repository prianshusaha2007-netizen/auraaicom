import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  data?: any;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Initialize push notifications for native
  const initNativePush = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      setPermission('granted');

      // Register listeners
      await PushNotifications.addListener('registration', async (token: Token) => {
        console.log('FCM Token:', token.value);
        setFcmToken(token.value);

        // Save token to database
        if (user?.id) {
          try {
            await supabase.from('push_subscriptions').upsert({
              user_id: user.id,
              endpoint: token.value,
              p256dh: 'fcm',
              auth: 'fcm',
            }, { onConflict: 'user_id,endpoint' });
          } catch (e) {
            console.error('Save FCM token error:', e);
          }
        }
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        toast.info(notification.title || 'Notification', {
          description: notification.body,
        });
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Push action:', action);
      });

      await PushNotifications.register();
    } catch (error) {
      console.error('Native push init error:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    setIsNative(isNativePlatform);
    
    if (isNativePlatform) {
      setIsSupported(true);
      initNativePush();
    } else {
      setIsSupported('Notification' in window);
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    }
  }, [initNativePush]);

  const requestPermission = useCallback(async () => {
    if (isNative) {
      await initNativePush();
      return permission === 'granted';
    }

    if (!isSupported) {
      toast.error('Notifications are not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      } else if (result === 'denied') {
        toast.error('Notifications blocked. Please enable in settings.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }, [isSupported, isNative, permission, initNativePush]);

  const sendNotification = useCallback(async (options: NotificationOptions) => {
    if (isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 1000000),
            title: options.title,
            body: options.body || '',
            sound: 'default',
          }],
        });
        return true;
      } catch (error) {
        console.error('Native notification error:', error);
        toast(options.title, { description: options.body });
        return false;
      }
    }

    if (!isSupported || permission !== 'granted') {
      toast(options.title, { description: options.body });
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      toast(options.title, { description: options.body });
      return false;
    }
  }, [isSupported, isNative, permission]);

  const scheduleNotification = useCallback(async (
    options: NotificationOptions,
    scheduleAt: Date
  ) => {
    if (isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 1000000),
            title: options.title,
            body: options.body || '',
            schedule: { at: scheduleAt },
            sound: 'default',
          }],
        });
        return true;
      } catch (error) {
        console.error('Schedule notification error:', error);
        return false;
      }
    }

    // Web fallback
    const delay = scheduleAt.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => sendNotification(options), delay);
      return true;
    }
    return false;
  }, [isNative, sendNotification]);

  const scheduleReminder = useCallback((
    reminderText: string,
    reminderTime: Date,
  ) => {
    const now = new Date();
    if (reminderTime.getTime() <= now.getTime()) {
      console.log('Reminder time has passed');
      return null;
    }

    scheduleNotification({
      title: '⏰ AURA Reminder',
      body: reminderText,
      tag: `reminder-${Date.now()}`,
    }, reminderTime);

    return true;
  }, [scheduleNotification]);

  return {
    isSupported,
    isNative,
    permission,
    fcmToken,
    requestPermission,
    sendNotification,
    scheduleNotification,
    scheduleReminder,
  };
};
