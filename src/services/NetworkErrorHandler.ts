import React from 'react';
import { notificationService } from './NotificationService';
import { logger } from './LoggingService';
import { errorRecoveryService } from './ErrorRecoveryService';

export interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  context?: string;
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export class NetworkErrorHandler {
  private static instance: NetworkErrorHandler;
  private isOnline: boolean = navigator.onLine;
  private requestQueue: QueuedRequest[] = [];
  private maxQueueSize: number = 100;
  private retryIntervals: number[] = [1000, 2000, 5000, 10000, 30000]; // Progressive delays
  private networkStatus: NetworkStatus = { isOnline: navigator.onLine };
  private onlineListeners: Set<(isOnline: boolean) => void> = new Set();
  private queueProcessingInterval: NodeJS.Timeout | null = null;
  private lastOnlineCheck: number = Date.now();
  private connectionQuality: 'poor' | 'good' | 'excellent' = 'good';

  static getInstance(): NetworkErrorHandler {
    if (!NetworkErrorHandler.instance) {
      NetworkErrorHandler.instance = new NetworkErrorHandler();
      NetworkErrorHandler.instance.initialize();
    }
    return NetworkErrorHandler.instance;
  }

  private initialize(): void {
    this.setupNetworkListeners();
    this.detectConnectionQuality();
    this.startQueueProcessor();
    this.setupPeriodicConnectivityCheck();
  }

  private setupNetworkListeners(): void {
    // Standard online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Network Information API (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
      this.updateNetworkStatus();
    }

    // Visibility API to handle tab switching
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.updateNetworkStatus();
    this.notifyListeners(true);
    
    notificationService.success('Back online', {
      description: 'Internet connection restored. Processing queued requests.',
      duration: 3000
    });

    this.processQueuedRequests();
    logger.info('Network connection restored');
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.updateNetworkStatus();
    this.notifyListeners(false);
    
    notificationService.warning('No internet connection', {
      description: 'You are offline. Requests will be queued and sent when connection is restored.',
      duration: 5000
    });

    logger.warn('Network connection lost');
  }

  private handleConnectionChange(): void {
    this.updateNetworkStatus();
    this.detectConnectionQuality();
  }

  private handleVisibilityChange(): void {
    if (!document.hidden && Date.now() - this.lastOnlineCheck > 30000) {
      this.checkConnectivity();
    }
  }

  private updateNetworkStatus(): void {
    this.networkStatus.isOnline = navigator.onLine;
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.networkStatus.connectionType = connection.type;
      this.networkStatus.effectiveType = connection.effectiveType;
      this.networkStatus.downlink = connection.downlink;
      this.networkStatus.rtt = connection.rtt;
      this.networkStatus.saveData = connection.saveData;
    }
  }

  private detectConnectionQuality(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection.effectiveType;
      const rtt = connection.rtt || 0;
      const downlink = connection.downlink || 0;

      if (effectiveType === 'slow-2g' || rtt > 2000 || downlink < 0.5) {
        this.connectionQuality = 'poor';
      } else if (effectiveType === '4g' && rtt < 300 && downlink > 5) {
        this.connectionQuality = 'excellent';
      } else {
        this.connectionQuality = 'good';
      }
    }
  }

  private async checkConnectivity(): Promise<boolean> {
    this.lastOnlineCheck = Date.now();
    
    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      const wasOnline = this.isOnline;
      this.isOnline = response.ok;
      
      if (wasOnline !== this.isOnline) {
        this.isOnline ? this.handleOnline() : this.handleOffline();
      }
      
      return this.isOnline;
    } catch (error) {
      const wasOnline = this.isOnline;
      this.isOnline = false;
      
      if (wasOnline) {
        this.handleOffline();
      }
      
      return false;
    }
  }

  private setupPeriodicConnectivityCheck(): void {
    setInterval(() => {
      if (!this.isOnline) {
        this.checkConnectivity();
      }
    }, 30000); // Check every 30 seconds when offline
  }

  private startQueueProcessor(): void {
    if (this.queueProcessingInterval) {
      clearInterval(this.queueProcessingInterval);
    }

    this.queueProcessingInterval = setInterval(() => {
      if (this.isOnline && this.requestQueue.length > 0) {
        this.processQueuedRequests();
      }
    }, 5000); // Process queue every 5 seconds
  }

  async handleNetworkRequest(
    url: string,
    options: RequestInit = {},
    context?: string,
    priority: QueuedRequest['priority'] = 'medium'
  ): Promise<Response> {
    // If online, try the request immediately
    if (this.isOnline) {
      try {
        const response = await this.makeRequest(url, options);
        return response;
      } catch (error) {
        // If request fails, check if it's a network error
        if (this.isNetworkError(error)) {
          this.isOnline = false;
          this.handleOffline();
          // Queue the request for retry
          return this.queueRequest(url, options, context, priority);
        }
        throw error;
      }
    } else {
      // If offline, queue the request
      return this.queueRequest(url, options, context, priority);
    }
  }

  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    // Add timeout based on connection quality
    const timeout = this.getTimeoutForConnectionQuality();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private getTimeoutForConnectionQuality(): number {
    switch (this.connectionQuality) {
      case 'poor': return 30000; // 30 seconds
      case 'good': return 15000; // 15 seconds
      case 'excellent': return 10000; // 10 seconds
      default: return 15000;
    }
  }

  private queueRequest(
    url: string,
    options: RequestInit,
    context?: string,
    priority: QueuedRequest['priority'] = 'medium'
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      // Check queue size limit
      if (this.requestQueue.length >= this.maxQueueSize) {
        // Remove oldest low priority requests
        this.requestQueue = this.requestQueue.filter(req => req.priority !== 'low');
        
        if (this.requestQueue.length >= this.maxQueueSize) {
          reject(new Error('Request queue is full'));
          return;
        }
      }

      const queuedRequest: QueuedRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        options,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: this.getMaxRetriesForPriority(priority),
        priority,
        resolve,
        reject,
        context
      };

      // Insert based on priority
      this.insertByPriority(queuedRequest);
      
      logger.info('Request queued for offline processing', {
        requestId: queuedRequest.id,
        url,
        priority,
        queueSize: this.requestQueue.length
      });
    });
  }

  private insertByPriority(request: QueuedRequest): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.requestQueue.findIndex(
      req => priorityOrder[req.priority] > priorityOrder[request.priority]
    );
    
    if (insertIndex === -1) {
      this.requestQueue.push(request);
    } else {
      this.requestQueue.splice(insertIndex, 0, request);
    }
  }

  private getMaxRetriesForPriority(priority: QueuedRequest['priority']): number {
    switch (priority) {
      case 'critical': return 10;
      case 'high': return 5;
      case 'medium': return 3;
      case 'low': return 1;
      default: return 3;
    }
  }

  private async processQueuedRequests(): Promise<void> {
    if (!this.isOnline || this.requestQueue.length === 0) {
      return;
    }

    const batchSize = this.getBatchSizeForConnectionQuality();
    const batch = this.requestQueue.splice(0, batchSize);
    
    logger.info(`Processing ${batch.length} queued requests`);

    const promises = batch.map(request => this.processQueuedRequest(request));
    await Promise.allSettled(promises);

    // Continue processing if there are more requests
    if (this.requestQueue.length > 0) {
      setTimeout(() => this.processQueuedRequests(), 1000);
    }
  }

  private getBatchSizeForConnectionQuality(): number {
    switch (this.connectionQuality) {
      case 'poor': return 1;
      case 'good': return 3;
      case 'excellent': return 5;
      default: return 3;
    }
  }

  private async processQueuedRequest(request: QueuedRequest): Promise<void> {
    try {
      const response = await this.makeRequest(request.url, request.options);
      request.resolve(response);
      
      logger.info('Queued request processed successfully', {
        requestId: request.id,
        url: request.url
      });
    } catch (error) {
      if (this.isNetworkError(error) && request.retryCount < request.maxRetries) {
        // Retry the request
        request.retryCount++;
        const delay = this.retryIntervals[Math.min(request.retryCount - 1, this.retryIntervals.length - 1)];
        
        setTimeout(() => {
          this.insertByPriority(request);
        }, delay);
        
        logger.warn('Queued request failed, will retry', {
          requestId: request.id,
          retryCount: request.retryCount,
          maxRetries: request.maxRetries,
          delay
        });
      } else {
        // Max retries exceeded or non-network error
        request.reject(error instanceof Error ? error : new Error('Request failed'));
        
        logger.error('Queued request failed permanently', {
          requestId: request.id,
          error: error instanceof Error ? error.message : error
        });
      }
    }
  }

  private isNetworkError(error: unknown): boolean {
    if (!error) return false;
    
    const networkErrorIndicators = [
      'NetworkError',
      'fetch',
      'network',
      'timeout',
      'aborted',
      'connection',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ];

    const errorMessage = error.message || error.toString() || '';
    return networkErrorIndicators.some(indicator => 
      errorMessage.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  // Public API methods
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  getQueueStatus(): {
    queueSize: number;
    priorityCounts: Record<string, number>;
    oldestRequest?: number;
  } {
    const priorityCounts = this.requestQueue.reduce((acc, req) => {
      acc[req.priority] = (acc[req.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const oldestRequest = this.requestQueue.length > 0 
      ? Math.min(...this.requestQueue.map(req => req.timestamp))
      : undefined;

    return {
      queueSize: this.requestQueue.length,
      priorityCounts,
      oldestRequest
    };
  }

  clearQueue(): void {
    this.requestQueue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.requestQueue = [];
    logger.info('Request queue cleared');
  }

  addOnlineListener(callback: (isOnline: boolean) => void): () => void {
    this.onlineListeners.add(callback);
    return () => this.onlineListeners.delete(callback);
  }

  private notifyListeners(isOnline: boolean): void {
    this.onlineListeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        logger.error('Error in online status listener', { error });
      }
    });
  }

  // Cleanup method
  destroy(): void {
    if (this.queueProcessingInterval) {
      clearInterval(this.queueProcessingInterval);
    }
    
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.removeEventListener('change', this.handleConnectionChange.bind(this));
    }
    
    this.clearQueue();
    this.onlineListeners.clear();
  }
}

// Export singleton instance
export const networkErrorHandler = NetworkErrorHandler.getInstance();

// React hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(networkErrorHandler.isOnlineStatus());
  const [networkStatus, setNetworkStatus] = React.useState(networkErrorHandler.getNetworkStatus());
  const [queueStatus, setQueueStatus] = React.useState(networkErrorHandler.getQueueStatus());

  React.useEffect(() => {
    const unsubscribe = networkErrorHandler.addOnlineListener((online) => {
      setIsOnline(online);
      setNetworkStatus(networkErrorHandler.getNetworkStatus());
      setQueueStatus(networkErrorHandler.getQueueStatus());
    });

    // Update queue status periodically
    const interval = setInterval(() => {
      setQueueStatus(networkErrorHandler.getQueueStatus());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    networkStatus,
    queueStatus,
    handleRequest: networkErrorHandler.handleNetworkRequest.bind(networkErrorHandler),
    clearQueue: networkErrorHandler.clearQueue.bind(networkErrorHandler)
  };
}

// Higher-order function to wrap fetch with network error handling
export function withNetworkErrorHandling(
  url: string,
  options?: RequestInit,
  context?: string,
  priority?: QueuedRequest['priority']
): Promise<Response> {
  return networkErrorHandler.handleNetworkRequest(url, options, context, priority);
}