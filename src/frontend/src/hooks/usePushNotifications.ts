import { useEffect, useState } from 'react';
import { useInternetIdentity } from './useInternetIdentity';

export function usePushNotifications() {
  const { identity } = useInternetIdentity();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!identity || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // Check current permission
    setPermission(Notification.permission);

    // Register service worker
    const registerServiceWorker = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/',
          });
          console.log('Service Worker registered:', registration);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    // Request notification permission
    const requestPermission = async () => {
      if (Notification.permission === 'default') {
        try {
          const result = await Notification.requestPermission();
          setPermission(result);
          
          if (result === 'granted') {
            await registerServiceWorker();
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      } else if (Notification.permission === 'granted') {
        await registerServiceWorker();
      }
    };

    requestPermission();
  }, [identity]);

  return {
    permission,
    isSubscribed,
  };
}
