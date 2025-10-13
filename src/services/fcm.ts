import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export interface FCMNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, string>;
}

export class FCMService {
  private messaging: any = null;
  private vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  private listeners: Set<(payload: MessagePayload) => void> = new Set();

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Initialize Firebase if not already initialized
      if (getApps().length === 0) {
        initializeApp(firebaseConfig);
      }

      // Initialize messaging only in browser environment
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        this.messaging = getMessaging();
        this.setupMessageListener();
      }
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }

  private setupMessageListener() {
    if (!this.messaging) return;

    // Handle foreground messages
    onMessage(this.messaging, (payload: MessagePayload) => {
      console.log('FCM message received in foreground:', payload);
      
      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener(payload);
        } catch (error) {
          console.error('Error in FCM listener:', error);
        }
      });

      // Show notification if the app is in focus
      this.showNotification(payload);
    });
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getDeviceToken(): Promise<string | null> {
    try {
      if (!this.messaging || !this.vapidKey) {
        console.error('FCM not properly initialized or VAPID key missing');
        return null;
      }

      // Check if permission is granted
      if (Notification.permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) {
          console.warn('Notification permission not granted');
          return null;
        }
      }

      // Register service worker if not already registered
      await this.registerServiceWorker();

      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey,
      });

      if (token) {
        console.log('FCM device token obtained:', token);
        return token;
      } else {
        console.warn('No FCM registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM device token:', error);
      return null;
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private showNotification(payload: MessagePayload) {
    if (!payload.notification) return;

    const { title, body, icon, image } = payload.notification;
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(title || 'New Notification', {
        body: body || '',
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        image: image,
        data: payload.data,
        requireInteraction: false,
        silent: false,
        tag: payload.data?.notificationId || 'fcm-notification',
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Handle notification click based on data
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
      };
    }
  }

  // Add message listener
  onMessage(callback: (payload: MessagePayload) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Remove message listener
  offMessage(callback: (payload: MessagePayload) => void) {
    this.listeners.delete(callback);
  }

  // Check if FCM is supported
  get isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'Notification' in window &&
      this.messaging !== null
    );
  }

  // Get current permission status
  get permissionStatus(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  }
}

// Singleton instance
let fcmService: FCMService | null = null;

export const getFCMService = (): FCMService => {
  if (!fcmService) {
    fcmService = new FCMService();
  }
  return fcmService;
};

// Utility functions
export const requestNotificationPermission = async (): Promise<boolean> => {
  const fcm = getFCMService();
  return fcm.requestPermission();
};

export const getDeviceToken = async (): Promise<string | null> => {
  const fcm = getFCMService();
  return fcm.getDeviceToken();
};

export const onFCMMessage = (callback: (payload: MessagePayload) => void): (() => void) => {
  const fcm = getFCMService();
  return fcm.onMessage(callback);
};