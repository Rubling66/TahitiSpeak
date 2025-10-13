// IndexedDB wrapper for offline functionality
export interface OfflineData {
  id: string;
  type: 'lesson' | 'progress' | 'vocabulary' | 'audio' | 'user_data';
  data: any;
  timestamp: number;
  synced: boolean;
  version: number;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export class OfflineService {
  private dbName = 'FrenchLearningApp';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('offline_data')) {
          const offlineStore = db.createObjectStore('offline_data', { keyPath: 'id' });
          offlineStore.createIndex('type', 'type', { unique: false });
          offlineStore.createIndex('synced', 'synced', { unique: false });
          offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('retryCount', 'retryCount', { unique: false });
        }

        if (!db.objectStoreNames.contains('cached_assets')) {
          const assetsStore = db.createObjectStore('cached_assets', { keyPath: 'url' });
          assetsStore.createIndex('type', 'type', { unique: false });
          assetsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('IndexedDB schema updated');
      };
    });
  }

  // Store data offline
  async storeOfflineData(data: Omit<OfflineData, 'timestamp'>): Promise<boolean> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');
      
      const offlineData: OfflineData = {
        ...data,
        timestamp: Date.now()
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(offlineData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`Stored offline data: ${data.type}/${data.id}`);
      return true;
    } catch (error) {
      console.error('Error storing offline data:', error);
      return false;
    }
  }

  // Retrieve offline data
  async getOfflineData(type?: string, synced?: boolean): Promise<OfflineData[]> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['offline_data'], 'readonly');
      const store = transaction.objectStore('offline_data');
      
      let request: IDBRequest;
      
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }

      const data = await new Promise<OfflineData[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Filter by synced status if specified
      if (synced !== undefined) {
        return data.filter(item => item.synced === synced);
      }

      return data;
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return [];
    }
  }

  // Get specific offline data by ID
  async getOfflineDataById(id: string): Promise<OfflineData | null> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['offline_data'], 'readonly');
      const store = transaction.objectStore('offline_data');
      
      const data = await new Promise<OfflineData | undefined>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return data || null;
    } catch (error) {
      console.error('Error retrieving offline data by ID:', error);
      return null;
    }
  }

  // Mark data as synced
  async markAsSynced(id: string): Promise<boolean> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');
      
      const data = await new Promise<OfflineData>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (data) {
        data.synced = true;
        data.timestamp = Date.now();
        
        await new Promise<void>((resolve, reject) => {
          const request = store.put(data);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      return true;
    } catch (error) {
      console.error('Error marking data as synced:', error);
      return false;
    }
  }

  // Add item to sync queue
  async addToSyncQueue(item: Omit<SyncQueueItem, 'timestamp' | 'retryCount'>): Promise<boolean> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      
      const syncItem: SyncQueueItem = {
        ...item,
        timestamp: Date.now(),
        retryCount: 0
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(syncItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`Added to sync queue: ${item.action} ${item.type}/${item.id}`);
      return true;
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      return false;
    }
  }

  // Get sync queue items
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      
      const items = await new Promise<SyncQueueItem[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Sort by timestamp (oldest first)
      return items.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error retrieving sync queue:', error);
      return [];
    }
  }

  // Remove item from sync queue
  async removeFromSyncQueue(id: string): Promise<boolean> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      return true;
    } catch (error) {
      console.error('Error removing from sync queue:', error);
      return false;
    }
  }

  // Increment retry count for sync item
  async incrementRetryCount(id: string): Promise<boolean> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      
      const item = await new Promise<SyncQueueItem>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (item) {
        item.retryCount += 1;
        
        await new Promise<void>((resolve, reject) => {
          const request = store.put(item);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      return true;
    } catch (error) {
      console.error('Error incrementing retry count:', error);
      return false;
    }
  }

  // Cache asset (audio, images, etc.)
  async cacheAsset(url: string, data: ArrayBuffer, type: string): Promise<boolean> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['cached_assets'], 'readwrite');
      const store = transaction.objectStore('cached_assets');
      
      const asset = {
        url,
        data,
        type,
        timestamp: Date.now()
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(asset);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`Cached asset: ${url}`);
      return true;
    } catch (error) {
      console.error('Error caching asset:', error);
      return false;
    }
  }

  // Get cached asset
  async getCachedAsset(url: string): Promise<ArrayBuffer | null> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['cached_assets'], 'readonly');
      const store = transaction.objectStore('cached_assets');
      
      const asset = await new Promise<any>((resolve, reject) => {
        const request = store.get(url);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return asset ? asset.data : null;
    } catch (error) {
      console.error('Error retrieving cached asset:', error);
      return null;
    }
  }

  // Clear old cached assets (older than 7 days)
  async clearOldAssets(): Promise<boolean> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['cached_assets'], 'readwrite');
      const store = transaction.objectStore('cached_assets');
      const index = store.index('timestamp');
      
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const range = IDBKeyRange.upperBound(sevenDaysAgo);
      
      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(range);
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      console.log('Cleared old cached assets');
      return true;
    } catch (error) {
      console.error('Error clearing old assets:', error);
      return false;
    }
  }

  // Get storage usage
  async getStorageUsage(): Promise<{ used: number; quota: number } | null> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return null;
    }
  }

  // Check if online
  get isOnline(): boolean {
    return navigator.onLine;
  }

  // Clear all offline data
  async clearAllData(): Promise<boolean> {
    try {
      if (!this.db) await this.initDB();
      
      const transaction = this.db!.transaction(['offline_data', 'sync_queue', 'cached_assets'], 'readwrite');
      
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore('offline_data').clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore('sync_queue').clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore('cached_assets').clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      ]);

      console.log('Cleared all offline data');
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }
}

// Sync manager for handling background sync
export class SyncManager {
  private offlineService: OfflineService;
  private syncInProgress = false;
  private maxRetries = 3;

  constructor() {
    this.offlineService = new OfflineService();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Connection restored, starting sync...');
      this.syncData();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost, switching to offline mode');
    });

    // Periodic sync when online
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncData();
      }
    }, 30000); // Sync every 30 seconds
  }

  async syncData(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting data synchronization...');

    try {
      const syncQueue = await this.offlineService.getSyncQueue();
      
      for (const item of syncQueue) {
        if (item.retryCount >= this.maxRetries) {
          console.warn(`Max retries reached for sync item: ${item.id}`);
          await this.offlineService.removeFromSyncQueue(item.id);
          continue;
        }

        try {
          const success = await this.syncItem(item);
          
          if (success) {
            await this.offlineService.removeFromSyncQueue(item.id);
            await this.offlineService.markAsSynced(item.id);
            console.log(`Synced: ${item.action} ${item.type}/${item.id}`);
          } else {
            await this.offlineService.incrementRetryCount(item.id);
          }
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
          await this.offlineService.incrementRetryCount(item.id);
        }
      }

      console.log('Data synchronization completed');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    const { action, type, data, id } = item;
    
    try {
      let response: Response;
      
      switch (action) {
        case 'create':
          response = await fetch(`/api/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          break;
          
        case 'update':
          response = await fetch(`/api/${type}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          break;
          
        case 'delete':
          response = await fetch(`/api/${type}/${id}`, {
            method: 'DELETE'
          });
          break;
          
        default:
          console.warn(`Unknown sync action: ${action}`);
          return false;
      }

      return response.ok;
    } catch (error) {
      console.error(`Error syncing ${action} ${type}:`, error);
      return false;
    }
  }

  // Force sync
  async forcSync(): Promise<void> {
    if (navigator.onLine) {
      await this.syncData();
    } else {
      console.warn('Cannot sync while offline');
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    pendingItems: number;
    lastSync: number | null;
    isOnline: boolean;
  }> {
    const syncQueue = await this.offlineService.getSyncQueue();
    
    return {
      pendingItems: syncQueue.length,
      lastSync: null, // Could be stored in localStorage
      isOnline: navigator.onLine
    };
  }
}

// Singleton instances
let offlineService: OfflineService | null = null;
let syncManager: SyncManager | null = null;

export const getOfflineService = (): OfflineService => {
  if (!offlineService) {
    offlineService = new OfflineService();
  }
  return offlineService;
};

export const getSyncManager = (): SyncManager => {
  if (!syncManager) {
    syncManager = new SyncManager();
  }
  return syncManager;
};