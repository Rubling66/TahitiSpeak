// IndexedDB cache implementation for offline support

import type { Lesson, MediaAsset, UserProgress } from '@/types';

/**
 * IndexedDB cache for offline lesson data and media assets
 */
export class IndexedDBCache {
  private static readonly DB_NAME = 'TahitianTutorCache';
  private static readonly DB_VERSION = 1;
  private static readonly STORES = {
    LESSONS: 'lessons',
    MEDIA_ASSETS: 'mediaAssets',
    USER_PROGRESS: 'userProgress',
    METADATA: 'metadata'
  } as const;

  private db: IDBDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IndexedDBCache.DB_NAME, IndexedDBCache.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create lessons store
        if (!db.objectStoreNames.contains(IndexedDBCache.STORES.LESSONS)) {
          const lessonsStore = db.createObjectStore(IndexedDBCache.STORES.LESSONS, {
            keyPath: 'slug'
          });
          lessonsStore.createIndex('level', 'level', { unique: false });
          lessonsStore.createIndex('isPublished', 'isPublished', { unique: false });
        }

        // Create media assets store
        if (!db.objectStoreNames.contains(IndexedDBCache.STORES.MEDIA_ASSETS)) {
          const mediaStore = db.createObjectStore(IndexedDBCache.STORES.MEDIA_ASSETS, {
            keyPath: 'id'
          });
          mediaStore.createIndex('kind', 'kind', { unique: false });
        }

        // Create user progress store
        if (!db.objectStoreNames.contains(IndexedDBCache.STORES.USER_PROGRESS)) {
          const progressStore = db.createObjectStore(IndexedDBCache.STORES.USER_PROGRESS, {
            keyPath: ['userId', 'lessonId', 'sectionKind']
          });
          progressStore.createIndex('userId', 'userId', { unique: false });
          progressStore.createIndex('lessonId', 'lessonId', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(IndexedDBCache.STORES.METADATA)) {
          db.createObjectStore(IndexedDBCache.STORES.METADATA, {
            keyPath: 'key'
          });
        }
      };
    });
  }

  /**
   * Cache a lesson
   */
  async cacheLesson(lesson: Lesson): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IndexedDBCache.STORES.LESSONS], 'readwrite');
      const store = transaction.objectStore(IndexedDBCache.STORES.LESSONS);
      
      const request = store.put({
        ...lesson,
        cachedAt: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to cache lesson'));
    });
  }

  /**
   * Get a cached lesson by slug
   */
  async getCachedLesson(slug: string): Promise<Lesson | null> {
    await this.initialize();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IndexedDBCache.STORES.LESSONS], 'readonly');
      const store = transaction.objectStore(IndexedDBCache.STORES.LESSONS);
      
      const request = store.get(slug);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Remove cache metadata before returning
          const { cachedAt, ...lesson } = result;
          resolve(lesson as Lesson);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get cached lesson'));
    });
  }

  /**
   * Get all cached lessons
   */
  async getAllCachedLessons(): Promise<Lesson[]> {
    await this.initialize();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IndexedDBCache.STORES.LESSONS], 'readonly');
      const store = transaction.objectStore(IndexedDBCache.STORES.LESSONS);
      
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        const lessons = results.map(result => {
          const { cachedAt, ...lesson } = result;
          return lesson as Lesson;
        });
        resolve(lessons);
      };
      
      request.onerror = () => reject(new Error('Failed to get cached lessons'));
    });
  }

  /**
   * Cache a media asset
   */
  async cacheMediaAsset(asset: MediaAsset): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IndexedDBCache.STORES.MEDIA_ASSETS], 'readwrite');
      const store = transaction.objectStore(IndexedDBCache.STORES.MEDIA_ASSETS);
      
      const request = store.put({
        ...asset,
        cachedAt: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to cache media asset'));
    });
  }

  /**
   * Get a cached media asset by ID
   */
  async getCachedMediaAsset(id: number): Promise<MediaAsset | null> {
    await this.initialize();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IndexedDBCache.STORES.MEDIA_ASSETS], 'readonly');
      const store = transaction.objectStore(IndexedDBCache.STORES.MEDIA_ASSETS);
      
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { cachedAt, ...asset } = result;
          resolve(asset as MediaAsset);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get cached media asset'));
    });
  }

  /**
   * Cache user progress
   */
  async cacheUserProgress(progress: UserProgress): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IndexedDBCache.STORES.USER_PROGRESS], 'readwrite');
      const store = transaction.objectStore(IndexedDBCache.STORES.USER_PROGRESS);
      
      const request = store.put({
        ...progress,
        cachedAt: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to cache user progress'));
    });
  }

  /**
   * Get cached user progress
   */
  async getCachedUserProgress(userId: number, lessonId?: number): Promise<UserProgress[]> {
    await this.initialize();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IndexedDBCache.STORES.USER_PROGRESS], 'readonly');
      const store = transaction.objectStore(IndexedDBCache.STORES.USER_PROGRESS);
      const index = store.index('userId');
      
      const request = index.getAll(userId);

      request.onsuccess = () => {
        let results = request.result || [];
        
        if (lessonId) {
          results = results.filter(progress => progress.lessonId === lessonId);
        }
        
        const progressList = results.map(result => {
          const { cachedAt, ...progress } = result;
          return progress as UserProgress;
        });
        
        resolve(progressList);
      };
      
      request.onerror = () => reject(new Error('Failed to get cached user progress'));
    });
  }

  /**
   * Set metadata value
   */
  async setMetadata(key: string, value: unknown): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IndexedDBCache.STORES.METADATA], 'readwrite');
      const store = transaction.objectStore(IndexedDBCache.STORES.METADATA);
      
      const request = store.put({
        key,
        value,
        updatedAt: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to set metadata'));
    });
  }

  /**
   * Get metadata value
   */
  async getMetadata(key: string): Promise<unknown> {
    await this.initialize();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IndexedDBCache.STORES.METADATA], 'readonly');
      const store = transaction.objectStore(IndexedDBCache.STORES.METADATA);
      
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      
      request.onerror = () => reject(new Error('Failed to get metadata'));
    });
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await this.initialize();
    if (!this.db) return;

    const storeNames = Object.values(IndexedDBCache.STORES);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeNames, 'readwrite');
      
      let completed = 0;
      const total = storeNames.length;
      
      storeNames.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to clear store: ${storeName}`));
        };
      });
    });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    lessons: number;
    mediaAssets: number;
    userProgress: number;
    totalSize: number;
  }> {
    await this.initialize();
    if (!this.db) {
      return { lessons: 0, mediaAssets: 0, userProgress: 0, totalSize: 0 };
    }

    const storeNames = [
      IndexedDBCache.STORES.LESSONS,
      IndexedDBCache.STORES.MEDIA_ASSETS,
      IndexedDBCache.STORES.USER_PROGRESS
    ];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeNames, 'readonly');
      const stats = { lessons: 0, mediaAssets: 0, userProgress: 0, totalSize: 0 };
      let completed = 0;

      storeNames.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.count();
        
        request.onsuccess = () => {
          const count = request.result;
          
          switch (storeName) {
            case IndexedDBCache.STORES.LESSONS:
              stats.lessons = count;
              break;
            case IndexedDBCache.STORES.MEDIA_ASSETS:
              stats.mediaAssets = count;
              break;
            case IndexedDBCache.STORES.USER_PROGRESS:
              stats.userProgress = count;
              break;
          }
          
          completed++;
          if (completed === storeNames.length) {
            // Estimate total size (rough calculation)
            stats.totalSize = (stats.lessons * 50000) + (stats.mediaAssets * 10000) + (stats.userProgress * 1000);
            resolve(stats);
          }
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to count store: ${storeName}`));
        };
      });
    });
  }

  /**
   * Check if the cache is available (IndexedDB supported)
   */
  static isAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const indexedDBCache = new IndexedDBCache();