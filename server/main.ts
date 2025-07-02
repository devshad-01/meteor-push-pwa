import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import '/imports/api/notifications';
import '/imports/api/users';

Meteor.startup(async () => {
  console.log('🚀 Meteor PWA Server started');
  console.log('🔔 Push notification system initialized');
  console.log('👥 User management system initialized');

  // Ensure VAPID keys are loaded from settings
  const vapid = Meteor.settings.vapid || {};
  if (!vapid.publicKey || !vapid.privateKey) {
    console.warn('⚠️  VAPID keys not found in Meteor.settings');
    console.warn('   Please set vapid.publicKey and vapid.privateKey in settings.json');
  } else {
    console.log('✅ VAPID keys loaded from Meteor.settings');
  }

  // Create some demo users if no users exist
  const userCount = await Meteor.users.find({}).countAsync();
  console.log(`Current user count: ${userCount}`);
  
  if (userCount === 0) {
    console.log('📝 Creating demo users...');
    
    const demoUsers = [
      {
        email: 'john@example.com',
        name: 'John Doe',
        password: 'password123'
      },
      {
        email: 'jane@example.com',
        name: 'Jane Smith',
        password: 'password123'
      },
      {
        email: 'bob@example.com',
        name: 'Bob Johnson',
        password: 'password123'
      }
    ];

    for (const user of demoUsers) {
      const userId = Accounts.createUser({
        email: user.email,
        password: user.password,
        profile: {
          name: user.name
        }
      });
      
      console.log(`Created user: ${user.name} (${user.email})`);
    }

    console.log('✅ Demo users created');
    console.log('   Login with: john@example.com / password123');
    console.log('   Login with: jane@example.com / password123');
    console.log('   Login with: bob@example.com / password123');
  }
});