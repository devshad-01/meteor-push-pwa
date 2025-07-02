// Service Worker for PWA notifications
const CACHE_NAME = 'meteor-pwa-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Push event - handles incoming push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push event received:', event);
  console.log('🔔 Push event data:', event.data ? event.data.text() : 'No data');
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('🔔 Parsed push data:', data);
      const { message, body, icon, badge, url, requireInteraction } = data;
      
      const options = {
        body: body || 'You have a new notification',
        icon: icon || '/icons/icon-192x192.svg',
        badge: badge || '/icons/icon-192x192.svg',
        data: { url: url || '/' },
        actions: [
          {
            action: 'open',
            title: 'Open App'
          },
          {
            action: 'close',
            title: 'Close'
          }
        ],
        requireInteraction: requireInteraction !== false, // Force interaction by default
        vibrate: [200, 100, 200],
        tag: 'notification-' + Date.now(), // Unique tag to prevent grouping
        renotify: true // Show even if similar notification exists
      };
      
      console.log('🔔 Showing notification with options:', options);
      
      event.waitUntil(
        self.registration.showNotification(message || 'Meteor PWA', options)
          .then(() => {
            console.log('🔔 Notification shown successfully');
          })
          .catch((error) => {
            console.error('🔔 Error showing notification:', error);
          })
      );
    } catch (error) {
      console.error('🔔 Error parsing push data:', error);
      // Fallback notification
      event.waitUntil(
        self.registration.showNotification('New Notification', {
          body: 'You have a new message',
          icon: '/icons/icon-192x192.svg',
          requireInteraction: true
        })
      );
    }
  } else {
    console.log('🔔 No data in push event, showing fallback notification');
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('New Notification', {
        body: 'You have a new message',
        icon: '/icons/icon-192x192.svg',
        requireInteraction: true
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync (optional for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      Promise.resolve()
    );
  }
});
