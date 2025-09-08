// IndexedDB service for offline lesson data caching

import type { Lesson, UserProgress, MediaAsset } from '../../types';

interface DBSchema {
  lessons: {
    key: string;
    value: Lesson;
    indexes: {
      level: string;
      tags: string[];
    };
  };
  progress: {
    key: string;
    value: UserProgress;
    indexes: {
      userId: number;
      lessonId: number;
    };
  };
  media: {
    key: number;
    value: MediaAsset;
  };
  metadata: {
    key: string;
    value: {
      lastSync: number;
      version: string;
    };
  };
}

export class IndexedDBService {
  private static instance: IndexedDBService;
  private db: IDBDatabase | null = null;
  private readonly dbName = 'TahitianTutorDB';
  private readonly dbVersion = 1;

  private constructor() {}

  static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  private createObjectStores(db: IDBDatabase): void {
    // Lessons store
    if (!db.objectStoreNames.contains('lessons')) {
      const lessonsStore = db.createObjectStore('lessons', { keyPath: 'slug' });
      lessonsStore.createIndex('level', 'level', { unique: false });
      lessonsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
    }

    // Progress store
    if (!db.objectStoreNames.contains('progress')) {
      const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
      progressStore.createIndex('userId', 'userId', { unique: false });
      progressStore.createIndex('lessonId', 'lessonId', { unique: false });
      progressStore.createIndex('userLesson', ['userId', 'lessonId'], { unique: true });
    }

    // Media store
    if (!db.objectStoreNames.contains('media')) {
      db.createObjectStore('media', { keyPath: 'id' });
    }

    // Metadata store
    if (!db.objectStoreNames.contains('metadata')) {
      db.createObjectStore('metadata', { keyPath: 'key' });
    }
  }

  // Lesson operations
  async cacheLessons(lessons: Lesson[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['lessons'], 'readwrite');
    const store = transaction.objectStore('lessons');

    const promises = lessons.map(lesson => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(lesson);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  async getCachedLesson(slug: string): Promise<Lesson | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readonly');
      const store = transaction.objectStore('lessons');
      const request = store.get(slug);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getCachedLessons(): Promise<Lesson[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readonly');
      const store = transaction.objectStore('lessons');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getLessonsByLevel(level: string): Promise<Lesson[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readonly');
      const store = transaction.objectStore('lessons');
      const index = store.index('level');
      const request = index.getAll(level);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Progress operations
  async cacheUserProgress(progress: UserProgress[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['progress'], 'readwrite');
    const store = transaction.objectStore('progress');

    const promises = progress.map(p => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(p);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  async getUserProgress(userId: number, lessonId?: number): Promise<UserProgress[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['progress'], 'readonly');
      const store = transaction.objectStore('progress');
      
      if (lessonId) {
        const index = store.index('userLesson');
        const request = index.get([userId, lessonId]);
        
        request.onsuccess = () => {
          resolve(request.result ? [request.result] : []);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      } else {
        const index = store.index('userId');
        const request = index.getAll(userId);
        
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      }
    });
  }

  // Media operations
  async cacheMediaAssets(assets: MediaAsset[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['media'], 'readwrite');
    const store = transaction.objectStore('media');

    const promises = assets.map(asset => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(asset);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  async getCachedMediaAsset(id: number): Promise<MediaAsset | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Metadata operations
  async setLastSyncTime(timestamp: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key: 'lastSync', lastSync: timestamp, version: '1.0.0' });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLastSyncTime(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get('lastSync');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.lastSync : 0);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Utility operations
  async clearCache(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['lessons', 'progress', 'media', 'metadata'], 'readwrite');
    
    const promises = [
      this.clearStore(transaction.objectStore('lessons')),
      this.clearStore(transaction.objectStore('progress')),
      this.clearStore(transaction.objectStore('media')),
      this.clearStore(transaction.objectStore('metadata'))
    ];

    await Promise.all(promises);
  }

  private clearStore(store: IDBObjectStore): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Get database instance for advanced operations
  getDatabase(): IDBDatabase | null {
    return this.db;
  }

  // Check if data exists
  async hasLessons(): Promise<boolean> {
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readonly');
      const store = transaction.objectStore('lessons');
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result > 0);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export const indexedDBService = IndexedDBService.getInstance();