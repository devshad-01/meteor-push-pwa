import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNotificationStore, showSuccessToast, showErrorToast } from '../stores/notificationStore';
import { useAuthStore } from '../stores/authStore';

interface NotificationPermission {
  granted: boolean;
  subscribed: boolean;
  loading: boolean;
}

export const MinimalNotificationManager: React.FC = () => {
  const { user } = useAuthStore();
  const { setSubscribed } = useNotificationStore();
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    subscribed: false,
    loading: false
  });

  useEffect(() => {
    checkPermissionStatus();
    registerServiceWorker();
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        console.log('Registering service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', registration.scope);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Service worker is ready');
        
        checkSubscriptionStatus();
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  };

  const checkPermissionStatus = () => {
    // Check if Notification API is available (not available in iOS Safari)
    if (typeof Notification === 'undefined') {
      console.log('Notification API not available on this device');
      setPermission(prev => ({ ...prev, granted: false }));
      return;
    }
    
    const granted = Notification.permission === 'granted';
    setPermission(prev => ({ ...prev, granted }));
  };

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const subscribed = !!subscription;
      
      setPermission(prev => ({ ...prev, subscribed }));
      setSubscribed(subscribed);
      
      console.log('Subscription status:', subscribed);
      if (subscription) {
        console.log('Existing subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermissionAndSubscribe = async () => {
    // Check if Notification API is available (not available in iOS Safari)
    if (typeof Notification === 'undefined') {
      showErrorToast('Push notifications are not supported on this device');
      return;
    }

    setPermission(prev => ({ ...prev, loading: true }));

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      console.log('Permission result:', permissionResult);
      
      if (permissionResult !== 'granted') {
        showErrorToast('Notification permission denied');
        setPermission(prev => ({ ...prev, loading: false }));
        return;
      }

      setPermission(prev => ({ ...prev, granted: true }));

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      console.log('Got registration:', registration);

      // Get VAPID public key
      const vapidPublicKey = Meteor.settings?.public?.vapidPublicKey;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found in settings');
      }

      console.log('Using VAPID key:', vapidPublicKey.substring(0, 20) + '...');

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      });

      console.log('Created subscription:', subscription.endpoint.substring(0, 50) + '...');

      // Send subscription to server
      await Meteor.callAsync('subscriptions.add', subscription.toJSON(), user?._id);
      console.log('Subscription saved to server');

      setPermission(prev => ({ ...prev, subscribed: true, loading: false }));
      setSubscribed(true);
      showSuccessToast('Notifications enabled successfully!');

    } catch (error) {
      console.error('Error setting up notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast(`Failed to enable notifications: ${errorMessage}`);
      setPermission(prev => ({ ...prev, loading: false }));
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await Meteor.callAsync('subscriptions.remove', user?._id);
        
        setPermission(prev => ({ ...prev, subscribed: false }));
        setSubscribed(false);
        showSuccessToast('Notifications disabled');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      showErrorToast('Failed to disable notifications');
    }
  };

  const sendTestNotification = async () => {
    if (!user) return;
    
    try {
      await Meteor.callAsync('notifications.send', user._id, {
        title: '🧪 Test Notification',
        body: 'If you can see this, notifications are working!',
        priority: 'normal',
        data: { test: true }
      });
      showSuccessToast('Test notification sent!');
    } catch (error) {
      console.error('Error sending test:', error);
      showErrorToast('Failed to send test notification');
    }
  };

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return (
      <div style={styles.container}>
        <div style={styles.unsupported}>
          ⚠️ Push notifications not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.status}>
        <span style={styles.indicator}>
          {permission.granted && permission.subscribed ? '🟢' : '🔴'}
        </span>
        <span style={styles.text}>
          {permission.granted && permission.subscribed ? 'Notifications ON' : 'Notifications OFF'}
        </span>
      </div>
      
      <div style={styles.controls}>
        {!permission.granted || !permission.subscribed ? (
          <button
            onClick={requestPermissionAndSubscribe}
            disabled={permission.loading}
            style={styles.button}
          >
            {permission.loading ? '⏳' : '🔔'} Enable
          </button>
        ) : (
          <>
            <button
              onClick={sendTestNotification}
              style={styles.button}
            >
              🧪 Test
            </button>
            <button
              onClick={unsubscribe}
              style={styles.buttonSecondary}
            >
              🔕 Disable
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    fontSize: '12px',
    border: '1px solid #e9ecef'
  } as React.CSSProperties,
  
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  } as React.CSSProperties,
  
  indicator: {
    fontSize: '8px'
  } as React.CSSProperties,
  
  text: {
    color: '#495057',
    fontWeight: '500'
  } as React.CSSProperties,
  
  controls: {
    display: 'flex',
    gap: '4px'
  } as React.CSSProperties,
  
  button: {
    padding: '2px 6px',
    fontSize: '10px',
    border: 'none',
    borderRadius: '3px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500'
  } as React.CSSProperties,
  
  buttonSecondary: {
    padding: '2px 6px',
    fontSize: '10px',
    border: 'none',
    borderRadius: '3px',
    backgroundColor: '#6c757d',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500'
  } as React.CSSProperties,
  
  unsupported: {
    color: '#856404',
    fontSize: '11px',
    fontWeight: '500'
  } as React.CSSProperties
};
