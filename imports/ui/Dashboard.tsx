import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useTrackingStore } from '../stores/trackingStore';
import { Notifications, OnlineUsers } from '../api/notifications';
import { showInfoToast } from '../stores/notificationStore';
import { NotificationManager } from './EnhancedNotificationManager';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount } = useNotificationStore();
  const { onlineUsers, trackPageView, trackUserAction } = useTrackingStore();

  // Subscribe to real-time data
  useTracker(() => {
    const notificationsSub = Meteor.subscribe('notifications');
    const onlineUsersSub = Meteor.subscribe('onlineUsers');
    
    return {
      notificationsReady: notificationsSub.ready(),
      onlineUsersReady: onlineUsersSub.ready(),
      notifications: Notifications.find({}, { sort: { createdAt: -1 } }).fetch(),
      onlineUsers: OnlineUsers.find({}).fetch()
    };
  }, []);

  useEffect(() => {
    trackPageView('/dashboard');
  }, [trackPageView]);

  const handleLogout = () => {
    trackUserAction('logout');
    showInfoToast('👋 Logging out...', 2000);
    logout();
  };

  const sendTestNotification = async () => {
    trackUserAction('send_test_notification');
    
    if (user) {
      try {
        await Meteor.callAsync('notifications.send', user._id, {
          title: 'Test Notification',
          body: 'This is a personalized test notification!',
          priority: 'normal',
          data: { testData: true }
        });
        showInfoToast('✅ Test notification sent!', 3000);
      } catch (error) {
        console.error('Error sending test notification:', error);
        showInfoToast('❌ Failed to send notification', 3000);
      }
    }
  };

  const sendBroadcast = async () => {
    trackUserAction('send_broadcast');
    
    try {
      await Meteor.callAsync('notifications.broadcast', {
        title: 'System Broadcast',
        body: 'This is a system-wide broadcast message to all users!',
        priority: 'high',
        data: { broadcast: true }
      });
      showInfoToast('📢 Broadcast sent to all users!', 4000);
    } catch (error) {
      console.error('Error sending broadcast:', error);
      showInfoToast('❌ Failed to send broadcast', 3000);
    }
  };

  const sendUrgentPing = async () => {
    trackUserAction('send_urgent_ping');
    
    if (user) {
      try {
        await Meteor.callAsync('notifications.send', user._id, {
          title: '🚨 Urgent Ping',
          body: 'This is an urgent notification that requires immediate attention!',
          priority: 'urgent',
          data: { urgent: true },
          actions: [
            { action: 'acknowledge', title: 'Acknowledge', icon: '✅' },
            { action: 'dismiss', title: 'Dismiss', icon: '❌' }
          ]
        });
        showInfoToast('🚨 Urgent ping sent!', 3000);
      } catch (error) {
        console.error('Error sending urgent ping:', error);
        showInfoToast('❌ Failed to send urgent ping', 3000);
      }
    }
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>🚀 Real-time Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
            Welcome, {user?.username || user?.emails?.[0]?.address || 'User'}!
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            👤 Profile
          </button>
          <button
            onClick={() => navigate('/notifications')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              position: 'relative'
            }}
          >
            🔔 Notifications
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#dc3545',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#007bff', marginBottom: '10px' }}>📱 Notifications</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
              {notifications.length}
            </div>
            <p style={{ color: '#666', fontSize: '14px' }}>
              {unreadCount} unread
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#28a745', marginBottom: '10px' }}>👥 Online Users</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
              {onlineUsers.length}
            </div>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Currently active
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#ffc107', marginBottom: '10px' }}>⚡ Real-time</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
              ✅
            </div>
            <p style={{ color: '#666', fontSize: '14px' }}>
              All systems active
            </p>
          </div>
        </div>

        {/* Notification Controls */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>� Notification System</h3>
          <NotificationManager />
        </div>

        {/* Send Notifications */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>�📤 Send Notifications</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Test the real-time notification system with different types of messages:
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <button
              onClick={sendTestNotification}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '15px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🧪 Send Test Notification
            </button>
            
            <button
              onClick={sendBroadcast}
              style={{
                background: '#ffc107',
                color: '#333',
                border: 'none',
                padding: '15px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              📢 Send Broadcast
            </button>
            
            <button
              onClick={sendUrgentPing}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '15px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🚨 Send Urgent Ping
            </button>
          </div>
        </div>

        {/* Online Users */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>👥 Online Users</h3>
          
          {onlineUsers.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No other users online at the moment
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              {onlineUsers.map((onlineUser) => (
                <div
                  key={onlineUser._id}
                  style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                    {onlineUser.status === 'online' ? '🟢' : 
                     onlineUser.status === 'away' ? '🟡' : '🔴'}
                  </div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {onlineUser.username || 'Anonymous'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {onlineUser.status}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    Last seen: {new Date(onlineUser.lastSeen).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
