// Enhanced Service Worker for PWA notifications
const CACHE_NAME = 'meteor-pwa-v2';

// Install event - force immediate activation
self.addEventListener('install', (event) => {
  console.log('SW: Installing, skipping waiting');
  self.skipWaiting();
});

// Activate event - claim all clients immediately
self.addEventListener('activate', (event) => {
  console.log('SW: Activating, claiming clients');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
    ])
  );
});

// Enhanced push event handler
self.addEventListener('push', (event) => {
  console.log('SW: Push event received');
  
  if (!event.data) {
    console.log('SW: No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('SW: Push data:', data);

    const title = data.title || 'Meteor PWA';
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icons/icon-192x192.svg',
      badge: data.badge || '/icons/icon-192x192.svg',
      tag: data.tag || 'default',
      data: data.data || {},
      timestamp: Date.now(),
      requireInteraction: data.priority === 'urgent',
      silent: data.priority === 'low',
      vibrate: data.priority === 'urgent' ? [200, 100, 200, 100, 200] : [100, 50, 100],
      actions: data.actions || [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    console.log('SW: Showing notification with options:', options);
    
    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => console.log('SW: Notification shown successfully'))
        .catch(err => console.error('SW: Failed to show notification:', err))
    );

  } catch (error) {
    console.error('SW: Error parsing push data:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Meteor PWA', {
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.svg'
      })
    );
  }
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        console.log('SW: Found clients:', clients.length);
        
        // Focus existing window if found
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            console.log('SW: Focusing existing client');
            return client.focus();
          }
        }
        
        // Open new window
        console.log('SW: Opening new window');
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
      .catch(err => console.error('SW: Error handling click:', err))
  );
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('SW: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline notifications when back online
      fetch('/api/sync-notifications')
        .then(response => response.json())
        .then(data => {
          console.log('SW: Sync completed:', data);
        })
        .catch(err => console.log('SW: Sync failed:', err))
    );
  }
});
