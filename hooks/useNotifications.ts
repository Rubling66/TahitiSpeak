import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationData } from '@/lib/notifications/NotificationService';
import { webSocketService } from '@/lib/notifications/WebSocketService';

export interface UseNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendNotification: (notification: Partial<NotificationData>) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);
      
      await Promise.all(unreadIds.map(id => notificationService.markAsRead(id)));
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      // Note: This would need a delete endpoint in the API
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, []);

  const sendNotification = useCallback(async (notification: Partial<NotificationData>) => {
    try {
      await notificationService.sendNotification(notification);
      await fetchNotifications(); // Refresh to get the new notification
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    }
  }, [fetchNotifications]);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time notification listener
  useEffect(() => {
    const handleNewNotification = (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev]);
    };

    const handleNotificationUpdate = (notification: NotificationData) => {
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? notification : n)
      );
    };

    // Connect to WebSocket for real-time updates
    webSocketService.connect();
    webSocketService.on('notification', handleNewNotification);
    webSocketService.on('notification_update', handleNotificationUpdate);

    return () => {
      webSocketService.off('notification', handleNewNotification);
      webSocketService.off('notification_update', handleNotificationUpdate);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    sendNotification,
  };
}