import Dexie, { Table } from 'dexie';
import LZString from 'lz-string';

// Enhanced interfaces for offline data
export interface OfflineLesson {
  id: string;
  title: string;
  description: string;
  level: string;
  content: any;
  audioFiles: string[];
  images: string[];
  exercises: any[];
  culturalNotes: any[];
  downloadedAt: Date;
  lastAccessedAt: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
  version: number;
  compressed: boolean;
  size: number;
}

export interface OfflineUserProgress {
  id: string;
  userId: string;
  lessonId: string;
  progress: number;
  completedExercises: string[];
  timeSpent: number;
  lastStudiedAt: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
  version: number;
  offline: boolean;
}

export interface OfflineMediaAsset {
  id: string;
  url: string;
  type: 'audio' | 'image' | 'video';
  blob: Blob;
  size: number;
  downloadedAt: Date;
  lastAccessedAt: Date;
  expiresAt?: Date;
  compressed: boolean;
}

export interface OfflineSyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  table: string;
  recordId: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  lastError?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface OfflineConflict {
  id: string;
  table: string;
  recordId: string;
  localData: any;
  remoteData: any;
  conflictType: 'update' | 'delete';
  timestamp: Date;
  resolved: boolean;
  resolution?: 'local' | 'remote' | 'merge';
}

export interface OfflineCache {
  id: string;
  key: string;
  data: any;
  timestamp: Date;
  expiresAt: Date;
  size: number;
  compressed: boolean;
  tags: string[];
}

export interface OfflineAnalytics {
  id: string;
  event: string;
  data: any;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  synced: boolean;
}

export interface OfflineSettings {
  id: string;
  key: string;
  value: any;
  updatedAt: Date;
}

// Advanced IndexedDB service with Dexie
class AdvancedIndexedDBService extends Dexie {
  lessons!: Table<OfflineLesson>;
  userProgress!: Table<OfflineUserProgress>;
  mediaAssets!: Table<OfflineMediaAsset>;
  syncQueue!: Table<OfflineSyncQueue>;
  conflicts!: Table<OfflineConflict>;
  cache!: Table<OfflineCache>;
  analytics!: Table<OfflineAnalytics>;
  settings!: Table<OfflineSettings>;

  constructor() {
    super('TahitiSpeakAdvancedDB');

    this.version(1).stores({
      lessons: '++id, title, level, downloadedAt, lastAccessedAt, syncStatus, version',
      userProgress: '++id, userId, lessonId, lastStudiedAt, syncStatus, version, offline',
      mediaAssets: '++id, url, type, downloadedAt, lastAccessedAt, expiresAt',
      syncQueue: '++id, action, table, recordId, timestamp, retryCount, priority',
      conflicts: '++id, table, recordId, timestamp, resolved',
      cache: '++id, key, timestamp, expiresAt, *tags',
      analytics: '++id, event, timestamp, userId, sessionId, synced',
      settings: '++id, key, updatedAt'
    });

    // Hooks for automatic data management
    this.lessons.hook('creating', (primKey, obj, trans) => {
      obj.downloadedAt = new Date();
      obj.lastAccessedAt = new Date();
      obj.syncStatus = 'synced';
      obj.version = 1;
    });

    this.lessons.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.lastAccessedAt = new Date();
      if (modifications.content || modifications.exercises) {
        modifications.version = (obj.version || 1) + 1;
        modifications.syncStatus = 'pending';
      }
    });

    this.userProgress.hook('creating', (primKey, obj, trans) => {
      obj.lastStudiedAt = new Date();
      obj.syncStatus = 'pending';
      obj.version = 1;
      obj.offline = !navigator.onLine;
    });

    this.userProgress.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.lastStudiedAt = new Date();
      modifications.version = (obj.version || 1) + 1;
      modifications.syncStatus = 'pending';
      modifications.offline = !navigator.onLine;
    });

    this.mediaAssets.hook('creating', (primKey, obj, trans) => {
      obj.downloadedAt = new Date();
      obj.lastAccessedAt = new Date();
    });

    this.mediaAssets.hook('reading', (obj) => {
      // Update last accessed time when reading media assets
      this.mediaAssets.update(obj.id, { lastAccessedAt: new Date() });
      return obj;
    });
  }

  // Lesson management
  async storeLessonOffline(lesson: any, compress: boolean = true): Promise<void> {
    try {
      let content = lesson.content;
      let size = JSON.stringify(lesson).length;
      
      if (compress) {
        content = LZString.compress(JSON.stringify(lesson.content));
        size = content.length;
      }

      const offlineLesson: OfflineLesson = {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        level: lesson.level,
        content,
        audioFiles: lesson.audioFiles || [],
        images: lesson.images || [],
        exercises: lesson.exercises || [],
        culturalNotes: lesson.culturalNotes || [],
        downloadedAt: new Date(),
        lastAccessedAt: new Date(),
        syncStatus: 'synced',
        version: lesson.version || 1,
        compressed: compress,
        size
      };

      await this.lessons.put(offlineLesson);
    } catch (error) {
      console.error('Error storing lesson offline:', error);
      throw error;
    }
  }

  async getLessonOffline(lessonId: string): Promise<OfflineLesson | null> {
    try {
      const lesson = await this.lessons.get(lessonId);
      if (!lesson) return null;

      // Decompress content if needed
      if (lesson.compressed && typeof lesson.content === 'string') {
        lesson.content = JSON.parse(LZString.decompress(lesson.content) || '{}');
      }

      // Update last accessed time
      await this.lessons.update(lessonId, { lastAccessedAt: new Date() });

      return lesson;
    } catch (error) {
      console.error('Error getting lesson offline:', error);
      return null;
    }
  }

  async getAllLessonsOffline(): Promise<OfflineLesson[]> {
    try {
      const lessons = await this.lessons.toArray();
      
      // Decompress content for all lessons
      return lessons.map(lesson => {
        if (lesson.compressed && typeof lesson.content === 'string') {
          lesson.content = JSON.parse(LZString.decompress(lesson.content) || '{}');
        }
        return lesson;
      });
    } catch (error) {
      console.error('Error getting all lessons offline:', error);
      return [];
    }
  }

  // User progress management
  async storeUserProgress(progress: Omit<OfflineUserProgress, 'id' | 'lastStudiedAt' | 'syncStatus' | 'version' | 'offline'>): Promise<void> {
    try {
      await this.userProgress.put({
        ...progress,
        id: `${progress.userId}_${progress.lessonId}`,
        lastStudiedAt: new Date(),
        syncStatus: 'pending',
        version: 1,
        offline: !navigator.onLine
      });
    } catch (error) {
      console.error('Error storing user progress:', error);
      throw error;
    }
  }

  async getUserProgress(userId: string, lessonId?: string): Promise<OfflineUserProgress[]> {
    try {
      let query = this.userProgress.where('userId').equals(userId);
      
      if (lessonId) {
        query = query.and(progress => progress.lessonId === lessonId);
      }

      return await query.toArray();
    } catch (error) {
      console.error('Error getting user progress:', error);
      return [];
    }
  }

  // Media asset management
  async storeMediaAsset(url: string, blob: Blob, type: 'audio' | 'image' | 'video', expiresIn?: number): Promise<void> {
    try {
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : undefined;
      
      const asset: OfflineMediaAsset = {
        id: this.generateId(),
        url,
        type,
        blob,
        size: blob.size,
        downloadedAt: new Date(),
        lastAccessedAt: new Date(),
        expiresAt,
        compressed: false
      };

      await this.mediaAssets.put(asset);
    } catch (error) {
      console.error('Error storing media asset:', error);
      throw error;
    }
  }

  async getMediaAsset(url: string): Promise<OfflineMediaAsset | null> {
    try {
      const asset = await this.mediaAssets.where('url').equals(url).first();
      
      if (asset) {
        // Check if expired
        if (asset.expiresAt && asset.expiresAt < new Date()) {
          await this.mediaAssets.delete(asset.id);
          return null;
        }

        // Update last accessed time
        await this.mediaAssets.update(asset.id, { lastAccessedAt: new Date() });
      }

      return asset || null;
    } catch (error) {
      console.error('Error getting media asset:', error);
      return null;
    }
  }

  // Sync queue management
  async addToSyncQueue(action: 'create' | 'update' | 'delete', table: string, recordId: string, data: any, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
    try {
      const queueItem: OfflineSyncQueue = {
        id: this.generateId(),
        action,
        table,
        recordId,
        data,
        timestamp: new Date(),
        retryCount: 0,
        priority
      };

      await this.syncQueue.put(queueItem);
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  }

  async getSyncQueue(priority?: 'low' | 'medium' | 'high'): Promise<OfflineSyncQueue[]> {
    try {
      let query = this.syncQueue.orderBy('timestamp');
      
      if (priority) {
        query = query.filter(item => item.priority === priority);
      }

      return await query.toArray();
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    try {
      await this.syncQueue.delete(id);
    } catch (error) {
      console.error('Error removing from sync queue:', error);
      throw error;
    }
  }

  async updateSyncQueueItem(id: string, updates: Partial<OfflineSyncQueue>): Promise<void> {
    try {
      await this.syncQueue.update(id, updates);
    } catch (error) {
      console.error('Error updating sync queue item:', error);
      throw error;
    }
  }

  // Conflict management
  async addConflict(table: string, recordId: string, localData: any, remoteData: any, conflictType: 'update' | 'delete'): Promise<void> {
    try {
      const conflict: OfflineConflict = {
        id: this.generateId(),
        table,
        recordId,
        localData,
        remoteData,
        conflictType,
        timestamp: new Date(),
        resolved: false
      };

      await this.conflicts.put(conflict);
    } catch (error) {
      console.error('Error adding conflict:', error);
      throw error;
    }
  }

  async getConflicts(resolved: boolean = false): Promise<OfflineConflict[]> {
    try {
      return await this.conflicts.where('resolved').equals(resolved).toArray();
    } catch (error) {
      console.error('Error getting conflicts:', error);
      return [];
    }
  }

  async resolveConflict(id: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any): Promise<void> {
    try {
      await this.conflicts.update(id, {
        resolved: true,
        resolution
      });

      // Apply resolution based on type
      const conflict = await this.conflicts.get(id);
      if (conflict) {
        const table = this.getTable(conflict.table);
        if (table) {
          switch (resolution) {
            case 'local':
              await table.put(conflict.localData);
              break;
            case 'remote':
              await table.put(conflict.remoteData);
              break;
            case 'merge':
              if (mergedData) {
                await table.put(mergedData);
              }
              break;
          }
        }
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  }

  // Cache management
  async setCache(key: string, data: any, expiresIn: number = 3600000, tags: string[] = []): Promise<void> {
    try {
      const compressed = LZString.compress(JSON.stringify(data));
      const size = compressed.length;

      const cacheItem: OfflineCache = {
        id: this.generateId(),
        key,
        data: compressed,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + expiresIn),
        size,
        compressed: true,
        tags
      };

      await this.cache.put(cacheItem);
    } catch (error) {
      console.error('Error setting cache:', error);
      throw error;
    }
  }

  async getCache(key: string): Promise<any | null> {
    try {
      const item = await this.cache.where('key').equals(key).first();
      
      if (!item) return null;

      // Check if expired
      if (item.expiresAt < new Date()) {
        await this.cache.delete(item.id);
        return null;
      }

      // Decompress data
      const data = JSON.parse(LZString.decompress(item.data) || 'null');
      return data;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  async clearCacheByTag(tag: string): Promise<void> {
    try {
      const items = await this.cache.where('tags').anyOf([tag]).toArray();
      const ids = items.map(item => item.id);
      await this.cache.bulkDelete(ids);
    } catch (error) {
      console.error('Error clearing cache by tag:', error);
      throw error;
    }
  }

  // Analytics management
  async storeAnalyticsEvent(event: string, data: any, userId?: string): Promise<void> {
    try {
      const analyticsEvent: OfflineAnalytics = {
        id: this.generateId(),
        event,
        data,
        timestamp: new Date(),
        userId,
        sessionId: this.getSessionId(),
        synced: false
      };

      await this.analytics.put(analyticsEvent);
    } catch (error) {
      console.error('Error storing analytics event:', error);
      throw error;
    }
  }

  async getUnsyncedAnalytics(): Promise<OfflineAnalytics[]> {
    try {
      return await this.analytics.where('synced').equals(false).toArray();
    } catch (error) {
      console.error('Error getting unsynced analytics:', error);
      return [];
    }
  }

  async markAnalyticsSynced(ids: string[]): Promise<void> {
    try {
      await this.analytics.where('id').anyOf(ids).modify({ synced: true });
    } catch (error) {
      console.error('Error marking analytics as synced:', error);
      throw error;
    }
  }

  // Settings management
  async setSetting(key: string, value: any): Promise<void> {
    try {
      await this.settings.put({
        id: key,
        key,
        value,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error setting setting:', error);
      throw error;
    }
  }

  async getSetting(key: string, defaultValue?: any): Promise<any> {
    try {
      const setting = await this.settings.get(key);
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  }

  // Storage management
  async getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (used / quota) * 100 : 0;

        return { used, quota, percentage };
      }

      // Fallback: estimate based on IndexedDB size
      const tables = [this.lessons, this.userProgress, this.mediaAssets, this.cache];
      let totalSize = 0;

      for (const table of tables) {
        const items = await table.toArray();
        totalSize += JSON.stringify(items).length;
      }

      return { used: totalSize, quota: 50 * 1024 * 1024, percentage: (totalSize / (50 * 1024 * 1024)) * 100 };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { used: 0, quota: 0, percentage: 0 };
    }
  }

  async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();

      // Clean expired cache
      await this.cache.where('expiresAt').below(now).delete();

      // Clean expired media assets
      await this.mediaAssets.where('expiresAt').below(now).delete();

      // Clean old analytics (older than 30 days and synced)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await this.analytics
        .where('timestamp').below(thirtyDaysAgo)
        .and(item => item.synced)
        .delete();

      // Clean old sync queue items (older than 7 days and failed multiple times)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await this.syncQueue
        .where('timestamp').below(sevenDaysAgo)
        .and(item => item.retryCount > 5)
        .delete();
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
      throw error;
    }
  }

  async optimizeStorage(): Promise<void> {
    try {
      // Clean up expired data first
      await this.cleanupExpiredData();

      // Remove least recently used media assets if storage is getting full
      const usage = await this.getStorageUsage();
      if (usage.percentage > 80) {
        const oldAssets = await this.mediaAssets
          .orderBy('lastAccessedAt')
          .limit(10)
          .toArray();
        
        const idsToDelete = oldAssets.map(asset => asset.id);
        await this.mediaAssets.bulkDelete(idsToDelete);
      }

      // Compress old lessons that aren't compressed yet
      const uncompressedLessons = await this.lessons
        .where('compressed').equals(false)
        .and(lesson => lesson.downloadedAt < new Date(Date.now() - 24 * 60 * 60 * 1000))
        .toArray();

      for (const lesson of uncompressedLessons) {
        const compressed = LZString.compress(JSON.stringify(lesson.content));
        await this.lessons.update(lesson.id, {
          content: compressed,
          compressed: true,
          size: compressed.length
        });
      }
    } catch (error) {
      console.error('Error optimizing storage:', error);
      throw error;
    }
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('tahiti_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('tahiti_session_id', sessionId);
    }
    return sessionId;
  }

  private getTable(tableName: string): Table<any> | null {
    switch (tableName) {
      case 'lessons': return this.lessons;
      case 'userProgress': return this.userProgress;
      case 'mediaAssets': return this.mediaAssets;
      case 'cache': return this.cache;
      case 'analytics': return this.analytics;
      case 'settings': return this.settings;
      default: return null;
    }
  }

  // Backup and restore
  async exportData(): Promise<string> {
    try {
      const data = {
        lessons: await this.lessons.toArray(),
        userProgress: await this.userProgress.toArray(),
        settings: await this.settings.toArray(),
        timestamp: new Date().toISOString()
      };

      return LZString.compress(JSON.stringify(data));
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importData(compressedData: string): Promise<void> {
    try {
      const data = JSON.parse(LZString.decompress(compressedData) || '{}');

      if (data.lessons) {
        await this.lessons.bulkPut(data.lessons);
      }
      if (data.userProgress) {
        await this.userProgress.bulkPut(data.userProgress);
      }
      if (data.settings) {
        await this.settings.bulkPut(data.settings);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const advancedIndexedDBService = new AdvancedIndexedDBService();

// Initialize the service
export const initializeAdvancedIndexedDB = async (): Promise<void> => {
  try {
    await advancedIndexedDBService.open();
    console.log('Advanced IndexedDB service initialized successfully');
    
    // Set up periodic cleanup
    setInterval(() => {
      advancedIndexedDBService.cleanupExpiredData().catch(console.error);
    }, 60 * 60 * 1000); // Every hour

    // Set up periodic optimization
    setInterval(() => {
      advancedIndexedDBService.optimizeStorage().catch(console.error);
    }, 24 * 60 * 60 * 1000); // Every day
  } catch (error) {
    console.error('Failed to initialize advanced IndexedDB service:', error);
    throw error;
  }
};

export default advancedIndexedDBService;