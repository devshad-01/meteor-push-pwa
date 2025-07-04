import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useTrackingStore } from '../stores/trackingStore';
import { Notifications, OnlineUsers } from '../api/notifications';
import { showInfoToast, showSuccessToast, showErrorToast } from '../stores/notificationStore';

export const CompactDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, isSubscribed, setSubscribed } = useNotificationStore();
  const { onlineUsers, trackPageView, trackUserAction } = useTrackingStore();

  // Subscribe to real-time data
  useTracker(() => {
    Meteor.subscribe('notifications');
    Meteor.subscribe('onlineUsers');
    return {};
  }, []);

  useEffect(() => {
    trackPageView('/dashboard');
    // Check subscription status on load
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }
  };

  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showErrorToast('Notification permission denied');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = Meteor.settings?.public?.vapidPublicKey;
      
      if (!vapidPublicKey) {
        showErrorToast('VAPID key missing');
        return;
      }

      // Convert VAPID key
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

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      await Meteor.callAsync('subscriptions.add', subscription.toJSON(), user?._id);
      setSubscribed(true);
      showSuccessToast('Notifications enabled!');
    } catch (error) {
      console.error('Error enabling notifications:', error);
      showErrorToast('Failed to enable notifications');
    }
  };

  const sendQuickTest = async () => {
    if (!user) return;
    
    try {
      await Meteor.callAsync('notifications.send', user._id, {
        title: '🧪 Quick Test',
        body: 'Test notification sent!',
        priority: 'normal'
      });
      showSuccessToast('Test sent!');
    } catch (error) {
      showErrorToast('Failed to send test');
    }
  };

  const sendBroadcast = async () => {
    try {
      await Meteor.callAsync('notifications.broadcast', {
        title: '📢 Broadcast',
        body: 'Message to all users!',
        priority: 'high'
      });
      showSuccessToast('Broadcast sent!');
    } catch (error) {
      showErrorToast('Failed to broadcast');
    }
  };

  const sendUrgent = async () => {
    if (!user) return;
    
    try {
      await Meteor.callAsync('notifications.send', user._id, {
        title: '🚨 URGENT',
        body: 'High priority alert!',
        priority: 'urgent'
      });
      showSuccessToast('Urgent sent!');
    } catch (error) {
      showErrorToast('Failed to send urgent');
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '20px auto', 
      padding: '15px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px'
    }}>
      {/* Compact Header */}
      <div style={{
        background: '#007bff',
        color: 'white',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px' }}>🚀 PWA Dashboard</h2>
          <small>{user?.emails?.[0]?.address}</small>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/notifications')} style={{ 
            padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.2)', 
            border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '4px', cursor: 'pointer'
          }}>
            🔔 {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button onClick={logout} style={{ 
            padding: '6px 12px', fontSize: '12px', background: '#dc3545', 
            border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer'
          }}>
            Exit
          </button>
        </div>
      </div>

      {/* Compact Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        marginBottom: '15px'
      }}>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{notifications.length}</div>
          <small>Notifications</small>
        </div>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{onlineUsers.length}</div>
          <small>Online</small>
        </div>
        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{isSubscribed ? '✅' : '❌'}</div>
          <small>Push</small>
        </div>
      </div>

      {/* Notification Controls */}
      <div style={{
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '6px',
        padding: '15px',
        marginBottom: '15px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>🔔 Notifications</h4>
        
        {!isSubscribed ? (
          <button
            onClick={enableNotifications}
            style={{
              width: '100%',
              padding: '8px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Enable Push Notifications
          </button>
        ) : (
          <div style={{ 
            padding: '8px', 
            background: '#d4edda', 
            color: '#155724', 
            borderRadius: '4px', 
            marginBottom: '10px',
            fontSize: '12px'
          }}>
            ✅ Push notifications enabled
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <button
            onClick={sendQuickTest}
            disabled={!isSubscribed}
            style={{
              padding: '8px 12px',
              background: isSubscribed ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubscribed ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            🧪 Test
          </button>
          
          <button
            onClick={sendBroadcast}
            disabled={!isSubscribed}
            style={{
              padding: '8px 12px',
              background: isSubscribed ? '#ffc107' : '#ccc',
              color: isSubscribed ? '#333' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubscribed ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            📢 Broadcast
          </button>
          
          <button
            onClick={sendUrgent}
            disabled={!isSubscribed}
            style={{
              padding: '8px 12px',
              background: isSubscribed ? '#dc3545' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubscribed ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            🚨 Urgent
          </button>
        </div>
      </div>

      {/* Online Users */}
      <div style={{
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '6px',
        padding: '15px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>👥 Online Users</h4>
        
        {onlineUsers.length === 0 ? (
          <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>No other users online</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {onlineUsers.map((onlineUser) => (
              <div
                key={onlineUser._id}
                style={{
                  padding: '6px 10px',
                  background: '#f8f9fa',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                {onlineUser.status === 'online' ? '🟢' : '🟡'} {onlineUser.username || 'User'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
