import { create } from 'zustand';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

export interface UserActivity {
  userId: string;
  action: string;
  timestamp: Date;
  metadata?: any;
  sessionId: string;
}

export interface OnlineUser {
  _id: string;
  username?: string;
  lastSeen: Date;
  status: 'online' | 'away' | 'offline';
  currentPage?: string;
}

interface TrackingState {
  onlineUsers: OnlineUser[];
  recentActivity: UserActivity[];
  currentUserStatus: 'online' | 'away' | 'offline';
  sessionId: string;
  isTracking: boolean;
  
  // Actions
  setOnlineUsers: (users: OnlineUser[]) => void;
  addActivity: (activity: UserActivity) => void;
  setUserStatus: (status: 'online' | 'away' | 'offline') => void;
  startTracking: () => void;
  stopTracking: () => void;
  trackPageView: (page: string) => void;
  trackUserAction: (action: string, metadata?: any) => void;
}

// Generate unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useTrackingStore = create<TrackingState>((set, get) => ({
  onlineUsers: [],
  recentActivity: [],
  currentUserStatus: 'offline',
  sessionId: generateSessionId(),
  isTracking: false,

  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  
  addActivity: (activity) => set((state) => ({
    recentActivity: [activity, ...state.recentActivity.slice(0, 49)] // Keep last 50 activities
  })),

  setUserStatus: (status) => {
    set({ currentUserStatus: status });
    
    // Update server
    if (Meteor.userId()) {
      Meteor.callAsync('tracking.updateStatus', status, get().sessionId).catch((error) => {
        console.error('Error updating status:', error);
      });
    }
  },

  startTracking: () => {
    const state = get();
    if (state.isTracking) return;

    set({ isTracking: true, currentUserStatus: 'online' });

    // Start heartbeat to maintain online status
    const heartbeatInterval = setInterval(() => {
      if (Meteor.userId() && get().isTracking) {
        Meteor.callAsync('tracking.heartbeat', get().sessionId).catch((error) => {
          console.error('Error sending heartbeat:', error);
        });
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // Every 30 seconds

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        get().setUserStatus('away');
      } else {
        get().setUserStatus('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track mouse movement for activity detection
    let lastActivity = Date.now();
    const handleActivity = () => {
      lastActivity = Date.now();
      if (get().currentUserStatus === 'away') {
        get().setUserStatus('online');
      }
    };

    // Check for inactivity
    const inactivityInterval = setInterval(() => {
      if (Date.now() - lastActivity > 300000) { // 5 minutes
        if (get().currentUserStatus === 'online') {
          get().setUserStatus('away');
        }
      }
    }, 60000); // Check every minute

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function (store in window for access)
    (window as any).stopTracking = () => {
      clearInterval(heartbeatInterval);
      clearInterval(inactivityInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  },

  stopTracking: () => {
    set({ isTracking: false, currentUserStatus: 'offline' });
    
    if (Meteor.userId()) {
      Meteor.callAsync('tracking.disconnect', get().sessionId).catch((error) => {
        console.error('Error disconnecting:', error);
      });
    }

    // Call cleanup function
    if ((window as any).stopTracking) {
      (window as any).stopTracking();
    }
  },

  trackPageView: (page) => {
    const activity: UserActivity = {
      userId: Meteor.userId() || 'anonymous',
      action: 'page_view',
      timestamp: new Date(),
      metadata: { page },
      sessionId: get().sessionId
    };

    get().addActivity(activity);
    
    if (Meteor.userId()) {
      Meteor.callAsync('tracking.logActivity', activity).catch((error) => {
        console.error('Error logging page view:', error);
      });
    }
  },

  trackUserAction: (action, metadata) => {
    const activity: UserActivity = {
      userId: Meteor.userId() || 'anonymous',
      action,
      timestamp: new Date(),
      metadata,
      sessionId: get().sessionId
    };

    get().addActivity(activity);
    
    if (Meteor.userId()) {
      Meteor.callAsync('tracking.logActivity', activity).catch((error) => {
        console.error('Error logging user action:', error);
      });
    }
  }
}));

// Auto-start tracking when user logs in
Meteor.startup(() => {
  Tracker.autorun(() => {
    const user = Meteor.user();
    const trackingStore = useTrackingStore.getState();
    
    if (user && !trackingStore.isTracking) {
      trackingStore.startTracking();
    } else if (!user && trackingStore.isTracking) {
      trackingStore.stopTracking();
    }
  });
});
