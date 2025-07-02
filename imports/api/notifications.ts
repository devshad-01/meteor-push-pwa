import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

// Collection to store user push subscriptions
export const Subscriptions = new Mongo.Collection('subscriptions');

// Meteor methods for handling push notifications
Meteor.methods({
  async 'subscriptions.add'(subscription: any, userId?: string) {
    console.log('=== ADDING SUBSCRIPTION ===');
    console.log('User ID:', userId);
    console.log('Raw subscription parameter:', subscription);
    console.log('Subscription type:', typeof subscription);
    console.log('Subscription keys:', Object.keys(subscription || {}));
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
  },
  
  async 'subscriptions.getByUser'(userId: string) {
    return await Subscriptions.findOneAsync({ userId });
  }
});

// Server-side push notification functionality
if (Meteor.isServer) {
  const webpush = require('web-push');
  
  // Use Meteor.settings for VAPID configuration with error handling
  try {
    const vapid = Meteor.settings.vapid || {};
    if (vapid.publicKey && vapid.privateKey) {
      webpush.setVapidDetails(
        vapid.email || 'mailto:your-email@example.com',
        vapid.publicKey,
        vapid.privateKey
      );
      console.log('✅ VAPID keys configured for push notifications');
    } else {
      console.warn('⚠️ VAPID keys not configured - push notifications disabled');
    }
  } catch (error) {
    console.warn('⚠️ Failed to configure VAPID keys - push notifications disabled:', error);
  }
  
  Meteor.methods({
    async 'notifications.send'(userId: string, payload: any) {
      console.log('🚀 FORCE Sending push notification to user:', userId);
      console.log('🚀 Payload:', payload);
      
      const subscription = await Subscriptions.findOneAsync({ userId });
      
      if (!subscription) {
        console.error('❌ No push subscription found for user:', userId);
        throw new Meteor.Error('no-subscription', 'No push subscription found for user');
      }
      
      console.log('✅ Subscription found for user:', userId);
      
      try {
        const pushSubscription = JSON.parse(subscription.subscription);
        console.log('🔑 Push subscription object:', pushSubscription);
        
        // Validate subscription has required properties
        if (!pushSubscription.endpoint) {
          throw new Error('Subscription missing endpoint');
        }
        
        const notificationPayload = JSON.stringify({
          message: payload.title || 'New Notification',
          body: payload.body || 'You have a new notification',
          icon: payload.icon || '/icons/icon-192x192.svg',
          badge: payload.badge || '/icons/icon-192x192.svg',
          url: payload.url || '/',
          requireInteraction: payload.requireInteraction !== false
        });
        
        console.log('📤 Sending notification payload:', notificationPayload);
        
        const pushResult = await webpush.sendNotification(pushSubscription, notificationPayload);
        console.log('✅ Push notification sent successfully:', pushResult);
        return { success: true, result: pushResult };
          
      } catch (error: any) {
        console.error('❌ Error sending push notification:', error);
        
        // If the subscription is invalid, remove it
        if (error.statusCode === 410) {
          console.log('🗑️ Removing invalid subscription for user:', userId);
          await Subscriptions.removeAsync({ _id: subscription._id });
        }
        
        throw new Meteor.Error('push-failed', 'Failed to send push notification: ' + error.message);
      }
    },
    
    async 'notifications.broadcast'(payload: any) {
      console.log('Broadcasting notification to all users');
      
      const subscriptions = await Subscriptions.find({}).fetchAsync();
      
      subscriptions.forEach((sub) => {
        try {
          const pushSubscription = JSON.parse(sub.subscription);
          console.log('Broadcast push subscription object:', pushSubscription);
          
          // Validate subscription has required properties
          if (!pushSubscription.endpoint) {
            console.error('Subscription missing endpoint:', pushSubscription);
            return;
          }
          
          const notificationPayload = JSON.stringify({
            message: payload.title || 'Broadcast Notification',
            body: payload.body || 'You have a new broadcast notification',
            icon: payload.icon || '/icons/icon-192x192.svg',
            badge: payload.badge || '/icons/icon-192x192.svg',
            url: payload.url || '/'
          });
          
          webpush.sendNotification(pushSubscription, notificationPayload)
            .catch(async (error: any) => {
              console.error('Error sending broadcast notification:', error);
              
              // If the subscription is invalid, remove it
              if (error.statusCode === 410) {
                await Subscriptions.removeAsync({ _id: sub._id });
              }
            });
            
        } catch (error) {
          console.error('Error processing subscription for broadcast:', error);
        }
      });
    }
  });
}
