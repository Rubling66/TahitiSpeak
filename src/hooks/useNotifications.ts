import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  timestamp: Date;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

export const useNotifications = (userId: string): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const socketInstance = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Connected to notification server');
      socketInstance.emit('register', { token });
    });

    socketInstance.on('registered', (data) => {
      if (data.success) {
        console.log('Successfully registered for notifications');
      } else {
        console.error('Failed to register for notifications:', data.error);
      }
    });

    socketInstance.on('notification', (notification: any) => {
      const newNotification: Notification = {
        ...notification,
        timestamp: new Date(notification.timestamp)
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      if (!newNotification.read) {
        setUnreadCount(prev => prev + 1);
      }

      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: newNotification.id
        });
      }
    });

    socketInstance.on('notification_read_ack', (data) => {
      setNotifications(prev => 
        prev.map(n => 
          n.id === data.notificationId 
            ? { ...n, read: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    socketInstance.on('all_notifications_read', () => {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Failed to connect to notification server');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/notifications/history/${userId}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      if (data.success) {
        const fetchedNotifications = data.notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.created_at)
        }));
        
        setNotifications(fetchedNotifications);
        
        // Calculate unread count
        const unread = fetchedNotifications.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      } else {
        throw new Error(data.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications/unread-count/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.count);
        }
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [userId]);

  // Initial data fetch
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Emit to socket for real-time update
      if (socket) {
        socket.emit('notification_read', { notificationId });
      }

      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, [userId, socket]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications/read-all/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Emit to socket for real-time update
      if (socket) {
        socket.emit('mark_all_read');
      }

      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }, [userId, socket]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
    await fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications/test/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'test' })
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to send test notification');
      }
    } catch (err) {
      console.error('Error sending test notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to send test notification');
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    sendTestNotification
  };
};

// Hook for real-time notification events
export const useNotificationEvents = (userId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const socketInstance = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('register', { token });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  const joinRoom = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('join_room', { roomId });
    }
  }, [socket]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('leave_room', { roomId });
    }
  }, [socket]);

  const updatePresence = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    if (socket) {
      socket.emit('update_presence', { status });
    }
  }, [socket]);

  const sendTypingIndicator = useCallback((conversationId: string, isTyping: boolean) => {
    if (socket) {
      if (isTyping) {
        socket.emit('typing_start', { conversationId });
      } else {
        socket.emit('typing_stop', { conversationId });
      }
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    updatePresence,
    sendTypingIndicator
  };
};

export default useNotifications;