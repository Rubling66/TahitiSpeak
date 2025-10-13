// IndexedDB Service for Offline Data Storage
// Handles user progress, lesson data, and offline synchronization

import { UserProgress, Lesson, MediaAsset } from './types';

interface DBSchema {
  lessons: {
    key: string;
    value: Lesson;
    indexes: {
      level: string;
      tags: string[];
    };
  };
  userProgress: {
    key: string;
    value: UserProgress;
    indexes: {
      lessonId: string;
      lastUpdated: number;
    };
  };
  mediaAssets: {
    key: string;
    value: MediaAsset & { blob?: Blob };
    indexes: {
      type: string;
      lessonId: string;
    };
  };
  offlineActions: {
    key: number;
    value: {
      id?: number;
      type: 'progress_update' | 'lesson_completion' | 'vocabulary_practice';
      data: Record<string, unknown>;
      timestamp: number;
      synced: boolean;
    };
    indexes: {
      synced: boolean;
      timestamp: number;
    };
  };
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'TahitianTutorDB';
  private readonly dbVersion = 1;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
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
      const lessonsStore = db.createObjectStore('lessons', { keyPath: 'id' });
      lessonsStore.createIndex('level', 'level', { unique: false });
      lessonsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
    }

    // User progress store
    if (!db.objectStoreNames.contains('userProgress')) {
      const progressStore = db.createObjectStore('userProgress', { keyPath: 'id' });
      progressStore.createIndex('lessonId', 'lessonId', { unique: false });
      progressStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
    }

    // Media assets store
    if (!db.objectStoreNames.contains('mediaAssets')) {
      const mediaStore = db.createObjectStore('mediaAssets', { keyPath: 'id' });
      mediaStore.createIndex('type', 'type', { unique: false });
      mediaStore.createIndex('lessonId', 'lessonId', { unique: false });
    }

    // Offline actions store
    if (!db.objectStoreNames.contains('offlineActions')) {
      const actionsStore = db.createObjectStore('offlineActions', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
      actionsStore.createIndex('synced', 'synced', { unique: false });
      actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
    }
  }

  /**
   * Store lesson data
   */
  async storeLesson(lesson: Lesson): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readwrite');
      const store = transaction.objectStore('lessons');
      const request = store.put(lesson);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store lesson'));
    });
  }

  /**
   * Get lesson by ID
   */
  async getLesson(id: string): Promise<Lesson | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readonly');
      const store = transaction.objectStore('lessons');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to get lesson'));
    });
  }

  /**
   * Get all lessons
   */
  async getAllLessons(): Promise<Lesson[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['lessons'], 'readonly');
        const store = transaction.objectStore('lessons');
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };
        
        request.onerror = (event) => {
          console.error('IndexedDB getAllLessons error:', event);
          reject(new Error(`Failed to get lessons: ${request.error?.message || 'Unknown error'}`));
        };
        
        transaction.onerror = (event) => {
          console.error('IndexedDB transaction error in getAllLessons:', event);
          reject(new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`));
        };
      } catch (error) {
        console.error('Error in getAllLessons:', error);
        reject(error);
      }
    });
  }

  /**
   * Store user progress
   */
  async storeUserProgress(progress: UserProgress): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userProgress'], 'readwrite');
      const store = transaction.objectStore('userProgress');
      const request = store.put(progress);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store user progress'));
    });
  }

  /**
   * Get user progress for a lesson
   */
  async getUserProgress(lessonId: string): Promise<UserProgress | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userProgress'], 'readonly');
      const store = transaction.objectStore('userProgress');
      const index = store.index('lessonId');
      const request = index.get(lessonId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to get user progress'));
    });
  }

  /**
   * Get all user progress
   */
  async getAllUserProgress(): Promise<UserProgress[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['userProgress'], 'readonly');
        const store = transaction.objectStore('userProgress');
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };
        
        request.onerror = (event) => {
          console.error('IndexedDB getAllUserProgress error:', event);
          reject(new Error(`Failed to get user progress: ${request.error?.message || 'Unknown error'}`));
        };
        
        transaction.onerror = (event) => {
          console.error('IndexedDB transaction error in getAllUserProgress:', event);
          reject(new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`));
        };
      } catch (error) {
        console.error('Error in getAllUserProgress:', error);
        reject(error);
      }
    });
  }

  /**
   * Store media asset with blob data
   */
  async storeMediaAsset(asset: MediaAsset, blob?: Blob): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['mediaAssets'], 'readwrite');
      const store = transaction.objectStore('mediaAssets');
      const assetWithBlob = { ...asset, blob };
      const request = store.put(assetWithBlob);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store media asset'));
    });
  }

  /**
   * Get media asset
   */
  async getMediaAsset(id: string): Promise<(MediaAsset & { blob?: Blob }) | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['mediaAssets'], 'readonly');
      const store = transaction.objectStore('mediaAssets');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to get media asset'));
    });
  }

  /**
   * Add offline action for later synchronization
   */
  async addOfflineAction(type: string, data: Record<string, unknown>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');
      const action = {
        type,
        data,
        timestamp: Date.now(),
        synced: false
      };
      const request = store.add(action);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to add offline action'));
    });
  }

  /**
   * Get unsynced offline actions
   */
  async getUnsyncedActions(): Promise<Array<{ id?: number; type: string; data: Record<string, unknown>; timestamp: number; synced: boolean }>> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['offlineActions'], 'readonly');
        const store = transaction.objectStore('offlineActions');
        
        // Check if the index exists before using it
        if (!store.indexNames.contains('synced')) {
          console.warn('Synced index not found, returning empty array');
          resolve([]);
          return;
        }
        
        const index = store.index('synced');
        const request = index.getAll(false);

        request.onsuccess = () => {
          resolve(request.result || []);
        };
        
        request.onerror = (event) => {
          console.error('IndexedDB getAll error:', event);
          reject(new Error(`Failed to get unsynced actions: ${request.error?.message || 'Unknown error'}`));
        };
        
        transaction.onerror = (event) => {
          console.error('IndexedDB transaction error:', event);
          reject(new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`));
        };
      } catch (error) {
        console.error('Error in getUnsyncedActions:', error);
        reject(error);
      }
    });
  }

  /**
   * Mark action as synced
   */
  async markActionSynced(actionId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');
      const getRequest = store.get(actionId);

      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          action.synced = true;
          const putRequest = store.put(action);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to mark action as synced'));
        } else {
          reject(new Error('Action not found'));
        }
      };
      getRequest.onerror = () => reject(new Error('Failed to get action'));
    });
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const storeNames = ['lessons', 'userProgress', 'mediaAssets', 'offlineActions'];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeNames, 'readwrite');
      let completed = 0;
      
      storeNames.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          completed++;
          if (completed === storeNames.length) {
            resolve();
          }
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to clear ${storeName} store`));
        };
      });
    });
  }

  /**
   * Get database size estimate
   */
  async getDatabaseSize(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
      }
    }
    
    return { used: 0, quota: 0 };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Create singleton instance
export const indexedDBService = new IndexedDBService();

// Helper function to initialize the database
export async function initializeOfflineStorage(): Promise<void> {
  try {
    await indexedDBService.init();
    console.log('Offline storage initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline storage:', error);
    throw error;
  }
}

// Helper function to check if IndexedDB is supported
export function isOfflineStorageSupported(): boolean {
  return 'indexedDB' in window;
}