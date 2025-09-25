// Cache service integration for TahitiSpeak application

import { CacheManager, type CacheConfig, type CacheStats } from '@/lib/cache/CacheManager';
import { indexedDBCache } from '@/lib/cache/IndexedDBCache';
import type { Lesson, MediaAsset, UserProgress } from '@/types';

/**
 * Cache service that integrates with the application's data layer
 */
export class CacheService {
  private static instance: CacheService;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Initialize cache service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize IndexedDB cache
      await indexedDBCache.initialize();
      
      // Configure cache manager for TahitiSpeak
      CacheManager.getInstance().updateConfig({
        maxAge: 24 * 60 * 60 * 1000, // 24 hours for lessons
        maxSize: 200 * 1024 * 1024, // 200MB total cache
        cleanupInterval: 2 * 60 * 60 * 1000, // Cleanup every 2 hours
        enableAutoCleanup: true
      });

      this.isInitialized = true;
      console.log('[CacheService] Initialized successfully');
    } catch (error) {
      console.error('[CacheService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Cache a lesson with metadata
   */
  async cacheLesson(lesson: Lesson): Promise<void> {
    try {
      // Cache in IndexedDB for persistence
      await indexedDBCache.cacheLesson(lesson);
      
      // Store cache timestamp
      await indexedDBCache.setMetadata(`lesson_${lesson.slug}_cached_at`, Date.now());
      
      // Cache in memory for quick access
      CacheManager.getInstance().set(`lesson:${lesson.slug}`, lesson);
      
      console.log(`[CacheService] Cached lesson: ${lesson.slug}`);
    } catch (error) {
      console.error(`[CacheService] Failed to cache lesson ${lesson.slug}:`, error);
      throw error;
    }
  }

  /**
   * Get cached lesson
   */
  async getCachedLesson(slug: string): Promise<Lesson | null> {
    try {
      // Try memory cache first
      let lesson = CacheManager.getInstance().get(`lesson:${slug}`);
      if (lesson) {
        return lesson;
      }

      // Fallback to IndexedDB
      lesson = await indexedDBCache.getCachedLesson(slug);
      if (lesson) {
        // Promote to memory cache
        CacheManager.getInstance().set(`lesson:${slug}`, lesson);
        return lesson;
      }

      return null;
    } catch (error) {
      console.error(`[CacheService] Failed to get cached lesson ${slug}:`, error);
      return null;
    }
  }

  /**
   * Cache media asset
   */
  async cacheMediaAsset(asset: MediaAsset): Promise<void> {
    try {
      await indexedDBCache.cacheMediaAsset(asset);
      CacheManager.getInstance().set(`media:${asset.id}`, asset);
      
      console.log(`[CacheService] Cached media asset: ${asset.id}`);
    } catch (error) {
      console.error(`[CacheService] Failed to cache media asset ${asset.id}:`, error);
      throw error;
    }
  }

  /**
   * Get cached media asset
   */
  async getCachedMediaAsset(id: number): Promise<MediaAsset | null> {
    try {
      // Try memory cache first
      let asset = CacheManager.getInstance().get(`media:${id}`);
      if (asset) {
        return asset;
      }

      // Fallback to IndexedDB
      asset = await indexedDBCache.getCachedMediaAsset(id);
      if (asset) {
        CacheManager.getInstance().set(`media:${id}`, asset);
        return asset;
      }

      return null;
    } catch (error) {
      console.error(`[CacheService] Failed to get cached media asset ${id}:`, error);
      return null;
    }
  }

  /**
   * Cache user progress
   */
  async cacheUserProgress(progress: UserProgress): Promise<void> {
    try {
      await indexedDBCache.cacheUserProgress(progress);
      const key = `progress:${progress.userId}:${progress.lessonId}:${progress.sectionKind}`;
      CacheManager.getInstance().set(key, progress);
      
      console.log(`[CacheService] Cached user progress: ${key}`);
    } catch (error) {
      console.error('[CacheService] Failed to cache user progress:', error);
      throw error;
    }
  }

  /**
   * Get cached user progress
   */
  async getCachedUserProgress(userId: number, lessonId?: number): Promise<UserProgress[]> {
    try {
      // For user progress, we primarily use IndexedDB due to the complex querying
      return await indexedDBCache.getCachedUserProgress(userId, lessonId);
    } catch (error) {
      console.error('[CacheService] Failed to get cached user progress:', error);
      return [];
    }
  }

  /**
   * Cache translation data
   */
  cacheTranslation(locale: string, namespace: string, data: Record<string, any>): void {
    const key = `translation:${locale}:${namespace}`;
    CacheManager.getInstance().set(key, {
      data,
      timestamp: Date.now(),
      version: '1.0.0'
    });
  }

  /**
   * Get cached translation data
   */
  getCachedTranslation(locale: string, namespace: string): Record<string, any> | null {
    const key = `translation:${locale}:${namespace}`;
    const cached = CacheManager.getInstance().get(key);
    
    if (cached) {
      // Check if cache is still valid (5 minutes for translations)
      const maxAge = 5 * 60 * 1000;
      if (Date.now() - cached.timestamp < maxAge) {
        return cached.data;
      } else {
        // Remove expired translation
        CacheManager.getInstance().delete(key);
      }
    }
    
    return null;
  }

  /**
   * Cache API response
   */
  cacheApiResponse(endpoint: string, data: any, ttl: number = 5 * 60 * 1000): void {
    const key = `api:${endpoint}`;
    CacheManager.getInstance().set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cached API response
   */
  getCachedApiResponse(endpoint: string): any | null {
    const key = `api:${endpoint}`;
    const cached = CacheManager.getInstance().get(key);
    
    if (cached) {
      if (Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      } else {
        CacheManager.getInstance().delete(key);
      }
    }
    
    return null;
  }

  /**
   * Preload essential data
   */
  async preloadEssentialData(): Promise<void> {
    try {
      console.log('[CacheService] Starting essential data preload...');
      
      // Get all cached lessons
      const lessons = await indexedDBCache.getAllCachedLessons();
      
      // Promote frequently accessed lessons to memory cache
      const essentialLessons = lessons.slice(0, 10); // First 10 lessons
      for (const lesson of essentialLessons) {
        CacheManager.getInstance().set(`lesson:${lesson.slug}`, lesson);
      }
      
      console.log(`[CacheService] Preloaded ${essentialLessons.length} essential lessons`);
    } catch (error) {
      console.error('[CacheService] Failed to preload essential data:', error);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  async getStats(): Promise<{
    memory: CacheStats;
    indexedDB: any;
    browser: any;
  }> {
    try {
      const memoryStats = CacheManager.getInstance().getStats();
      const indexedDBStats = await indexedDBCache.getCacheStats();
      
      let browserStats = { used: 0, quota: 0 };
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          browserStats = {
            used: estimate.usage || 0,
            quota: estimate.quota || 0
          };
        } catch (error) {
          console.warn('[CacheService] Could not get browser storage stats:', error);
        }
      }

      return {
        memory: memoryStats,
        indexedDB: indexedDBStats,
        browser: browserStats
      };
    } catch (error) {
      console.error('[CacheService] Failed to get cache stats:', error);
      throw error;
    }
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    try {
      await CacheManager.getInstance().clear();
      console.log('[CacheService] All caches cleared');
    } catch (error) {
      console.error('[CacheService] Failed to clear caches:', error);
      throw error;
    }
  }

  /**
   * Force cache cleanup
   */
  async forceCleanup(): Promise<void> {
    try {
      await CacheManager.getInstance().forceCleanup();
      console.log('[CacheService] Force cleanup completed');
    } catch (error) {
      console.error('[CacheService] Force cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Update cache configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    CacheManager.getInstance().updateConfig(config);
    console.log('[CacheService] Configuration updated:', config);
  }

  /**
   * Check cache health
   */
  async checkHealth(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      const stats = await this.getStats();
      
      // Check memory usage
      if (stats.memory.totalSize > 50 * 1024 * 1024) { // 50MB
        issues.push('Memory cache size is large');
        recommendations.push('Consider reducing cache size or increasing cleanup frequency');
      }
      
      // Check browser storage usage
      if (stats.browser.quota > 0) {
        const usagePercent = (stats.browser.used / stats.browser.quota) * 100;
        if (usagePercent > 80) {
          issues.push('Browser storage usage is high');
          recommendations.push('Clear old cache data or increase storage quota');
        }
      }
      
      // Check last cleanup time
      const timeSinceCleanup = Date.now() - stats.memory.lastCleanup;
      if (timeSinceCleanup > 4 * 60 * 60 * 1000) { // 4 hours
        issues.push('Cache cleanup has not run recently');
        recommendations.push('Force a cache cleanup or check cleanup configuration');
      }
      
      return {
        isHealthy: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      return {
        isHealthy: false,
        issues: ['Failed to check cache health'],
        recommendations: ['Check cache service configuration and connectivity']
      };
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Initialize cache service on module load
if (typeof window !== 'undefined') {
  cacheService.initialize().catch(error => {
    console.error('[CacheService] Auto-initialization failed:', error);
  });
}