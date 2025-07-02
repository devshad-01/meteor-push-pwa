// Notification Center Component using Meteor Accounts
import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { UserNotifications } from '/imports/api/users';

interface NotificationCenterProps {
  userId: string;
  onUnreadCountChange: (count: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  userId, 
  onUnreadCountChange 
}) => {
  // Check if userId matches current user
  const currentUserId = useTracker(() => Meteor.userId(), []);
  
  console.log('NotificationCenter props - userId:', userId);
  console.log('NotificationCenter current user:', currentUserId);
  
  // Use reactive data from Meteor
  const { notifications, isReady } = useTracker(() => {
    console.log('useTracker running for userId:', userId);
    const handle = Meteor.subscribe('userNotifications');
    
    // Force reactivity by checking if we're ready first
    if (!handle.ready()) {
      console.log('Subscription not ready yet');
      return {
        notifications: [],
        isReady: false
      };
    }
    
    const notifs = UserNotifications.find(
      { toUserId: userId },
      { sort: { createdAt: -1 } }
    ).fetch();
    
    console.log('NotificationCenter - userId:', userId);
    console.log('NotificationCenter - notifications found:', notifs.length);
    console.log('NotificationCenter - notifications:', notifs);
    console.log('NotificationCenter - current user ID:', Meteor.userId());
    
    return {
      notifications: notifs,
      isReady: true
    };
  }, [userId]);

  // Update unread count when notifications change
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    onUnreadCountChange(unreadCount);
  }, [notifications, onUnreadCountChange]);

  const markAsRead = async (notificationId: string) => {
    try {
      await Meteor.callAsync('userNotifications.markAsRead', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!isReady) {
    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1a1a1a', fontSize: '20px', fontWeight: 600 }}>
          Notifications
        </h3>
        <div>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '12px',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '12px',
              background: '#f8f9fa'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#e9ecef',
                marginTop: '4px'
              }}></div>
              <div style={{ flex: 1 }}>
                <div style={{
                  height: '16px',
                  background: '#e9ecef',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}></div>
                <div style={{
                  height: '12px',
                  background: '#e9ecef',
                  borderRadius: '4px',
                  width: '80%',
                  marginBottom: '8px'
                }}></div>
                <div style={{
                  height: '10px',
                  background: '#e9ecef',
                  borderRadius: '4px',
                  width: '40%'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      height: '100%',
      overflow: 'auto'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#1a1a1a', fontSize: '20px', fontWeight: 600 }}>
        Notifications
      </h3>
      
      {notifications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <p>No notifications yet</p>
          <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>
            You'll see notifications here when someone sends you a message
          </p>
        </div>
      ) : (
        <div 
          className="notifications-container"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            maxHeight: 'calc(100vh - 300px)',
            overflow: 'auto',
            paddingRight: '8px'
          }}
        >
          {/* Custom scrollbar styles */}
          <style>{`
            .notifications-container::-webkit-scrollbar {
              width: 6px;
            }
            .notifications-container::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 3px;
            }
            .notifications-container::-webkit-scrollbar-thumb {
              background: #c1c1c1;
              border-radius: 3px;
            }
            .notifications-container::-webkit-scrollbar-thumb:hover {
              background: #a1a1a1;
            }
          `}</style>
          {notifications.map((notification) => (
            <div 
              key={notification._id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '16px',
                background: notification.read ? 'white' : '#f8f9ff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: notification.read ? '1px solid #e9ecef' : '1px solid #d1ecf1',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => !notification.read && notification._id && markAsRead(notification._id)}
            >
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: notification.read ? '#6c757d' : '#007bff',
                marginTop: '4px',
                flexShrink: 0
              }}></div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: notification.read ? 500 : 600,
                    color: '#1a1a1a'
                  }}>
                    {notification.title}
                  </h4>
                  <span style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    marginLeft: '12px'
                  }}>
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
                
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '13px',
                  color: '#495057',
                  lineHeight: '1.4'
                }}>
                  {notification.message}
                </p>
                
                <div style={{
                  fontSize: '12px',
                  color: '#6c757d'
                }}>
                  From: {notification.fromUserName}
                </div>
              </div>
              
              {!notification.read && (
                <button
                  style={{
                    padding: '4px 8px',
                    border: 'none',
                    background: '#007bff',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    alignSelf: 'flex-start'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (notification._id) {
                      markAsRead(notification._id);
                    }
                  }}
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {notifications.length > 0 && (
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
            {notifications.filter(n => !n.read).length} unread of {notifications.length} total
          </p>
        </div>
      )}
    </div>
  );
};
