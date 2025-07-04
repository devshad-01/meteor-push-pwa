import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { useNotificationStore } from '../stores/notificationStore';
import { useTrackingStore } from '../stores/trackingStore';
import { Notifications } from '../api/collections';
import { useNotificationsSync } from '../stores/useNotificationsSync';

export const NotificationCenter: React.FC = () => {
  useNotificationsSync();
  const navigate = useNavigate();
  const { markAsRead, markAllAsRead, removeNotification, clearAll } = useNotificationStore();
  const { trackPageView, trackUserAction } = useTrackingStore();

  // Subscribe to notifications
  const { notifications, isLoading } = useTracker(() => {
    const handle = Meteor.subscribe('notifications');
    return {
      isLoading: !handle.ready(),
      notifications: Notifications.find({}, { sort: { createdAt: -1 } }).fetch()
    };
  }, []);

  useEffect(() => {
    trackPageView('/notifications');
  }, [trackPageView]);

  const handleMarkAsRead = (notificationId: string) => {
    trackUserAction('mark_notification_read', { notificationId });
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    trackUserAction('mark_all_notifications_read');
    markAllAsRead();
  };

  const handleRemove = (notificationId: string) => {
    trackUserAction('remove_notification', { notificationId });
    removeNotification(notificationId);
  };

  const handleClearAll = () => {
    trackUserAction('clear_all_notifications');
    clearAll();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'normal': return '#007bff';
      case 'low': return '#6c757d';
      default: return '#007bff';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '🔴';
      case 'normal': return '🔵';
      case 'low': return '⚪';
      default: return '🔵';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'broadcast': return '📢';
      case 'personal': return '📨';
      default: return '📨';
    }
  };

  return (
    <div style={{ 
      maxWidth: '1000px', 
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
          <h1 style={{ margin: 0, fontSize: '28px' }}>🔔 Notification Center</h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
            Manage your notifications and alerts
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
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
            🏠 Dashboard
          </button>
        </div>
      </header>

      {/* Controls */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          onClick={handleMarkAllAsRead}
          disabled={notifications.length === 0 || notifications.every(n => n.read)}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: notifications.length === 0 || notifications.every(n => n.read) ? 'not-allowed' : 'pointer',
            opacity: notifications.length === 0 || notifications.every(n => n.read) ? 0.6 : 1
          }}
        >
          ✅ Mark All Read
        </button>
        
        <button
          onClick={handleClearAll}
          disabled={notifications.length === 0}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: notifications.length === 0 ? 'not-allowed' : 'pointer',
            opacity: notifications.length === 0 ? 0.6 : 1
          }}
        >
          🗑️ Clear All
        </button>
        
        <div style={{ marginLeft: 'auto', color: '#666' }}>
          Total: {notifications.length} | 
          Unread: {notifications.filter(n => !n.read).length}
        </div>
      </div>

      {/* Notifications List */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {isLoading ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#666' 
          }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#666' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔔</div>
            <h3>No notifications yet</h3>
            <p>You'll see your notifications here when they arrive.</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification, index) => (
              <div
                key={notification._id}
                style={{
                  padding: '20px',
                  borderBottom: index < notifications.length - 1 ? '1px solid #eee' : 'none',
                  background: notification.read ? '#f8f9fa' : 'white',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px'
                }}
              >
                {/* Icon and Priority */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  minWidth: '60px'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div style={{ 
                    fontSize: '16px',
                    color: getPriorityColor(notification.priority)
                  }}>
                    {getPriorityIcon(notification.priority)}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <h4 style={{ 
                      margin: 0, 
                      color: notification.read ? '#666' : '#333',
                      fontWeight: notification.read ? 'normal' : 'bold'
                    }}>
                      {notification.title}
                    </h4>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id!)}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(notification._id!)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <p style={{ 
                    margin: '0 0 10px 0', 
                    color: notification.read ? '#666' : '#333',
                    lineHeight: '1.5'
                  }}>
                    {notification.body}
                  </p>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#999',
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center'
                  }}>
                    <span>
                      📅 {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    <span style={{
                      background: getPriorityColor(notification.priority),
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      textTransform: 'uppercase'
                    }}>
                      {notification.priority}
                    </span>
                    <span style={{
                      background: notification.type === 'broadcast' ? '#ffc107' : '#007bff',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      textTransform: 'uppercase'
                    }}>
                      {notification.type}
                    </span>
                    {notification.read && notification.readAt && (
                      <span>
                        ✅ Read {new Date(notification.readAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {notification.actions && notification.actions.length > 0 && (
                    <div style={{ 
                      marginTop: '10px',
                      display: 'flex',
                      gap: '10px'
                    }}>
                      {notification.actions.map((action: any, actionIndex: number) => (
                        <button
                          key={actionIndex}
                          onClick={() => trackUserAction('notification_action', { action: action.action, notificationId: notification._id })}
                          style={{
                            background: '#f8f9fa',
                            color: '#333',
                            border: '1px solid #ddd',
                            padding: '5px 10px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {action.icon} {action.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
