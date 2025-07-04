import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import '/imports/api/notifications';

Meteor.startup(async () => {
  console.log('🚀 Meteor PWA Server started');
  
  // Configure Accounts
  Accounts.config({
    sendVerificationEmail: true,
    forbidClientAccountCreation: false,
    loginExpirationInDays: 30,
  });

  // Configure email verification
  Accounts.emailTemplates.siteName = 'PWA Notification App';
  Accounts.emailTemplates.from = 'PWA App <noreply@pwaapp.com>';

  // Add validation for new users
  Accounts.validateNewUser((user: any) => {
    // Ensure user has an email
    if (!user.emails || user.emails.length === 0) {
      throw new Meteor.Error(403, 'User must have an email');
    }

    // Validate email format
    const email = user.emails[0].address;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Meteor.Error(403, 'Invalid email format');
    }

    return true;
  });

  // Rate limit login attempts
  DDPRateLimiter.addRule({
    name: 'login',
    type: 'method',
    connectionId() { return true; }
  }, 5, 60000); // 5 attempts per minute

  // Rate limit account creation
  DDPRateLimiter.addRule({
    name: 'createUser',
    type: 'method',
    connectionId() { return true; }
  }, 3, 60000); // 3 attempts per minute

  // Rate limit notification sending
  DDPRateLimiter.addRule({
    name: 'notifications.send',
    type: 'method',
    connectionId() { return true; }
  }, 10, 60000); // 10 notifications per minute

  // Rate limit broadcasts (more restrictive)
  DDPRateLimiter.addRule({
    name: 'notifications.broadcast',
    type: 'method',
    connectionId() { return true; }
  }, 2, 60000); // 2 broadcasts per minute

  // Publish user data (only the current user's data)
  Meteor.publish("userData", function () {
    if (this.userId) {
      return Meteor.users.find({_id: this.userId}, {
        fields: {
          username: 1,
          emails: 1,
          createdAt: 1,
          profile: 1
        }
      });
    } else {
      this.ready();
    }
  });

  // Ensure VAPID keys are loaded from settings
  const vapid = Meteor.settings.vapid || {};
  if (!vapid.publicKey || !vapid.privateKey) {
    console.warn('⚠️  VAPID keys not found in Meteor.settings');
    console.warn('   Please set vapid.publicKey and vapid.privateKey in settings.json');
  } else {
    console.log('✅ VAPID keys loaded from Meteor.settings');
  }

  console.log('🔔 Push notification system initialized');
  console.log('🔐 Authentication system configured');
  console.log('⚡ Real-time tracking enabled');
  console.log('🛡️ Security measures active');
});