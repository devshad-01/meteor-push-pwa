import { create } from 'zustand';
import { Meteor } from 'meteor/meteor';

export interface Notification {
  _id: string;
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

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
  timestamp: number;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  toasts: ToastNotification[];
  isPermissionGranted: boolean;
  isSubscribed: boolean;
  
  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  
  // Toast actions
  showToast: (message: string, type?: ToastNotification['type'], duration?: number) => string;
  removeToast: (toastId: string) => void;
  clearAllToasts: () => void;
  
  // Permission and subscription
  setPermission: (granted: boolean) => void;
  setSubscribed: (subscribed: boolean) => void;
}

let toastIdCounter = 0;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  toasts: [],
  isPermissionGranted: false,
  isSubscribed: false,

  addNotification: (notification) => set((state) => {
    const notifications = [notification, ...state.notifications];
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Show toast for new notification
    get().showToast(
      `${notification.title}: ${notification.body}`,
      notification.priority === 'urgent' ? 'error' : 'info',
      notification.priority === 'urgent' ? 8000 : 4000
    );
    
    return { notifications, unreadCount };
  }),

  markAsRead: (notificationId) => set((state) => {
    const notifications = state.notifications.map(n => 
      n._id === notificationId ? { ...n, read: true, readAt: new Date() } : n
    );
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Update on server
    Meteor.callAsync('notifications.markAsRead', notificationId).catch((error) => {
      console.error('Error marking notification as read:', error);
    });
    
    return { notifications, unreadCount };
  }),

  markAllAsRead: () => set((state) => {
    const notifications = state.notifications.map(n => 
      n.read ? n : { ...n, read: true, readAt: new Date() }
    );
    
    // Update on server
    Meteor.callAsync('notifications.markAllAsRead').catch((error) => {
      console.error('Error marking all notifications as read:', error);
    });
    
    return { notifications, unreadCount: 0 };
  }),

  removeNotification: (notificationId) => set((state) => {
    const notifications = state.notifications.filter(n => n._id !== notificationId);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Remove from server
    Meteor.callAsync('notifications.remove', notificationId).catch((error) => {
      console.error('Error removing notification:', error);
    });
    
    return { notifications, unreadCount };
  }),

  clearAll: () => set(() => {
    // Clear on server
    Meteor.callAsync('notifications.clearAll').catch((error) => {
      console.error('Error clearing all notifications:', error);
    });
    
    return { notifications: [], unreadCount: 0 };
  }),

  // Toast methods
  showToast: (message, type = 'info', duration = 4000) => {
    const toastId = `toast-${++toastIdCounter}`;
    const toast: ToastNotification = {
      id: toastId,
      message,
      type,
      duration,
      timestamp: Date.now()
    };

    set((state) => ({
      toasts: [...state.toasts, toast]
    }));

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(toastId);
      }, duration);
    }

    return toastId;
  },

  removeToast: (toastId) => set((state) => ({
    toasts: state.toasts.filter(toast => toast.id !== toastId)
  })),

  clearAllToasts: () => set({ toasts: [] }),

  setPermission: (isPermissionGranted) => set({ isPermissionGranted }),
  setSubscribed: (isSubscribed) => set({ isSubscribed })
}));

// Helper functions for common toast types
export const showSuccessToast = (message: string, duration = 4000) => 
  useNotificationStore.getState().showToast(message, 'success', duration);

export const showErrorToast = (message: string, duration = 6000) => 
  useNotificationStore.getState().showToast(message, 'error', duration);

export const showWarningToast = (message: string, duration = 5000) => 
  useNotificationStore.getState().showToast(message, 'warning', duration);

export const showInfoToast = (message: string, duration = 4000) => 
  useNotificationStore.getState().showToast(message, 'info', duration);
