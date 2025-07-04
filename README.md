# 🚀 Meteor PWA with Real-time Notifications & Authentication

A comprehensive Progressive Web App built with Meteor 3.3, featuring real-time notifications, authentication, state management, and user tracking.

## ✨ Features

- 🔐 **Secure Authentication** - Email/password authentication with rate limiting
- 🔔 **Real-time Notifications** - Personalized and broadcast push notifications
- ⚡ **Live Tracking** - Real-time user activity and presence tracking
- 📱 **PWA Support** - Service workers, offline capability, installable
- 🎯 **State Management** - Zustand for client-side state management
- 🛡️ **Security** - CSRF protection, input validation, secure headers
- 📊 **Real-time Data** - Live updates using Meteor's reactive data layer

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd PWA
npm install
```

### 2. Generate VAPID Keys

For push notifications, you need VAPID keys. Generate them using:

```bash
npx web-push generate-vapid-keys
```

### 3. Configure Settings

Copy the example settings file:

```bash
cp settings-example.json settings.json
```

Update `settings.json` with your VAPID keys:

```json
{
  "vapid": {
    "email": "mailto:your-email@example.com",
    "publicKey": "your-vapid-public-key",
    "privateKey": "your-vapid-private-key"
  },
  "public": {
    "vapidPublicKey": "your-vapid-public-key",
    "appName": "PWA Notification App"
  }
}
```

### 4. Run the Application

```bash
meteor run --settings settings.json
```

The app will be available at `http://localhost:3000`

## 📱 Usage

### Authentication

1. Visit the app and click "Sign Up" to create an account
2. Or "Login" if you already have an account
3. Rate limiting protects against brute force attacks

### Notifications

1. After logging in, enable push notifications in the dashboard
2. Test different notification types:
   - **Personal notifications** - sent to specific users
   - **Broadcast notifications** - sent to all users
   - **Urgent pings** - high-priority notifications with actions

### Real-time Features

- **Online users** - See who's currently active
- **Live activity** - Track user actions in real-time
- **Presence detection** - Online/away/offline status
- **Instant updates** - All data updates in real-time

## 🏗️ Architecture

### State Management

- **Zustand stores** for client-side state
- **AuthStore** - Authentication state and user management
- **NotificationStore** - Notifications and toast messages
- **TrackingStore** - User activity and presence tracking

### Real-time Data

- **Meteor Publications** - Server-side data publishing
- **Reactive subscriptions** - Client-side data synchronization
- **Live queries** - Automatic UI updates on data changes

### Security Features

- **Rate limiting** on login attempts and API calls
- **Input validation** and sanitization
- **CSRF protection** and secure headers
- **Session management** with configurable expiration

### PWA Features

- **Service Workers** for offline functionality
- **Web App Manifest** for installation
- **Push API** for background notifications
- **Background Sync** for offline actions

## 📁 Project Structure

```
├── client/           # Client entry point
├── imports/
│   ├── api/         # Server-side API and methods
│   ├── stores/      # Zustand state stores
│   └── ui/          # React components
├── public/          # Static assets and PWA files
├── server/          # Server entry point
└── settings.json    # Configuration (create from example)
```

## 🔧 Configuration

### Environment Variables

For production, use environment variables instead of settings.json:

```bash
export VAPID_PUBLIC_KEY="your-public-key"
export VAPID_PRIVATE_KEY="your-private-key"
export VAPID_EMAIL="mailto:your-email@example.com"
```

### Database

Meteor uses MongoDB by default. The app creates the following collections:

- `users` - User accounts and authentication
- `notifications` - Notification history
- `subscriptions` - Push notification subscriptions
- `userActivity` - User activity tracking
- `onlineUsers` - Real-time presence data

## 🛡️ Security Considerations

- Never commit `settings.json` with real keys to version control
- Use environment variables for production deployments
- Regularly rotate VAPID keys
- Configure proper CORS and security headers
- Use HTTPS in production for push notifications

## 🚀 Deployment

### Meteor Galaxy

```bash
meteor deploy your-app.meteorapp.com --settings settings.json
```

### Docker

```bash
meteor build --directory ../build
cd ../build
docker build -t pwa-app .
docker run -p 3000:3000 pwa-app
```

## 📚 API Reference

### Notification Methods

- `notifications.send(userId, notification)` - Send personal notification
- `notifications.broadcast(notification)` - Send to all users
- `notifications.markAsRead(notificationId)` - Mark as read
- `notifications.remove(notificationId)` - Delete notification

### Tracking Methods

- `tracking.updateStatus(status, sessionId)` - Update user status
- `tracking.logActivity(activity)` - Log user action
- `tracking.heartbeat(sessionId)` - Maintain online presence

### Subscription Methods

- `subscriptions.add(subscription, userId)` - Register push subscription
- `subscriptions.remove(userId)` - Remove subscription

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify VAPID keys are configured correctly
3. Ensure HTTPS is used in production
4. Check that service workers are registered

For push notification issues:

- Verify browser support for Push API
- Check notification permissions
- Ensure service worker is active
- Validate VAPID key format
