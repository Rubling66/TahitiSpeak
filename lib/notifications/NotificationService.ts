import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export interface NotificationData {
  id: string;
  type: 'payment' | 'subscription' | 'feature' | 'cultural' | 'learning' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  userId: string;
  scheduledFor?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  paymentReminders: boolean;
  featureUpdates: boolean;
  culturalEvents: boolean;
  learningReminders: boolean;
}

class NotificationService {
  private messaging: any = null;
  private fcmToken: string | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.initializeMessaging();
  }

  private async initializeMessaging() {
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        this.messaging = getMessaging(app);
        this.isSupported = true;
      }
    } catch (error) {
      console.error('Failed to initialize Firebase messaging:', error);
      this.isSupported = false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported || !this.messaging) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        await this.getToken();
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.isSupported || !this.messaging) {
      return null;
    }

    try {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error('VAPID key not configured');
        return null;
      }

      const token = await getToken(this.messaging, { vapidKey });
      if (token) {
        this.fcmToken = token;
        console.log('FCM token obtained:', token);
        
        // Save token to user preferences
        await this.saveFCMToken(token);
        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  private async saveFCMToken(token: string): Promise<void> {
    try {
      const response = await fetch('/api/notifications/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to save FCM token');
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  setupMessageListener(callback: (payload: MessagePayload) => void): void {
    if (!this.isSupported || !this.messaging) {
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('Message received:', payload);
      callback(payload);
      
      // Show notification if app is in foreground
      this.showForegroundNotification(payload);
    });
  }

  private showForegroundNotification(payload: MessagePayload): void {
    if (!payload.notification) return;

    const { title, body, icon } = payload.notification;
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(title || 'TahitiSpeak', {
        body: body || '',
        icon: icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: payload.data?.id || 'default',
        data: payload.data,
        requireInteraction: payload.data?.priority === 'urgent',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Handle notification click
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
      };

      // Auto-close after 5 seconds for non-urgent notifications
      if (payload.data?.priority !== 'urgent') {
        setTimeout(() => notification.close(), 5000);
      }
    }
  }

  async sendNotification(notification: NotificationData): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async getNotifications(limit: number = 20, offset: number = 0): Promise<NotificationData[]> {
    try {
      const response = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  async getPreferences(): Promise<NotificationPreferences | null> {
    try {
      const response = await fetch('/api/notifications/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  // Schedule a notification for later delivery
  async scheduleNotification(notification: NotificationData, scheduledFor: Date): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...notification,
          scheduledFor: scheduledFor.toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }

  // Bulk operations
  async markAllAsRead(): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await fetch('/api/notifications/unread-count');
      
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  getFCMToken(): string | null {
    return this.fcmToken;
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default NotificationService;