// User Management API using Meteor Accounts
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

// Define notification interface
interface UserNotification {
  _id?: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

// Collections
export const UserNotifications = new Mongo.Collection<UserNotification>('userNotifications');

// Extend Meteor.User interface to include our custom fields
declare module 'meteor/meteor' {
  interface UserProfile {
    name?: string;
    isOnline?: boolean;
    lastSeen?: Date;
    notificationSubscription?: any;
  }
}

// Server-side user management
if (Meteor.isServer) {
  // Configure accounts
  Accounts.config({
    sendVerificationEmail: false,
    forbidClientAccountCreation: false
  });

// Custom user creation
  Accounts.onCreateUser((options: any, user: any) => {
    // Add profile information
    user.profile = {
      name: options.profile?.name || options.name || 'User',
      isOnline: true,
      lastSeen: new Date(),
      notificationSubscription: null
    };
    return user;
  });

  // Publications
  Meteor.publish('userData', function () {
    if (this.userId) {
      return Meteor.users.find(this.userId, {
        fields: {
          emails: 1,
          profile: 1
        }
      });
    } else {
      this.ready();
    }
  });

  Meteor.publish('allUsers', function () {
    return Meteor.users.find({}, {
      fields: {
        emails: 1,
        profile: 1
      },
      limit: 100
    });
  });

  Meteor.publish('userNotifications', function () {
    console.log('userNotifications publication called, this.userId:', this.userId);
    if (!this.userId) {
      return this.ready();
    }
    const cursor = UserNotifications.find({ toUserId: this.userId });
    console.log('Publishing notifications for user:', this.userId);
    return cursor;
  });
}

// User Management Methods
Meteor.methods({
  'users.updateOnlineStatus': async function (isOnline: boolean) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    await Meteor.users.updateAsync(this.userId, {
      $set: {
        'profile.isOnline': isOnline,
        'profile.lastSeen': new Date()
      }
    });
  },

  'users.updateProfile': async function (profileData: { name?: string }) {
    check(profileData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const updateFields: any = {};
    if (profileData.name) {
      check(profileData.name, String);
      updateFields['profile.name'] = profileData.name;
    }

    await Meteor.users.updateAsync(this.userId, {
      $set: updateFields
    });
  },

  'users.updateNotificationSubscription': async function (subscription: any) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    await Meteor.users.updateAsync(this.userId, {
      $set: {
        'profile.notificationSubscription': subscription
      }
    });
  }
});

// User Notification Management (separate from push notifications)
Meteor.methods({
  'userNotifications.send': async function (toUserId: string, title: string, message: string) {
    console.log('userNotifications.send called, this.userId:', this.userId);
    console.log('userNotifications.send params - toUserId:', toUserId, 'title:', title, 'message:', message);
    check(toUserId, String);
    check(title, String);
    check(message, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const fromUser = await Meteor.users.findOneAsync(this.userId);
    const toUser = await Meteor.users.findOneAsync(toUserId);

    console.log('fromUser found:', !!fromUser);
    console.log('toUser found:', !!toUser);

    if (!fromUser || !toUser) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }

    const notificationData = {
      fromUserId: this.userId,
      toUserId,
      fromUserName: (fromUser.profile as any)?.name || fromUser.emails?.[0]?.address || 'Anonymous',
      title,
      message,
      createdAt: new Date(),
      read: false
    };

    console.log('About to insert notification:', notificationData);

    const notificationId = await UserNotifications.insertAsync(notificationData);

    console.log('Notification inserted with ID:', notificationId);
    console.log('Notification for user:', toUserId);

    // Send push notification if user has subscription in Subscriptions collection
    console.log('Checking for subscription in Subscriptions collection for user:', toUserId);
    try {
      const result = await Meteor.callAsync('subscriptions.getByUser', toUserId);
      console.log('Subscription found for user:', toUserId, result ? 'Yes' : 'No');
      
      if (result) {
        console.log('Sending individual push notification to user:', toUserId);
        await Meteor.callAsync('notifications.send', toUserId, {
          title: `${(fromUser.profile as any)?.name || 'Someone'}: ${title}`,
          body: message,
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-192x192.svg'
        });
        console.log('Individual push notification sent successfully to user:', toUserId);
      } else {
        console.log('User does not have notification subscription in Subscriptions collection, skipping push notification');
      }
    } catch (error) {
      console.error('Error checking subscription or sending notification for user:', toUserId, error);
    }

    return notificationId;
  },

  'userNotifications.sendToAll': async function (title: string, message: string) {
    console.log('userNotifications.sendToAll called, this.userId:', this.userId);
    check(title, String);
    check(message, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const fromUser = await Meteor.users.findOneAsync(this.userId);
    if (!fromUser) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }

    const usersCursor = Meteor.users.find({ _id: { $ne: this.userId } });
    const users = await usersCursor.fetchAsync();
    
    for (const user of users) {
      await UserNotifications.insertAsync({
        fromUserId: this.userId,
        toUserId: user._id,
        fromUserName: (fromUser.profile as any)?.name || 'Anonymous',
        title,
        message,
        createdAt: new Date(),
        read: false
      });
    }

    // Send broadcast push notification
    Meteor.call('notifications.broadcast', {
      title: `${(fromUser.profile as any)?.name || 'Someone'}: ${title}`,
      body: message,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg'
    });

    return users.length;
  },

  'userNotifications.markAsRead': async function (notificationId: string) {
    check(notificationId, String);
    await UserNotifications.updateAsync(notificationId, {
      $set: { read: true }
    });
  },

  'userNotifications.getForUser': async function (userId: string) {
    check(userId, String);
    const cursor = UserNotifications.find(
      { toUserId: userId },
      { sort: { createdAt: -1 }, limit: 50 }
    );
    return await cursor.fetchAsync();
  },
});

// Additional publications for backward compatibility
if (Meteor.isServer) {
  Meteor.publish('users.list', function() {
    return Meteor.users.find({}, {
      fields: {
        emails: 1,
        profile: 1
      }
    });
  });

  Meteor.publish('userNotifications.user', function(userId: string) {
    check(userId, String);
    return UserNotifications.find({ toUserId: userId });
  });
}
