import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  marketing: boolean;
  system: boolean;
  learning: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    inApp: true,
    marketing: false,
    system: true,
    learning: true
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with mock notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'info',
            title: 'Welcome to the Dashboard',
            message: 'Explore all the new features available in your admin dashboard.',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            read: false,
            actionUrl: '/dashboard/overview',
            actionLabel: 'View Dashboard'
          },
          {
            id: '2',
            type: 'warning',
            title: 'System Maintenance',
            message: 'Scheduled maintenance will occur tonight from 2-4 AM UTC.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            read: false
          },
          {
            id: '3',
            type: 'success',
            title: 'Backup Completed',
            message: 'Daily database backup completed successfully.',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            read: true
          },
          {
            id: '4',
            type: 'error',
            title: 'Integration Issue',
            message: 'Email service integration requires attention.',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            read: false,
            actionUrl: '/dashboard/integration-status',
            actionLabel: 'Check Status'
          }
        ];
        
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        toast.error('Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPreferences(prev => ({ ...prev, ...newPreferences }));
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update notification preferences');
      throw error;
    }
  };

  const sendTestNotification = async (): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const testNotification: Notification = {
        id: `test-${Date.now()}`,
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working correctly.',
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => [testNotification, ...prev]);
      toast.success('Test notification sent');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  const refreshNotifications = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call to refresh notifications
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would fetch fresh notifications from the server
      toast.success('Notifications refreshed');
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      toast.error('Failed to refresh notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    sendTestNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};