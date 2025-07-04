import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Subscriptions, Notifications, UserActivity, OnlineUsers } from './collections';

// Notification interface
interface NotificationDoc {
  _id?: string;
  userId: string;
  title: string;
  body: string;
  type: 'personal' | 'broadcast';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Create indexes for better performance
if (Meteor.isServer) {
  Meteor.startup(() => {
    Notifications.createIndex({ userId: 1, createdAt: -1 });
    Notifications.createIndex({ type: 1, createdAt: -1 });
    UserActivity.createIndex({ userId: 1, timestamp: -1 });
    OnlineUsers.createIndex({ userId: 1 });
    OnlineUsers.createIndex({ lastSeen: 1 });
  });
}

// Meteor methods for handling push subscriptions
Meteor.methods({
  async 'subscriptions.add'(subscription: any, userId?: string) {
    console.log('=== ADDING SUBSCRIPTION ===');
    console.log('User ID:', userId);
    console.log('Subscription endpoint:', subscription?.endpoint);
    
    // Remove any existing subscription for this user
    if (userId) {
      const removed = await Subscriptions.removeAsync({ userId });
      console.log('Removed existing subscriptions:', removed);
    }
    
    // Validate subscription
    if (!subscription || !subscription.endpoint) {
      throw new Meteor.Error('invalid-subscription', 'Subscription must have an endpoint');
    }
    
    // Add new subscription
    const insertResult = await Subscriptions.insertAsync({
      subscription: JSON.stringify(subscription),
      userId: userId || null,
      createdAt: new Date(),
      endpoint: subscription.endpoint
    });
    
    console.log('Subscription inserted with ID:', insertResult);
    return insertResult;
  },
  
  async 'subscriptions.remove'(userId: string) {
    return await Subscriptions.removeAsync({ userId });
  },
  

  async 'subscriptions.clearAll'() {
    console.log('Clearing all subscriptions');
    return await Subscriptions.removeAsync({});
  }
});

// Enhanced notification methods
Meteor.methods({
  async 'notifications.send'(targetUserId: string, notification: {
    title: string;
    body: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    data?: any;
    actions?: Array<{ action: string; title: string; icon?: string }>;
  }) {
    check(targetUserId, String);
    check(notification, Object);
    
    console.log('Sending notification to user:', targetUserId);
    
    // Create notification document
    const notificationDoc: NotificationDoc = {
      userId: targetUserId,
      title: notification.title,
      body: notification.body,
      type: 'personal',
      priority: notification.priority || 'normal',
      read: false,
      createdAt: new Date(),
      data: notification.data,
      actions: notification.actions
    };
    
    // Save to database
    const notificationId = await Notifications.insertAsync(notificationDoc);
    
    // Send push notification
    const subscription = await Subscriptions.findOneAsync({ userId: targetUserId });
    
    if (subscription) {
      try {
        const pushSubscription = JSON.parse(subscription.subscription);
        
        const pushPayload = JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-192x192.svg',
          tag: `notification-${notificationId}`,
          priority: notification.priority,
          data: {
            notificationId,
            priority: notification.priority,
            timestamp: Date.now(),
            actions: notification.actions,
            ...notification.data
          },
          actions: notification.actions || []
        });
        
        console.log('Push payload:', pushPayload);
        
        if (Meteor.isServer) {
          const webpush = require('web-push');
          const vapid = Meteor.settings.vapid || {};
          
          console.log('VAPID config:', {
            email: vapid.email,
            publicKey: vapid.publicKey ? vapid.publicKey.substring(0, 20) + '...' : 'missing',
            privateKey: vapid.privateKey ? 'present' : 'missing'
          });
          
          if (!vapid.publicKey || !vapid.privateKey) {
            throw new Error('VAPID keys not configured properly');
          }
          
          webpush.setVapidDetails(
            vapid.email || 'mailto:noreply@meteorpwa.com',
            vapid.publicKey,
            vapid.privateKey
          );
          
          console.log('Sending push to endpoint:', pushSubscription.endpoint.substring(0, 50) + '...');
          
          const result = await webpush.sendNotification(pushSubscription, pushPayload);
          console.log('Push notification sent successfully:', result.statusCode);
        }
        
      } catch (error) {
        console.error('Error sending push notification:', error);
        
        // If the subscription is invalid, remove it
        if ((error as any).statusCode === 410) {
          await Subscriptions.removeAsync({ _id: subscription._id });
        }
      }
    }
    
    return notificationId;
  },
  
  async 'notifications.broadcast'(notification: {
    title: string;
    body: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    data?: any;
    actions?: Array<{ action: string; title: string; icon?: string }>;
  }) {
    check(notification, Object);
    
    console.log('Broadcasting notification to all users');
    
    // Get all subscribed users
    const subscriptions = await Subscriptions.find({}).fetchAsync();
    const userIds = subscriptions.map(s => s.userId).filter(Boolean);
    
    // Create notification documents for each user
    const notificationDocs = userIds.map(userId => ({
      userId,
      title: notification.title,
      body: notification.body,
      type: 'broadcast' as const,
      priority: notification.priority || 'normal',
      read: false,
      createdAt: new Date(),
      data: notification.data,
      actions: notification.actions
    }));
    
    // Bulk insert notifications
    if (notificationDocs.length > 0) {
      await Promise.all(notificationDocs.map(doc => Notifications.insertAsync(doc)));
    }
    
    // Send push notifications
    const webpush = Meteor.isServer ? require('web-push') : null;
    if (webpush) {
      const vapid = Meteor.settings.vapid || {};
      webpush.setVapidDetails(
        vapid.email || 'mailto:your-email@example.com',
        vapid.publicKey || '',
        vapid.privateKey || ''
      );
      
      const pushPayload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-192x192.svg',
        tag: 'broadcast-notification',
        data: {
          type: 'broadcast',
          priority: notification.priority,
          actions: notification.actions,
          ...notification.data
        },
        actions: notification.actions || []
      });
      
      // Send to all subscriptions
      await Promise.all(subscriptions.map(async (sub) => {
        try {
          const pushSubscription = JSON.parse(sub.subscription);
          await webpush.sendNotification(pushSubscription, pushPayload);
        } catch (error) {
          console.error('Error sending broadcast notification:', error);
          if ((error as any).statusCode === 410) {
            await Subscriptions.removeAsync({ _id: sub._id });
          }
        }
      }));
    }
    
    return userIds.length;
  },
  
  async 'notifications.sendBroadcast'(notification: {
    title: string;
    body: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    data?: any;
    actions?: Array<{ action: string; title: string; icon?: string }>;
  }) {
    // Call the existing broadcast method
    return await Meteor.callAsync('notifications.broadcast', notification);
  },
  
  async 'notifications.markAsRead'(notificationId: string) {
    check(notificationId, String);
    
    const userId = Meteor.userId();
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    
    return await Notifications.updateAsync(
      { _id: notificationId, userId },
      { $set: { read: true, readAt: new Date() } }
    );
  },
  
  async 'notifications.markAllAsRead'() {
    const userId = Meteor.userId();
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    
    return await Notifications.updateAsync(
      { userId, read: false },
      { $set: { read: true, readAt: new Date() } },
      { multi: true }
    );
  },
  
  async 'notifications.remove'(notificationId: string) {
    check(notificationId, String);
    
    const userId = Meteor.userId();
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    
    return await Notifications.removeAsync({ _id: notificationId, userId });
  },
  
  async 'notifications.clearAll'() {
    const userId = Meteor.userId();
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    
    return await Notifications.removeAsync({ userId });
  }
});

// Real-time tracking methods
Meteor.methods({
  async 'tracking.updateStatus'(status: 'online' | 'away' | 'offline', sessionId: string) {
    check(status, String);
    check(sessionId, String);
    
    const userId = Meteor.userId();
    if (!userId) return;
    
    await OnlineUsers.upsertAsync(
      { userId },
      {
        $set: {
          userId,
          username: (await Meteor.userAsync())?.username,
          status,
          lastSeen: new Date(),
          sessionId
        }
      }
    );
    
    // Remove offline users after 5 minutes
    if (status === 'offline') {
      Meteor.setTimeout(async () => {
        await OnlineUsers.removeAsync({ userId, sessionId });
      }, 5 * 60 * 1000);
    }
  },
  
  async 'tracking.heartbeat'(sessionId: string) {
    check(sessionId, String);
    
    const userId = Meteor.userId();
    if (!userId) return;
    
    await OnlineUsers.updateAsync(
      { userId, sessionId },
      { $set: { lastSeen: new Date() } }
    );
  },
  
  async 'tracking.disconnect'(sessionId: string) {
    check(sessionId, String);
    
    const userId = Meteor.userId();
    if (!userId) return;
    
    await OnlineUsers.removeAsync({ userId, sessionId });
  },
  
  async 'tracking.logActivity'(activity: {
    userId: string;
    action: string;
    timestamp: Date;
    metadata?: any;
    sessionId: string;
  }) {
    check(activity, Object);
    
    // Only log activities for authenticated users
    if (!Meteor.userId()) return;
    
    return await UserActivity.insertAsync({
      ...activity,
      createdAt: new Date()
    });
  }
});

// Publications for real-time updates
if (Meteor.isServer) {
  Meteor.publish('notifications', function() {
    if (!this.userId) {
      return this.ready();
    }
    
    return Notifications.find(
      { userId: this.userId },
      { sort: { createdAt: -1 }, limit: 50 }
    );
  });
  
  Meteor.publish('onlineUsers', function() {
    if (!this.userId) {
      return this.ready();
    }
    
    // Clean up old entries first
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    OnlineUsers.removeAsync({ lastSeen: { $lt: fiveMinutesAgo } });
    
    return OnlineUsers.find({}, {
      fields: { userId: 1, username: 1, status: 1, lastSeen: 1 }
    });
  });
  
  Meteor.publish('recentActivity', function(limit = 20) {
    check(limit, Number);
    
    if (!this.userId) {
      return this.ready();
    }
    
    return UserActivity.find({}, {
      sort: { timestamp: -1 },
      limit: Math.min(limit, 100),
      fields: { userId: 1, action: 1, timestamp: 1, metadata: 1 }
    });
  });
}
