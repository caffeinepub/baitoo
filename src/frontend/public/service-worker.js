// Service Worker for Push Notifications
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBQLSKDf8sFuIwUugc3y2Ik2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofsz';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body || 'New booking notification',
      icon: '/assets/salon-chair-icon.dim_64x64.png',
      badge: '/assets/salon-chair-icon.dim_64x64.png',
      tag: data.tag || 'booking-notification',
      requireInteraction: true,
      actions: data.actions || [],
      data: data.data || {},
      vibrate: [200, 100, 200],
      silent: false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Baitoo Booking', options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((client) => {
            // Send action to the client
            if (action && notificationData) {
              client.postMessage({
                type: 'NOTIFICATION_ACTION',
                action: action,
                data: notificationData,
              });
            }
            return client;
          });
        }
      }
      
      // Open new window if no existing window
      if (clients.openWindow) {
        return clients.openWindow('/salon/bookings');
      }
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, data } = event.data;
    
    const options = {
      body: body,
      icon: '/assets/salon-chair-icon.dim_64x64.png',
      badge: '/assets/salon-chair-icon.dim_64x64.png',
      tag: 'booking-notification',
      requireInteraction: true,
      data: data,
      vibrate: [200, 100, 200],
      silent: false,
    };

    self.registration.showNotification(title, options);
  }
});
