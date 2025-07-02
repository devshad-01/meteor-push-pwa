import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';

// Utility function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface NotificationManagerProps {
  userId?: string;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ userId }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking existing subscription:', error);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      alert('Push notifications are not supported in this browser');
      return false;
    }

    if (permission === 'denied') {
      alert('Notifications are blocked. Please enable them in your browser settings.');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    return result === 'granted';
  };

  const subscribeToNotifications = async () => {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      const registration = await navigator.serviceWorker.ready;
      // Fetch public VAPID key from Meteor.settings.public
      const vapidPublicKey = Meteor.settings?.public?.vapidPublicKey || '';
      if (!vapidPublicKey) {
        alert('VAPID public key not found in Meteor.settings.public');
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });

      console.log('Raw subscription:', subscription);
      console.log('Subscription endpoint:', subscription.endpoint);

      // Convert subscription to a serializable format
      const subscriptionData = subscription.toJSON();
      console.log('Subscription toJSON():', subscriptionData);

      // Save subscription to the server
      Meteor.call('subscriptions.add', subscriptionData, userId, (error: any) => {
        if (error) {
          console.error('Error saving subscription:', error);
          alert('Failed to save notification subscription');
        } else {
          console.log('Subscription saved successfully');
          setIsSubscribed(true);
        }
      });

    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      alert('Failed to subscribe to notifications');
    }
  };

  const unsubscribeFromNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from server
        if (userId) {
          Meteor.call('subscriptions.remove', userId, (error: any) => {
            if (error) {
              console.error('Error removing subscription:', error);
            } else {
              console.log('Subscription removed successfully');
            }
          });
        }
      }
      
      setIsSubscribed(false);
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      alert('Failed to unsubscribe from notifications');
    }
  };

  const testNotification = () => {
    if (userId) {
      Meteor.call('notifications.send', userId, {
        title: 'Test Notification',
        body: 'This is a test notification from your Meteor PWA!',
        icon: '/icons/icon-192x192.svg',
        url: '/'
      }, (error: any) => {
        if (error) {
          console.error('Error sending test notification:', error);
          alert('Failed to send test notification');
        } else {
          console.log('Test notification sent successfully');
        }
      });
    }
  };

  const broadcastNotification = () => {
    Meteor.call('notifications.broadcast', {
      title: 'Broadcast Message',
      body: 'This is a broadcast message to all users!',
      icon: '/icons/icon-192x192.svg',
      url: '/'
    }, (error: any) => {
      if (error) {
        console.error('Error sending broadcast notification:', error);
        alert('Failed to send broadcast notification');
      } else {
        console.log('Broadcast notification sent successfully');
      }
    });
  };

  if (!isSupported) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>❌ Push notifications are not supported in this browser</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>🔔 Push Notifications</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Permission: <strong>{permission}</strong></p>
        <p>Subscribed: <strong>{isSubscribed ? 'Yes' : 'No'}</strong></p>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {!isSubscribed ? (
          <button
            onClick={subscribeToNotifications}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔔 Enable Notifications
          </button>
        ) : (
          <button
            onClick={unsubscribeFromNotifications}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔕 Disable Notifications
          </button>
        )}

        {isSubscribed && userId && (
          <button
            onClick={testNotification}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🧪 Test Notification
          </button>
        )}

        {isSubscribed && (
          <button
            onClick={broadcastNotification}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📢 Broadcast
          </button>
        )}
      </div>
    </div>
  );
};
