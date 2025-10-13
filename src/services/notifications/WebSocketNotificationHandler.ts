import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export interface WebSocketNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
  read: boolean;
}

export interface UserConnection {
  userId: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
}

export class WebSocketNotificationHandler {
  private io: SocketIOServer;
  private supabase: SupabaseClient;
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId
  private jwtSecret: string;

  constructor(
    httpServer: HttpServer,
    supabase: SupabaseClient,
    jwtSecret: string,
    corsOrigin: string = "http://localhost:5173"
  ) {
    this.supabase = supabase;
    this.jwtSecret = jwtSecret;

    // Initialize Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
    this.setupHeartbeat();
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle user authentication and registration
      socket.on('register', async (data: { token: string }) => {
        try {
          const userId = await this.authenticateUser(data.token);
          if (userId) {
            await this.registerUserConnection(userId, socket.id);
            socket.emit('registered', { success: true, userId });
            
            // Send any pending notifications
            await this.sendPendingNotifications(userId, socket.id);
          } else {
            socket.emit('registered', { success: false, error: 'Invalid token' });
          }
        } catch (error) {
          console.error('Error registering user:', error);
          socket.emit('registered', { success: false, error: 'Registration failed' });
        }
      });

      // Handle notification acknowledgment
      socket.on('notification_read', async (data: { notificationId: string }) => {
        try {
          const userId = this.socketToUser.get(socket.id);
          if (userId) {
            await this.markNotificationAsRead(data.notificationId, userId);
            socket.emit('notification_read_ack', { notificationId: data.notificationId });
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      });

      // Handle bulk notification read
      socket.on('mark_all_read', async () => {
        try {
          const userId = this.socketToUser.get(socket.id);
          if (userId) {
            await this.markAllNotificationsAsRead(userId);
            socket.emit('all_notifications_read');
          }
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
        }
      });

      // Handle notification preferences update
      socket.on('update_preferences', async (preferences: Record<string, any>) => {
        try {
          const userId = this.socketToUser.get(socket.id);
          if (userId) {
            await this.updateNotificationPreferences(userId, preferences);
            socket.emit('preferences_updated', { success: true });
          }
        } catch (error) {
          console.error('Error updating preferences:', error);
          socket.emit('preferences_updated', { success: false, error: error.message });
        }
      });

      // Handle typing indicators for chat notifications
      socket.on('typing_start', (data: { conversationId: string }) => {
        const userId = this.socketToUser.get(socket.id);
        if (userId) {
          socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
            userId,
            conversationId: data.conversationId
          });
        }
      });

      socket.on('typing_stop', (data: { conversationId: string }) => {
        const userId = this.socketToUser.get(socket.id);
        if (userId) {
          socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
            userId,
            conversationId: data.conversationId
          });
        }
      });

      // Handle joining/leaving rooms for group notifications
      socket.on('join_room', (data: { roomId: string }) => {
        socket.join(data.roomId);
        console.log(`Socket ${socket.id} joined room ${data.roomId}`);
      });

      socket.on('leave_room', (data: { roomId: string }) => {
        socket.leave(data.roomId);
        console.log(`Socket ${socket.id} left room ${data.roomId}`);
      });

      // Handle presence updates
      socket.on('update_presence', (data: { status: 'online' | 'away' | 'busy' | 'offline' }) => {
        const userId = this.socketToUser.get(socket.id);
        if (userId) {
          this.updateUserPresence(userId, data.status);
          this.broadcastPresenceUpdate(userId, data.status);
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
        this.handleDisconnection(socket.id);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Authenticate socket connection
   */
  private async authenticateSocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const userId = await this.authenticateUser(token as string);
      if (!userId) {
        return next(new Error('Invalid authentication token'));
      }

      // Store user ID in socket data
      socket.data.userId = userId;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Authenticate user token
   */
  private async authenticateUser(token: string): Promise<string | null> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Verify user exists in database
      const { data: user, error } = await this.supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', decoded.sub || decoded.userId)
        .single();

      if (error || !user) {
        return null;
      }

      return user.user_id;
    } catch (error) {
      console.error('Token authentication error:', error);
      return null;
    }
  }

  /**
   * Register user connection
   */
  private async registerUserConnection(userId: string, socketId: string): Promise<void> {
    // Add to user connections map
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(socketId);
    
    // Map socket to user
    this.socketToUser.set(socketId, userId);

    // Update user's online status
    await this.updateUserPresence(userId, 'online');

    console.log(`User ${userId} connected with socket ${socketId}`);
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socketId: string): void {
    const userId = this.socketToUser.get(socketId);
    
    if (userId) {
      // Remove from connections
      const userSockets = this.userConnections.get(userId);
      if (userSockets) {
        userSockets.delete(socketId);
        
        // If no more connections for this user, update presence
        if (userSockets.size === 0) {
          this.userConnections.delete(userId);
          this.updateUserPresence(userId, 'offline');
        }
      }
      
      this.socketToUser.delete(socketId);
      console.log(`User ${userId} disconnected socket ${socketId}`);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendToUser(userId: string, notification: WebSocketNotification): Promise<boolean> {
    try {
      const userSockets = this.userConnections.get(userId);
      
      if (!userSockets || userSockets.size === 0) {
        console.log(`User ${userId} not connected, storing notification for later`);
        await this.storeNotificationForLater(userId, notification);
        return false;
      }

      // Send to all user's connected sockets
      let sent = false;
      for (const socketId of userSockets) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('notification', notification);
          sent = true;
        }
      }

      // Store notification in database
      await this.storeNotification(userId, notification);

      return sent;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(userIds: string[], notification: WebSocketNotification): Promise<string[]> {
    const sentToUsers: string[] = [];

    for (const userId of userIds) {
      const sent = await this.sendToUser(userId, notification);
      if (sent) {
        sentToUsers.push(userId);
      }
    }

    return sentToUsers;
  }

  /**
   * Broadcast notification to all connected users
   */
  async broadcastToAll(notification: WebSocketNotification): Promise<number> {
    try {
      this.io.emit('notification', notification);
      
      // Store for all connected users
      const connectedUsers = Array.from(this.userConnections.keys());
      for (const userId of connectedUsers) {
        await this.storeNotification(userId, notification);
      }

      return connectedUsers.length;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      return 0;
    }
  }

  /**
   * Send notification to room/group
   */
  async sendToRoom(roomId: string, notification: WebSocketNotification): Promise<void> {
    try {
      this.io.to(roomId).emit('notification', notification);
      
      // Get users in room and store notification
      const socketsInRoom = await this.io.in(roomId).fetchSockets();
      for (const socket of socketsInRoom) {
        const userId = this.socketToUser.get(socket.id);
        if (userId) {
          await this.storeNotification(userId, notification);
        }
      }
    } catch (error) {
      console.error('Error sending notification to room:', error);
    }
  }

  /**
   * Store notification in database
   */
  private async storeNotification(userId: string, notification: WebSocketNotification): Promise<void> {
    try {
      await this.supabase
        .from('notification_history')
        .insert({
          id: notification.id,
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: notification.read,
          created_at: notification.timestamp.toISOString()
        });
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  /**
   * Store notification for offline user
   */
  private async storeNotificationForLater(userId: string, notification: WebSocketNotification): Promise<void> {
    await this.storeNotification(userId, notification);
  }

  /**
   * Send pending notifications to newly connected user
   */
  private async sendPendingNotifications(userId: string, socketId: string): Promise<void> {
    try {
      const { data: notifications, error } = await this.supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching pending notifications:', error);
        return;
      }

      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && notifications) {
        for (const notification of notifications) {
          socket.emit('notification', {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            timestamp: new Date(notification.created_at),
            read: notification.read
          });
        }
      }
    } catch (error) {
      console.error('Error sending pending notifications:', error);
    }
  }

  /**
   * Mark notification as read
   */
  private async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await this.supabase
        .from('notification_history')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for user
   */
  private async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await this.supabase
        .from('notification_history')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Update notification preferences
   */
  private async updateNotificationPreferences(userId: string, preferences: Record<string, any>): Promise<void> {
    try {
      await this.supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update user presence status
   */
  private async updateUserPresence(userId: string, status: string): Promise<void> {
    try {
      await this.supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          status,
          last_seen: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  /**
   * Broadcast presence update to relevant users
   */
  private broadcastPresenceUpdate(userId: string, status: string): void {
    // Broadcast to friends/contacts
    this.io.emit('presence_update', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  /**
   * Setup heartbeat to clean up stale connections
   */
  private setupHeartbeat(): void {
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 30000); // Every 30 seconds
  }

  /**
   * Clean up stale connections
   */
  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [userId, socketIds] of this.userConnections.entries()) {
      const validSockets = new Set<string>();

      for (const socketId of socketIds) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket && (now - socket.handshake.time) < staleThreshold) {
          validSockets.add(socketId);
        } else {
          this.socketToUser.delete(socketId);
        }
      }

      if (validSockets.size === 0) {
        this.userConnections.delete(userId);
        this.updateUserPresence(userId, 'offline');
      } else {
        this.userConnections.set(userId, validSockets);
      }
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  /**
   * Get user connection status
   */
  isUserConnected(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  /**
   * Get all connected users
   */
  getConnectedUsers(): string[] {
    return Array.from(this.userConnections.keys());
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(fromUserId: string, toUserId: string, isTyping: boolean): void {
    const userSockets = this.userConnections.get(toUserId);
    if (userSockets) {
      for (const socketId of userSockets) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('typing_indicator', {
            fromUserId,
            isTyping,
            timestamp: new Date()
          });
        }
      }
    }
  }

  /**
   * Get server statistics
   */
  getServerStats(): {
    connectedUsers: number;
    totalSockets: number;
    uptime: number;
  } {
    return {
      connectedUsers: this.userConnections.size,
      totalSockets: this.io.sockets.sockets.size,
      uptime: process.uptime()
    };
  }

  /**
   * Gracefully shutdown WebSocket server
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down WebSocket server...');
    
    // Notify all connected clients
    this.io.emit('server_shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date()
    });

    // Close all connections
    this.io.close();
    
    // Clear connection maps
    this.userConnections.clear();
    this.socketToUser.clear();
    
    console.log('WebSocket server shutdown complete');
  }
}