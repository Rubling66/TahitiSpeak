'use client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  enableLRU?: boolean; // Enable Least Recently Used eviction
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
}

class AnalyticsCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0
  };
  
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private readonly enableLRU: boolean;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
    this.enableLRU = options.enableLRU ?? true;
    
    // Start cleanup interval
    this.startCleanup();
  }

  private startCleanup(): void {
    // Clean expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanExpired();
    }, 60 * 1000);
  }

  private cleanExpired(): void {
    const now = Date.now();
    let evicted = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        evicted++;
      }
    }
    
    this.stats.evictions += evicted;
    this.stats.size = this.cache.size;
    this.updateHitRate();
  }

  private evictLRU(): void {
    if (!this.enableLRU || this.cache.size <= this.maxSize) return;

    // Find least recently used entry
    let lruKey: string | null = null;
    let lruTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const timeToLive = ttl || this.defaultTTL;
    
    // Evict LRU if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + timeToLive,
      accessCount: 0,
      lastAccessed: now
    };
    
    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    const now = Date.now();
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Check if expired
    if (entry.expiresAt < now) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.stats.size = this.cache.size;
      this.updateHitRate();
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    this.stats.hits++;
    this.updateHitRate();
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.size = this.cache.size;
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0
    };
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get cache entry info for debugging
  getEntryInfo(key: string): Omit<CacheEntry<T>, 'data'> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const { data, ...info } = entry;
    return info;
  }

  // Warm cache with data
  warm(entries: Record<string, T>, ttl?: number): void {
    Object.entries(entries).forEach(([key, data]) => {
      this.set(key, data, ttl);
    });
  }

  // Get or set pattern
  async getOrSet<U = T>(
    key: string, 
    factory: () => Promise<U>, 
    ttl?: number
  ): Promise<U> {
    const cached = this.get(key) as U;
    if (cached !== null) {
      return cached;
    }
    
    const data = await factory();
    this.set(key, data as any, ttl);
    return data;
  }

  // Batch operations
  mget(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  }

  mset(entries: Record<string, T>, ttl?: number): void {
    Object.entries(entries).forEach(([key, data]) => {
      this.set(key, data, ttl);
    });
  }

  // Invalidate by pattern
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    this.stats.size = this.cache.size;
    return invalidated;
  }

  // Extend TTL for existing entry
  extend(key: string, additionalTTL: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    entry.expiresAt += additionalTTL;
    return true;
  }

  // Cleanup and destroy
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Specialized analytics cache instances
export const dashboardCache = new AnalyticsCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 50,
  enableLRU: true
});

export const metricsCache = new AnalyticsCache({
  ttl: 2 * 60 * 1000, // 2 minutes for real-time metrics
  maxSize: 100,
  enableLRU: true
});

export const reportsCache = new AnalyticsCache({
  ttl: 15 * 60 * 1000, // 15 minutes for reports
  maxSize: 30,
  enableLRU: true
});

// Cache warming strategies
export const warmAnalyticsCache = async () => {
  try {
    // Warm dashboard cache with common queries
    const dashboardData = await fetch('/api/analytics/dashboard').then(r => r.json());
    dashboardCache.set('dashboard:overview', dashboardData);
    
    // Warm metrics cache
    const metricsData = await fetch('/api/analytics/metrics').then(r => r.json());
    metricsCache.set('metrics:current', metricsData);
    
    console.log('Analytics cache warmed successfully');
  } catch (error) {
    console.error('Failed to warm analytics cache:', error);
  }
};

// Cache invalidation helpers
export const invalidateAnalyticsCache = {
  dashboard: () => {
    dashboardCache.invalidatePattern(/^dashboard:/);
  },
  
  metrics: () => {
    metricsCache.invalidatePattern(/^metrics:/);
  },
  
  reports: () => {
    reportsCache.invalidatePattern(/^reports:/);
  },
  
  all: () => {
    dashboardCache.clear();
    metricsCache.clear();
    reportsCache.clear();
  },
  
  byUser: (userId: string) => {
    const pattern = new RegExp(`user:${userId}:`);
    dashboardCache.invalidatePattern(pattern);
    metricsCache.invalidatePattern(pattern);
    reportsCache.invalidatePattern(pattern);
  }
};

// Cache statistics aggregator
export const getCacheStatistics = () => {
  return {
    dashboard: dashboardCache.getStats(),
    metrics: metricsCache.getStats(),
    reports: reportsCache.getStats(),
    total: {
      size: dashboardCache.getStats().size + 
            metricsCache.getStats().size + 
            reportsCache.getStats().size,
      hits: dashboardCache.getStats().hits + 
            metricsCache.getStats().hits + 
            reportsCache.getStats().hits,
      misses: dashboardCache.getStats().misses + 
              metricsCache.getStats().misses + 
              reportsCache.getStats().misses
    }
  };
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    dashboardCache.destroy();
    metricsCache.destroy();
    reportsCache.destroy();
  });
}

export { AnalyticsCache };
export default AnalyticsCache;