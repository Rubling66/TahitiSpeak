// Cache System Validation Tests
import { CacheManager } from '../lib/cache/CacheManager';
import { CacheService } from '../services/CacheService';
import type { Lesson, UserProgress } from '../types';

// Test cache functionality
const testCacheBasicOperations = async () => {
  console.log('🧪 Testing basic cache operations...');
  
  const cache = CacheManager.getInstance();
  
  // Test set and get
  await cache.set('test-key', { data: 'test-value' }, 5000); // 5 second TTL
  const result = await cache.get('test-key');
  
  if (result && result.data === 'test-value') {
    console.log('✅ Basic set/get operations working');
  } else {
    console.log('❌ Basic set/get operations failed');
  }
  
  // Test has method
  const exists = await cache.has('test-key');
  if (exists) {
    console.log('✅ Has method working');
  } else {
    console.log('❌ Has method failed');
  }
};

// Test cache expiration
const testCacheExpiration = async () => {
  console.log('🧪 Testing cache expiration...');
  
  const cache = CacheManager.getInstance();
  
  // Set item with short TTL
  await cache.set('expire-test', { data: 'will-expire' }, 1000); // 1 second TTL
  
  // Check immediately
  let result = await cache.get('expire-test');
  if (result) {
    console.log('✅ Item exists immediately after setting');
  }
  
  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Check after expiration
  result = await cache.get('expire-test');
  if (!result) {
    console.log('✅ Item properly expired');
  } else {
    console.log('❌ Item did not expire as expected');
  }
};

// Test cache service integration
const testCacheServiceIntegration = async () => {
  console.log('🧪 Testing CacheService integration...');
  
  const cacheService = CacheService.getInstance();
  
  // Test lesson caching
  const mockLesson: Lesson = {
    id: 1,
    slug: 'test-lesson-1',
    level: 'Beginner',
    title: {
      fr: 'Test Lesson',
      en: 'Test Lesson',
      tah: 'Test Lesson'
    },
    summary: 'Test lesson summary',
    durationMin: 10,
    sections: [],
    tags: ['test'],
    isPublished: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  await cacheService.cacheLesson(mockLesson);
  const cachedLesson = await cacheService.getCachedLesson('test-lesson-1');
  
  if (cachedLesson && cachedLesson.title.fr === 'Test Lesson') {
    console.log('✅ Lesson caching working');
  } else {
    console.log('❌ Lesson caching failed');
  }
  
  // Test user progress caching
  const mockProgress: UserProgress = {
    userId: 1,
    lessonId: 1,
    sectionKind: 'Vocabulary',
    completed: true,
    score: 85,
    attempts: 1,
    updatedAt: Date.now()
  };
  
  await cacheService.cacheUserProgress(mockProgress);
  const cachedProgress = await cacheService.getCachedUserProgress(1, 1);
  
  if (cachedProgress && cachedProgress.score === 85) {
    console.log('✅ User progress caching working');
  } else {
    console.log('❌ User progress caching failed');
  }
};

// Test cache performance
const testCachePerformance = async () => {
  console.log('🧪 Testing cache performance...');
  
  const cache = CacheManager.getInstance();
  const iterations = 1000;
  
  // Test write performance
  const writeStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await cache.set(`perf-test-${i}`, { data: `value-${i}` }, 60000);
  }
  const writeEnd = performance.now();
  const writeTime = writeEnd - writeStart;
  
  console.log(`✅ Write performance: ${iterations} operations in ${writeTime.toFixed(2)}ms (${(writeTime/iterations).toFixed(2)}ms per operation)`);
  
  // Test read performance
  const readStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await cache.get(`perf-test-${i}`);
  }
  const readEnd = performance.now();
  const readTime = readEnd - readStart;
  
  console.log(`✅ Read performance: ${iterations} operations in ${readTime.toFixed(2)}ms (${(readTime/iterations).toFixed(2)}ms per operation)`);
  
  // Clean up performance test data
  for (let i = 0; i < iterations; i++) {
    await cache.delete(`perf-test-${i}`);
  }
};

// Test automatic cleanup
const testAutomaticCleanup = async () => {
  console.log('🧪 Testing automatic cleanup...');
  
  const cache = CacheManager.getInstance();
  
  // Add multiple items with different TTLs
  await cache.set('cleanup-test-1', { data: 'value1' }, 1000); // 1 second
  await cache.set('cleanup-test-2', { data: 'value2' }, 2000); // 2 seconds
  await cache.set('cleanup-test-3', { data: 'value3' }, 5000); // 5 seconds
  
  console.log('✅ Added test items with different TTLs');
  
  // Force cleanup
  await cache.forceCleanup();
  
  // Wait for some items to expire
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Force cleanup again
  await cache.forceCleanup();
  
  // Check which items remain
  const item1 = await cache.get('cleanup-test-1');
  const item2 = await cache.get('cleanup-test-2');
  const item3 = await cache.get('cleanup-test-3');
  
  if (!item1 && !item2 && item3) {
    console.log('✅ Automatic cleanup working correctly');
  } else {
    console.log('❌ Automatic cleanup not working as expected');
  }
};

// Test cache stats
const testCacheStats = async () => {
  console.log('🧪 Testing cache statistics...');
  
  const cache = CacheManager.getInstance();
  const cacheService = CacheService.getInstance();
  
  // Add some test data
  await cache.set('stats-test-1', { data: 'value1' }, 60000);
  await cache.set('stats-test-2', { data: 'value2' }, 60000);
  
  const stats = await cacheService.getStats();
  
  if (stats && typeof stats.totalItems === 'number' && stats.totalItems >= 2) {
    console.log('✅ Cache statistics working');
    console.log(`📊 Cache stats: ${stats.totalItems} items, ${stats.memoryUsage} bytes memory, ${stats.hitRate}% hit rate`);
  } else {
    console.log('❌ Cache statistics failed');
  }
};

// Main validation function
export const validateCacheSystem = async () => {
  console.log('🚀 Starting Cache System Validation...');
  console.log('=' .repeat(50));
  
  try {
    await testCacheBasicOperations();
    console.log('');
    
    await testCacheExpiration();
    console.log('');
    
    await testCacheServiceIntegration();
    console.log('');
    
    await testCachePerformance();
    console.log('');
    
    await testAutomaticCleanup();
    console.log('');
    
    await testCacheStats();
    console.log('');
    
    console.log('=' .repeat(50));
    console.log('✅ Cache System Validation Complete!');
    
  } catch (error) {
    console.error('❌ Cache System Validation Failed:', error);
  }
};

// Auto-run validation if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to window for manual testing
  (window as any).validateCacheSystem = validateCacheSystem;
  console.log('Cache validation available as window.validateCacheSystem()');
}