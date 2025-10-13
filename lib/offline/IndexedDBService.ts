import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface OfflineDBSchema extends DBSchema {
  stories: {
    key: string;
    value: {
      id: string;
      title: string;
      content: string;
      audioUrl?: string;
      imageUrl?: string;
      category: string;
      difficulty: string;
      language: string;
      createdAt: string;
      updatedAt: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
      lastModified: number;
      version: number;
    };
    indexes: {
      'by-category': string;
      'by-language': string;
      'by-sync-status': string;
      'by-last-modified': number;
    };
  };
  lessons: {
    key: string;
    value: {
      id: string;
      title: string;
      content: string;
      exercises: any[];
      progress: number;
      completed: boolean;
      language: string;
      difficulty: string;
      createdAt: string;
      updatedAt: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
      lastModified: number;
      version: number;
    };
    indexes: {
      'by-language': string;
      'by-difficulty': string;
      'by-sync-status': string;
      'by-completed': boolean;
      'by-last-modified': number;
    };
  };
  userProgress: {
    key: string;
    value: {
      id: string;
      userId: string;
      lessonId?: string;
      storyId?: string;
      progress: number;
      score: number;
      timeSpent: number;
      completedAt?: string;
      createdAt: string;
      updatedAt: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
      lastModified: number;
      version: number;
    };
    indexes: {
      'by-user': string;
      'by-lesson': string;
      'by-story': string;
      'by-sync-status': string;
      'by-last-modified': number;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      operation: 'create' | 'update' | 'delete';
      table: string;
      data: any;
      timestamp: number;
      retryCount: number;
      lastError?: string;
    };
    indexes: {
      'by-timestamp': number;
      'by-table': string;
      'by-operation': string;
    };
  };
  offlineAssets: {
    key: string;
    value: {
      id: string;
      url: string;
      blob: Blob;
      mimeType: string;
      size: number;
      downloadedAt: string;
      lastAccessed: string;
      expiresAt?: string;
    };
    indexes: {
      'by-url': string;
      'by-downloaded-at': string;
      'by-last-accessed': string;
      'by-expires-at': string;
    };
  };
}

class IndexedDBService {
  private db: IDBPDatabase<OfflineDBSchema> | null = null;
  private readonly dbName = 'TahitiSpeakOfflineDB';
  private readonly dbVersion = 1;

  async initialize(): Promise<void> {
    try {
      this.db = await openDB<OfflineDBSchema>(this.dbName, this.dbVersion, {
        upgrade(db) {
          // Stories store
          if (!db.objectStoreNames.contains('stories')) {
            const storiesStore = db.createObjectStore('stories', { keyPath: 'id' });
            storiesStore.createIndex('by-category', 'category');
            storiesStore.createIndex('by-language', 'language');
            storiesStore.createIndex('by-sync-status', 'syncStatus');
            storiesStore.createIndex('by-last-modified', 'lastModified');
          }

          // Lessons store
          if (!db.objectStoreNames.contains('lessons')) {
            const lessonsStore = db.createObjectStore('lessons', { keyPath: 'id' });
            lessonsStore.createIndex('by-language', 'language');
            lessonsStore.createIndex('by-difficulty', 'difficulty');
            lessonsStore.createIndex('by-sync-status', 'syncStatus');
            lessonsStore.createIndex('by-completed', 'completed');
            lessonsStore.createIndex('by-last-modified', 'lastModified');
          }

          // User progress store
          if (!db.objectStoreNames.contains('userProgress')) {
            const progressStore = db.createObjectStore('userProgress', { keyPath: 'id' });
            progressStore.createIndex('by-user', 'userId');
            progressStore.createIndex('by-lesson', 'lessonId');
            progressStore.createIndex('by-story', 'storyId');
            progressStore.createIndex('by-sync-status', 'syncStatus');
            progressStore.createIndex('by-last-modified', 'lastModified');
          }

          // Sync queue store
          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
            syncStore.createIndex('by-timestamp', 'timestamp');
            syncStore.createIndex('by-table', 'table');
            syncStore.createIndex('by-operation', 'operation');
          }

          // Offline assets store
          if (!db.objectStoreNames.contains('offlineAssets')) {
            const assetsStore = db.createObjectStore('offlineAssets', { keyPath: 'id' });
            assetsStore.createIndex('by-url', 'url');
            assetsStore.createIndex('by-downloaded-at', 'downloadedAt');
            assetsStore.createIndex('by-last-accessed', 'lastAccessed');
            assetsStore.createIndex('by-expires-at', 'expiresAt');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  private ensureDB(): IDBPDatabase<OfflineDBSchema> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Generic CRUD operations
  async get<T extends keyof OfflineDBSchema>(
    storeName: T,
    key: string
  ): Promise<OfflineDBSchema[T]['value'] | undefined> {
    const db = this.ensureDB();
    return await db.get(storeName, key);
  }

  async getAll<T extends keyof OfflineDBSchema>(
    storeName: T
  ): Promise<OfflineDBSchema[T]['value'][]> {
    const db = this.ensureDB();
    return await db.getAll(storeName);
  }

  async put<T extends keyof OfflineDBSchema>(
    storeName: T,
    data: OfflineDBSchema[T]['value']
  ): Promise<void> {
    const db = this.ensureDB();
    await db.put(storeName, data);
  }

  async delete<T extends keyof OfflineDBSchema>(
    storeName: T,
    key: string
  ): Promise<void> {
    const db = this.ensureDB();
    await db.delete(storeName, key);
  }

  async clear<T extends keyof OfflineDBSchema>(storeName: T): Promise<void> {
    const db = this.ensureDB();
    await db.clear(storeName);
  }

  // Index-based queries
  async getByIndex<T extends keyof OfflineDBSchema>(
    storeName: T,
    indexName: keyof OfflineDBSchema[T]['indexes'],
    value: any
  ): Promise<OfflineDBSchema[T]['value'][]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex(storeName, indexName as string, value);
  }

  // Sync-specific operations
  async getPendingSync(): Promise<OfflineDBSchema['syncQueue']['value'][]> {
    const db = this.ensureDB();
    return await db.getAll('syncQueue');
  }

  async addToSyncQueue(operation: {
    operation: 'create' | 'update' | 'delete';
    table: string;
    data: any;
  }): Promise<void> {
    const db = this.ensureDB();
    const syncItem: OfflineDBSchema['syncQueue']['value'] = {
      id: `${operation.table}_${operation.operation}_${Date.now()}_${Math.random()}`,
      ...operation,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await db.put('syncQueue', syncItem);
  }

  async removeSyncItem(id: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('syncQueue', id);
  }

  async updateSyncItemError(id: string, error: string): Promise<void> {
    const db = this.ensureDB();
    const item = await db.get('syncQueue', id);
    if (item) {
      item.retryCount += 1;
      item.lastError = error;
      await db.put('syncQueue', item);
    }
  }

  // Asset management
  async storeAsset(url: string, blob: Blob, expiresIn?: number): Promise<void> {
    const db = this.ensureDB();
    const now = new Date().toISOString();
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn).toISOString()
      : undefined;

    const asset: OfflineDBSchema['offlineAssets']['value'] = {
      id: btoa(url), // Base64 encode URL as ID
      url,
      blob,
      mimeType: blob.type,
      size: blob.size,
      downloadedAt: now,
      lastAccessed: now,
      expiresAt,
    };

    await db.put('offlineAssets', asset);
  }

  async getAsset(url: string): Promise<Blob | null> {
    const db = this.ensureDB();
    const id = btoa(url);
    const asset = await db.get('offlineAssets', id);
    
    if (!asset) return null;
    
    // Check if expired
    if (asset.expiresAt && new Date(asset.expiresAt) < new Date()) {
      await db.delete('offlineAssets', id);
      return null;
    }

    // Update last accessed
    asset.lastAccessed = new Date().toISOString();
    await db.put('offlineAssets', asset);
    
    return asset.blob;
  }

  async cleanupExpiredAssets(): Promise<void> {
    const db = this.ensureDB();
    const now = new Date();
    const assets = await db.getAll('offlineAssets');
    
    for (const asset of assets) {
      if (asset.expiresAt && new Date(asset.expiresAt) < now) {
        await db.delete('offlineAssets', asset.id);
      }
    }
  }

  // Storage management
  async getStorageUsage(): Promise<{
    total: number;
    byStore: Record<string, number>;
  }> {
    const db = this.ensureDB();
    const usage = { total: 0, byStore: {} as Record<string, number> };

    for (const storeName of db.objectStoreNames) {
      const items = await db.getAll(storeName as keyof OfflineDBSchema);
      const storeSize = JSON.stringify(items).length;
      usage.byStore[storeName] = storeSize;
      usage.total += storeSize;
    }

    return usage;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const indexedDBService = new IndexedDBService();