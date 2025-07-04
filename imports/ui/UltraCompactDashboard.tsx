import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useTrackingStore } from '../stores/trackingStore';
import { Notifications, OnlineUsers } from '../api/notifications';
import { MinimalNotificationManager } from './MinimalNotificationManager';
import { showSuccessToast, showErrorToast } from '../stores/notificationStore';

export const UltraCompactDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount } = useNotificationStore();
  const { onlineUsers, trackPageView, trackUserAction } = useTrackingStore();
  const [onlineCount, setOnlineCount] = useState(0);

  // Real-time subscriptions
  useTracker(() => {
    const notificationsSub = Meteor.subscribe('notifications');
    const onlineUsersSub = Meteor.subscribe('onlineUsers');
    
    if (notificationsSub.ready() && onlineUsersSub.ready()) {
      const notifications = Notifications.find(
        { userId: user?._id },
        { sort: { createdAt: -1 }, limit: 5 }
      ).fetch();
      
      const onlineUsers = OnlineUsers.find({}).count();
      setOnlineCount(onlineUsers);
    }
    
    return {};
  }, [user?._id]);

  useEffect(() => {
    trackPageView('/dashboard');
  }, []);

  const sendBroadcast = async () => {
    try {
      trackUserAction('broadcast_sent');
      await Meteor.callAsync('notifications.sendBroadcast', {
        title: '📢 Broadcast',
        body: `Message from ${user?.username || 'Admin'}`,
        priority: 'normal'
      });
      showSuccessToast('Broadcast sent to all users!');
    } catch (error) {
      console.error('Broadcast error:', error);
      showErrorToast('Failed to send broadcast');
    }
  };

  const quickActions = [
    {
      icon: '📢',
      label: 'Broadcast',
      action: sendBroadcast,
      color: '#28a745'
    },
    {
      icon: '📊',
      label: 'Profile',
      action: () => navigate('/profile'),
      color: '#007bff'
    },
    {
      icon: '🔔',
      label: 'Notifications',
      action: () => navigate('/notifications'),
      color: '#fd7e14',
      badge: unreadCount > 0 ? unreadCount : undefined
    }
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.userInfo}>
          <span style={styles.avatar}>👤</span>
          <span style={styles.username}>{user?.username}</span>
        </div>
        <div style={styles.headerActions}>
          <MinimalNotificationManager />
          <button onClick={logout} style={styles.logoutBtn}>
            🚪
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{onlineCount}</span>
          <span style={styles.statLabel}>Online</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{notifications.length}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{unreadCount}</span>
          <span style={styles.statLabel}>Unread</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.actions}>
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            style={{
              ...styles.actionBtn,
              backgroundColor: action.color
            }}
          >
            <span style={styles.actionIcon}>{action.icon}</span>
            <span style={styles.actionLabel}>{action.label}</span>
            {action.badge && (
              <span style={styles.badge}>{action.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Recent Notifications Preview */}
      {notifications.length > 0 && (
        <div style={styles.preview}>
          <div style={styles.previewHeader}>Recent</div>
          <div style={styles.previewList}>
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification._id}
                style={{
                  ...styles.previewItem,
                  opacity: notification.read ? 0.6 : 1
                }}
              >
                <span style={styles.previewTitle}>{notification.title}</span>
                <span style={styles.previewTime}>
                  {new Date(notification.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '400px',
    margin: '20px auto',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  } as React.CSSProperties,

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e9ecef'
  } as React.CSSProperties,

  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  } as React.CSSProperties,

  avatar: {
    fontSize: '16px'
  } as React.CSSProperties,

  username: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  } as React.CSSProperties,

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  } as React.CSSProperties,

  logoutBtn: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#dc3545',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px'
  } as React.CSSProperties,

  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  } as React.CSSProperties,

  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  } as React.CSSProperties,

  statValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#007bff'
  } as React.CSSProperties,

  statLabel: {
    fontSize: '10px',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  } as React.CSSProperties,

  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '16px'
  } as React.CSSProperties,

  actionBtn: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'transform 0.1s'
  } as React.CSSProperties,

  actionIcon: {
    fontSize: '16px',
    marginBottom: '4px'
  } as React.CSSProperties,

  actionLabel: {
    fontSize: '10px'
  } as React.CSSProperties,

  badge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '50%',
    fontSize: '8px',
    fontWeight: '700',
    minWidth: '14px',
    height: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties,

  preview: {
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    padding: '8px'
  } as React.CSSProperties,

  previewHeader: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  } as React.CSSProperties,

  previewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  } as React.CSSProperties,

  previewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 6px',
    backgroundColor: 'white',
    borderRadius: '4px'
  } as React.CSSProperties,

  previewTitle: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1
  } as React.CSSProperties,

  previewTime: {
    fontSize: '9px',
    color: '#6c757d',
    marginLeft: '8px'
  } as React.CSSProperties
};
