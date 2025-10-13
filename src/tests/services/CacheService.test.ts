import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdvancedCacheService } from '../../services/CacheService';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

const mockIDBDatabase = {
  createObjectStore: vi.fn(),
  transaction: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockIDBTransaction = {
  objectStore: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockIDBObjectStore = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  getAll: vi.fn(),
  count: vi.fn(),
  createIndex: vi.fn(),
};

const mockIDBRequest = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  result: null,
  error: null,
};

// Setup IndexedDB mocks
beforeEach(() => {
  global.indexedDB = mockIndexedDB as any;
  
  mockIndexedDB.open.mockReturnValue({
    ...mockIDBRequest,
    addEventListener: vi.fn((event, callback) => {
      if (event === 'success') {
        setTimeout(() => {
          mockIDBRequest.result = mockIDBDatabase;
          callback({ target: mockIDBRequest });
        }, 0);
      }
    }),
  });

  mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
  mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);

  // Mock successful operations
  mockIDBObjectStore.get.mockReturnValue({
    ...mockIDBRequest,
    addEventListener: vi.fn((event, callback) => {
      if (event === 'success') {
        setTimeout(() => callback({ target: mockIDBRequest }), 0);
      }
    }),
  });

  mockIDBObjectStore.put.mockReturnValue({
    ...mockIDBRequest,
    addEventListener: vi.fn((event, callback) => {
      if (event === 'success') {
        setTimeout(() => callback({ target: mockIDBRequest }), 0);
      }
    }),
  });

  mockIDBObjectStore.delete.mockReturnValue({
    ...mockIDBRequest,
    addEventListener: vi.fn((event, callback) => {
      if (event === 'success') {
        setTimeout(() => callback({ target: mockIDBRequest }), 0);
      }
    }),
  });

  mockIDBObjectStore.clear.mockReturnValue({
    ...mockIDBRequest,
    addEventListener: vi.fn((event, callback) => {
      if (event === 'success') {
        setTimeout(() => callback({ target: mockIDBRequest }), 0);
      }
    }),
  });

  mockIDBObjectStore.getAll.mockReturnValue({
    ...mockIDBRequest,
    addEventListener: vi.fn((event, callback) => {
      if (event === 'success') {
        mockIDBRequest.result = [];
        setTimeout(() => callback({ target: mockIDBRequest }), 0);
      }
    }),
  });

  mockIDBObjectStore.count.mockReturnValue({
    ...mockIDBRequest,
    addEventListener: vi.fn((event, callback) => {
      if (event === 'success') {
        mockIDBRequest.result = 0;
        setTimeout(() => callback({ target: mockIDBRequest }), 0);
      }
    }),
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AdvancedCacheService', () => {
  let cacheService: AdvancedCacheService;

  beforeEach(async () => {
    cacheService = new AdvancedCacheService({
      memoryLimit: 100,
      defaultTTL: 5000,
      enablePersistence: true,
      enableCompression: false,
      enableEncryption: false,
    });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  describe('Memory Cache', () => {
    it('should store and retrieve data from memory cache', async () => {
      const key = 'test-key';
      const value = { message: 'Hello World' };

      await cacheService.set(key, value);
      const result = await cacheService.get(key);

      expect(result).toEqual(value);
    });

    it('should handle TTL expiration', async () => {
      const key = 'ttl-test';
      const value = { data: 'expires soon' };

      await cacheService.set(key, value, { ttl: 100 });
      
      // Should be available immediately
      let result = await cacheService.get(key);
      expect(result).toEqual(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      result = await cacheService.get(key);
      expect(result).toBeNull();
    });

    it('should implement LRU eviction', async () => {
      // Fill cache beyond limit
      for (let i = 0; i < 150; i++) {
        await cacheService.set(`key-${i}`, { value: i });
      }

      // Early keys should be evicted
      const result = await cacheService.get('key-0');
      expect(result).toBeNull();

      // Recent keys should still exist
      const recentResult = await cacheService.get('key-149');
      expect(recentResult).toEqual({ value: 149 });
    });

    it('should update access time on get', async () => {
      await cacheService.set('key1', { value: 1 });
      await cacheService.set('key2', { value: 2 });

      // Access key1 to update its position
      await cacheService.get('key1');

      // Fill cache to trigger eviction
      for (let i = 0; i < 150; i++) {
        await cacheService.set(`new-key-${i}`, { value: i });
      }

      // key1 should still exist due to recent access
      const result1 = await cacheService.get('key1');
      expect(result1).toEqual({ value: 1 });

      // key2 should be evicted
      const result2 = await cacheService.get('key2');
      expect(result2).toBeNull();
    });
  });

  describe('Pattern-based Operations', () => {
    beforeEach(async () => {
      await cacheService.set('user:123:profile', { name: 'John' });
      await cacheService.set('user:123:settings', { theme: 'dark' });
      await cacheService.set('user:456:profile', { name: 'Jane' });
      await cacheService.set('lesson:math:basic', { title: 'Basic Math' });
    });

    it('should invalidate by pattern', async () => {
      await cacheService.invalidatePattern('user:123:*');

      expect(await cacheService.get('user:123:profile')).toBeNull();
      expect(await cacheService.get('user:123:settings')).toBeNull();
      expect(await cacheService.get('user:456:profile')).toEqual({ name: 'Jane' });
      expect(await cacheService.get('lesson:math:basic')).toEqual({ title: 'Basic Math' });
    });

    it('should get keys by pattern', async () => {
      const userKeys = await cacheService.getKeysByPattern('user:*');
      
      expect(userKeys).toContain('user:123:profile');
      expect(userKeys).toContain('user:123:settings');
      expect(userKeys).toContain('user:456:profile');
      expect(userKeys).not.toContain('lesson:math:basic');
    });
  });

  describe('Prefetching', () => {
    it('should prefetch data', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'prefetched' });
      
      await cacheService.prefetch('prefetch-key', fetchFn);

      expect(fetchFn).toHaveBeenCalled();
      
      const result = await cacheService.get('prefetch-key');
      expect(result).toEqual({ data: 'prefetched' });
    });

    it('should not prefetch if key already exists', async () => {
      await cacheService.set('existing-key', { data: 'existing' });
      
      const fetchFn = vi.fn().mockResolvedValue({ data: 'new' });
      
      await cacheService.prefetch('existing-key', fetchFn);

      expect(fetchFn).not.toHaveBeenCalled();
      
      const result = await cacheService.get('existing-key');
      expect(result).toEqual({ data: 'existing' });
    });
  });

  describe('Batch Operations', () => {
    it('should set multiple keys at once', async () => {
      const data = {
        'key1': { value: 1 },
        'key2': { value: 2 },
        'key3': { value: 3 },
      };

      await cacheService.setMany(data);

      for (const [key, value] of Object.entries(data)) {
        const result = await cacheService.get(key);
        expect(result).toEqual(value);
      }
    });

    it('should get multiple keys at once', async () => {
      await cacheService.set('key1', { value: 1 });
      await cacheService.set('key2', { value: 2 });
      await cacheService.set('key3', { value: 3 });

      const results = await cacheService.getMany(['key1', 'key2', 'key4']);

      expect(results).toEqual({
        'key1': { value: 1 },
        'key2': { value: 2 },
        'key4': null,
      });
    });

    it('should delete multiple keys at once', async () => {
      await cacheService.set('key1', { value: 1 });
      await cacheService.set('key2', { value: 2 });
      await cacheService.set('key3', { value: 3 });

      await cacheService.deleteMany(['key1', 'key3']);

      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key2')).toEqual({ value: 2 });
      expect(await cacheService.get('key3')).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should track cache statistics', async () => {
      // Generate some cache activity
      await cacheService.set('key1', { value: 1 });
      await cacheService.get('key1'); // hit
      await cacheService.get('key2'); // miss
      await cacheService.get('key1'); // hit

      const stats = await cacheService.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(2/3);
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.totalKeys).toBe(1);
    });

    it('should reset statistics', async () => {
      await cacheService.set('key1', { value: 1 });
      await cacheService.get('key1');
      await cacheService.get('key2');

      await cacheService.resetStats();

      const stats = await cacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should track operation performance', async () => {
      await cacheService.set('perf-key', { data: 'performance test' });
      await cacheService.get('perf-key');

      const metrics = await cacheService.getPerformanceMetrics();

      expect(metrics.averageSetTime).toBeGreaterThan(0);
      expect(metrics.averageGetTime).toBeGreaterThan(0);
      expect(metrics.totalOperations).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock IndexedDB error
      mockIDBObjectStore.put.mockReturnValue({
        ...mockIDBRequest,
        addEventListener: vi.fn((event, callback) => {
          if (event === 'error') {
            mockIDBRequest.error = new Error('Storage error');
            setTimeout(() => callback({ target: mockIDBRequest }), 0);
          }
        }),
      });

      // Should not throw, but log error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await cacheService.set('error-key', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle corrupted data gracefully', async () => {
      // Mock corrupted data in IndexedDB
      mockIDBObjectStore.get.mockReturnValue({
        ...mockIDBRequest,
        addEventListener: vi.fn((event, callback) => {
          if (event === 'success') {
            mockIDBRequest.result = {
              key: 'corrupted-key',
              value: 'invalid-json-{',
              timestamp: Date.now(),
              ttl: 5000,
            };
            setTimeout(() => callback({ target: mockIDBRequest }), 0);
          }
        }),
      });

      const result = await cacheService.get('corrupted-key');
      expect(result).toBeNull();
    });
  });

  describe('Memory Management', () => {
    it('should clear expired entries during cleanup', async () => {
      await cacheService.set('expired-key', { data: 'expires' }, { ttl: 50 });
      await cacheService.set('valid-key', { data: 'valid' }, { ttl: 5000 });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Trigger cleanup
      await (cacheService as any).cleanup();

      expect(await cacheService.get('expired-key')).toBeNull();
      expect(await cacheService.get('valid-key')).toEqual({ data: 'valid' });
    });

    it('should handle memory pressure', async () => {
      const originalMemoryLimit = (cacheService as any).config.memoryLimit;
      (cacheService as any).config.memoryLimit = 10; // Very small limit

      // Fill cache beyond memory limit
      for (let i = 0; i < 20; i++) {
        await cacheService.set(`memory-key-${i}`, { data: `data-${i}` });
      }

      const stats = await cacheService.getStats();
      expect(stats.totalKeys).toBeLessThanOrEqual(10);

      // Restore original limit
      (cacheService as any).config.memoryLimit = originalMemoryLimit;
    });
  });

  describe('Configuration', () => {
    it('should respect configuration options', () => {
      const config = (cacheService as any).config;
      
      expect(config.memoryLimit).toBe(100);
      expect(config.defaultTTL).toBe(5000);
      expect(config.enablePersistence).toBe(true);
      expect(config.enableCompression).toBe(false);
      expect(config.enableEncryption).toBe(false);
    });

    it('should use default configuration when not provided', () => {
      const defaultCacheService = new AdvancedCacheService();
      const config = (defaultCacheService as any).config;
      
      expect(config.memoryLimit).toBe(1000);
      expect(config.defaultTTL).toBe(300000); // 5 minutes
      expect(config.enablePersistence).toBe(true);
      expect(config.enableCompression).toBe(true);
      expect(config.enableEncryption).toBe(false);
    });
  });

  describe('Cleanup and Disposal', () => {
    it('should clear all data', async () => {
      await cacheService.set('key1', { value: 1 });
      await cacheService.set('key2', { value: 2 });

      await cacheService.clear();

      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key2')).toBeNull();

      const stats = await cacheService.getStats();
      expect(stats.totalKeys).toBe(0);
    });

    it('should handle disposal properly', async () => {
      await cacheService.set('key1', { value: 1 });
      
      await cacheService.dispose();

      // After disposal, operations should handle gracefully
      const result = await cacheService.get('key1');
      expect(result).toBeNull();
    });
  });
});