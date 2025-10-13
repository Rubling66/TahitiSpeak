import { EventEmitter } from 'events';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    selection?: {
      from: number;
      to: number;
    };
  };
}

export interface CollaborationEvent {
  type: 'content-change' | 'cursor-move' | 'user-join' | 'user-leave' | 'comment-add' | 'comment-update' | 'comment-delete';
  data: any;
  user: CollaborationUser;
  timestamp: number;
  lessonId: string;
}

export interface Comment {
  id: string;
  content: string;
  author: CollaborationUser;
  position: {
    from: number;
    to: number;
  };
  timestamp: number;
  resolved: boolean;
  replies?: Comment[];
}

export interface DocumentVersion {
  id: string;
  content: string;
  author: CollaborationUser;
  timestamp: number;
  changes: {
    type: 'insert' | 'delete' | 'replace';
    position: number;
    content: string;
  }[];
}

export class CollaborationService extends EventEmitter {
  private socket: WebSocket | null = null;
  private lessonId: string | null = null;
  private currentUser: CollaborationUser | null = null;
  private connectedUsers: Map<string, CollaborationUser> = new Map();
  private comments: Map<string, Comment> = new Map();
  private versions: DocumentVersion[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  async connectLesson(lessonId: string, user: CollaborationUser): Promise<void> {
    try {
      this.lessonId = lessonId;
      this.currentUser = user;
      
      // Use secure WebSocket in production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/collaboration/lessons/${lessonId}`;
      
      this.socket = new WebSocket(wsUrl);
      this.setupSocketHandlers();
      
      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Failed to create WebSocket connection'));
          return;
        }

        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send user join event
          this.sendEvent({
            type: 'user-join',
            data: { user },
            user,
            timestamp: Date.now(),
            lessonId
          });
          
          this.emit('connected', { lessonId, user });
          resolve();
        };

        this.socket.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket && this.isConnected) {
      // Send user leave event before disconnecting
      if (this.currentUser && this.lessonId) {
        this.sendEvent({
          type: 'user-leave',
          data: { user: this.currentUser },
          user: this.currentUser,
          timestamp: Date.now(),
          lessonId: this.lessonId
        });
      }
      
      this.socket.close();
    }
    
    this.cleanup();
  }

  sendContentChange(content: string, changes: any[]): void {
    if (!this.isConnected || !this.currentUser || !this.lessonId) return;

    const event: CollaborationEvent = {
      type: 'content-change',
      data: { content, changes },
      user: this.currentUser,
      timestamp: Date.now(),
      lessonId: this.lessonId
    };

    this.sendEvent(event);
  }

  sendCursorMove(cursor: { x: number; y: number; selection?: { from: number; to: number } }): void {
    if (!this.isConnected || !this.currentUser || !this.lessonId) return;

    // Update current user's cursor position
    this.currentUser.cursor = cursor;

    const event: CollaborationEvent = {
      type: 'cursor-move',
      data: { cursor },
      user: this.currentUser,
      timestamp: Date.now(),
      lessonId: this.lessonId
    };

    this.sendEvent(event);
  }

  addComment(content: string, position: { from: number; to: number }): string {
    if (!this.currentUser || !this.lessonId) return '';

    const comment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      author: this.currentUser,
      position,
      timestamp: Date.now(),
      resolved: false,
      replies: []
    };

    this.comments.set(comment.id, comment);

    const event: CollaborationEvent = {
      type: 'comment-add',
      data: { comment },
      user: this.currentUser,
      timestamp: Date.now(),
      lessonId: this.lessonId
    };

    this.sendEvent(event);
    this.emit('comment-added', comment);

    return comment.id;
  }

  updateComment(commentId: string, content: string): void {
    const comment = this.comments.get(commentId);
    if (!comment || !this.currentUser || !this.lessonId) return;

    comment.content = content;
    comment.timestamp = Date.now();

    const event: CollaborationEvent = {
      type: 'comment-update',
      data: { commentId, content },
      user: this.currentUser,
      timestamp: Date.now(),
      lessonId: this.lessonId
    };

    this.sendEvent(event);
    this.emit('comment-updated', comment);
  }

  deleteComment(commentId: string): void {
    const comment = this.comments.get(commentId);
    if (!comment || !this.currentUser || !this.lessonId) return;

    this.comments.delete(commentId);

    const event: CollaborationEvent = {
      type: 'comment-delete',
      data: { commentId },
      user: this.currentUser,
      timestamp: Date.now(),
      lessonId: this.lessonId
    };

    this.sendEvent(event);
    this.emit('comment-deleted', commentId);
  }

  resolveComment(commentId: string): void {
    const comment = this.comments.get(commentId);
    if (!comment) return;

    comment.resolved = true;
    this.updateComment(commentId, comment.content);
  }

  getConnectedUsers(): CollaborationUser[] {
    return Array.from(this.connectedUsers.values());
  }

  getComments(): Comment[] {
    return Array.from(this.comments.values());
  }

  getVersionHistory(): DocumentVersion[] {
    return [...this.versions];
  }

  rollbackToVersion(versionId: string): DocumentVersion | null {
    const version = this.versions.find(v => v.id === versionId);
    if (!version) return null;

    // Send content change with the rolled back content
    this.sendContentChange(version.content, []);
    this.emit('version-rollback', version);

    return version;
  }

  private setupEventHandlers(): void {
    // Handle browser events
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });

    // Handle visibility change for presence
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.emit('user-away', this.currentUser);
      } else {
        this.emit('user-active', this.currentUser);
      }
    });
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.onmessage = (event) => {
      try {
        const collaborationEvent: CollaborationEvent = JSON.parse(event.data);
        this.handleCollaborationEvent(collaborationEvent);
      } catch (error) {
        console.error('Failed to parse collaboration event:', error);
        this.emit('error', error);
      }
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      this.emit('disconnected', event);
      
      // Attempt to reconnect if not a clean close
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      this.emit('error', error);
    };
  }

  private handleCollaborationEvent(event: CollaborationEvent): void {
    // Don't process events from the current user
    if (event.user.id === this.currentUser?.id) return;

    switch (event.type) {
      case 'content-change':
        this.handleContentChange(event);
        break;
      case 'cursor-move':
        this.handleCursorMove(event);
        break;
      case 'user-join':
        this.handleUserJoin(event);
        break;
      case 'user-leave':
        this.handleUserLeave(event);
        break;
      case 'comment-add':
        this.handleCommentAdd(event);
        break;
      case 'comment-update':
        this.handleCommentUpdate(event);
        break;
      case 'comment-delete':
        this.handleCommentDelete(event);
        break;
      default:
        console.warn('Unknown collaboration event type:', event.type);
    }
  }

  private handleContentChange(event: CollaborationEvent): void {
    const { content, changes } = event.data;
    
    // Create version entry
    const version: DocumentVersion = {
      id: `version-${Date.now()}-${event.user.id}`,
      content,
      author: event.user,
      timestamp: event.timestamp,
      changes: changes || []
    };
    
    this.versions.push(version);
    
    // Keep only last 50 versions
    if (this.versions.length > 50) {
      this.versions = this.versions.slice(-50);
    }

    this.emit('content-changed', { content, changes, author: event.user });
  }

  private handleCursorMove(event: CollaborationEvent): void {
    const user = event.user;
    user.cursor = event.data.cursor;
    this.connectedUsers.set(user.id, user);
    this.emit('cursor-moved', user);
  }

  private handleUserJoin(event: CollaborationEvent): void {
    const user = event.data.user;
    this.connectedUsers.set(user.id, user);
    this.emit('user-joined', user);
  }

  private handleUserLeave(event: CollaborationEvent): void {
    const user = event.data.user;
    this.connectedUsers.delete(user.id);
    this.emit('user-left', user);
  }

  private handleCommentAdd(event: CollaborationEvent): void {
    const comment = event.data.comment;
    this.comments.set(comment.id, comment);
    this.emit('comment-added', comment);
  }

  private handleCommentUpdate(event: CollaborationEvent): void {
    const { commentId, content } = event.data;
    const comment = this.comments.get(commentId);
    if (comment) {
      comment.content = content;
      comment.timestamp = event.timestamp;
      this.emit('comment-updated', comment);
    }
  }

  private handleCommentDelete(event: CollaborationEvent): void {
    const { commentId } = event.data;
    this.comments.delete(commentId);
    this.emit('comment-deleted', commentId);
  }

  private sendEvent(event: CollaborationEvent): void {
    if (this.socket && this.isConnected) {
      try {
        this.socket.send(JSON.stringify(event));
      } catch (error) {
        console.error('Failed to send collaboration event:', error);
        this.emit('error', error);
      }
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.lessonId && this.currentUser) {
        this.connectLesson(this.lessonId, this.currentUser)
          .catch(() => {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.attemptReconnect();
            } else {
              this.emit('reconnect-failed');
            }
          });
      }
    }, delay);
  }

  private cleanup(): void {
    this.socket = null;
    this.lessonId = null;
    this.isConnected = false;
    this.connectedUsers.clear();
    this.comments.clear();
    this.versions = [];
    this.reconnectAttempts = 0;
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();