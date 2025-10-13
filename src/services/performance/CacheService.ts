import { LRUCache } from 'lru-cache';

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate?: number;
  updateAgeOnGet?: boolean;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
  hitRate: number;
  memoryUsage: number;
}

export interface CacheLayer {
  name: string;
  priority: number;
  config: CacheConfig;
  stats: CacheStats;
}

/**
 * Advanced multi-layer caching service with Redis-like functionality
 * Supports memory cache, IndexedDB cache, and network cache layers
 */
export class AdvancedCacheService {
  private memoryCache: LRUCache<string, any>;
  private indexedDBCache: IDBDatabase | null = null;
  private cacheStats: Map<string, CacheStats> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();
  private compressionEnabled = true;
  private encryptionEnabled = false;

  constructor(private config: CacheConfig = {
    maxSize: 100,
    ttl: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: 60 * 1000, // 1 minute
    updateAgeOnGet: true
  }) {
    this.memoryCache = new LRUCache({
      max: config.maxSize,
      ttl: config.ttl,
      updateAgeOnGet: config.updateAgeOnGet,
      allowStale: true
    });

    this.initializeIndexedDB();
    this.initializeStats();
    this.startPerformanceMonitoring();
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TahitiSpeakCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.indexedDBCache = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          cacheStore.createIndex('ttl', 'ttl', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Initialize cache statistics
   */
  private initializeStats(): void {
    const defaultStats: CacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };

    this.cacheStats.set('memory', { ...defaultStats });
    this.cacheStats.set('indexeddb', { ...defaultStats });
    this.cacheStats.set('network', { ...defaultStats });
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
      this.cleanupExpiredEntries();
    }, 30000); // Every 30 seconds
  }

  /**
   * Get value from cache with multi-layer fallback
   */
  async get<T>(key: string, fallbackFn?: () => Promise<T>): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      // Layer 1: Memory cache
      const memoryValue = this.memoryCache.get(key);
      if (memoryValue !== undefined) {
        this.recordHit('memory');
        this.recordPerformance('get', performance.now() - startTime);
        return memoryValue;
      }

      // Layer 2: IndexedDB cache
      const indexedDBValue = await this.getFromIndexedDB<T>(key);
      if (indexedDBValue !== null) {
        // Promote to memory cache
        this.memoryCache.set(key, indexedDBValue);
        this.recordHit('indexeddb');
        this.recordPerformance('get', performance.now() - startTime);
        return indexedDBValue;
      }

      // Layer 3: Fallback function (network, etc.)
      if (fallbackFn) {
        const fallbackValue = await fallbackFn();
        if (fallbackValue !== null) {
          await this.set(key, fallbackValue);
          this.recordHit('network');
          this.recordPerformance('get', performance.now() - startTime);
          return fallbackValue;
        }
      }

      this.recordMiss('memory');
      this.recordPerformance('get', performance.now() - startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.recordPerformance('get', performance.now() - startTime);
      return null;
    }
  }

  /**
   * Set value in all cache layers
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const startTime = performance.now();
    const effectiveTtl = ttl || this.config.ttl;

    try {
      // Compress value if enabled
      const processedValue = this.compressionEnabled ? 
        await this.compressValue(value) : value;

      // Set in memory cache
      this.memoryCache.set(key, processedValue, { ttl: effectiveTtl });
      this.recordSet('memory');

      // Set in IndexedDB cache
      await this.setInIndexedDB(key, processedValue, effectiveTtl);
      this.recordSet('indexeddb');

      this.recordPerformance('set', performance.now() - startTime);
    } catch (error) {
      console.error('Cache set error:', error);
      this.recordPerformance('set', performance.now() - startTime);
    }
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string): Promise<void> {
    const startTime = performance.now();

    try {
      // Delete from memory cache
      this.memoryCache.delete(key);
      this.recordDelete('memory');

      // Delete from IndexedDB cache
      await this.deleteFromIndexedDB(key);
      this.recordDelete('indexeddb');

      this.recordPerformance('delete', performance.now() - startTime);
    } catch (error) {
      console.error('Cache delete error:', error);
      this.recordPerformance('delete', performance.now() - startTime);
    }
  }

  /**
   * Clear all cache layers
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      await this.clearIndexedDB();
      this.initializeStats();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): Map<string, CacheStats> {
    // Update memory cache stats
    const memoryStats = this.cacheStats.get('memory')!;
    memoryStats.size = this.memoryCache.size;
    memoryStats.hitRate = memoryStats.hits / (memoryStats.hits + memoryStats.misses) || 0;

    return new Map(this.cacheStats);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Map<string, { avg: number; min: number; max: number; count: number }> {
    const metrics = new Map();

    for (const [operation, times] of this.performanceMetrics) {
      if (times.length > 0) {
        metrics.set(operation, {
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length
        });
      }
    }

    return metrics;
  }

  /**
   * Prefetch data for better performance
   */
  async prefetch<T>(keys: string[], fetchFn: (key: string) => Promise<T>): Promise<void> {
    const promises = keys.map(async (key) => {
      const cached = await this.get(key);
      if (cached === null) {
        try {
          const value = await fetchFn(key);
          await this.set(key, value);
        } catch (error) {
          console.warn(`Failed to prefetch ${key}:`, error);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern: RegExp): Promise<void> {
    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (pattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Invalidate IndexedDB cache
    await this.invalidateIndexedDBPattern(pattern);
  }

  // Private helper methods

  private async getFromIndexedDB<T>(key: string): Promise<T | null> {
    if (!this.indexedDBCache) return null;

    return new Promise((resolve) => {
      const transaction = this.indexedDBCache!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && this.isValidCacheEntry(result)) {
          resolve(this.decompressValue(result.value));
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  private async setInIndexedDB<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.indexedDBCache) return;

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDBCache!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      const entry = {
        key,
        value,
        timestamp: Date.now(),
        ttl,
        expiresAt: Date.now() + ttl
      };

      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.indexedDBCache) return;

    return new Promise((resolve) => {
      const transaction = this.indexedDBCache!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => resolve(); // Don't fail on delete errors
    });
  }

  private async clearIndexedDB(): Promise<void> {
    if (!this.indexedDBCache) return;

    return new Promise((resolve) => {
      const transaction = this.indexedDBCache!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  private async invalidateIndexedDBPattern(pattern: RegExp): Promise<void> {
    if (!this.indexedDBCache) return;

    return new Promise((resolve) => {
      const transaction = this.indexedDBCache!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (pattern.test(cursor.key as string)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  private isValidCacheEntry(entry: any): boolean {
    return entry && 
           entry.expiresAt && 
           Date.now() < entry.expiresAt;
  }

  private async compressValue<T>(value: T): Promise<T> {
    // Simple compression simulation - in production, use actual compression
    return value;
  }

  private async decompressValue<T>(value: T): Promise<T> {
    // Simple decompression simulation
    return value;
  }

  private recordHit(layer: string): void {
    const stats = this.cacheStats.get(layer);
    if (stats) {
      stats.hits++;
    }
  }

  private recordMiss(layer: string): void {
    const stats = this.cacheStats.get(layer);
    if (stats) {
      stats.misses++;
    }
  }

  private recordSet(layer: string): void {
    const stats = this.cacheStats.get(layer);
    if (stats) {
      stats.sets++;
    }
  }

  private recordDelete(layer: string): void {
    const stats = this.cacheStats.get(layer);
    if (stats) {
      stats.deletes++;
    }
  }

  private recordPerformance(operation: string, time: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    const times = this.performanceMetrics.get(operation)!;
    times.push(time);
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
  }

  private updatePerformanceMetrics(): void {
    // Update memory usage estimation
    const memoryStats = this.cacheStats.get('memory')!;
    memoryStats.memoryUsage = this.estimateMemoryUsage();
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    return this.memoryCache.size * 1024; // Assume 1KB per entry average
  }

  private async cleanupExpiredEntries(): Promise<void> {
    if (!this.indexedDBCache) return;

    return new Promise((resolve) => {
      const transaction = this.indexedDBCache!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('ttl');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value;
          if (Date.now() > entry.expiresAt) {
            cursor.delete();
            this.recordDelete('indexeddb');
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }
}

// Export singleton instance
export const cacheService = new AdvancedCacheService();