import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  useEffect(() => {
    if (registration && user && permission === 'granted') {
      setupPushSubscription();
    }
  }, [registration, user, permission]);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Not supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You'll now receive push notifications for new messages",
        });
        return true;
      } else {
        toast({
          title: "Notifications disabled",
          description: "You can enable notifications in your browser settings",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
      });
      return false;
    }
  };

  const setupPushSubscription = async () => {
    if (!registration || !user) return;

    try {
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (!existingSubscription) {
        // Create new subscription
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertVapidKey(getVapidPublicKey()),
        });

        // Store subscription in database
        await saveSubscription(subscription);
      }
    } catch (error) {
      console.error('Error setting up push subscription:', error);
    }
  };

  const saveSubscription = async (subscription: PushSubscription) => {
    if (!user) return;

    try {
      const subscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.getKey('p256dh') ? 
            btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : null,
          auth: subscription.getKey('auth') ? 
            btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : null,
        },
      };

      // In a real app, you'd save this to your database
      console.log('Push subscription:', subscriptionData);
      
      // For now, store in localStorage as fallback
      localStorage.setItem('pushSubscription', JSON.stringify(subscriptionData));
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const showNotification = async (options: PushNotificationOptions) => {
    if (permission !== 'granted' || !registration) {
      return;
    }

    try {
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        data: options.data,
        actions: [
          {
            action: 'reply',
            title: 'Reply',
          },
          {
            action: 'view',
            title: 'View',
          },
        ],
      } as NotificationOptions);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const getVapidPublicKey = () => {
    // In a real app, this should come from your server configuration
    // For demo purposes, using a placeholder
    return 'BMqStYneEoP8qr1pVtCYqgBqxvpE3ZcjLe8Oc-Q3N8i7nA9JbBrG8TqkF3o6hNpYvXi7c4rJg5mK8WfE2gB3LNw';
  };

  const convertVapidKey = (vapidKey: string) => {
    const padding = '='.repeat((4 - vapidKey.length % 4) % 4);
    const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    canShowNotifications: permission === 'granted' && isSupported,
  };
};