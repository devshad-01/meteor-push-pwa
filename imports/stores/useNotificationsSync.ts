import { useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Notifications } from '../api/collections';
import { useNotificationStore, Notification } from './notificationStore';

/**
 * Keeps Zustand notification store in sync with Meteor's notifications collection.
 * Call this hook once at the top level (e.g. in App or Dashboard).
 */
export function useNotificationsSync() {
  // Subscribe and sync notifications
  const notifications = useTracker(() => {
    const handle = Meteor.subscribe('notifications');
    if (!handle.ready()) return [];
    return Notifications.find({}, { sort: { createdAt: -1 } }).fetch() as Notification[];
  }, []);

  useEffect(() => {
    // Update Zustand store with all notifications
    useNotificationStore.setState({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length
    });
  }, [notifications]);
}
