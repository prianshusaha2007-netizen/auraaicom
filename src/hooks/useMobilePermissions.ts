import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface PermissionStatus {
  microphone: 'granted' | 'denied' | 'prompt' | 'unavailable';
  camera: 'granted' | 'denied' | 'prompt' | 'unavailable';
  notifications: 'granted' | 'denied' | 'default' | 'unavailable';
  geolocation: 'granted' | 'denied' | 'prompt' | 'unavailable';
  storage: 'granted' | 'unavailable'; // Storage is always available in web
}

export const useMobilePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    microphone: 'prompt',
    camera: 'prompt',
    notifications: 'default',
    geolocation: 'prompt',
    storage: 'granted',
  });
  const [isChecking, setIsChecking] = useState(true);

  // Check all permissions on mount
  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    setIsChecking(true);
    const newPermissions: PermissionStatus = {
      microphone: 'unavailable',
      camera: 'unavailable',
      notifications: 'unavailable',
      geolocation: 'unavailable',
      storage: 'granted',
    };

    try {
      // Check microphone
      if (navigator.permissions) {
        try {
          const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          newPermissions.microphone = mic.state as 'granted' | 'denied' | 'prompt';
        } catch {
          newPermissions.microphone = 'prompt';
        }
      }

      // Check camera
      if (navigator.permissions) {
        try {
          const cam = await navigator.permissions.query({ name: 'camera' as PermissionName });
          newPermissions.camera = cam.state as 'granted' | 'denied' | 'prompt';
        } catch {
          newPermissions.camera = 'prompt';
        }
      }

      // Check notifications
      if ('Notification' in window) {
        newPermissions.notifications = Notification.permission as 'granted' | 'denied' | 'default';
      }

      // Check geolocation
      if (navigator.permissions) {
        try {
          const geo = await navigator.permissions.query({ name: 'geolocation' });
          newPermissions.geolocation = geo.state as 'granted' | 'denied' | 'prompt';
        } catch {
          newPermissions.geolocation = 'prompt';
        }
      }

    } catch (error) {
      console.error('Permission check error:', error);
    }

    setPermissions(newPermissions);
    setIsChecking(false);
  };

  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      toast.success('Microphone access granted! 🎤');
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      toast.error('Microphone access denied');
      return false;
    }
  }, []);

  const requestCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, camera: 'granted' }));
      toast.success('Camera access granted! 📷');
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      toast.error('Camera access denied');
      return false;
    }
  }, []);

  const requestNotifications = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermissions(prev => ({ ...prev, notifications: result as 'granted' | 'denied' | 'default' }));
      
      if (result === 'granted') {
        toast.success('Notifications enabled! 🔔');
        // Show test notification
        new Notification('AURA', {
          body: 'Notifications are now enabled! 🎉',
          icon: '/favicon.ico'
        });
        return true;
      } else {
        toast.error('Notifications denied');
        return false;
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }, []);

  const requestGeolocation = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast.error('Location not supported');
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissions(prev => ({ ...prev, geolocation: 'granted' }));
          toast.success('Location access granted! 📍');
          resolve(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setPermissions(prev => ({ ...prev, geolocation: 'denied' }));
          toast.error('Location access denied');
          resolve(false);
        }
      );
    });
  }, []);

  const requestAllPermissions = useCallback(async () => {
    toast.info('Requesting permissions...');
    
    await requestNotifications();
    await requestMicrophone();
    await requestCamera();
    await requestGeolocation();
    
    await checkAllPermissions();
    toast.success('Permissions updated!');
  }, [requestNotifications, requestMicrophone, requestCamera, requestGeolocation]);

  // Schedule a local notification
  const scheduleNotification = useCallback((title: string, body: string, delayMs: number) => {
    if (permissions.notifications !== 'granted') {
      toast.error('Enable notifications first');
      return;
    }

    setTimeout(() => {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `aura-${Date.now()}`,
      });
    }, delayMs);
  }, [permissions.notifications]);

  // Set an alarm (using notification)
  const setAlarm = useCallback((title: string, time: Date) => {
    const now = new Date();
    const delay = time.getTime() - now.getTime();
    
    if (delay <= 0) {
      toast.error('Alarm time must be in the future');
      return false;
    }

    scheduleNotification(`⏰ ${title}`, 'Your alarm is ringing!', delay);
    toast.success(`Alarm set for ${time.toLocaleTimeString()}`);
    return true;
  }, [scheduleNotification]);

  return {
    permissions,
    isChecking,
    requestMicrophone,
    requestCamera,
    requestNotifications,
    requestGeolocation,
    requestAllPermissions,
    checkAllPermissions,
    scheduleNotification,
    setAlarm,
  };
};
