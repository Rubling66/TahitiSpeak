import { io, Socket } from 'socket.io-client';

export interface WebSocketNotification {
  id: string;
  type: 'push' | 'email' | 'in_app';
  title?: string;
  body: string;
  data?: Record<string, any>;
  timestamp: string;
  userId: string;
}

export interface WebSocketEvents {
  // Client to Server
  'join-room': (userId: string) => void;
  'leave-room': (userId: string) => void;
  'mark-notification-read': (notificationId: string) => void;
  'notification-delivered': (notificationId: string) => void;

  // Server to Client
  'notification': (notification: WebSocketNotification) => void;
  'notification-read': (notificationId: string) => void;
  'notification-count-updated': (count: number) => void;
  'connection-status': (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  'error': (error: string) => void;
}

export type WebSocketEventHandler<T extends keyof WebSocketEvents> = WebSocketEvents[T];

class WebSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor() {
    this.setupEventHandlers();
  }

  // Connection Management
  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.userId = userId;
      
      this.socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || window.location.origin, {
        auth: {
          token,
          userId
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.joinUserRoom(userId);
        this.emit('connection-status', 'connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.emit('connection-status', 'disconnected');
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.emit('connection-status', 'disconnected');
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          return;
        }
        
        this.handleReconnection();
      });

      this.setupSocketEventListeners();
    });
  }

  disconnect(): void {
    if (this.socket) {
      if (this.userId) {
        this.leaveUserRoom(this.userId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.reconnectAttempts = 0;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Room Management
  private joinUserRoom(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-room', userId);
    }
  }

  private leaveUserRoom(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-room', userId);
    }
  }

  // Event Handling
  on<T extends keyof WebSocketEvents>(event: T, handler: WebSocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off<T extends keyof WebSocketEvents>(event: T, handler: WebSocketEventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit<T extends keyof WebSocketEvents>(event: T, ...args: Parameters<WebSocketEventHandler<T>>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as any)(...args);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }

  // Notification Actions
  markNotificationAsRead(notificationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark-notification-read', notificationId);
    }
  }

  markNotificationAsDelivered(notificationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('notification-delivered', notificationId);
    }
  }

  // Private Methods
  private setupEventHandlers(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.userId && !this.isConnected()) {
        this.handleReconnection();
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      if (this.userId && !this.isConnected()) {
        this.handleReconnection();
      }
    });

    window.addEventListener('offline', () => {
      this.emit('connection-status', 'disconnected');
    });
  }

  private setupSocketEventListeners(): void {
    if (!this.socket) return;

    // Notification events
    this.socket.on('notification', (notification: WebSocketNotification) => {
      console.log('Received notification:', notification);
      this.emit('notification', notification);
      
      // Auto-mark as delivered
      this.markNotificationAsDelivered(notification.id);
    });

    this.socket.on('notification-read', (notificationId: string) => {
      this.emit('notification-read', notificationId);
    });

    this.socket.on('notification-count-updated', (count: number) => {
      this.emit('notification-count-updated', count);
    });

    // Error handling
    this.socket.on('error', (error: string) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Reconnection events
    this.socket.on('reconnect', () => {
      console.log('WebSocket reconnected');
      this.reconnectAttempts = 0;
      if (this.userId) {
        this.joinUserRoom(this.userId);
      }
      this.emit('connection-status', 'connected');
    });

    this.socket.on('reconnect_attempt', () => {
      console.log('WebSocket reconnection attempt');
      this.emit('connection-status', 'reconnecting');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      this.handleReconnection();
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.emit('connection-status', 'disconnected');
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('connection-status', 'disconnected');
      return;
    }

    this.reconnectAttempts++;
    this.emit('connection-status', 'reconnecting');

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.userId && !this.isConnected()) {
        console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        // Get fresh token and reconnect
        this.refreshTokenAndReconnect();
      }
    }, delay);
  }

  private async refreshTokenAndReconnect(): Promise<void> {
    try {
      // This would typically refresh the auth token
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const { token } = await response.json();
        if (this.userId) {
          await this.connect(this.userId, token);
        }
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Failed to refresh token for reconnection:', error);
      this.emit('connection-status', 'disconnected');
    }
  }

  // Utility Methods
  getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    if (this.reconnectAttempts > 0) return 'reconnecting';
    return 'disconnected';
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  // Send custom events (for future extensibility)
  send(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot send event ${event}: WebSocket not connected`);
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();

// React Hook for WebSocket
export const useWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = React.useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [notifications, setNotifications] = React.useState<WebSocketNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const handleConnectionStatus = (status: 'connected' | 'disconnected' | 'reconnecting') => {
      setConnectionStatus(status);
    };

    const handleNotification = (notification: WebSocketNotification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
      setUnreadCount(prev => prev + 1);
    };

    const handleNotificationRead = (notificationId: string) => {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleCountUpdated = (count: number) => {
      setUnreadCount(count);
    };

    webSocketService.on('connection-status', handleConnectionStatus);
    webSocketService.on('notification', handleNotification);
    webSocketService.on('notification-read', handleNotificationRead);
    webSocketService.on('notification-count-updated', handleCountUpdated);

    return () => {
      webSocketService.off('connection-status', handleConnectionStatus);
      webSocketService.off('notification', handleNotification);
      webSocketService.off('notification-read', handleNotificationRead);
      webSocketService.off('notification-count-updated', handleCountUpdated);
    };
  }, []);

  const connect = React.useCallback((userId: string, token: string) => {
    return webSocketService.connect(userId, token);
  }, []);

  const disconnect = React.useCallback(() => {
    webSocketService.disconnect();
  }, []);

  const markAsRead = React.useCallback((notificationId: string) => {
    webSocketService.markNotificationAsRead(notificationId);
  }, []);

  return {
    connectionStatus,
    notifications,
    unreadCount,
    connect,
    disconnect,
    markAsRead,
    isConnected: webSocketService.isConnected()
  };
};

export default webSocketService;