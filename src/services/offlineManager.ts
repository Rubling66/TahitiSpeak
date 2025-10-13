import { offlineDB, OfflineLesson, OfflineStory, OfflineUserProgress, OfflineAudioFile, DownloadItem, SyncQueueItem, ConflictItem } from './offlineDatabase';
import { supabase } from './supabase';

export interface StorageUsage {
  totalSize: number;
  availableSpace: number;
  usedSpace: number;
  contentBreakdown: {
    lessons: number;
    stories: number;
    audio: number;
    images: number;
    userData: number;
    compressed: number;
  };
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingItems: number;
  conflicts: number;
  syncInProgress: boolean;
  nextScheduledSync: Date | null;
}

export interface DownloadProgress {
  itemId: string;
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: number;
  estimatedTimeRemaining: number;
  error?: string;
}

export interface ConflictResolution {
  action: 'use_local' | 'use_remote' | 'merge' | 'manual';
  resolvedData?: any;
  requiresUserInput: boolean;
}

class OfflineManager {
  private downloadProgressCallbacks: ((progress: DownloadProgress) => void)[] = [];
  private syncStatusCallbacks: ((status: SyncStatus) => void)[] = [];
  private isInitialized = false;
  private syncInProgress = false;
  private downloadQueue: Map<string, AbortController> = new Map();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await offlineDB.open();
      this.setupEventListeners();
      this.schedulePeriodicSync();
      this.isInitialized = true;
      console.log('OfflineManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OfflineManager:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Device came online, triggering sync');
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      console.log('Device went offline');
      this.notifySyncStatusChange();
    });

    // Listen for storage quota warnings
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      this.monitorStorageQuota();
    }
  }

  private async monitorStorageQuota(): Promise<void> {
    try {
      const estimate = await navigator.storage.estimate();
      const usageRatio = (estimate.usage || 0) / (estimate.quota || 1);
      
      if (usageRatio > 0.8) {
        console.warn('Storage quota nearly exceeded, optimizing storage');
        await this.optimizeStorage();
      }
    } catch (error) {
      console.error('Failed to check storage quota:', error);
    }
  }

  private schedulePeriodicSync(): void {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncWhenOnline();
      }
    }, 5 * 60 * 1000);
  }

  // Content Management
  async downloadContent(contentId: string, type: 'lesson' | 'story'): Promise<void> {
    try {
      const downloadItem: DownloadItem = {
        id: `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        contentId,
        url: `/api/${type}s/${contentId}`,
        size: 0,
        priority: 'medium',
        dependencies: [],
        status: 'queued',
        progress: 0,
        downloadedBytes: 0,
        speed: 0,
        estimatedTimeRemaining: 0,
        createdAt: new Date()
      };

      await offlineDB.downloadQueue.add(downloadItem);
      await this.processDownloadQueue();
    } catch (error) {
      console.error(`Failed to download ${type}:`, error);
      throw error;
    }
  }

  private async processDownloadQueue(): Promise<void> {
    const queuedItems = await offlineDB.downloadQueue
      .where('status')
      .equals('queued')
      .sortBy('priority');

    for (const item of queuedItems) {
      if (this.downloadQueue.size >= 3) break; // Limit concurrent downloads

      await this.downloadItem(item);
    }
  }

  private async downloadItem(item: DownloadItem): Promise<void> {
    const abortController = new AbortController();
    this.downloadQueue.set(item.id, abortController);

    try {
      await offlineDB.downloadQueue.update(item.id, {
        status: 'downloading',
        startedAt: new Date()
      });

      const response = await fetch(item.url, {
        signal: abortController.signal,
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0');
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let downloadedBytes = 0;
      const chunks: Uint8Array[] = [];
      const startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        downloadedBytes += value.length;
        
        const progress = contentLength > 0 ? (downloadedBytes / contentLength) * 100 : 0;
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = downloadedBytes / elapsed;
        const estimatedTimeRemaining = contentLength > 0 ? 
          (contentLength - downloadedBytes) / speed : 0;

        const progressData: DownloadProgress = {
          itemId: item.id,
          status: 'downloading',
          progress,
          downloadedBytes,
          totalBytes: contentLength,
          speed,
          estimatedTimeRemaining
        };

        await offlineDB.downloadQueue.update(item.id, {
          progress,
          downloadedBytes,
          speed,
          estimatedTimeRemaining
        });

        this.notifyDownloadProgress(progressData);
      }

      // Combine chunks and parse content
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const contentText = new TextDecoder().decode(combined);
      const content = JSON.parse(contentText);

      // Store content in appropriate table
      if (item.type === 'lesson') {
        await this.storeOfflineLesson(content);
      } else if (item.type === 'story') {
        await this.storeOfflineStory(content);
      }

      // Download associated media files
      await this.downloadMediaFiles(content, item.type);

      await offlineDB.downloadQueue.update(item.id, {
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      });

      this.notifyDownloadProgress({
        itemId: item.id,
        status: 'completed',
        progress: 100,
        downloadedBytes,
        totalBytes: contentLength,
        speed: 0,
        estimatedTimeRemaining: 0
      });

    } catch (error) {
      console.error(`Download failed for item ${item.id}:`, error);
      
      await offlineDB.downloadQueue.update(item.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      this.notifyDownloadProgress({
        itemId: item.id,
        status: 'failed',
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        speed: 0,
        estimatedTimeRemaining: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.downloadQueue.delete(item.id);
    }
  }

  private async storeOfflineLesson(lesson: any): Promise<void> {
    const offlineLesson: OfflineLesson = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      level: lesson.level,
      content: lesson.content,
      audioFiles: lesson.audioFiles || [],
      images: lesson.images || [],
      exercises: lesson.exercises || [],
      culturalNotes: lesson.culturalNotes || [],
      downloadedAt: new Date(),
      lastUpdated: new Date(lesson.updated_at || Date.now()),
      version: lesson.version || 1,
      size: this.estimateContentSize(lesson)
    };

    await offlineDB.lessons.put(offlineLesson);
  }

  private async storeOfflineStory(story: any): Promise<void> {
    const offlineStory: OfflineStory = {
      id: story.id,
      title: story.title,
      description: story.description,
      passages: story.passages || [],
      choices: story.choices || [],
      culturalAnnotations: story.culturalAnnotations || [],
      audioNarration: story.audioNarration || [],
      images: story.images || [],
      downloadedAt: new Date(),
      lastUpdated: new Date(story.updated_at || Date.now()),
      version: story.version || 1,
      size: this.estimateContentSize(story)
    };

    await offlineDB.stories.put(offlineStory);
  }

  private async downloadMediaFiles(content: any, contentType: string): Promise<void> {
    const mediaUrls: string[] = [];
    
    // Extract audio file URLs
    if (content.audioFiles) {
      mediaUrls.push(...content.audioFiles);
    }
    
    // Extract image URLs
    if (content.images) {
      mediaUrls.push(...content.images);
    }

    // Download each media file
    for (const url of mediaUrls) {
      try {
        await this.downloadAndCacheMediaFile(url);
      } catch (error) {
        console.error(`Failed to download media file ${url}:`, error);
      }
    }
  }

  private async downloadAndCacheMediaFile(url: string): Promise<void> {
    // Check if already cached
    const existing = await offlineDB.audioFiles.where('url').equals(url).first();
    if (existing) {
      // Update access count
      await offlineDB.audioFiles.update(existing.id, {
        lastAccessed: new Date(),
        accessCount: existing.accessCount + 1
      });
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const audioFile: OfflineAudioFile = {
        id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url,
        blob,
        contentType: blob.type,
        size: blob.size,
        downloadedAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1
      };

      await offlineDB.audioFiles.add(audioFile);
    } catch (error) {
      console.error(`Failed to cache media file ${url}:`, error);
    }
  }

  private estimateContentSize(content: any): number {
    return new Blob([JSON.stringify(content)]).size;
  }

  async removeContent(contentId: string, type: 'lesson' | 'story'): Promise<void> {
    try {
      if (type === 'lesson') {
        await offlineDB.lessons.delete(contentId);
      } else if (type === 'story') {
        await offlineDB.stories.delete(contentId);
      }

      // Clean up associated media files that are no longer needed
      await this.cleanupUnusedMediaFiles();
    } catch (error) {
      console.error(`Failed to remove ${type}:`, error);
      throw error;
    }
  }

  private async cleanupUnusedMediaFiles(): Promise<void> {
    const [lessons, stories] = await Promise.all([
      offlineDB.lessons.toArray(),
      offlineDB.stories.toArray()
    ]);

    const usedUrls = new Set<string>();
    
    lessons.forEach(lesson => {
      lesson.audioFiles.forEach(url => usedUrls.add(url));
      lesson.images.forEach(url => usedUrls.add(url));
    });

    stories.forEach(story => {
      story.audioNarration.forEach(url => usedUrls.add(url));
      story.images.forEach(url => usedUrls.add(url));
    });

    const allAudioFiles = await offlineDB.audioFiles.toArray();
    const unusedFiles = allAudioFiles.filter(file => !usedUrls.has(file.url));
    
    if (unusedFiles.length > 0) {
      await offlineDB.audioFiles.bulkDelete(unusedFiles.map(f => f.id));
    }
  }

  async getOfflineContent(type: 'lesson' | 'story'): Promise<any[]> {
    if (type === 'lesson') {
      return offlineDB.lessons.toArray();
    } else if (type === 'story') {
      return offlineDB.stories.toArray();
    }
    return [];
  }

  // Storage Management
  async getStorageUsage(): Promise<StorageUsage> {
    const usage = await offlineDB.getStorageUsage();
    
    let availableSpace = 0;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        availableSpace = (estimate.quota || 0) - (estimate.usage || 0);
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
      }
    }

    return {
      totalSize: usage.totalSize,
      availableSpace,
      usedSpace: usage.totalSize,
      contentBreakdown: {
        lessons: usage.contentBreakdown.lessons,
        stories: usage.contentBreakdown.stories,
        audio: usage.contentBreakdown.audio,
        images: 0, // Images are included in audio files table
        userData: usage.contentBreakdown.userData,
        compressed: usage.contentBreakdown.compressed
      }
    };
  }

  async clearCache(): Promise<void> {
    await Promise.all([
      offlineDB.lessons.clear(),
      offlineDB.stories.clear(),
      offlineDB.culturalContent.clear(),
      offlineDB.audioFiles.clear(),
      offlineDB.compressedContent.clear(),
      offlineDB.downloadQueue.clear(),
      offlineDB.cacheItems.clear()
    ]);
  }

  async optimizeStorage(): Promise<void> {
    await offlineDB.optimizeStorage();
    await offlineDB.clearExpiredCache();
  }

  // Sync Management
  async syncWhenOnline(): Promise<void> {
    if (!navigator.onLine || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    this.notifySyncStatusChange();

    try {
      await this.syncUserProgress();
      await this.syncUserData();
      await this.syncContentUpdates();
      
      // Update last sync timestamp
      await offlineDB.lastSync.put({
        id: 'last_full_sync',
        type: 'progress',
        lastSync: new Date()
      });

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
      this.notifySyncStatusChange();
    }
  }

  private async syncUserProgress(): Promise<void> {
    const pendingProgress = await offlineDB.userProgress
      .where('syncStatus')
      .equals('pending')
      .toArray();

    for (const progress of pendingProgress) {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .upsert({
            id: progress.id,
            user_id: progress.userId,
            lesson_id: progress.lessonId,
            story_id: progress.storyId,
            progress_data: progress.progressData,
            completed_at: progress.completedAt,
            score: progress.score,
            time_spent: progress.timeSpent,
            updated_at: progress.lastModified
          });

        if (error) {
          throw error;
        }

        await offlineDB.userProgress.update(progress.id, {
          syncStatus: 'synced'
        });

      } catch (error) {
        console.error(`Failed to sync progress ${progress.id}:`, error);
        await offlineDB.addToSyncQueue({
          type: 'progress',
          action: 'update',
          data: progress,
          priority: 'high'
        });
      }
    }
  }

  private async syncUserData(): Promise<void> {
    // Sync achievements
    const pendingAchievements = await offlineDB.achievements
      .where('syncStatus')
      .equals('pending')
      .toArray();

    for (const achievement of pendingAchievements) {
      try {
        const { error } = await supabase
          .from('user_achievements')
          .upsert({
            id: achievement.id,
            user_id: achievement.userId,
            achievement_type: achievement.achievementType,
            title: achievement.title,
            description: achievement.description,
            earned_at: achievement.earnedAt
          });

        if (error) throw error;

        await offlineDB.achievements.update(achievement.id, {
          syncStatus: 'synced'
        });
      } catch (error) {
        console.error(`Failed to sync achievement ${achievement.id}:`, error);
      }
    }

    // Sync bookmarks
    const pendingBookmarks = await offlineDB.bookmarks
      .where('syncStatus')
      .equals('pending')
      .toArray();

    for (const bookmark of pendingBookmarks) {
      try {
        const { error } = await supabase
          .from('user_bookmarks')
          .upsert({
            id: bookmark.id,
            user_id: bookmark.userId,
            content_id: bookmark.contentId,
            content_type: bookmark.contentType,
            title: bookmark.title,
            created_at: bookmark.createdAt
          });

        if (error) throw error;

        await offlineDB.bookmarks.update(bookmark.id, {
          syncStatus: 'synced'
        });
      } catch (error) {
        console.error(`Failed to sync bookmark ${bookmark.id}:`, error);
      }
    }

    // Sync notes
    const pendingNotes = await offlineDB.notes
      .where('syncStatus')
      .equals('pending')
      .toArray();

    for (const note of pendingNotes) {
      try {
        const { error } = await supabase
          .from('user_notes')
          .upsert({
            id: note.id,
            user_id: note.userId,
            content_id: note.contentId,
            content_type: note.contentType,
            content: note.content,
            position: note.position,
            created_at: note.createdAt,
            updated_at: note.updatedAt
          });

        if (error) throw error;

        await offlineDB.notes.update(note.id, {
          syncStatus: 'synced'
        });
      } catch (error) {
        console.error(`Failed to sync note ${note.id}:`, error);
      }
    }
  }

  private async syncContentUpdates(): Promise<void> {
    // Check for content updates from server
    try {
      const { data: serverLessons } = await supabase
        .from('lessons')
        .select('id, updated_at, version')
        .order('updated_at', { ascending: false });

      if (serverLessons) {
        const localLessons = await offlineDB.lessons.toArray();
        const localLessonMap = new Map(localLessons.map(l => [l.id, l]));

        for (const serverLesson of serverLessons) {
          const localLesson = localLessonMap.get(serverLesson.id);
          if (localLesson) {
            const serverUpdated = new Date(serverLesson.updated_at);
            if (serverUpdated > localLesson.lastUpdated) {
              // Content needs update
              console.log(`Lesson ${serverLesson.id} needs update`);
              // Add to download queue for update
              await this.downloadContent(serverLesson.id, 'lesson');
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to check for content updates:', error);
    }
  }

  async forceSync(): Promise<void> {
    await this.syncWhenOnline();
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const [pendingSync, conflicts, lastSyncRecord] = await Promise.all([
      offlineDB.getPendingSyncItems(),
      offlineDB.conflictResolution.where('resolved').equals(false).toArray(),
      offlineDB.lastSync.get('last_full_sync')
    ]);

    return {
      isOnline: navigator.onLine,
      lastSync: lastSyncRecord?.lastSync || null,
      pendingItems: pendingSync.length,
      conflicts: conflicts.length,
      syncInProgress: this.syncInProgress,
      nextScheduledSync: null // Could implement scheduled sync
    };
  }

  // Conflict Resolution
  async resolveConflicts(): Promise<void> {
    const conflicts = await offlineDB.conflictResolution
      .where('resolved')
      .equals(false)
      .toArray();

    for (const conflict of conflicts) {
      try {
        const resolution = await this.autoResolveConflict(conflict);
        if (resolution.requiresUserInput) {
          // Skip for now, requires manual resolution
          continue;
        }

        await this.applyConflictResolution(conflict.id, resolution);
      } catch (error) {
        console.error(`Failed to resolve conflict ${conflict.id}:`, error);
      }
    }
  }

  private async autoResolveConflict(conflict: ConflictItem): Promise<ConflictResolution> {
    // Simple timestamp-based resolution for now
    const localTime = new Date(conflict.localData.lastModified || conflict.localData.updatedAt);
    const remoteTime = new Date(conflict.remoteData.updated_at || conflict.remoteData.lastModified);

    if (localTime > remoteTime) {
      return {
        action: 'use_local',
        requiresUserInput: false
      };
    } else {
      return {
        action: 'use_remote',
        requiresUserInput: false
      };
    }
  }

  private async applyConflictResolution(conflictId: string, resolution: ConflictResolution): Promise<void> {
    const conflict = await offlineDB.conflictResolution.get(conflictId);
    if (!conflict) return;

    try {
      if (resolution.action === 'use_local') {
        // Keep local data, sync to server
        await this.syncItemToServer(conflict.type, conflict.localData);
      } else if (resolution.action === 'use_remote') {
        // Use remote data, update local
        await this.updateLocalItem(conflict.type, conflict.remoteData);
      } else if (resolution.action === 'merge' && resolution.resolvedData) {
        // Use merged data
        await this.updateLocalItem(conflict.type, resolution.resolvedData);
        await this.syncItemToServer(conflict.type, resolution.resolvedData);
      }

      // Mark conflict as resolved
      await offlineDB.conflictResolution.update(conflictId, {
        resolved: true
      });

    } catch (error) {
      console.error(`Failed to apply conflict resolution for ${conflictId}:`, error);
      throw error;
    }
  }

  private async syncItemToServer(type: string, data: any): Promise<void> {
    // Implementation depends on the data type
    // This is a simplified version
    const tableName = this.getSupabaseTableName(type);
    const { error } = await supabase.from(tableName).upsert(data);
    if (error) throw error;
  }

  private async updateLocalItem(type: string, data: any): Promise<void> {
    // Implementation depends on the data type
    const table = this.getOfflineTable(type);
    await table.put(data);
  }

  private getSupabaseTableName(type: string): string {
    const mapping: Record<string, string> = {
      'progress': 'user_progress',
      'note': 'user_notes',
      'bookmark': 'user_bookmarks',
      'achievement': 'user_achievements'
    };
    return mapping[type] || type;
  }

  private getOfflineTable(type: string): any {
    const mapping: Record<string, any> = {
      'progress': offlineDB.userProgress,
      'note': offlineDB.notes,
      'bookmark': offlineDB.bookmarks,
      'achievement': offlineDB.achievements
    };
    return mapping[type];
  }

  async getConflicts(): Promise<ConflictItem[]> {
    return offlineDB.conflictResolution.where('resolved').equals(false).toArray();
  }

  // Event listeners
  onDownloadProgress(callback: (progress: DownloadProgress) => void): void {
    this.downloadProgressCallbacks.push(callback);
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void): void {
    this.syncStatusCallbacks.push(callback);
  }

  private notifyDownloadProgress(progress: DownloadProgress): void {
    this.downloadProgressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in download progress callback:', error);
      }
    });
  }

  private async notifySyncStatusChange(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncStatusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in sync status callback:', error);
      }
    });
  }

  // Download queue management
  async pauseDownload(itemId: string): Promise<void> {
    const controller = this.downloadQueue.get(itemId);
    if (controller) {
      controller.abort();
      this.downloadQueue.delete(itemId);
      await offlineDB.downloadQueue.update(itemId, { status: 'paused' });
    }
  }

  async resumeDownload(itemId: string): Promise<void> {
    const item = await offlineDB.downloadQueue.get(itemId);
    if (item && item.status === 'paused') {
      await offlineDB.downloadQueue.update(itemId, { status: 'queued' });
      await this.processDownloadQueue();
    }
  }

  async cancelDownload(itemId: string): Promise<void> {
    const controller = this.downloadQueue.get(itemId);
    if (controller) {
      controller.abort();
      this.downloadQueue.delete(itemId);
    }
    await offlineDB.downloadQueue.delete(itemId);
  }

  async getDownloadQueue(): Promise<DownloadItem[]> {
    return offlineDB.downloadQueue.toArray();
  }

  async getDownloadProgress(itemId: string): Promise<DownloadProgress | null> {
    const item = await offlineDB.downloadQueue.get(itemId);
    if (!item) return null;

    return {
      itemId: item.id,
      status: item.status,
      progress: item.progress,
      downloadedBytes: item.downloadedBytes,
      totalBytes: item.size,
      speed: item.speed,
      estimatedTimeRemaining: item.estimatedTimeRemaining,
      error: item.error
    };
  }
}

// Create and export singleton instance
export const offlineManager = new OfflineManager();

// Initialize on module load
if (typeof window !== 'undefined') {
  offlineManager.initialize().catch(console.error);
}

export default offlineManager;