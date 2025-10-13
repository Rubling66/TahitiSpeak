import Dexie, { Table } from 'dexie';
import { compress, decompress } from 'lz-string';

// Offline content interfaces
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
  lastUpdated: Date;
  version: number;
  size: number;
}

export interface OfflineStory {
  id: string;
  title: string;
  description: string;
  passages: any[];
  choices: any[];
  culturalAnnotations: any[];
  audioNarration: string[];
  images: string[];
  downloadedAt: Date;
  lastUpdated: Date;
  version: number;
  size: number;
}

export interface OfflineCulturalContent {
  id: string;
  title: string;
  type: 'tradition' | 'history' | 'language' | 'custom';
  content: any;
  images: string[];
  audioFiles: string[];
  downloadedAt: Date;
  lastUpdated: Date;
  version: number;
  size: number;
}

export interface OfflineAudioFile {
  id: string;
  url: string;
  blob: Blob;
  contentType: string;
  size: number;
  downloadedAt: Date;
  lastAccessed: Date;
  accessCount: number;
}

// User data interfaces
export interface OfflineUserProgress {
  id: string;
  userId: string;
  lessonId?: string;
  storyId?: string;
  progressData: any;
  completedAt?: Date;
  score?: number;
  timeSpent: number;
  lastModified: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  localVersion: number;
  remoteVersion?: number;
}

export interface OfflineAchievement {
  id: string;
  userId: string;
  achievementType: string;
  title: string;
  description: string;
  earnedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  lastModified: Date;
}

export interface OfflineBookmark {
  id: string;
  userId: string;
  contentId: string;
  contentType: 'lesson' | 'story' | 'cultural';
  title: string;
  createdAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  lastModified: Date;
}

export interface OfflineNote {
  id: string;
  userId: string;
  contentId: string;
  contentType: 'lesson' | 'story' | 'cultural';
  content: string;
  position?: any;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  localVersion: number;
  remoteVersion?: number;
}

// Sync management interfaces
export interface SyncQueueItem {
  id: string;
  type: 'progress' | 'achievement' | 'bookmark' | 'note';
  action: 'create' | 'update' | 'delete';
  data: any;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  createdAt: Date;
}

export interface ConflictItem {
  id: string;
  type: 'progress' | 'note' | 'bookmark' | 'achievement';
  localData: any;
  remoteData: any;
  conflictType: 'update_conflict' | 'delete_conflict' | 'create_conflict';
  timestamp: Date;
  resolved: boolean;
}

export interface SyncTimestamp {
  id: string;
  type: 'progress' | 'content' | 'user_data';
  lastSync: Date;
  nextSync?: Date;
}

// Download management interfaces
export interface DownloadItem {
  id: string;
  type: 'lesson' | 'story' | 'audio' | 'image' | 'cultural';
  contentId: string;
  url: string;
  size: number;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  downloadedBytes: number;
  speed: number;
  estimatedTimeRemaining: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CacheItem {
  id: string;
  type: string;
  size: number;
  priority: number;
  lastAccessed: Date;
  accessCount: number;
  userRelevance: number;
  data?: any;
}

// Compressed content wrapper
export interface CompressedContent {
  id: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  data: string; // LZ-compressed string
  createdAt: Date;
}

class OfflineDatabase extends Dexie {
  // Content tables
  lessons!: Table<OfflineLesson>;
  stories!: Table<OfflineStory>;
  culturalContent!: Table<OfflineCulturalContent>;
  audioFiles!: Table<OfflineAudioFile>;

  // User data tables
  userProgress!: Table<OfflineUserProgress>;
  achievements!: Table<OfflineAchievement>;
  bookmarks!: Table<OfflineBookmark>;
  notes!: Table<OfflineNote>;

  // Sync management tables
  syncQueue!: Table<SyncQueueItem>;
  conflictResolution!: Table<ConflictItem>;
  lastSync!: Table<SyncTimestamp>;

  // Download management tables
  downloadQueue!: Table<DownloadItem>;
  cacheItems!: Table<CacheItem>;

  // Compressed content table
  compressedContent!: Table<CompressedContent>;

  constructor() {
    super('TahitiSpeakOfflineDB');

    this.version(1).stores({
      // Content stores
      lessons: 'id, title, level, downloadedAt, lastUpdated, version, size',
      stories: 'id, title, downloadedAt, lastUpdated, version, size',
      culturalContent: 'id, title, type, downloadedAt, lastUpdated, version, size',
      audioFiles: 'id, url, size, downloadedAt, lastAccessed, accessCount',

      // User data stores
      userProgress: 'id, userId, lessonId, storyId, lastModified, syncStatus, localVersion',
      achievements: 'id, userId, achievementType, earnedAt, syncStatus, lastModified',
      bookmarks: 'id, userId, contentId, contentType, createdAt, syncStatus, lastModified',
      notes: 'id, userId, contentId, contentType, createdAt, updatedAt, syncStatus, localVersion',

      // Sync management stores
      syncQueue: 'id, type, action, priority, attempts, lastAttempt, createdAt',
      conflictResolution: 'id, type, conflictType, timestamp, resolved',
      lastSync: 'id, type, lastSync, nextSync',

      // Download management stores
      downloadQueue: 'id, type, contentId, priority, status, progress, createdAt',
      cacheItems: 'id, type, priority, lastAccessed, accessCount, userRelevance',

      // Compressed content store
      compressedContent: 'id, originalSize, compressedSize, compressionRatio, createdAt'
    });

    // Add hooks for automatic compression/decompression
    this.lessons.hook('creating', (primKey, obj, trans) => {
      if (obj.content && typeof obj.content === 'object') {
        const compressed = this.compressData(obj.content);
        obj.content = compressed.id;
        this.compressedContent.add(compressed);
      }
    });

    this.lessons.hook('reading', (obj) => {
      if (obj.content && typeof obj.content === 'string') {
        // Content is compressed, decompress it
        return this.decompressData(obj.content).then(decompressed => {
          obj.content = decompressed;
          return obj;
        });
      }
      return obj;
    });

    this.stories.hook('creating', (primKey, obj, trans) => {
      if (obj.passages && Array.isArray(obj.passages)) {
        const compressed = this.compressData(obj.passages);
        obj.passages = compressed.id;
        this.compressedContent.add(compressed);
      }
    });

    this.stories.hook('reading', (obj) => {
      if (obj.passages && typeof obj.passages === 'string') {
        return this.decompressData(obj.passages).then(decompressed => {
          obj.passages = decompressed;
          return obj;
        });
      }
      return obj;
    });
  }

  // Compression utilities
  compressData(data: any): CompressedContent {
    const jsonString = JSON.stringify(data);
    const compressed = compress(jsonString);
    const originalSize = new Blob([jsonString]).size;
    const compressedSize = new Blob([compressed]).size;

    return {
      id: `compressed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize,
      data: compressed,
      createdAt: new Date()
    };
  }

  async decompressData(compressedId: string): Promise<any> {
    const compressed = await this.compressedContent.get(compressedId);
    if (!compressed) {
      throw new Error(`Compressed data not found: ${compressedId}`);
    }

    const decompressed = decompress(compressed.data);
    if (!decompressed) {
      throw new Error(`Failed to decompress data: ${compressedId}`);
    }

    return JSON.parse(decompressed);
  }

  // Storage management utilities
  async getStorageUsage() {
    const [
      lessonsSize,
      storiesSize,
      culturalSize,
      audioSize,
      userDataSize,
      compressedSize
    ] = await Promise.all([
      this.calculateTableSize('lessons'),
      this.calculateTableSize('stories'),
      this.calculateTableSize('culturalContent'),
      this.calculateTableSize('audioFiles'),
      this.calculateUserDataSize(),
      this.calculateTableSize('compressedContent')
    ]);

    const totalSize = lessonsSize + storiesSize + culturalSize + audioSize + userDataSize + compressedSize;

    return {
      totalSize,
      contentBreakdown: {
        lessons: lessonsSize,
        stories: storiesSize,
        cultural: culturalSize,
        audio: audioSize,
        userData: userDataSize,
        compressed: compressedSize
      }
    };
  }

  private async calculateTableSize(tableName: string): Promise<number> {
    const table = (this as any)[tableName];
    if (!table) return 0;

    const items = await table.toArray();
    return items.reduce((total: number, item: any) => {
      return total + (item.size || this.estimateObjectSize(item));
    }, 0);
  }

  private async calculateUserDataSize(): Promise<number> {
    const [progress, achievements, bookmarks, notes] = await Promise.all([
      this.userProgress.toArray(),
      this.achievements.toArray(),
      this.bookmarks.toArray(),
      this.notes.toArray()
    ]);

    return [progress, achievements, bookmarks, notes].reduce((total, items) => {
      return total + items.reduce((subtotal, item) => {
        return subtotal + this.estimateObjectSize(item);
      }, 0);
    }, 0);
  }

  private estimateObjectSize(obj: any): number {
    return new Blob([JSON.stringify(obj)]).size;
  }

  // Cleanup utilities
  async clearExpiredCache(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoffDate = new Date(Date.now() - maxAge);
    
    await Promise.all([
      this.audioFiles.where('lastAccessed').below(cutoffDate).delete(),
      this.compressedContent.where('createdAt').below(cutoffDate).delete(),
      this.cacheItems.where('lastAccessed').below(cutoffDate).delete()
    ]);
  }

  async optimizeStorage(): Promise<void> {
    // Remove duplicate audio files
    const audioFiles = await this.audioFiles.toArray();
    const urlMap = new Map<string, OfflineAudioFile>();
    
    for (const file of audioFiles) {
      const existing = urlMap.get(file.url);
      if (existing) {
        // Keep the one with higher access count
        if (file.accessCount > existing.accessCount) {
          await this.audioFiles.delete(existing.id);
          urlMap.set(file.url, file);
        } else {
          await this.audioFiles.delete(file.id);
        }
      } else {
        urlMap.set(file.url, file);
      }
    }

    // Clean up orphaned compressed content
    const compressedIds = new Set((await this.compressedContent.toArray()).map(c => c.id));
    const lessons = await this.lessons.toArray();
    const stories = await this.stories.toArray();
    
    const usedCompressedIds = new Set<string>();
    lessons.forEach(lesson => {
      if (typeof lesson.content === 'string' && compressedIds.has(lesson.content)) {
        usedCompressedIds.add(lesson.content);
      }
    });
    
    stories.forEach(story => {
      if (typeof story.passages === 'string' && compressedIds.has(story.passages)) {
        usedCompressedIds.add(story.passages);
      }
    });

    const orphanedIds = Array.from(compressedIds).filter(id => !usedCompressedIds.has(id));
    if (orphanedIds.length > 0) {
      await this.compressedContent.bulkDelete(orphanedIds);
    }
  }

  // Sync queue management
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'attempts' | 'createdAt'>): Promise<void> {
    await this.syncQueue.add({
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attempts: 0,
      createdAt: new Date()
    });
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return this.syncQueue.where('attempts').below(3).toArray();
  }

  async markSyncCompleted(itemId: string): Promise<void> {
    await this.syncQueue.delete(itemId);
  }

  async markSyncFailed(itemId: string, error: string): Promise<void> {
    const item = await this.syncQueue.get(itemId);
    if (item) {
      await this.syncQueue.update(itemId, {
        attempts: item.attempts + 1,
        lastAttempt: new Date(),
        error
      });
    }
  }
}

// Create and export database instance
export const offlineDB = new OfflineDatabase();

// Initialize database
export const initializeOfflineDatabase = async (): Promise<void> => {
  try {
    await offlineDB.open();
    console.log('Offline database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline database:', error);
    throw error;
  }
};

export default offlineDB;