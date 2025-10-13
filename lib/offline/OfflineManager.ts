import { indexedDBService } from './IndexedDBService';
import { offlineSyncService, SyncResult, SyncConflict } from './OfflineSyncService';

export interface OfflineConfig {
  enableAutoSync: boolean;
  syncInterval: number; // in milliseconds
  maxRetries: number;
  retryDelay: number; // in milliseconds
  conflictResolution: 'client' | 'server' | 'manual';
  cacheExpiry: number; // in milliseconds
}

export interface OfflineStatus {
  isOnline: boolean;
  isInitialized: boolean;
  syncInProgress: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  storageUsage: any;
  conflicts: SyncConflict[];
}

class OfflineManager {
  private config: OfflineConfig = {
    enableAutoSync: true,
    syncInterval: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    conflictResolution: 'manual',
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
  };

  private isInitialized: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();

  async initialize(config?: Partial<OfflineConfig>): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Merge config
    this.config = { ...this.config, ...config };

    try {
      // Initialize services
      await indexedDBService.initialize();
      await offlineSyncService.initialize();

      // Set conflict resolution strategy
      offlineSyncService.setConflictResolutionStrategy(this.config.conflictResolution);

      // Register service worker
      await this.registerServiceWorker();

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('Offline Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Offline Manager:', error);
      throw error;
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.emit('update-available');
              }
            });
          }
        });

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private setupEventListeners(): void {
    // Network status changes
    window.addEventListener('online', () => {
      this.emit('online');
      if (this.config.enableAutoSync) {
        this.sync();
      }
    });

    window.addEventListener('offline', () => {
      this.emit('offline');
    });

    // Visibility change (tab focus)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine && this.config.enableAutoSync) {
        this.sync();
      }
    });
  }

  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'CACHE_UPDATED':
        this.emit('cache-updated', data.payload);
        break;
      case 'SYNC_BACKGROUND':
        this.sync();
        break;
      case 'OFFLINE_READY':
        this.emit('offline-ready');
        break;
      default:
        console.log('Unknown service worker message:', data);
    }
  }

  // Data management methods
  async saveData(table: string, data: any, operation: 'create' | 'update' | 'delete' = 'create'): Promise<void> {
    this.ensureInitialized();
    
    try {
      await offlineSyncService.saveOffline(table, data, operation);
      this.emit('data-saved', { table, data, operation });
    } catch (error) {
      this.emit('error', { type: 'save-failed', error, table, data });
      throw error;
    }
  }

  async getData(table: string, id?: string): Promise<any> {
    this.ensureInitialized();
    
    try {
      const data = await offlineSyncService.getOfflineData(table, id);
      return data;
    } catch (error) {
      this.emit('error', { type: 'get-failed', error, table, id });
      throw error;
    }
  }

  async deleteData(table: string, id: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.saveData(table, { id }, 'delete');
      this.emit('data-deleted', { table, id });
    } catch (error) {
      this.emit('error', { type: 'delete-failed', error, table, id });
      throw error;
    }
  }

  // Sync methods
  async sync(): Promise<SyncResult> {
    this.ensureInitialized();
    
    try {
      this.emit('sync-start');
      const result = await offlineSyncService.triggerSync();
      
      if (result.success) {
        this.emit('sync-success', result);
      } else {
        this.emit('sync-error', result);
      }
      
      return result;
    } catch (error) {
      const errorResult: SyncResult = {
        success: false,
        synced: 0,
        conflicts: [],
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
      };
      
      this.emit('sync-error', errorResult);
      return errorResult;
    }
  }

  async forceSync(): Promise<SyncResult> {
    return await this.sync();
  }

  // Conflict resolution
  async getConflicts(): Promise<SyncConflict[]> {
    this.ensureInitialized();
    return await offlineSyncService.getConflicts();
  }

  async resolveConflict(
    conflictId: string, 
    resolution: 'client' | 'server' | 'merge', 
    mergedData?: any
  ): Promise<void> {
    this.ensureInitialized();
    
    try {
      await offlineSyncService.resolveConflict(conflictId, resolution, mergedData);
      this.emit('conflict-resolved', { conflictId, resolution });
    } catch (error) {
      this.emit('error', { type: 'conflict-resolution-failed', error, conflictId });
      throw error;
    }
  }

  // Cache management
  async preloadContent(contentIds: string[]): Promise<void> {
    this.ensureInitialized();
    
    try {
      for (const contentId of contentIds) {
        // Preload stories and lessons
        const story = await this.fetchAndCache('stories', contentId);
        if (story && story.lessons) {
          for (const lessonId of story.lessons) {
            await this.fetchAndCache('lessons', lessonId);
          }
        }
      }
      
      this.emit('content-preloaded', { contentIds });
    } catch (error) {
      this.emit('error', { type: 'preload-failed', error, contentIds });
      throw error;
    }
  }

  private async fetchAndCache(table: string, id: string): Promise<any> {
    try {
      // Check if already cached
      const cached = await this.getData(table, id);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }

      // Fetch from server if online
      if (navigator.onLine) {
        const response = await fetch(`/api/${table}/${id}`);
        if (response.ok) {
          const data = await response.json();
          await this.saveData(table, data, 'update');
          return data;
        }
      }

      return cached; // Return cached even if expired when offline
    } catch (error) {
      console.error(`Failed to fetch and cache ${table}/${id}:`, error);
      return null;
    }
  }

  private isCacheValid(data: any): boolean {
    if (!data.lastModified) return false;
    return (Date.now() - data.lastModified) < this.config.cacheExpiry;
  }

  // Asset management
  async cacheAsset(url: string, type: 'image' | 'audio' | 'video' | 'document'): Promise<void> {
    this.ensureInitialized();
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.status}`);
      }

      const blob = await response.blob();
      await indexedDBService.storeAsset(url, blob, type);
      
      this.emit('asset-cached', { url, type });
    } catch (error) {
      this.emit('error', { type: 'asset-cache-failed', error, url });
      throw error;
    }
  }

  async getAsset(url: string): Promise<Blob | null> {
    this.ensureInitialized();
    return await indexedDBService.getAsset(url);
  }

  async clearExpiredAssets(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await indexedDBService.cleanupExpiredAssets();
      this.emit('assets-cleaned');
    } catch (error) {
      this.emit('error', { type: 'asset-cleanup-failed', error });
      throw error;
    }
  }

  // Status and monitoring
  async getStatus(): Promise<OfflineStatus> {
    this.ensureInitialized();
    
    const syncStatus = offlineSyncService.getSyncStatus();
    const storageUsage = await indexedDBService.getStorageUsage();
    const conflicts = await this.getConflicts();
    const lastSyncTime = localStorage.getItem('lastSyncTimestamp');

    return {
      isOnline: navigator.onLine,
      isInitialized: this.isInitialized,
      syncInProgress: syncStatus.syncInProgress,
      lastSyncTime: lastSyncTime ? parseInt(lastSyncTime) : null,
      pendingChanges: syncStatus.pendingItems,
      storageUsage,
      conflicts,
    };
  }

  async clearAllData(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await offlineSyncService.clearOfflineData();
      await indexedDBService.clearAssets();
      this.emit('data-cleared');
    } catch (error) {
      this.emit('error', { type: 'clear-failed', error });
      throw error;
    }
  }

  // Configuration
  updateConfig(config: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...config };
    offlineSyncService.setConflictResolutionStrategy(this.config.conflictResolution);
    this.emit('config-updated', this.config);
  }

  getConfig(): OfflineConfig {
    return { ...this.config };
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('OfflineManager not initialized. Call initialize() first.');
    }
  }

  // Utility methods
  isOnline(): boolean {
    return navigator.onLine;
  }

  isOffline(): boolean {
    return !navigator.onLine;
  }

  async estimateStorageQuota(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { usage: 0, quota: 0 };
  }
}

export const offlineManager = new OfflineManager();