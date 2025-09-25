// Comprehensive cache management system with automatic discharge

import { indexedDBCache } from './IndexedDBCache';
import type { Lesson, MediaAsset, UserProgress } from '@/types';

/**
 * Cache configuration interface
 */
interface CacheConfig {
  maxAge: number; // Maximum age in milliseconds
  maxSize: number; // Maximum cache size in bytes
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableAutoCleanup: boolean;
}

/**
 * Cache entry metadata
 */
interface CacheEntry {
  key: string;
  size: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  lastCleanup: number;
}

/**
 * Comprehensive cache manager with automatic discharge functionality
 */
export class CacheManager {
  private static instance: CacheManager;
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private stats: CacheStats;
  private memoryCache: Map<string, any> = new Map();
  private cacheMetadata: Map<string, CacheEntry> = new Map();

  private constructor() {
    this.config = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100 * 1024 * 1024, // 100MB
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      enableAutoCleanup: true
    };

    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      lastCleanup: Date.now()
    };

    this.initializeAutoCleanup();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize automatic cleanup system
   */
  private initializeAutoCleanup(): void {
    if (this.config.enableAutoCleanup) {
      this.cleanupTimer = setInterval(() => {
        this.performAutomaticCleanup();
      }, this.config.cleanupInterval);

      // Also cleanup on page visibility change
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            this.performAutomaticCleanup();
          }
        });
      }
    }
  }

  /**
   * Perform automatic cache cleanup
   */
  private async performAutomaticCleanup(): Promise<void> {
    try {
      console.log('[CacheManager] Starting automatic cleanup...');
      
      // Clean expired entries
      await this.cleanExpiredEntries();
      
      // Clean LRU entries if size limit exceeded
      await this.cleanLRUEntries();
      
      // Update statistics
      await this.updateStats();
      
      this.stats.lastCleanup = Date.now();
      
      console.log('[CacheManager] Automatic cleanup completed');
    } catch (error) {
      console.error('[CacheManager] Error during automatic cleanup:', error);
    }
  }

  /**
   * Clean expired cache entries
   */
  private async cleanExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Check memory cache
    for (const [key, metadata] of this.cacheMetadata.entries()) {
      if (now - metadata.createdAt > this.config.maxAge) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      this.memoryCache.delete(key);
      this.cacheMetadata.delete(key);
    }

    // Clean IndexedDB cache
    await this.cleanExpiredIndexedDBEntries();

    console.log(`[CacheManager] Cleaned ${expiredKeys.length} expired entries`);
  }

  /**
   * Clean expired IndexedDB entries
   */
  private async cleanExpiredIndexedDBEntries(): Promise<void> {
    try {
      // Get all cached lessons and check their age
      const lessons = await indexedDBCache.getAllCachedLessons();
      const now = Date.now();
      
      for (const lesson of lessons) {
        const metadata = await indexedDBCache.getMetadata(`lesson_${lesson.slug}_cached_at`);
        if (metadata && typeof metadata === 'number') {
          if (now - metadata > this.config.maxAge) {
            // Remove expired lesson from IndexedDB
            await this.removeFromIndexedDB('lessons', lesson.slug);
          }
        }
      }
    } catch (error) {
      console.error('[CacheManager] Error cleaning IndexedDB entries:', error);
    }
  }

  /**
   * Clean least recently used entries when size limit is exceeded
   */
  private async cleanLRUEntries(): Promise<void> {
    if (this.stats.totalSize <= this.config.maxSize) {
      return;
    }

    // Sort by last accessed time (LRU)
    const sortedEntries = Array.from(this.cacheMetadata.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let removedSize = 0;
    const targetSize = this.config.maxSize * 0.8; // Clean to 80% of max size

    for (const [key, metadata] of sortedEntries) {
      if (this.stats.totalSize - removedSize <= targetSize) {
        break;
      }

      this.memoryCache.delete(key);
      this.cacheMetadata.delete(key);
      removedSize += metadata.size;
    }

    console.log(`[CacheManager] Cleaned ${removedSize} bytes using LRU strategy`);
  }

  /**
   * Remove entry from IndexedDB
   */
  private async removeFromIndexedDB(store: string, key: string): Promise<void> {
    // This would need to be implemented based on the specific IndexedDB structure
    // For now, we'll use the existing clearCache method for full cleanup
    console.log(`[CacheManager] Would remove ${key} from ${store}`);
  }

  /**
   * Update cache statistics
   */
  private async updateStats(): Promise<void> {
    this.stats.totalEntries = this.memoryCache.size;
    this.stats.totalSize = Array.from(this.cacheMetadata.values())
      .reduce((total, entry) => total + entry.size, 0);

    // Add IndexedDB stats
    try {
      const indexedDBStats = await indexedDBCache.getCacheStats();
      this.stats.totalSize += indexedDBStats.totalSize;
      this.stats.totalEntries += indexedDBStats.lessons + indexedDBStats.mediaAssets + indexedDBStats.userProgress;
    } catch (error) {
      console.error('[CacheManager] Error getting IndexedDB stats:', error);
    }
  }

  /**
   * Set cache entry
   */
  set(key: string, value: any, size?: number): void {
    const estimatedSize = size || this.estimateSize(value);
    const now = Date.now();

    this.memoryCache.set(key, value);
    this.cacheMetadata.set(key, {
      key,
      size: estimatedSize,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0
    });
  }

  /**
   * Get cache entry
   */
  get(key: string): any {
    const value = this.memoryCache.get(key);
    if (value !== undefined) {
      // Update access metadata
      const metadata = this.cacheMetadata.get(key);
      if (metadata) {
        metadata.lastAccessed = Date.now();
        metadata.accessCount++;
      }
    }
    return value;
  }

  /**
   * Check if cache has key
   */
  has(key: string): boolean {
    return this.memoryCache.has(key);
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    this.cacheMetadata.delete(key);
    return this.memoryCache.delete(key);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.cacheMetadata.clear();
    await indexedDBCache.clearCache();
    
    // Clear browser cache if available
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval && this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.initializeAutoCleanup();
    }
  }

  /**
   * Estimate size of an object
   */
  private estimateSize(obj: any): number {
    const jsonString = JSON.stringify(obj);
    return new Blob([jsonString]).size;
  }

  /**
   * Force immediate cleanup
   */
  async forceCleanup(): Promise<void> {
    await this.performAutomaticCleanup();
  }

  /**
   * Destroy cache manager and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.memoryCache.clear();
    this.cacheMetadata.clear();
  }
}

// Export class and singleton instance
export { CacheManager };
export const cacheManager = CacheManager.getInstance();

// Export types
export type { CacheConfig, CacheStats, CacheEntry };