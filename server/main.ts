import { Meteor } from 'meteor/meteor';
import '/imports/api/notifications';

Meteor.startup(() => {
  console.log('🚀 Meteor PWA Server started');
  console.log('🔔 Push notification system initialized');

  // Ensure VAPID keys are loaded from settings
  const vapid = Meteor.settings.vapid || {};
  if (!vapid.publicKey || !vapid.privateKey) {
    console.warn('⚠️  VAPID keys not found in Meteor.settings');
    console.warn('   Please set vapid.publicKey and vapid.privateKey in settings.json');
  } else {
    console.log('✅ VAPID keys loaded from Meteor.settings');
  }
});