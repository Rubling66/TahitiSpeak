import { offlineDB, DownloadItem } from './offlineDatabase';
import { offlineManager, DownloadProgress } from './offlineManager';

export interface ContentDownloadManager {
  addToDownloadQueue(items: DownloadItem[]): Promise<void>;
  removeFromDownloadQueue(itemId: string): Promise<void>;
  getDownloadQueue(): Promise<DownloadItem[]>;
  downloadItem(item: DownloadItem): Promise<void>;
  pauseDownload(itemId: string): Promise<void>;
  resumeDownload(itemId: string): Promise<void>;
  cancelDownload(itemId: string): Promise<void>;
  onDownloadProgress(callback: (progress: DownloadProgress) => void): void;
  getDownloadProgress(itemId: string): Promise<DownloadProgress>;
}

export interface BatchDownloadOptions {
  maxConcurrent: number;
  priority: 'high' | 'medium' | 'low';
  includeMedia: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface DownloadStatistics {
  totalDownloads: number;
  completedDownloads: number;
  failedDownloads: number;
  totalBytes: number;
  downloadedBytes: number;
  averageSpeed: number;
  estimatedTimeRemaining: number;
}

class ContentDownloadManagerImpl implements ContentDownloadManager {
  private progressCallbacks: ((progress: DownloadProgress) => void)[] = [];
  private activeDownloads: Map<string, AbortController> = new Map();
  private maxConcurrentDownloads = 3;
  private downloadStats: DownloadStatistics = {
    totalDownloads: 0,
    completedDownloads: 0,
    failedDownloads: 0,
    totalBytes: 0,
    downloadedBytes: 0,
    averageSpeed: 0,
    estimatedTimeRemaining: 0
  };

  constructor() {
    this.initializeDownloadManager();
  }

  private async initializeDownloadManager(): Promise<void> {
    // Resume any paused downloads on startup
    const pausedDownloads = await offlineDB.downloadQueue
      .where('status')
      .equals('paused')
      .toArray();

    for (const download of pausedDownloads) {
      await offlineDB.downloadQueue.update(download.id, { status: 'queued' });
    }

    // Start processing queue
    this.processDownloadQueue();
  }

  async addToDownloadQueue(items: DownloadItem[]): Promise<void> {
    try {
      // Validate and prepare items
      const validatedItems = await this.validateDownloadItems(items);
      
      // Add to database
      await offlineDB.downloadQueue.bulkAdd(validatedItems);
      
      // Update statistics
      this.downloadStats.totalDownloads += validatedItems.length;
      this.downloadStats.totalBytes += validatedItems.reduce((sum, item) => sum + item.size, 0);
      
      // Start processing if not already running
      this.processDownloadQueue();
      
      console.log(`Added ${validatedItems.length} items to download queue`);
    } catch (error) {
      console.error('Failed to add items to download queue:', error);
      throw error;
    }
  }

  private async validateDownloadItems(items: DownloadItem[]): Promise<DownloadItem[]> {
    const validatedItems: DownloadItem[] = [];
    
    for (const item of items) {
      // Check if already downloaded
      const existing = await this.checkIfContentExists(item.contentId, item.type);
      if (existing) {
        console.log(`Content ${item.contentId} already exists, skipping`);
        continue;
      }
      
      // Check if already in queue
      const inQueue = await offlineDB.downloadQueue
        .where('contentId')
        .equals(item.contentId)
        .and(item => item.type === item.type)
        .first();
      
      if (inQueue) {
        console.log(`Content ${item.contentId} already in queue, skipping`);
        continue;
      }
      
      // Validate URL and estimate size if not provided
      if (!item.size) {
        item.size = await this.estimateContentSize(item.url);
      }
      
      validatedItems.push({
        ...item,
        id: item.id || `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'queued',
        progress: 0,
        downloadedBytes: 0,
        speed: 0,
        estimatedTimeRemaining: 0,
        createdAt: item.createdAt || new Date()
      });
    }
    
    return validatedItems;
  }

  private async checkIfContentExists(contentId: string, type: string): Promise<boolean> {
    switch (type) {
      case 'lesson':
        return !!(await offlineDB.lessons.get(contentId));
      case 'story':
        return !!(await offlineDB.stories.get(contentId));
      case 'cultural':
        return !!(await offlineDB.culturalContent.get(contentId));
      default:
        return false;
    }
  }

  private async estimateContentSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength) : 1024 * 1024; // Default 1MB
    } catch (error) {
      console.warn(`Failed to estimate size for ${url}:`, error);
      return 1024 * 1024; // Default 1MB
    }
  }

  async removeFromDownloadQueue(itemId: string): Promise<void> {
    try {
      // Cancel if currently downloading
      await this.cancelDownload(itemId);
      
      // Remove from database
      await offlineDB.downloadQueue.delete(itemId);
      
      console.log(`Removed item ${itemId} from download queue`);
    } catch (error) {
      console.error(`Failed to remove item ${itemId} from queue:`, error);
      throw error;
    }
  }

  async getDownloadQueue(): Promise<DownloadItem[]> {
    return offlineDB.downloadQueue.orderBy('priority').reverse().toArray();
  }

  private async processDownloadQueue(): Promise<void> {
    // Get queued items sorted by priority
    const queuedItems = await offlineDB.downloadQueue
      .where('status')
      .equals('queued')
      .toArray();

    // Sort by priority and dependencies
    const sortedItems = this.sortByPriorityAndDependencies(queuedItems);
    
    // Start downloads up to max concurrent limit
    const availableSlots = this.maxConcurrentDownloads - this.activeDownloads.size;
    const itemsToDownload = sortedItems.slice(0, availableSlots);
    
    for (const item of itemsToDownload) {
      this.downloadItem(item).catch(error => {
        console.error(`Download failed for item ${item.id}:`, error);
      });
    }
  }

  private sortByPriorityAndDependencies(items: DownloadItem[]): DownloadItem[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return items.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  async downloadItem(item: DownloadItem): Promise<void> {
    if (this.activeDownloads.has(item.id)) {
      console.log(`Download already in progress for item ${item.id}`);
      return;
    }

    const abortController = new AbortController();
    this.activeDownloads.set(item.id, abortController);

    try {
      await offlineDB.downloadQueue.update(item.id, {
        status: 'downloading',
        startedAt: new Date()
      });

      // Use offline manager to handle the actual download
      await offlineManager.downloadContent(item.contentId, item.type as 'lesson' | 'story');

      await offlineDB.downloadQueue.update(item.id, {
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      });

      this.downloadStats.completedDownloads++;
      this.downloadStats.downloadedBytes += item.size;

      this.notifyProgress({
        itemId: item.id,
        status: 'completed',
        progress: 100,
        downloadedBytes: item.size,
        totalBytes: item.size,
        speed: 0,
        estimatedTimeRemaining: 0
      });

    } catch (error) {
      console.error(`Download failed for item ${item.id}:`, error);
      
      await offlineDB.downloadQueue.update(item.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      this.downloadStats.failedDownloads++;

      this.notifyProgress({
        itemId: item.id,
        status: 'failed',
        progress: 0,
        downloadedBytes: 0,
        totalBytes: item.size,
        speed: 0,
        estimatedTimeRemaining: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.activeDownloads.delete(item.id);
      
      // Continue processing queue
      setTimeout(() => this.processDownloadQueue(), 100);
    }
  }

  async pauseDownload(itemId: string): Promise<void> {
    const controller = this.activeDownloads.get(itemId);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(itemId);
      
      await offlineDB.downloadQueue.update(itemId, { status: 'paused' });
      
      this.notifyProgress({
        itemId,
        status: 'paused',
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        speed: 0,
        estimatedTimeRemaining: 0
      });
    }
  }

  async resumeDownload(itemId: string): Promise<void> {
    const item = await offlineDB.downloadQueue.get(itemId);
    if (item && item.status === 'paused') {
      await offlineDB.downloadQueue.update(itemId, { status: 'queued' });
      this.processDownloadQueue();
    }
  }

  async cancelDownload(itemId: string): Promise<void> {
    const controller = this.activeDownloads.get(itemId);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(itemId);
    }
    
    await offlineDB.downloadQueue.delete(itemId);
  }

  onDownloadProgress(callback: (progress: DownloadProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  private notifyProgress(progress: DownloadProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in download progress callback:', error);
      }
    });
  }

  async getDownloadProgress(itemId: string): Promise<DownloadProgress> {
    const item = await offlineDB.downloadQueue.get(itemId);
    if (!item) {
      throw new Error(`Download item ${itemId} not found`);
    }

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

  // Batch download operations
  async downloadLessonsBatch(lessonIds: string[], options: Partial<BatchDownloadOptions> = {}): Promise<void> {
    const defaultOptions: BatchDownloadOptions = {
      maxConcurrent: 3,
      priority: 'medium',
      includeMedia: true,
      compressionLevel: 'medium'
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    const downloadItems: DownloadItem[] = lessonIds.map(lessonId => ({
      id: `lesson_${lessonId}_${Date.now()}`,
      type: 'lesson',
      contentId: lessonId,
      url: `/api/lessons/${lessonId}`,
      size: 0, // Will be estimated
      priority: finalOptions.priority,
      dependencies: [],
      status: 'queued',
      progress: 0,
      downloadedBytes: 0,
      speed: 0,
      estimatedTimeRemaining: 0,
      createdAt: new Date()
    }));

    await this.addToDownloadQueue(downloadItems);
  }

  async downloadStoriesBatch(storyIds: string[], options: Partial<BatchDownloadOptions> = {}): Promise<void> {
    const defaultOptions: BatchDownloadOptions = {
      maxConcurrent: 3,
      priority: 'medium',
      includeMedia: true,
      compressionLevel: 'medium'
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    const downloadItems: DownloadItem[] = storyIds.map(storyId => ({
      id: `story_${storyId}_${Date.now()}`,
      type: 'story',
      contentId: storyId,
      url: `/api/stories/${storyId}`,
      size: 0, // Will be estimated
      priority: finalOptions.priority,
      dependencies: [],
      status: 'queued',
      progress: 0,
      downloadedBytes: 0,
      speed: 0,
      estimatedTimeRemaining: 0,
      createdAt: new Date()
    }));

    await this.addToDownloadQueue(downloadItems);
  }

  // Download statistics
  getDownloadStatistics(): DownloadStatistics {
    return { ...this.downloadStats };
  }

  async updateDownloadStatistics(): Promise<void> {
    const allDownloads = await offlineDB.downloadQueue.toArray();
    
    this.downloadStats = {
      totalDownloads: allDownloads.length,
      completedDownloads: allDownloads.filter(d => d.status === 'completed').length,
      failedDownloads: allDownloads.filter(d => d.status === 'failed').length,
      totalBytes: allDownloads.reduce((sum, d) => sum + d.size, 0),
      downloadedBytes: allDownloads
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + d.size, 0),
      averageSpeed: this.calculateAverageSpeed(allDownloads),
      estimatedTimeRemaining: this.calculateEstimatedTimeRemaining(allDownloads)
    };
  }

  private calculateAverageSpeed(downloads: DownloadItem[]): number {
    const completedDownloads = downloads.filter(d => 
      d.status === 'completed' && d.startedAt && d.completedAt
    );

    if (completedDownloads.length === 0) return 0;

    const totalSpeed = completedDownloads.reduce((sum, d) => {
      const duration = (d.completedAt!.getTime() - d.startedAt!.getTime()) / 1000;
      return sum + (d.size / duration);
    }, 0);

    return totalSpeed / completedDownloads.length;
  }

  private calculateEstimatedTimeRemaining(downloads: DownloadItem[]): number {
    const queuedDownloads = downloads.filter(d => 
      d.status === 'queued' || d.status === 'downloading'
    );

    if (queuedDownloads.length === 0) return 0;

    const remainingBytes = queuedDownloads.reduce((sum, d) => 
      sum + (d.size - d.downloadedBytes), 0
    );

    const averageSpeed = this.downloadStats.averageSpeed;
    return averageSpeed > 0 ? remainingBytes / averageSpeed : 0;
  }

  // Cleanup operations
  async cleanupCompletedDownloads(): Promise<void> {
    const completedDownloads = await offlineDB.downloadQueue
      .where('status')
      .equals('completed')
      .toArray();

    // Keep only recent completed downloads (last 24 hours)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldCompletedDownloads = completedDownloads.filter(d => 
      d.completedAt && d.completedAt < cutoffTime
    );

    if (oldCompletedDownloads.length > 0) {
      await offlineDB.downloadQueue.bulkDelete(
        oldCompletedDownloads.map(d => d.id)
      );
      console.log(`Cleaned up ${oldCompletedDownloads.length} old completed downloads`);
    }
  }

  async retryFailedDownloads(): Promise<void> {
    const failedDownloads = await offlineDB.downloadQueue
      .where('status')
      .equals('failed')
      .toArray();

    for (const download of failedDownloads) {
      await offlineDB.downloadQueue.update(download.id, {
        status: 'queued',
        error: undefined
      });
    }

    if (failedDownloads.length > 0) {
      console.log(`Retrying ${failedDownloads.length} failed downloads`);
      this.processDownloadQueue();
    }
  }

  // Configuration
  setMaxConcurrentDownloads(max: number): void {
    this.maxConcurrentDownloads = Math.max(1, Math.min(max, 10));
  }

  getMaxConcurrentDownloads(): number {
    return this.maxConcurrentDownloads;
  }
}

// Create and export singleton instance
export const contentDownloadManager = new ContentDownloadManagerImpl();

export default contentDownloadManager;