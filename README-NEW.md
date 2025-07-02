# 🚀 Modern PWA with Notifications & User Management

A beautiful, mobile-first Progressive Web App built with Meteor, React, and TypeScript featuring user authentication, real-time notifications, and modern UI design inspired by Dribbble.

## ✨ Features

### 🔐 Authentication System

- **Email-based registration and login**
- **Secure password hashing**
- **Persistent user sessions**
- **Beautiful, animated login forms**

### 👥 User Management

- **User registration with email validation**
- **User profiles with custom avatars**
- **Online/offline status tracking**
- **User listing with real-time status**

### 🔔 Notification System

- **Send notifications to individual users**
- **Broadcast notifications to all users**
- **Real-time notification center**
- **Push notifications support**
- **Unread notification badges**
- **Mark as read functionality**

### 📱 Mobile-First Design

- **Responsive design optimized for mobile**
- **Modern glass-morphism UI**
- **Smooth animations and transitions**
- **Bottom navigation for mobile UX**
- **Touch-friendly interface**

### 🌐 PWA Features

- **Service Worker for offline support**
- **App installation prompt**
- **Background sync capabilities**
- **Push notification support**
- **Responsive manifest**

## 🎨 Design Features

### Modern UI Elements

- **Glass-morphism effects**
- **Gradient backgrounds**
- **Smooth animations**
- **Modern typography**
- **Mobile-optimized components**

### Dribbble-Inspired Design

- **Beautiful color schemes**
- **Modern card layouts**
- **Intuitive user interactions**
- **Professional aesthetics**
- **Clean, minimal interface**

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Meteor (latest version)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd PWA
   ```

2. **Install dependencies:**

   ```bash
   meteor npm install
   ```

3. **Start the development server:**

   ```bash
   meteor run
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🔧 Demo Accounts

The app comes with pre-configured demo accounts for testing:

- **Email:** `john@example.com` | **Password:** `password123`
- **Email:** `jane@example.com` | **Password:** `password123`
- **Email:** `bob@example.com` | **Password:** `password123`

## 🏗️ Project Structure

```
PWA/
├── client/
│   ├── main.css          # Global styles with mobile-first design
│   ├── main.html         # HTML template
│   └── main.tsx          # Client entry point
├── imports/
│   ├── api/
│   │   ├── notifications.ts  # Push notification API
│   │   └── users.ts          # User management API
│   └── ui/
│       ├── components/
│       │   ├── AuthScreen.tsx       # Login/Register component
│       │   ├── Dashboard.tsx        # Main dashboard
│       │   ├── UsersList.tsx        # User management
│       │   ├── NotificationCenter.tsx   # Notification center
│       │   └── NotificationComposer.tsx # Send notifications
│       ├── contexts/
│       │   └── AuthContext.tsx      # Authentication context
│       ├── App.tsx              # Main app component
│       ├── PWAInstaller.tsx     # PWA installation
│       └── NotificationManager.tsx  # Legacy notification manager
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/              # App icons
├── server/
│   └── main.ts             # Server entry point
└── package.json            # Dependencies
```

## 🔔 Notification Features

### Sending Notifications

1. **Individual Notifications:**

   - Select a user from the dropdown
   - Enter title and message
   - Click "Send Notification"

2. **Broadcast Notifications:**
   - Select "Broadcast to All Users"
   - Enter title and message
   - Sends to all registered users

### Receiving Notifications

- **Real-time updates** in the notification center
- **Badge counters** on navigation
- **Push notifications** (when subscribed)
- **Mark as read** functionality

## 👥 User Management

### Registration

- **Email validation**
- **Password requirements** (minimum 6 characters)
- **Automatic avatar generation**
- **Instant login after registration**

### User Features

- **Online/offline status**
- **Last seen timestamps**
- **Profile avatars**
- **User listing with status**

## 📱 Mobile Experience

### Responsive Design

- **Mobile-first approach**
- **Touch-optimized interface**
- **Bottom navigation**
- **Swipe gestures support**

### PWA Installation

- **Add to homescreen**
- **Standalone app mode**
- **Offline functionality**
- **Native app feel**

## 🎨 Customization

### Theming

The app uses CSS custom properties and can be easily themed by modifying:

- `client/main.css` - Global styles
- Component inline styles
- Gradient color schemes

### Adding Features

1. **New API methods** in `imports/api/`
2. **New components** in `imports/ui/components/`
3. **New contexts** for state management
4. **Database collections** for data storage

## 🔧 Configuration

### Settings

Create a `settings.json` file for configuration:

```json
{
  "vapid": {
    "publicKey": "your-vapid-public-key",
    "privateKey": "your-vapid-private-key"
  }
}
```

### Environment Variables

- `MONGO_URL` - MongoDB connection string
- `ROOT_URL` - App root URL for production

## 🚀 Deployment

### Production Build

```bash
meteor build ../build --architecture os.linux.x86_64
```

### Environment Setup

```bash
export MONGO_URL=mongodb://localhost:27017/myapp
export ROOT_URL=https://myapp.com
export PORT=3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Meteor** - For the excellent full-stack framework
- **React** - For the component-based UI
- **Dribbble** - For design inspiration
- **UI Avatars** - For automatic avatar generation

---

## 🔥 What's New in This Version

### ✅ Complete Authentication System

- Beautiful login/register forms with animations
- Email validation and password requirements
- Persistent user sessions with localStorage

### ✅ Modern Mobile UI

- Glass-morphism design effects
- Mobile-first responsive layout
- Bottom navigation for easy thumb access
- Touch-optimized interactions

### ✅ Real-time Notifications

- Send to individual users or broadcast to all
- Unread notification badges
- Real-time notification center
- Mark as read functionality

### ✅ User Management

- User registration and profile management
- Online/offline status tracking
- User listing with avatars and status
- Last seen timestamps

### ✅ PWA Features

- Service worker for offline support
- App installation prompts
- Push notification support
- Native app-like experience

Enjoy your modern, mobile-first PWA! 🎉
