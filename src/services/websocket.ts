import { io, Socket } from 'socket.io-client';

export interface WebSocketNotification {
  id: string;
  type: 'notification' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(private userId?: string) {}

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || window.location.origin, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Join user-specific room for notifications
        if (this.userId) {
          this.socket?.emit('join_user_room', this.userId);
        }
        
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        
        // Attempt to reconnect if disconnection was not intentional
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          return;
        }
        
        this.attemptReconnect(token);
      });

      // Listen for notification events
      this.socket.on('notification', (data: WebSocketNotification) => {
        this.handleNotification(data);
      });

      this.socket.on('notification_update', (data: WebSocketNotification) => {
        this.handleNotificationUpdate(data);
      });

      this.socket.on('notification_delete', (data: WebSocketNotification) => {
        this.handleNotificationDelete(data);
      });

      // Listen for real-time updates
      this.socket.on('user_update', (data: any) => {
        this.emit('user_update', data);
      });

      this.socket.on('system_announcement', (data: any) => {
        this.emit('system_announcement', data);
      });
    });
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(token).catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  private handleNotification(data: WebSocketNotification) {
    console.log('New notification received:', data);
    
    // Show browser notification if permission granted
    this.showBrowserNotification(data.data);
    
    // Emit to listeners
    this.emit('new_notification', data.data);
  }

  private handleNotificationUpdate(data: WebSocketNotification) {
    console.log('Notification updated:', data);
    this.emit('notification_updated', data.data);
  }

  private handleNotificationDelete(data: WebSocketNotification) {
    console.log('Notification deleted:', data);
    this.emit('notification_deleted', data.data);
  }

  private async showBrowserNotification(notification: any) {
    // Check if browser notifications are supported and permitted
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: false,
        silent: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        // Emit click event for handling in the app
        this.emit('notification_clicked', notification);
      };
    } else if (Notification.permission === 'default') {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showBrowserNotification(notification);
      }
    }
  }

  // Event listener management
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    } else {
      this.listeners.delete(event);
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event listener:', error);
        }
      });
    }
  }

  // Send message to server
  send(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  // Get connection status
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Update user ID (for room management)
  setUserId(userId: string) {
    this.userId = userId;
    if (this.socket?.connected) {
      this.socket.emit('join_user_room', userId);
    }
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

export const getWebSocketService = (userId?: string): WebSocketService => {
  if (!webSocketService) {
    webSocketService = new WebSocketService(userId);
  } else if (userId && userId !== webSocketService['userId']) {
    webSocketService.setUserId(userId);
  }
  return webSocketService;
};

export const disconnectWebSocket = () => {
  if (webSocketService) {
    webSocketService.disconnect();
    webSocketService = null;
  }
};