import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore, showSuccessToast, showErrorToast } from '../stores/notificationStore';

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

export const NotificationManager: React.FC = () => {
  const { user } = useAuthStore();
  const { isPermissionGranted, isSubscribed, setPermission, setSubscribed } = useNotificationStore();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission === 'granted');
      checkExistingSubscription();
    }
  }, [setPermission]);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking existing subscription:', error);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      showErrorToast('Push notifications are not supported in this browser');
      return false;
    }

    if (Notification.permission === 'denied') {
      showErrorToast('Notifications are blocked. Please enable them in your browser settings.');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result === 'granted');
    
    return result === 'granted';
  };

  const subscribeToNotifications = async () => {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = Meteor.settings?.public?.vapidPublicKey || '';
      
      if (!vapidPublicKey) {
        showErrorToast('VAPID public key not found in Meteor.settings.public');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });

      const subscriptionData = subscription.toJSON();

      // Save subscription to the server
      try {
        await Meteor.callAsync('subscriptions.add', subscriptionData, user?._id);
        console.log('Subscription saved successfully');
        setSubscribed(true);
        showSuccessToast('🔔 Notifications enabled successfully!');
      } catch (error) {
        console.error('Error saving subscription:', error);
        showErrorToast('Failed to save notification subscription');
      }

    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      showErrorToast('Failed to subscribe to notifications');
    }
  };

  const unsubscribeFromNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from server
        if (user?._id) {
          try {
            await Meteor.callAsync('subscriptions.remove', user._id);
            console.log('Subscription removed successfully');
          } catch (error) {
            console.error('Error removing subscription:', error);
          }
        }
      }
      
      setSubscribed(false);
      showSuccessToast('🔕 Notifications disabled');
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      showErrorToast('Failed to unsubscribe from notifications');
    }
  };

  if (!isSupported) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: 'white'
      }}>
        <p>❌ Push notifications are not supported in this browser</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: 'white'
      }}>
        <p>🔐 Please log in to enable notifications</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '8px',
      color: 'white'
    }}>
      <h3>🔔 Push Notifications</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Permission: <strong>{isPermissionGranted ? 'Granted' : 'Not granted'}</strong></p>
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
      </div>
    </div>
  );
};
