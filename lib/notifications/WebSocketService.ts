import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: 'notification' | 'sync' | 'presence' | 'system';
  data: any;
  timestamp: number;
  userId?: string;
}

export interface PresenceData {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  currentPage?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private userId: string | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    if (typeof window === 'undefined') return;

    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join user room if authenticated
      if (this.userId) {
        this.joinUserRoom(this.userId);
      }

      this.emit('connected', { timestamp: Date.now() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', { reason, timestamp: Date.now() });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('connectionFailed', { error, attempts: this.reconnectAttempts });
      }
    });

    this.socket.on('notification', (data) => {
      console.log('Received notification via WebSocket:', data);
      this.emit('notification', data);
    });

    this.socket.on('sync', (data) => {
      console.log('Received sync event via WebSocket:', data);
      this.emit('sync', data);
    });

    this.socket.on('presence', (data) => {
      console.log('Received presence update via WebSocket:', data);
      this.emit('presence', data);
    });

    this.socket.on('system', (data) => {
      console.log('Received system message via WebSocket:', data);
      this.emit('system', data);
    });

    this.socket.on('user_joined', (data) => {
      console.log('User joined:', data);
      this.emit('userJoined', data);
    });

    this.socket.on('user_left', (data) => {
      console.log('User left:', data);
      this.emit('userLeft', data);
    });

    this.socket.on('typing', (data) => {
      this.emit('typing', data);
    });

    this.socket.on('stop_typing', (data) => {
      this.emit('stopTyping', data);
    });
  }

  connect(userId?: string): void {
    if (userId) {
      this.userId = userId;
    }

    if (!this.socket) {
      this.initializeConnection();
    } else if (!this.isConnected) {
      this.socket.connect();
    }

    if (this.userId && this.isConnected) {
      this.joinUserRoom(this.userId);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.userId = null;
  }

  private joinUserRoom(userId: string): void {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('join_user_room', { userId });
    console.log(`Joined user room: ${userId}`);
  }

  sendMessage(type: string, data: any): void {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    const message: WebSocketMessage = {
      type: type as any,
      data,
      timestamp: Date.now(),
      userId: this.userId || undefined,
    };

    this.socket.emit(type, message);
  }

  // Notification-specific methods
  sendNotification(notification: any): void {
    this.sendMessage('notification', notification);
  }

  // Sync-specific methods
  requestSync(syncData: any): void {
    this.sendMessage('sync', syncData);
  }

  // Presence methods
  updatePresence(status: 'online' | 'offline' | 'away', currentPage?: string): void {
    const presenceData: PresenceData = {
      userId: this.userId || '',
      status,
      lastSeen: new Date(),
      currentPage,
    };

    this.sendMessage('presence', presenceData);
  }

  // Typing indicators
  startTyping(roomId: string): void {
    this.sendMessage('typing', { roomId, userId: this.userId });
  }

  stopTyping(roomId: string): void {
    this.sendMessage('stop_typing', { roomId, userId: this.userId });
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.eventListeners.has(event)) return;

    if (callback) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Room management
  joinRoom(roomId: string): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('join_room', { roomId, userId: this.userId });
  }

  leaveRoom(roomId: string): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('leave_room', { roomId, userId: this.userId });
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getConnectionState(): {
    connected: boolean;
    reconnectAttempts: number;
    userId: string | null;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      userId: this.userId,
    };
  }

  // Health check
  ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const startTime = Date.now();
      
      this.socket.emit('ping', startTime);
      
      const timeout = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);

      this.socket.once('pong', (timestamp: number) => {
        clearTimeout(timeout);
        const latency = Date.now() - timestamp;
        resolve(latency);
      });
    });
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default WebSocketService;